import { ipcMain, dialog, shell, app, BrowserWindow } from 'electron'
import { getDb } from '../database'
import { documents } from '@shared/schema'
import { eq } from 'drizzle-orm'
import path from 'path'
import fs from 'fs'

function getDocumentsDir(clientId: number): string {
  const dir = path.join(app.getPath('userData'), 'documents', String(clientId))
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function registerDocumentHandlers(): void {
  ipcMain.handle('documents:list', async (_event, clientId: number) => {
    const db = getDb()
    return db.select().from(documents).where(eq(documents.clientId, clientId)).all()
  })

  ipcMain.handle('documents:upload', async (_event, clientId: number) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const db = getDb()
    const docsDir = getDocumentsDir(clientId)
    const uploaded: typeof documents.$inferSelect[] = []

    for (const filePath of result.filePaths) {
      const fileName = path.basename(filePath)
      const destPath = path.join(docsDir, `${Date.now()}_${fileName}`)

      fs.copyFileSync(filePath, destPath)

      const relativePath = path.relative(app.getPath('userData'), destPath)

      const doc = db
        .insert(documents)
        .values({
          clientId,
          fileName,
          filePath: relativePath,
          docType: 'other',
          uploadedAt: new Date().toISOString()
        })
        .returning()
        .get()

      uploaded.push(doc)
    }

    return uploaded
  })

  ipcMain.handle('documents:open', async (_event, id: number) => {
    const db = getDb()
    const doc = db.select().from(documents).where(eq(documents.id, id)).get()
    if (!doc) return

    const fullPath = path.join(app.getPath('userData'), doc.filePath)
    shell.openPath(fullPath)
  })

  ipcMain.handle('documents:delete', async (_event, id: number) => {
    const db = getDb()
    const doc = db.select().from(documents).where(eq(documents.id, id)).get()
    if (!doc) return

    const fullPath = path.join(app.getPath('userData'), doc.filePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }

    db.delete(documents).where(eq(documents.id, id)).run()
  })
}
