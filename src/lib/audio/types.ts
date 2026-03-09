export type SoundId =
  | 'ui_hover'
  | 'ui_click'
  | 'ui_back'
  | 'ui_toggle_on'
  | 'ui_toggle_off'
  | 'error'
  | 'portal_swoosh'
  | 'portal_swoosh_long'
  | 'vortex_loop'
  | 'vortex_error'
  | 'music_menu'
  | 'music_pause'
  | 'music_gameplay'

export type SoundCategory = 'sfx' | 'music'

/** A function that synthesizes a one-shot sound into a destination node. */
export type SynthOneShot = (ctx: AudioContext, dest: AudioNode) => void

/** A function that starts a looping synth and returns a stop callback. */
export type SynthLoop = (ctx: AudioContext, dest: AudioNode) => () => void
