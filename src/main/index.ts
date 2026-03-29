import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { initDatabase } from './database'
import { registerClientHandlers } from './ipc/clients'
import { registerFollowUpHandlers } from './ipc/follow-ups'
import { registerNoteHandlers } from './ipc/notes'
import { registerDocumentHandlers } from './ipc/documents'
import { registerDashboardHandlers } from './ipc/dashboard'
import { registerBackupHandlers } from './ipc/backup'
import { runAutoFollowUps } from './services/auto-follow-ups'
import { runMonthlyBackup } from './services/csv-backup'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.miglena.architect-crm')

  // Initialize database
  initDatabase()

  // Register all IPC handlers
  registerClientHandlers()
  registerFollowUpHandlers()
  registerNoteHandlers()
  registerDocumentHandlers()
  registerDashboardHandlers()
  registerBackupHandlers()

  // Run startup tasks
  runAutoFollowUps()
  runMonthlyBackup()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
