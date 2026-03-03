import { ipcMain } from 'electron'
import * as path from 'node:path'
import * as fs from 'node:fs'

export function registerDebugIpc(): void {
  ipcMain.handle('write-spark-tuning', async (_event, tuning: Record<string, number>) => {
    const targetPath = path.resolve(process.cwd(), 'src', 'lib', 'portalSparksTuning.json')
    await fs.promises.writeFile(targetPath, JSON.stringify(tuning, null, 2) + '\n', 'utf-8')
  })
}
