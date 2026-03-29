import { ipcMain } from 'electron'
import { getDb } from '../database'
import { clients, clientPhones, clientEmails, followUps, notes, documents } from '@shared/schema'
import { eq, like, or, and, sql } from 'drizzle-orm'
import type { ClientFilters, CreateClientInput, UpdateClientInput } from '@shared/api'
import { runAutoFollowUps } from '../services/auto-follow-ups'

export function registerClientHandlers(): void {
  ipcMain.handle('clients:list', async (_event, filters?: ClientFilters) => {
    const db = getDb()

    let conditions: ReturnType<typeof eq>[] = []

    if (filters?.search) {
      const search = `%${filters.search}%`
      conditions.push(
        or(
          like(clients.name, search),
          like(clients.projectName, search),
          like(clients.projectLocation, search)
        )!
      )
    }

    if (filters?.stage) {
      conditions.push(eq(clients.stage, filters.stage))
    }

    if (filters?.clientType) {
      conditions.push(eq(clients.clientType, filters.clientType))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const clientList = db
      .select()
      .from(clients)
      .where(where)
      .orderBy(sql`${clients.createdAt} DESC`)
      .all()

    // Attach phones and emails to each client
    return clientList.map((client) => {
      const phones = db
        .select()
        .from(clientPhones)
        .where(eq(clientPhones.clientId, client.id))
        .all()
      const emails = db
        .select()
        .from(clientEmails)
        .where(eq(clientEmails.clientId, client.id))
        .all()
      return { ...client, phones, emails }
    })
  })

  ipcMain.handle('clients:get', async (_event, id: number) => {
    const db = getDb()
    const client = db.select().from(clients).where(eq(clients.id, id)).get()
    if (!client) return null

    const phones = db
      .select()
      .from(clientPhones)
      .where(eq(clientPhones.clientId, id))
      .all()
    const emails = db
      .select()
      .from(clientEmails)
      .where(eq(clientEmails.clientId, id))
      .all()
    const docs = db
      .select()
      .from(documents)
      .where(eq(documents.clientId, id))
      .all()
    const clientNotes = db
      .select()
      .from(notes)
      .where(eq(notes.clientId, id))
      .orderBy(sql`${notes.createdAt} DESC`)
      .all()
    const clientFollowUps = db
      .select()
      .from(followUps)
      .where(eq(followUps.clientId, id))
      .orderBy(sql`${followUps.dueDate} ASC`)
      .all()

    return {
      ...client,
      phones,
      emails,
      documents: docs,
      notes: clientNotes,
      followUps: clientFollowUps
    }
  })

  ipcMain.handle('clients:create', async (_event, data: CreateClientInput) => {
    const db = getDb()
    const now = new Date().toISOString()

    const result = db
      .insert(clients)
      .values({
        name: data.name,
        clientType: data.clientType,
        projectLocation: data.projectLocation || '',
        projectName: data.projectName || '',
        projectSum: data.projectSum || 0,
        stage: data.stage || 'inquiry',
        followUpIntervalDays: data.followUpIntervalDays ?? 7,
        createdAt: now,
        updatedAt: now
      })
      .returning()
      .get()

    // Insert phones
    for (const phone of data.phones) {
      if (phone.phone.trim()) {
        db.insert(clientPhones)
          .values({ clientId: result.id, phone: phone.phone, label: phone.label })
          .run()
      }
    }

    // Insert emails
    for (const email of data.emails) {
      if (email.email.trim()) {
        db.insert(clientEmails)
          .values({ clientId: result.id, email: email.email, label: email.label })
          .run()
      }
    }

    // Run auto follow-up generation for new client
    runAutoFollowUps(result.id)

    return result
  })

  ipcMain.handle('clients:update', async (_event, data: UpdateClientInput) => {
    const db = getDb()
    const now = new Date().toISOString()

    const result = db
      .update(clients)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.clientType !== undefined && { clientType: data.clientType }),
        ...(data.projectLocation !== undefined && { projectLocation: data.projectLocation }),
        ...(data.projectName !== undefined && { projectName: data.projectName }),
        ...(data.projectSum !== undefined && { projectSum: data.projectSum }),
        ...(data.stage !== undefined && { stage: data.stage }),
        ...(data.followUpIntervalDays !== undefined && { followUpIntervalDays: data.followUpIntervalDays }),
        updatedAt: now
      })
      .where(eq(clients.id, data.id))
      .returning()
      .get()

    // Update phones if provided
    if (data.phones) {
      db.delete(clientPhones).where(eq(clientPhones.clientId, data.id)).run()
      for (const phone of data.phones) {
        if (phone.phone.trim()) {
          db.insert(clientPhones)
            .values({ clientId: data.id, phone: phone.phone, label: phone.label })
            .run()
        }
      }
    }

    // Update emails if provided
    if (data.emails) {
      db.delete(clientEmails).where(eq(clientEmails.clientId, data.id)).run()
      for (const email of data.emails) {
        if (email.email.trim()) {
          db.insert(clientEmails)
            .values({ clientId: data.id, email: email.email, label: email.label })
            .run()
        }
      }
    }

    // Run auto follow-up generation after update
    runAutoFollowUps(data.id)

    return result
  })

  ipcMain.handle('clients:delete', async (_event, id: number) => {
    const db = getDb()
    db.delete(clients).where(eq(clients.id, id)).run()
  })

  ipcMain.handle('clients:set-reminder', async (_event, id: number, days: number) => {
    const db = getDb()
    const now = new Date().toISOString()
    const result = db
      .update(clients)
      .set({ followUpIntervalDays: days, updatedAt: now })
      .where(eq(clients.id, id))
      .returning()
      .get()
    // Regenerate follow-ups with new interval
    runAutoFollowUps(id)
    return result
  })

  ipcMain.handle('clients:mark-lost', async (_event, id: number) => {
    const db = getDb()
    const now = new Date().toISOString()
    return db
      .update(clients)
      .set({ stage: 'lost', updatedAt: now })
      .where(eq(clients.id, id))
      .returning()
      .get()
  })
}
