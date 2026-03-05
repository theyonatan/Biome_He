export type SeedRecord = {
  filename: string
  is_safe: boolean
  is_default: boolean
}

export type SeedRecordWithThumbnail = SeedRecord & {
  thumbnail_base64: string | null
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
