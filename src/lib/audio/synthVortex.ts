import type { SynthLoop } from './types'
import { loopTeardown } from './synthUtils'

/**
 * Builds a vortex tunnel sound. The core character is a smooth tonal drone
 * with gentle movement, plus light filtered noise for air texture. The
 * `variant` parameter shifts the character:
 *  - 'normal': warm fifth, slow modulation — soaring through a tunnel
 *  - 'error':  minor second, faster wobble — same tunnel, gone wrong
 */
function buildVortexLoop(ctx: AudioContext, dest: AudioNode, variant: 'normal' | 'error'): () => void {
  const nodes: AudioNode[] = []
  const gains: GainNode[] = []
  const t = ctx.currentTime
  const isError = variant === 'error'

  // --- Layer 1: Fundamental drone (sine, warm) ---
  const fund = ctx.createOscillator()
  const fundGain = ctx.createGain()
  fund.type = 'sine'
  fund.frequency.setValueAtTime(isError ? 55 : 60, t)
  fundGain.gain.setValueAtTime(0.3, t)
  fund.connect(fundGain).connect(dest)
  fund.start()
  nodes.push(fund, fundGain)
  gains.push(fundGain)

  // --- Layer 2: Harmonic (perfect fifth / minor second) ---
  const harm = ctx.createOscillator()
  const harmGain = ctx.createGain()
  harm.type = 'sine'
  // Normal: perfect fifth (×1.5). Error: minor second (×16/15), tense.
  harm.frequency.setValueAtTime(isError ? 55 * (16 / 15) : 60 * 1.5, t)
  harmGain.gain.setValueAtTime(isError ? 0.2 : 0.18, t)
  // Gentle pitch wobble — slower for normal, faster & wider for error
  const harmLfo = ctx.createOscillator()
  const harmLfoGain = ctx.createGain()
  harmLfo.type = 'sine'
  harmLfo.frequency.setValueAtTime(isError ? 0.6 : 0.15, t)
  harmLfoGain.gain.setValueAtTime(isError ? 3 : 1.2, t)
  harmLfo.connect(harmLfoGain).connect(harm.frequency)
  harmLfo.start()
  harm.connect(harmGain).connect(dest)
  harm.start()
  nodes.push(harm, harmGain, harmLfo, harmLfoGain)
  gains.push(harmGain)

  // --- Layer 3: Upper octave shimmer ---
  const shimmer = ctx.createOscillator()
  const shimmerGain = ctx.createGain()
  shimmer.type = 'triangle'
  shimmer.frequency.setValueAtTime(isError ? 110 : 120, t)
  shimmer.detune.setValueAtTime(isError ? -15 : 5, t)
  shimmerGain.gain.setValueAtTime(isError ? 0.06 : 0.08, t)
  // Amplitude breathing
  const shimLfo = ctx.createOscillator()
  const shimLfoGain = ctx.createGain()
  shimLfo.type = 'sine'
  shimLfo.frequency.setValueAtTime(isError ? 0.35 : 0.1, t)
  shimLfoGain.gain.setValueAtTime(isError ? 0.04 : 0.03, t)
  shimLfo.connect(shimLfoGain).connect(shimmerGain.gain)
  shimLfo.start()
  shimmer.connect(shimmerGain).connect(dest)
  shimmer.start()
  nodes.push(shimmer, shimmerGain, shimLfo, shimLfoGain)
  gains.push(shimmerGain)

  // --- Layer 4: Soft air texture (filtered noise) ---
  const noise = ctx.createBufferSource()
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
  const noiseData = noiseBuf.getChannelData(0)
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1
  noise.buffer = noiseBuf
  noise.loop = true

  const noiseBP = ctx.createBiquadFilter()
  noiseBP.type = 'bandpass'
  noiseBP.frequency.setValueAtTime(isError ? 500 : 600, t)
  noiseBP.Q.setValueAtTime(0.4, t)

  // Gentle filter sweep for sense of movement
  const noiseLfo = ctx.createOscillator()
  const noiseLfoGain = ctx.createGain()
  noiseLfo.type = 'sine'
  noiseLfo.frequency.setValueAtTime(isError ? 0.4 : 0.18, t)
  noiseLfoGain.gain.setValueAtTime(isError ? 250 : 150, t)
  noiseLfo.connect(noiseLfoGain).connect(noiseBP.frequency)
  noiseLfo.start()

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(isError ? 0.12 : 0.08, t)
  noise.connect(noiseBP).connect(noiseGain).connect(dest)
  noise.start()
  nodes.push(noise, noiseBP, noiseLfo, noiseLfoGain, noiseGain)
  gains.push(noiseGain)

  return loopTeardown(gains, nodes, 0.5)
}

/** Flying-through-a-tunnel vortex loop. */
export const synthVortexLoop: SynthLoop = (ctx, dest) => buildVortexLoop(ctx, dest, 'normal')

/** Darker, frenzied variant of the vortex for error states. */
export const synthVortexError: SynthLoop = (ctx, dest) => buildVortexLoop(ctx, dest, 'error')
