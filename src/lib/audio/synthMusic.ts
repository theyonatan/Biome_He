import type { SynthLoop } from './types'
import { loopTeardown } from './synthUtils'

/** Pause menu music — darker Am7 pad, slower breathing. */
export const synthPauseMusic: SynthLoop = (ctx, dest) => {
  const nodes: AudioNode[] = []
  const gains: GainNode[] = []
  const t = ctx.currentTime

  const freqs = [110.0, 164.81, 196.0, 261.63]
  for (const freq of freqs) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0.1, t)
    osc.connect(g).connect(dest)
    osc.start()
    nodes.push(osc, g)
    gains.push(g)
  }

  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(0.05, t)
  lfoGain.gain.setValueAtTime(0.03, t)
  lfo.start()
  for (const g of gains) {
    lfo.connect(lfoGain).connect(g.gain)
  }
  nodes.push(lfo, lfoGain)

  return loopTeardown(gains, nodes, 1.0)
}

/** Gameplay music — open fifth drone with triangle waves and slow modulation. */
export const synthGameplayMusic: SynthLoop = (ctx, dest) => {
  const nodes: AudioNode[] = []
  const gains: GainNode[] = []
  const t = ctx.currentTime

  const osc1 = ctx.createOscillator()
  const g1 = ctx.createGain()
  osc1.type = 'triangle'
  osc1.frequency.setValueAtTime(65.41, t) // C2
  g1.gain.setValueAtTime(0.2, t)
  osc1.connect(g1).connect(dest)
  osc1.start()
  nodes.push(osc1, g1)
  gains.push(g1)

  const osc2 = ctx.createOscillator()
  const g2 = ctx.createGain()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(98.0, t) // G2
  g2.gain.setValueAtTime(0.15, t)
  osc2.connect(g2).connect(dest)
  osc2.start()
  nodes.push(osc2, g2)
  gains.push(g2)

  // Octave above for presence
  const osc3 = ctx.createOscillator()
  const g3 = ctx.createGain()
  osc3.type = 'sine'
  osc3.frequency.setValueAtTime(130.81, t) // C3
  g3.gain.setValueAtTime(0.08, t)
  osc3.connect(g3).connect(dest)
  osc3.start()
  nodes.push(osc3, g3)
  gains.push(g3)

  // Slow amplitude modulation for movement
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(0.05, t)
  lfoGain.gain.setValueAtTime(0.05, t)
  lfo.start()
  lfo.connect(lfoGain).connect(g1.gain)
  lfo.connect(lfoGain).connect(g2.gain)
  nodes.push(lfo, lfoGain)

  return loopTeardown(gains, nodes, 1.5)
}
