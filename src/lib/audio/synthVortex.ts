import type { SynthLoop } from './types'
import { loopTeardown } from './synthUtils'

/**
 * Builds a vortex loop — a quiet, low-frequency rumble designed for
 * long listening sessions (30+ minutes during downloads/compiles).
 *  - 'normal': gentle low rumble, barely-there presence
 *  - 'error':  same character but darker and slightly more prominent
 */
/** Master volume multiplier for the vortex loop — tweak this to dial in overall level. */
const VORTEX_VOLUME = 1.0

function buildVortexLoop(ctx: AudioContext, dest: AudioNode, variant: 'normal' | 'error'): () => void {
  const nodes: AudioNode[] = []
  const gains: GainNode[] = []
  const t = ctx.currentTime
  const isError = variant === 'error'
  const v = VORTEX_VOLUME

  // --- Layer 1: Noise rumble through a steep lowpass ---
  const rumble = ctx.createBufferSource()
  const rumbleBuf = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = rumbleBuf.getChannelData(ch)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  rumble.buffer = rumbleBuf
  rumble.loop = true

  const rumbleLP = ctx.createBiquadFilter()
  rumbleLP.type = 'lowpass'
  rumbleLP.frequency.setValueAtTime(isError ? 140 : 160, t)
  rumbleLP.Q.setValueAtTime(2.5, t) // resonant peak adds body

  const rumbleGain = ctx.createGain()
  rumbleGain.gain.setValueAtTime(0.35 * v, t)
  rumble.connect(rumbleLP).connect(rumbleGain).connect(dest)
  rumble.start()
  nodes.push(rumble, rumbleLP, rumbleGain)
  gains.push(rumbleGain)

  // --- Layer 2: Sub-bass weight ---
  const sub = ctx.createOscillator()
  const subGain = ctx.createGain()
  sub.type = 'triangle'
  sub.frequency.setValueAtTime(isError ? 35 : 42, t)
  subGain.gain.setValueAtTime(0.12 * v, t)
  sub.connect(subGain).connect(dest)
  sub.start()
  nodes.push(sub, subGain)
  gains.push(subGain)

  // --- Layer 3: Slow filter cutoff drift for organic movement ---
  const driftLfo = ctx.createOscillator()
  const driftDepth = ctx.createGain()
  driftLfo.type = 'sine'
  driftLfo.frequency.setValueAtTime(0.035, t)
  driftDepth.gain.setValueAtTime(40, t) // ±40 Hz cutoff drift
  driftLfo.connect(driftDepth).connect(rumbleLP.frequency)
  driftLfo.start()
  nodes.push(driftLfo, driftDepth)

  // --- Layer 4: Very slow amplitude breathing ---
  const breathLfo = ctx.createOscillator()
  const breathDepth = ctx.createGain()
  breathLfo.type = 'sine'
  breathLfo.frequency.setValueAtTime(0.025, t)
  breathDepth.gain.setValueAtTime(0.04 * v, t)
  breathLfo.connect(breathDepth).connect(rumbleGain.gain)
  breathLfo.connect(breathDepth).connect(subGain.gain)
  breathLfo.start()
  nodes.push(breathLfo, breathDepth)

  return loopTeardown(gains, nodes, 0.5)
}

/** Quiet low rumble for the loading vortex. */
export const synthVortexLoop: SynthLoop = (ctx, dest) => buildVortexLoop(ctx, dest, 'normal')

/** Slightly darker/louder variant for error states. */
export const synthVortexError: SynthLoop = (ctx, dest) => buildVortexLoop(ctx, dest, 'error')

/** Warm energy hum for portal hover — like standing near something powerful. */
export const synthPortalHum: SynthLoop = (ctx, dest) => {
  const nodes: AudioNode[] = []
  const gains: GainNode[] = []
  const t = ctx.currentTime

  // Deep fundamental — felt more than heard
  const fund = ctx.createOscillator()
  const fundGain = ctx.createGain()
  fund.type = 'sine'
  fund.frequency.setValueAtTime(50, t)
  fundGain.gain.setValueAtTime(0.08, t)
  fund.connect(fundGain).connect(dest)
  fund.start()
  nodes.push(fund, fundGain)
  gains.push(fundGain)

  // Second harmonic for warmth
  const harm = ctx.createOscillator()
  const harmGain = ctx.createGain()
  harm.type = 'sine'
  harm.frequency.setValueAtTime(100, t)
  harmGain.gain.setValueAtTime(0.04, t)
  harm.connect(harmGain).connect(dest)
  harm.start()
  nodes.push(harm, harmGain)
  gains.push(harmGain)

  // Very slow amplitude breathing — energy pulsing gently
  const breathLfo = ctx.createOscillator()
  const breathDepth = ctx.createGain()
  breathLfo.type = 'sine'
  breathLfo.frequency.setValueAtTime(0.06, t)
  breathDepth.gain.setValueAtTime(0.02, t)
  breathLfo.connect(breathDepth).connect(fundGain.gain)
  breathLfo.connect(breathDepth).connect(harmGain.gain)
  breathLfo.start()
  nodes.push(breathLfo, breathDepth)

  // Faint high-frequency shimmer — energy crackling at the edge of hearing
  const shimmer = ctx.createBufferSource()
  const shimBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
  const shimData = shimBuf.getChannelData(0)
  for (let i = 0; i < shimData.length; i++) shimData[i] = Math.random() * 2 - 1
  shimmer.buffer = shimBuf
  shimmer.loop = true

  const shimBP = ctx.createBiquadFilter()
  shimBP.type = 'bandpass'
  shimBP.frequency.setValueAtTime(3000, t)
  shimBP.Q.setValueAtTime(1.5, t)

  const shimGain = ctx.createGain()
  shimGain.gain.setValueAtTime(0.012, t)
  shimmer.connect(shimBP).connect(shimGain).connect(dest)
  shimmer.start()
  nodes.push(shimmer, shimBP, shimGain)
  gains.push(shimGain)

  return loopTeardown(gains, nodes, 0.3)
}
