import { ipcMain } from 'electron'
import { getDb } from '../database'
import { notes } from '@shared/schema'
import { eq, and, sql } from 'drizzle-orm'

export function registerNoteHandlers(): void {
  ipcMain.handle('notes:list', async (_event, clientId: number, followUpId?: number) => {
    const db = getDb()

    const conditions = [eq(notes.clientId, clientId)]
    if (followUpId !== undefined) {
      conditions.push(eq(notes.followUpId, followUpId))
    }

    return db
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(sql`${notes.createdAt} DESC`)
      .all()
  })

  ipcMain.handle(
    'notes:create',
    async (
      _event,
      data: { clientId: number; followUpId?: number; content: string }
    ) => {
      const db = getDb()
      return db
        .insert(notes)
        .values({
          clientId: data.clientId,
          followUpId: data.followUpId || null,
          content: data.content,
          createdAt: new Date().toISOString()
        })
        .returning()
        .get()
    }
  )

  ipcMain.handle('notes:delete', async (_event, id: number) => {
    const db = getDb()
    db.delete(notes).where(eq(notes.id, id)).run()
  })
}
