import type { SynthOneShot } from './types'

export const synthUIHover: SynthOneShot = (ctx, dest) => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(2400, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + 0.04)
  gain.gain.setValueAtTime(0.06, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
  osc.connect(gain).connect(dest)
  osc.start()
  osc.stop(ctx.currentTime + 0.06)
}

export const synthUIClick: SynthOneShot = (ctx, dest) => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(1200, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08)
  gain.gain.setValueAtTime(0.12, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
  osc.connect(gain).connect(dest)
  osc.start()
  osc.stop(ctx.currentTime + 0.1)

  // Subtle click transient
  const noise = ctx.createBufferSource()
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.01, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3
  noise.buffer = buf
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0.08, ctx.currentTime)
  ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015)
  noise.connect(ng).connect(dest)
  noise.start()
}

export const synthUIBack: SynthOneShot = (ctx, dest) => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(900, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.12)
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
  osc.connect(gain).connect(dest)
  osc.start()
  osc.stop(ctx.currentTime + 0.12)
}

export const synthToggleOn: SynthOneShot = (ctx, dest) => synthToggle(ctx, dest, true)
export const synthToggleOff: SynthOneShot = (ctx, dest) => synthToggle(ctx, dest, false)

function synthToggle(ctx: AudioContext, dest: AudioNode, on: boolean) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  if (on) {
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.07)
  } else {
    osc.frequency.setValueAtTime(1200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.07)
  }
  gain.gain.setValueAtTime(0.09, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)
  osc.connect(gain).connect(dest)
  osc.start()
  osc.stop(ctx.currentTime + 0.09)
}
