import { useEffect, useRef } from 'react'
import { useAudio } from '../context/AudioContext'
import { usePortal } from '../context/PortalContext'
import { useStreaming } from '../context/StreamingContext'

/** Duration in seconds for music crossfades. */
const MUSIC_FADE_S = 0.5

/**
 * Observes app state and manages ambient audio loops.
 * Renders nothing — pure side-effect component.
 */
const AudioController = () => {
  const { play, startLoop, stopLoop, fadeOutLoop, crossfadeLoop, stopAllLoops } = useAudio()
  const { state, states } = usePortal()
  const { error, engineError, isPaused } = useStreaming()
  const prevErrorRef = useRef<string | null>(null)
  const prevStateRef = useRef<string | null>(null)

  // Manage ambient loops based on portal state
  useEffect(() => {
    const cameFromLoading = prevStateRef.current === states.LOADING
    prevStateRef.current = state

    if (state === states.LOADING) {
      fadeOutLoop('music_menu', 0.3)
      fadeOutLoop('music_pause', 0.3)
      fadeOutLoop('music_gameplay', 0.3)
      fadeOutLoop('portal_hum', 0.15)
      startLoop('vortex_loop', 1, 0.5)
    } else if (state === states.STREAMING) {
      fadeOutLoop('vortex_loop', 0.3)
      fadeOutLoop('vortex_error', 0.3)
      fadeOutLoop('music_menu', 0.3)
      // Pause/gameplay music handled by the isPaused effect below
    } else if (state === states.MAIN_MENU) {
      // Stop vortex when returning from loading; leave it alone if portal hover started it
      if (cameFromLoading) {
        fadeOutLoop('vortex_loop', 0.3)
        fadeOutLoop('vortex_error', 0.3)
      }
      crossfadeLoop('music_gameplay', 'music_menu', MUSIC_FADE_S)
      crossfadeLoop('music_pause', 'music_menu', MUSIC_FADE_S)
    } else {
      stopAllLoops()
    }
  }, [state, states, startLoop, stopLoop, fadeOutLoop, crossfadeLoop, stopAllLoops])

  // Swap between gameplay and pause music with crossfade
  useEffect(() => {
    if (state !== states.STREAMING) return
    if (isPaused) {
      crossfadeLoop('music_gameplay', 'music_pause', MUSIC_FADE_S)
    } else {
      crossfadeLoop('music_pause', 'music_gameplay', MUSIC_FADE_S)
    }
  }, [isPaused, state, states, crossfadeLoop])

  // On error during loading: swap vortex_loop for menacing vortex_error
  useEffect(() => {
    const currentError = error || engineError || null
    if (currentError && currentError !== prevErrorRef.current) {
      play('error')
      if (state === states.LOADING) {
        fadeOutLoop('vortex_loop', 0.3)
        startLoop('vortex_error', 1, 0.3)
      }
    }
    prevErrorRef.current = currentError
  }, [error, engineError, play, state, states, stopLoop, fadeOutLoop, startLoop])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAllLoops()
  }, [stopAllLoops])

  return null
}

export default AudioController
