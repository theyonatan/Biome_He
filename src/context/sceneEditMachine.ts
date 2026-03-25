/** Scene edit (inpainting) state machine. */

export type SceneEditPhase = 'inactive' | 'prompting' | 'loading' | 'error'

export type SceneEditDebugPreview = {
  originalB64: string
  inpaintedB64: string
}

export type SceneEditState = {
  phase: SceneEditPhase
  /** The prompt being submitted (only set in 'loading'). */
  prompt: string
  /** Error message (only set in 'error'). */
  errorMessage: string
  /** Debug preview of the last inpaint operation (before + after). */
  lastPreview: SceneEditDebugPreview | null
}

export type SceneEditEvent =
  | { type: 'OPEN' }
  | { type: 'DISMISS' }
  | { type: 'SUBMIT'; prompt: string }
  | { type: 'SUCCESS'; preview?: SceneEditDebugPreview }
  | { type: 'ERROR'; message: string }
  | { type: 'ERROR_TIMEOUT' }

export const initialSceneEditState: SceneEditState = {
  phase: 'inactive',
  prompt: '',
  errorMessage: '',
  lastPreview: null
}

export function sceneEditReducer(state: SceneEditState, event: SceneEditEvent): SceneEditState {
  switch (event.type) {
    case 'OPEN':
      if (state.phase !== 'inactive') return state
      return { ...initialSceneEditState, phase: 'prompting', lastPreview: state.lastPreview }

    case 'DISMISS':
      if (state.phase === 'inactive') return state
      return { ...initialSceneEditState, lastPreview: state.lastPreview }

    case 'SUBMIT':
      if (state.phase !== 'prompting') return state
      return { ...state, phase: 'loading', prompt: event.prompt }

    case 'SUCCESS':
      if (state.phase !== 'loading') return state
      return { ...initialSceneEditState, lastPreview: event.preview ?? state.lastPreview }

    case 'ERROR':
      if (state.phase !== 'loading') return state
      return { ...state, phase: 'error', errorMessage: event.message }

    case 'ERROR_TIMEOUT':
      if (state.phase !== 'error') return state
      return { ...initialSceneEditState, lastPreview: state.lastPreview }

    default:
      return state
  }
}
