"""
Inpainting module - Handles scene editing via Stable Diffusion inpainting.

Uses runwayml/stable-diffusion-inpainting with LCM-LoRA for fast (4-step)
image-to-image inpainting of the center region of a gameplay frame.
"""

import asyncio
import gc
import logging
import time

import numpy as np
import torch
from PIL import Image, ImageDraw, ImageFilter

logger = logging.getLogger(__name__)

# Fraction of each dimension to inpaint (centered).
# 0.35 = center 35% of width × 35% of height.
INPAINT_REGION_FRACTION = 0.35

# Gaussian blur radius (in pixels at 512x512) for soft mask edges.
MASK_FEATHER_RADIUS = 20


class InpaintingManager:
    """Manages the Stable Diffusion inpainting pipeline for scene editing."""

    def __init__(self, cuda_executor):
        self.cuda_executor = cuda_executor
        self.pipeline = None
        self._loaded = False

    @property
    def is_loaded(self):
        return self._loaded

    async def _run_on_cuda_thread(self, fn):
        """Run callable on the dedicated CUDA thread."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(self.cuda_executor, fn)

    async def warmup(self):
        """Load the inpainting model + LCM-LoRA to GPU."""
        logger.info("[INPAINT] Loading inpainting model...")
        t0 = time.perf_counter()
        await self._run_on_cuda_thread(self._load_sync)
        elapsed = time.perf_counter() - t0
        logger.info(f"[INPAINT] Model loaded in {elapsed:.1f}s")

    def _load_sync(self):
        """Synchronous model load on CUDA thread."""
        from diffusers import LCMScheduler, StableDiffusionInpaintPipeline

        pipe = StableDiffusionInpaintPipeline.from_pretrained(
            "runwayml/stable-diffusion-inpainting",
            torch_dtype=torch.float16,
        ).to("cuda")
        pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
        pipe.fuse_lora()
        pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
        pipe.set_progress_bar_config(disable=True)
        self.pipeline = pipe
        self._loaded = True

    async def inpaint(
        self,
        frame_numpy: np.ndarray,
        prompt: str,
        seed_target_size: tuple[int, int],
    ) -> torch.Tensor:
        """Inpaint the center region of a frame.

        Args:
            frame_numpy: HxWx3 uint8 numpy array (the last generated frame).
            prompt: Text description of what to inpaint.
            seed_target_size: (height, width) tuple for the output tensor.

        Returns:
            Composited frame as a uint8 CUDA tensor (HxWx3).
        """
        if not self._loaded:
            raise RuntimeError("Inpainting model not loaded")
        return await self._run_on_cuda_thread(
            lambda: self._inpaint_sync(frame_numpy, prompt, seed_target_size)
        )

    def _inpaint_sync(
        self,
        frame_numpy: np.ndarray,
        prompt: str,
        seed_target_size: tuple[int, int],
    ) -> torch.Tensor:
        h_orig, w_orig = frame_numpy.shape[:2]
        frame_pil = Image.fromarray(frame_numpy)

        # Take the full 1:1 center crop of the image (largest square that fits).
        # This gives the inpainter maximum context around the edit region.
        side = min(w_orig, h_orig)
        crop_x0 = (w_orig - side) // 2
        crop_y0 = (h_orig - side) // 2
        crop = frame_pil.crop((crop_x0, crop_y0, crop_x0 + side, crop_y0 + side))

        # Resize the square crop to 512x512 (native SD resolution, no aspect distortion)
        crop_512 = crop.resize((512, 512))

        # Build the mask: center INPAINT_REGION_FRACTION of each dimension,
        # with soft feathered edges for smooth blending.
        margin = (1 - INPAINT_REGION_FRACTION) / 2
        mask_x0 = int(512 * margin)
        mask_y0 = int(512 * margin)
        mask_x1 = 512 - mask_x0
        mask_y1 = 512 - mask_y0

        mask_512 = Image.new("L", (512, 512), 0)
        draw = ImageDraw.Draw(mask_512)
        draw.rectangle([mask_x0, mask_y0, mask_x1, mask_y1], fill=255)
        mask_512 = mask_512.filter(ImageFilter.GaussianBlur(radius=MASK_FEATHER_RADIUS))

        t0 = time.perf_counter()
        result_512 = self.pipeline(
            prompt=prompt,
            image=crop_512,
            mask_image=mask_512,
            num_inference_steps=4,
            guidance_scale=1.0,
            width=512,
            height=512,
        ).images[0]
        logger.info(
            f"[INPAINT] Diffusion took {(time.perf_counter() - t0) * 1000:.0f}ms"
        )

        # Composite the inpainted result back using the same soft mask,
        # then resize back to crop dimensions and paste into the full frame.
        blended_512 = Image.composite(result_512, crop_512, mask_512)
        blended_crop = blended_512.resize((side, side), Image.LANCZOS)

        composited = frame_pil.copy()
        composited.paste(blended_crop, (crop_x0, crop_y0))

        # Resize to seed target size and convert to tensor
        h, w = seed_target_size
        composited = composited.resize((w, h), Image.LANCZOS)
        result_tensor = (
            torch.from_numpy(np.array(composited))
            .to(dtype=torch.uint8, device="cuda")
            .contiguous()
        )
        return result_tensor

    def unload(self):
        """Free GPU memory used by the inpainting pipeline."""
        self.pipeline = None
        self._loaded = False
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
