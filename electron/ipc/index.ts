import { registerConfigIpc } from './config.js'
import { registerBackgroundsIpc } from './backgrounds.js'
import { registerSeedsIpc } from './seeds.js'
import { registerModelsIpc } from './models.js'
import { registerEngineIpc } from './engine.js'
import { registerServerIpc } from './server.js'
import { registerWindowIpc } from './window.js'
import { registerDebugIpc } from './debug.js'

export function registerAllIpc(): void {
  registerConfigIpc()
  registerBackgroundsIpc()
  registerSeedsIpc()
  registerModelsIpc()
  registerEngineIpc()
  registerServerIpc()
  registerWindowIpc()
  registerDebugIpc()
}
