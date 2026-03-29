import { getDb } from '../database'
import { clients, followUps } from '@shared/schema'
import { eq, and, gte, sql } from 'drizzle-orm'

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const CHECK_TASK = 'Check on project'

export function runAutoFollowUps(clientId?: number): void {
  const db = getDb()

  const clientList = clientId
    ? db.select().from(clients).where(eq(clients.id, clientId)).all()
    : db.select().from(clients).all()

  const today = new Date().toISOString().split('T')[0]

  for (const client of clientList) {
    // Skip completed and lost clients — no reminders needed
    if (client.stage === 'completed' || client.stage === 'lost') {
      continue
    }

    const intervalDays = client.followUpIntervalDays ?? 7

    // Check if there's already a pending (incomplete) follow-up for this client
    const existingPending = db
      .select()
      .from(followUps)
      .where(
        and(
          eq(followUps.clientId, client.id),
          eq(followUps.isCompleted, 0),
          gte(followUps.dueDate, today)
        )
      )
      .get()

    // If there's already a future pending follow-up, skip
    if (existingPending) {
      continue
    }

    // Find the last completed follow-up date
    const lastCompleted = db
      .select()
      .from(followUps)
      .where(
        and(eq(followUps.clientId, client.id), eq(followUps.isCompleted, 1))
      )
      .orderBy(sql`${followUps.dueDate} DESC`)
      .limit(1)
      .get()

    const baseDate = lastCompleted
      ? new Date(lastCompleted.dueDate)
      : new Date(client.createdAt)

    const dueDate = addDays(baseDate, intervalDays)

    // If the computed due date is in the past, schedule from today instead
    const actualDueDate = dueDate < today ? addDays(new Date(), intervalDays) : dueDate

    db.insert(followUps)
      .values({
        clientId: client.id,
        task: CHECK_TASK,
        dueDate: actualDueDate,
        isCompleted: 0,
        createdAt: new Date().toISOString()
      })
      .run()
  }
}
