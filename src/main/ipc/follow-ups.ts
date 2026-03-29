import { ipcMain } from 'electron'
import { getDb } from '../database'
import { followUps, clients, clientPhones, clientEmails } from '@shared/schema'
import { eq, and, lte, gte, sql } from 'drizzle-orm'
import type { FollowUpFilters } from '@shared/api'

export function registerFollowUpHandlers(): void {
  ipcMain.handle('follow-ups:list', async (_event, filters?: FollowUpFilters) => {
    const db = getDb()

    const today = new Date().toISOString().split('T')[0]
    const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    let conditions: ReturnType<typeof eq>[] = []

    if (filters?.clientId) {
      conditions.push(eq(followUps.clientId, filters.clientId))
    }

    switch (filters?.tab) {
      case 'overdue':
        conditions.push(sql`${followUps.dueDate} < ${today}`)
        conditions.push(eq(followUps.isCompleted, 0))
        break
      case 'today':
        conditions.push(eq(followUps.dueDate, today))
        conditions.push(eq(followUps.isCompleted, 0))
        break
      case 'week':
        conditions.push(gte(followUps.dueDate, today))
        conditions.push(lte(followUps.dueDate, weekEnd))
        conditions.push(eq(followUps.isCompleted, 0))
        break
      case 'upcoming':
        conditions.push(gte(followUps.dueDate, today))
        conditions.push(eq(followUps.isCompleted, 0))
        break
      case 'all':
      default:
        // Show incomplete first
        conditions.push(eq(followUps.isCompleted, 0))
        break
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const followUpList = db
      .select()
      .from(followUps)
      .where(where)
      .orderBy(sql`${followUps.dueDate} ASC`)
      .all()

    // Attach client info
    return followUpList.map((fu) => {
      const client = db.select().from(clients).where(eq(clients.id, fu.clientId)).get()
      const phones = client
        ? db.select().from(clientPhones).where(eq(clientPhones.clientId, client.id)).all()
        : []
      const emails = client
        ? db.select().from(clientEmails).where(eq(clientEmails.clientId, client.id)).all()
        : []
      return {
        ...fu,
        client: client ? { ...client, phones, emails } : null
      }
    })
  })

  ipcMain.handle(
    'follow-ups:create',
    async (_event, data: { clientId: number; task: string; dueDate: string }) => {
      const db = getDb()
      return db
        .insert(followUps)
        .values({
          clientId: data.clientId,
          task: data.task,
          dueDate: data.dueDate,
          isCompleted: 0,
          createdAt: new Date().toISOString()
        })
        .returning()
        .get()
    }
  )

  ipcMain.handle('follow-ups:toggle', async (_event, id: number) => {
    const db = getDb()
    const existing = db.select().from(followUps).where(eq(followUps.id, id)).get()
    if (!existing) throw new Error('Follow-up not found')

    return db
      .update(followUps)
      .set({ isCompleted: existing.isCompleted === 0 ? 1 : 0 })
      .where(eq(followUps.id, id))
      .returning()
      .get()
  })

  ipcMain.handle('follow-ups:delete', async (_event, id: number) => {
    const db = getDb()
    db.delete(followUps).where(eq(followUps.id, id)).run()
  })
}
