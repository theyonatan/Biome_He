/**
 * Audio engine: synthesized placeholder sounds + easy asset swap.
 *
 * To replace a synthesized sound with a real asset, add the file to
 * `assets/audio/` and register it in `SOUND_ASSETS` below. The engine
 * will prefer the asset file over the synthesizer. If the asset fails
 * to load, the synthesizer is used as a fallback.
 */

// ---------------------------------------------------------------------------
// Sound registry
// ---------------------------------------------------------------------------

export type SoundId =
  | 'ui_hover'
  | 'ui_click'
  | 'ui_back'
  | 'ui_toggle_on'
  | 'ui_toggle_off'
  | 'error'
  | 'portal_swoosh'
  | 'vortex_loop'
  | 'vortex_error'
  | 'music_menu'
  | 'music_pause'
  | 'music_gameplay'

export type SoundCategory = 'sfx' | 'music'

const SOUND_CATEGORIES: Record<SoundId, SoundCategory> = {
  ui_hover: 'sfx',
  ui_click: 'sfx',
  ui_back: 'sfx',
  ui_toggle_on: 'sfx',
  ui_toggle_off: 'sfx',
  error: 'sfx',
  portal_swoosh: 'sfx',
  vortex_loop: 'sfx',
  vortex_error: 'sfx',
  music_menu: 'music',
  music_pause: 'music',
  music_gameplay: 'music'
}

/**
 * Map sound IDs to asset file paths (relative to the app root).
 * Leave a key absent to use the synthesizer fallback.
 *
 * Example:
 *   ui_click: new URL('../../assets/audio/click.wav', import.meta.url).href
 */
const SOUND_ASSETS: Partial<Record<SoundId, string>> = {}

// ---------------------------------------------------------------------------
// Synthesizer — procedural placeholder sounds
// ---------------------------------------------------------------------------

function synthUIHover(ctx: AudioContext, dest: AudioNode) {
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

function synthUIClick(ctx: AudioContext, dest: AudioNode) {
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

function synthUIBack(ctx: AudioContext, dest: AudioNode) {
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

function synthError(ctx: AudioContext, dest: AudioNode) {
  // Low rumble
  const rumble = ctx.createOscillator()
  const rGain = ctx.createGain()
  rumble.type = 'sawtooth'
  rumble.frequency.setValueAtTime(55, ctx.currentTime)
  rGain.gain.setValueAtTime(0.1, ctx.currentTime)
  rGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.15)
  rGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
  rumble.connect(rGain).connect(dest)
  rumble.start()
  rumble.stop(ctx.currentTime + 0.8)

  // Detuned chime
  for (const detune of [-30, 0, 25]) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(330, ctx.currentTime)
    osc.detune.setValueAtTime(detune, ctx.currentTime)
    g.gain.setValueAtTime(0.06, ctx.currentTime + 0.05)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.connect(g).connect(dest)
    osc.start(ctx.currentTime + 0.05)
    osc.stop(ctx.currentTime + 0.6)
  }
}

/** Gentle wind passing by when the portal transitions. */
function synthPortalSwoosh(ctx: AudioContext, dest: AudioNode) {
  const t = ctx.currentTime

  // Soft filtered noise — gentle breeze
  const noise = ctx.createBufferSource()
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate)
  const noiseData = noiseBuf.getChannelData(0)
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1
  noise.buffer = noiseBuf
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.setValueAtTime(400, t)
  bandpass.frequency.exponentialRampToValueAtTime(1200, t + 0.4)
  bandpass.frequency.exponentialRampToValueAtTime(500, t + 1.2)
  bandpass.Q.setValueAtTime(0.4, t)
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0, t)
  noiseGain.gain.linearRampToValueAtTime(0.15, t + 0.2)
  noiseGain.gain.linearRampToValueAtTime(0.1, t + 0.6)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.3)
  noise.connect(bandpass).connect(noiseGain).connect(dest)
  noise.start()
}

