import { DEFAULT_WORLD_ENGINE_MODEL } from '../types/settings'
import type { PortalState } from './portalStateMachine'
import type { StreamingLifecycleSyncPayload } from './streamingLifecycleMachine'

type BuildStreamingLifecycleSyncPayloadArgs = {
  portalState: PortalState
  connectionState: string
  transportError: string | null
  engineModel?: string | null
  lastAppliedModel: string | null
  engineError: string | null
  statusCode: string | null
  hasReceivedFrame: boolean
  socketReady: boolean
  isPointerLocked: boolean
  settingsOpen: boolean
  isPaused: boolean
}

export const buildStreamingLifecycleSyncPayload = (
  args: BuildStreamingLifecycleSyncPayloadArgs
): StreamingLifecycleSyncPayload => {
  const selectedModel = args.engineModel || DEFAULT_WORLD_ENGINE_MODEL

  return {
    portalState: args.portalState,
    connectionState: args.connectionState,
    transportError: args.transportError,
    selectedModel,
    lastAppliedModel: args.lastAppliedModel,
    engineError: args.engineError,
    statusCode: args.statusCode,
    hasReceivedFrame: args.hasReceivedFrame,
    socketReady: args.socketReady,
    isPointerLocked: args.isPointerLocked,
    settingsOpen: args.settingsOpen,
    isPaused: args.isPaused
  }
}
