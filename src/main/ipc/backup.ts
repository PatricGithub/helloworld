import { ipcMain, app, shell } from 'electron'
import { exportCsv } from '../services/csv-backup'
import path from 'path'
import fs from 'fs'
import type { BackupEntry } from '@shared/api'

function getBackupDir(): string {
  const desktopPath = app.getPath('desktop')
  return path.join(desktopPath, 'Backup')
}

export function registerBackupHandlers(): void {
  ipcMain.handle('backup:run', async () => {
    return exportCsv()
  })

  ipcMain.handle('backup:list', async (): Promise<BackupEntry[]> => {
    const backupDir = getBackupDir()

    if (!fs.existsSync(backupDir)) {
      return []
    }

    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.csv'))

    return files
      .map((fileName) => {
        const filePath = path.join(backupDir, fileName)
        const stats = fs.statSync(filePath)
        return {
          fileName,
          filePath,
          date: stats.mtime.toISOString(),
          sizeKb: Math.round(stats.size / 1024)
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  ipcMain.handle('backup:open', async (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
  })
}