/** Shared cleanup helper for loop synths. */
function loopTeardown(gains: GainNode[], nodes: AudioNode[], fadeSeconds: number): () => void {
  return () => {
    const t = gains[0]?.context?.currentTime ?? 0
    for (const g of gains) {
      g.gain.cancelScheduledValues(t)
      g.gain.setValueAtTime(g.gain.value, t)
      g.gain.linearRampToValueAtTime(0, t + fadeSeconds)
    }
    setTimeout(
      () => {
        for (const n of nodes) {
          try {
            if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) (n as OscillatorNode).stop()
            n.disconnect()
          } catch {
            // Already stopped/disconnected
          }
        }
      },
      fadeSeconds * 1000 + 100
    )
  }
}

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
function synthVortexLoop(ctx: AudioContext, dest: AudioNode): () => void {
  return buildVortexLoop(ctx, dest, 'normal')
}

/** Darker, frenzied variant of the vortex for error states. */
function synthVortexError(ctx: AudioContext, dest: AudioNode): () => void {
  return buildVortexLoop(ctx, dest, 'error')
}

/** Create ambient menu music — returns a stop function. */
function synthMenuMusic(ctx: AudioContext, dest: AudioNode): () => void {
  const nodes: AudioNode[] = []
  const gains: GainNode[] = []
  const t = ctx.currentTime

  // Warm pad chord: Cmaj7 voiced openly
  const freqs = [130.81, 196.0, 246.94, 329.63]
  for (const freq of freqs) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0.12, t)
    osc.connect(g).connect(dest)
    osc.start()
    nodes.push(osc, g)
    gains.push(g)
  }

  // Gentle LFO on volume for breathing effect
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(0.08, t)
  lfoGain.gain.setValueAtTime(0.04, t)
  lfo.start()
  for (const g of gains) {
    lfo.connect(lfoGain).connect(g.gain)
  }
  nodes.push(lfo, lfoGain)

  return loopTeardown(gains, nodes, 1.0)
}

