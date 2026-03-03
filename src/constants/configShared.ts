// Shared configuration constants used by both renderer and main process.
// Keep this file free of React/runtime dependencies.

// Internal standalone server port used by Biome's managed local engine.
// Keep fixed and not user-configurable to avoid collisions with hosted mode.
// Port 7987 = 'O' (79) + 'W' (87) in ASCII
export const STANDALONE_DEFAULT_PORT = 7987

// Hosted/self-hosted server default port (user-configurable).
export const HOSTED_DEFAULT_PORT = 7897

export const DEFAULT_WORLD_ENGINE_MODEL = 'Overworld/Waypoint-1-Small'

// Engine mode: how the World Engine server should be managed.
export const ENGINE_MODES = {
  UNCHOSEN: 'unchosen',
  STANDALONE: 'standalone',
  SERVER: 'server'
} as const
