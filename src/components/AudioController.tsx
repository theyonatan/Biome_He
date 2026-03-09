import { useEffect, useRef } from 'react'
import { useAudio } from '../context/AudioContext'
import { usePortal } from '../context/PortalContext'
import { useStreaming } from '../context/StreamingContext'

/**
 * Observes app state and manages ambient audio loops.
 * Renders nothing — pure side-effect component.
 */
const AudioController = () => {
  const { play, startLoop, stopLoop, stopAllLoops, setLoopVolume, isLoopActive } = useAudio()
  const { state, states } = usePortal()
  const { error, engineError, isPaused } = useStreaming()
  const prevErrorRef = useRef<string | null>(null)
  const prevStateRef = useRef<string | null>(null)

  // Manage ambient loops based on portal state
  useEffect(() => {
    const cameFromLoading = prevStateRef.current === states.LOADING
    prevStateRef.current = state

    if (state === states.LOADING) {
      stopLoop('music_menu')
      stopLoop('music_pause')
      stopLoop('music_gameplay')
      // The portal hover may have already started the vortex loop at low volume;
      // ramp it to full rather than restarting.
      if (isLoopActive('vortex_loop')) {
        setLoopVolume('vortex_loop', 1, 0.3)
      } else {
        startLoop('vortex_loop')
      }
    } else if (state === states.STREAMING) {
      stopLoop('vortex_loop')
      stopLoop('vortex_error')
      stopLoop('music_menu')
      // Pause/gameplay music handled by the isPaused effect below
    } else if (state === states.MAIN_MENU) {
      // Stop vortex when returning from loading; leave it alone if portal hover started it
      if (cameFromLoading) {
        stopLoop('vortex_loop')
        stopLoop('vortex_error')
      }
      stopLoop('music_gameplay')
      stopLoop('music_pause')
      startLoop('music_menu')
    } else {
      stopAllLoops()
    }
  }, [state, states, startLoop, stopLoop, stopAllLoops, setLoopVolume, isLoopActive])

  // Swap between gameplay and pause music
  useEffect(() => {
    if (state !== states.STREAMING) return
    if (isPaused) {
      stopLoop('music_gameplay')
      startLoop('music_pause')
    } else {
      stopLoop('music_pause')
      startLoop('music_gameplay')
    }
  }, [isPaused, state, states, startLoop, stopLoop])

  // On error during loading: swap vortex_loop for menacing vortex_error
  useEffect(() => {
    const currentError = error || engineError || null
    if (currentError && currentError !== prevErrorRef.current) {
      play('error')
      // Swap to error vortex while in loading state
      if (state === states.LOADING) {
        stopLoop('vortex_loop')
        startLoop('vortex_error')
      }
    }
    prevErrorRef.current = currentError
  }, [error, engineError, play, state, states, stopLoop, startLoop])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAllLoops()
  }, [stopAllLoops])

  return null
}

export default AudioController