/** Create ambient pause menu music — returns a stop function. */
function synthPauseMusic(ctx: AudioContext, dest: AudioNode): () => void {
  const nodes: AudioNode[] = []
  const gains: GainNode[] = []
  const t = ctx.currentTime

  // Darker, more subdued version of menu music — Am7 chord
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

  // Slower breathing than menu
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

/** Create ambient gameplay music — returns a stop function. */
function synthGameplayMusic(ctx: AudioContext, dest: AudioNode): () => void {
  const nodes: AudioNode[] = []
  const gains: GainNode[] = []
  const t = ctx.currentTime

  // Open fifth drone with triangle waves for more presence
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

const SYNTH_ONE_SHOTS: Record<string, (ctx: AudioContext, dest: AudioNode) => void> = {
  ui_hover: synthUIHover,
  ui_click: synthUIClick,
  ui_back: synthUIBack,
  ui_toggle_on: (ctx, dest) => synthToggle(ctx, dest, true),
  ui_toggle_off: (ctx, dest) => synthToggle(ctx, dest, false),
  error: synthError,
  portal_swoosh: synthPortalSwoosh
}

const SYNTH_LOOPS: Record<string, (ctx: AudioContext, dest: AudioNode) => () => void> = {
  vortex_loop: synthVortexLoop,
  vortex_error: synthVortexError,
  music_menu: synthMenuMusic,
  music_pause: synthPauseMusic,
  music_gameplay: synthGameplayMusic
}

// ---------------------------------------------------------------------------
// Audio engine class
// ---------------------------------------------------------------------------

export class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private assetBuffers = new Map<string, AudioBuffer>()
  private activeLoops = new Map<SoundId, { stop: () => void; gain: GainNode }>()
  private _masterVolume = 1.0
  private _sfxVolume = 0.5
  private _musicVolume = 0.3
  private resumePromise: Promise<void> | null = null

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.sfxGain = this.ctx.createGain()
      this.musicGain = this.ctx.createGain()
      this.sfxGain.connect(this.masterGain)
      this.musicGain.connect(this.masterGain)
      this.masterGain.connect(this.ctx.destination)
      this.applyVolumes()
    }
    if (this.ctx.state === 'suspended' && !this.resumePromise) {
      this.resumePromise = this.ctx.resume().then(() => {
        this.resumePromise = null
      })
    }
    return this.ctx
  }

  private applyVolumes() {
    if (this.masterGain) this.masterGain.gain.value = this._masterVolume
    if (this.sfxGain) this.sfxGain.gain.value = this._sfxVolume
    if (this.musicGain) this.musicGain.gain.value = this._musicVolume
  }

  setVolumes(master: number, sfx: number, music: number) {
    this._masterVolume = master
    this._sfxVolume = sfx
    this._musicVolume = music
    this.applyVolumes()
  }

  private getDestForCategory(cat: SoundCategory): AudioNode {
    return cat === 'music' ? this.musicGain! : this.sfxGain!
  }

  /** Preload an asset file into a decoded AudioBuffer. */
  async preloadAsset(id: string, url: string): Promise<void> {
    try {
      const ctx = this.ensureContext()
      const resp = await fetch(url)
      const arrayBuf = await resp.arrayBuffer()
      const audioBuf = await ctx.decodeAudioData(arrayBuf)
      this.assetBuffers.set(id, audioBuf)
    } catch (err) {
      console.warn(`[AudioEngine] Failed to preload asset "${id}":`, err)
    }
  }

  /** Play a one-shot sound. */
  play(id: SoundId) {
    const ctx = this.ensureContext()
    const cat = SOUND_CATEGORIES[id]
    const dest = this.getDestForCategory(cat)

    // Try asset buffer first
    const buffer = this.assetBuffers.get(id)
    if (buffer) {
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(dest)
      source.start()
      return
    }

    // Fall back to synthesizer
    const synth = SYNTH_ONE_SHOTS[id]
    if (synth) {
      synth(ctx, dest)
    }
  }

  /** Start a looping sound at an optional volume (0-1, default 1). Returns true if started. */
  startLoop(id: SoundId, volume = 1): boolean {
    if (this.activeLoops.has(id)) return false
    const ctx = this.ensureContext()
    const cat = SOUND_CATEGORIES[id]
    const dest = this.getDestForCategory(cat)

    // Per-loop gain node for individual volume control
    const loopGain = ctx.createGain()
    loopGain.gain.setValueAtTime(volume, ctx.currentTime)
    loopGain.connect(dest)

    // Try asset buffer first
    const buffer = this.assetBuffers.get(id)
    if (buffer) {
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(loopGain)
      source.start()
      this.activeLoops.set(id, {
        gain: loopGain,
        stop: () => {
          source.stop()
          source.disconnect()
          loopGain.disconnect()
        }
      })
      return true
    }

    // Fall back to synthesizer
    const synthLoop = SYNTH_LOOPS[id]
    if (synthLoop) {
      const stop = synthLoop(ctx, loopGain)
      this.activeLoops.set(id, { gain: loopGain, stop })
      return true
    }

    loopGain.disconnect()
    return false
  }

  /** Set volume of an active loop, with optional ramp time in seconds. */
  setLoopVolume(id: SoundId, volume: number, rampSeconds = 0) {
    const loop = this.activeLoops.get(id)
    if (!loop || !this.ctx) return
    if (rampSeconds > 0) {
      loop.gain.gain.cancelScheduledValues(this.ctx.currentTime)
      loop.gain.gain.setValueAtTime(loop.gain.gain.value, this.ctx.currentTime)
      loop.gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + rampSeconds)
    } else {
      loop.gain.gain.setValueAtTime(volume, this.ctx.currentTime)
    }
  }

  /** Check if a loop is currently active. */
  isLoopActive(id: SoundId): boolean {
    return this.activeLoops.has(id)
  }

  /** Stop a looping sound. */
  stopLoop(id: SoundId) {
    const loop = this.activeLoops.get(id)
    if (loop) {
      loop.stop()
      this.activeLoops.delete(id)
    }
  }

  /** Stop all active loops. */
  stopAllLoops() {
    for (const [id] of this.activeLoops) {
      this.stopLoop(id)
    }
  }

  /** Preload all registered asset files. */
  async preloadAll(): Promise<void> {
    const entries = Object.entries(SOUND_ASSETS) as [SoundId, string][]
    await Promise.all(entries.map(([id, url]) => this.preloadAsset(id, url)))
  }
}
