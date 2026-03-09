import { useCallback } from 'react'
import { useAudio } from '../context/AudioContext'

/** Convenience hook for UI sound effects on interactive elements. */
export const useUISound = () => {
  const { play } = useAudio()

  const hoverProps = {
    onMouseEnter: useCallback(() => play('ui_hover'), [play])
  }

  const clickProps = {
    onMouseDown: useCallback(() => play('ui_click'), [play])
  }

  const backProps = {
    onMouseDown: useCallback(() => play('ui_back'), [play])
  }

  const playHover = useCallback(() => play('ui_hover'), [play])
  const playClick = useCallback(() => play('ui_click'), [play])
  const playBack = useCallback(() => play('ui_back'), [play])
  const playToggleOn = useCallback(() => play('ui_toggle_on'), [play])
  const playToggleOff = useCallback(() => play('ui_toggle_off'), [play])
  const playError = useCallback(() => play('error'), [play])

  return { hoverProps, clickProps, backProps, playHover, playClick, playBack, playToggleOn, playToggleOff, playError }
}
