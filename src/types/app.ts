/** Seed file record returned by the Electron main process (IPC) */
export type SeedFileRecord = {
  filename: string
  is_default: boolean
  modifiedAt: number
}

/** Seed record used in the renderer with client-side safety status */
export type SeedRecord = {
  filename: string
  is_safe: boolean | null // null = not yet checked
  is_default: boolean
}

export type EngineStatus = {
  uv_installed: boolean
  repo_cloned: boolean
  dependencies_synced: boolean
  server_running: boolean
  server_port: number | null
  server_log_path: string | null
}

export type SetupStatus = 'saved' | 'error' | null

export type LoadingStage = {
  id: string
  label: string
  percent: number
}
