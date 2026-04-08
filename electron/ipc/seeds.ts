import { ipcMain, nativeImage, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { getSeedsDefaultDir, getSeedsUploadsDir, getSeedsThumbnailDir } from '../lib/paths.js'
import { SUPPORTED_IMAGE_EXTENSIONS } from '../lib/constants.js'
import type { SeedFileRecord } from '../../src/types/app.js'

const IMAGE_EXTENSIONS: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp'
}

function isSupportedImage(filename: string): boolean {
  const ext = path.extname(filename).slice(1).toLowerCase()
  return SUPPORTED_IMAGE_EXTENSIONS.includes(ext)
}

/** Find the full path of a seed by filename, searching default then uploads dirs */
function resolveSeedPath(filename: string): string | null {
  const defaultPath = path.join(getSeedsDefaultDir(), filename)
  if (fs.existsSync(defaultPath)) return defaultPath
  const uploadsPath = path.join(getSeedsUploadsDir(), filename)
  if (fs.existsSync(uploadsPath)) return uploadsPath
  return null
}

function scanDir(dir: string, isDefault: boolean): SeedFileRecord[] {
  if (!fs.existsSync(dir)) return []
  const records: SeedFileRecord[] = []
  for (const entry of fs.readdirSync(dir)) {
    if (!isSupportedImage(entry)) continue
    const filePath = path.join(dir, entry)
    try {
      const stat = fs.statSync(filePath)
      if (!stat.isFile()) continue
      records.push({ filename: entry, is_default: isDefault, modifiedAt: stat.mtimeMs })
    } catch {
      // Skip unreadable files
    }
  }
  return records
}

export function registerSeedsIpc(): void {
  ipcMain.handle('list-seeds', (): SeedFileRecord[] => {
    const defaults = scanDir(getSeedsDefaultDir(), true)
    const uploads = scanDir(getSeedsUploadsDir(), false)
    return [...defaults, ...uploads]
  })

  ipcMain.handle('get-seed-image-base64', (_event, filename: string): { base64: string } | null => {
    const filePath = resolveSeedPath(filename)
    if (!filePath) return null
    const data = fs.readFileSync(filePath)
    return { base64: data.toString('base64') }
  })

  ipcMain.handle('get-seed-thumbnail-base64', async (_event, filename: string): Promise<string | null> => {
    const filePath = resolveSeedPath(filename)
    if (!filePath) return null

    const thumbDir = getSeedsThumbnailDir()
    const thumbName = `${path.parse(filename).name}.jpg`
    const thumbPath = path.join(thumbDir, thumbName)

    // Check if cached thumbnail exists and is newer than source
    if (fs.existsSync(thumbPath)) {
      try {
        const srcStat = fs.statSync(filePath)
        const thumbStat = fs.statSync(thumbPath)
        if (thumbStat.mtimeMs >= srcStat.mtimeMs) {
          return fs.readFileSync(thumbPath).toString('base64')
        }
      } catch {
        // Regenerate on error
      }
    }

    // Generate thumbnail via Electron nativeImage (scale to 300px wide, aspect ratio preserved automatically)
    fs.mkdirSync(thumbDir, { recursive: true })
    const img = nativeImage.createFromPath(filePath)
    if (img.isEmpty()) {
      console.error(`[SEEDS] Failed to load image for thumbnail: ${filePath}`)
      return null
    }
    const { width } = img.getSize()
    const resized = img.resize({ width: Math.min(300, width) })
    const thumbBuffer = resized.toJPEG(85)
    fs.writeFileSync(thumbPath, thumbBuffer)
    return thumbBuffer.toString('base64')
  })

  ipcMain.handle('upload-seed', (_event, filename: string, base64: string): SeedFileRecord => {
    const uploadsDir = getSeedsUploadsDir()
    fs.mkdirSync(uploadsDir, { recursive: true })
    const destPath = path.join(uploadsDir, filename)
    fs.writeFileSync(destPath, Buffer.from(base64, 'base64'))
    const stat = fs.statSync(destPath)
    return { filename, is_default: false, modifiedAt: stat.mtimeMs }
  })

  ipcMain.handle('delete-seed', (_event, filename: string): void => {
    const uploadsDir = getSeedsUploadsDir()
    const filePath = path.join(uploadsDir, filename)

    // Only allow deleting from uploads dir (not default seeds)
    if (!filePath.startsWith(uploadsDir)) return
    if (!fs.existsSync(filePath)) return
    fs.unlinkSync(filePath)

    // Also delete cached thumbnail
    const thumbDir = getSeedsThumbnailDir()
    const thumbName = `${path.parse(filename).name}.jpg`
    const thumbPath = path.join(thumbDir, thumbName)
    if (fs.existsSync(thumbPath)) {
      try {
        fs.unlinkSync(thumbPath)
      } catch {
        // Best-effort cleanup
      }
    }
  })

  ipcMain.handle('get-seeds-dir-path', () => {
    return getSeedsUploadsDir()
  })

  ipcMain.handle('open-seeds-dir', () => {
    const seedsDir = getSeedsUploadsDir()
    if (!fs.existsSync(seedsDir)) {
      fs.mkdirSync(seedsDir, { recursive: true })
    }
    shell.showItemInFolder(seedsDir)
  })

  ipcMain.handle('read-image-files', (_event, paths: string[]) => {
    const results: { name: string; base64: string; mimeType: string }[] = []
    for (const filePath of paths) {
      const ext = path.extname(filePath).toLowerCase()
      const mimeType = IMAGE_EXTENSIONS[ext]
      if (!mimeType) continue
      try {
        const data = fs.readFileSync(filePath)
        results.push({ name: path.basename(filePath), base64: data.toString('base64'), mimeType })
      } catch {
        // Skip unreadable files
      }
    }
    return results
  })
}
