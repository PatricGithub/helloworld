import { ipcMain } from 'electron'
import { getDb } from '../database'
import { clients, followUps } from '@shared/schema'
import { eq, sql, and, not } from 'drizzle-orm'
import type { DashboardStats } from '@shared/api'

export function registerDashboardHandlers(): void {
  ipcMain.handle('dashboard:stats', async (): Promise<DashboardStats> => {
    const db = getDb()
    const today = new Date().toISOString().split('T')[0]

    // Follow-ups due today
    const followUpsDueToday = db
      .select({ count: sql<number>`count(*)` })
      .from(followUps)
      .where(and(eq(followUps.dueDate, today), eq(followUps.isCompleted, 0)))
      .get()?.count ?? 0

    // Total active clients (not completed, not lost)
    const totalClients = db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(
        and(
          not(eq(clients.stage, 'completed')),
          not(eq(clients.stage, 'lost'))
        )
      )
      .get()?.count ?? 0

    // Revenue earned (completed)
    const revenueEarned = db
      .select({ total: sql<number>`COALESCE(sum(${clients.projectSum}), 0)` })
      .from(clients)
      .where(eq(clients.stage, 'completed'))
      .get()?.total ?? 0

    // Success rate: completed / (completed + lost)
    const completedCount = db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(eq(clients.stage, 'completed'))
      .get()?.count ?? 0

    const lostCount = db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(eq(clients.stage, 'lost'))
      .get()?.count ?? 0

    const totalFinished = completedCount + lostCount
    const successRate = totalFinished > 0 ? Math.round((completedCount / totalFinished) * 100) : 0

    // Inquiries by month (last 12 months)
    const inquiriesByMonth = db
      .select({
        month: sql<string>`strftime('%Y-%m', ${clients.createdAt})`,
        count: sql<number>`count(*)`
      })
      .from(clients)
      .where(
        sql`${clients.createdAt} >= date('now', '-12 months')`
      )
      .groupBy(sql`strftime('%Y-%m', ${clients.createdAt})`)
      .orderBy(sql`strftime('%Y-%m', ${clients.createdAt}) ASC`)
      .all()
      .map((row) => ({ month: row.month, count: row.count }))

    // Stage distribution for pie chart
    const stageDistribution = [
      { name: 'Active', value: totalClients },
      { name: 'Completed', value: completedCount },
      { name: 'Lost', value: lostCount }
    ]

    return {
      followUpsDueToday,
      totalClients,
      revenueEarned,
      successRate,
      inquiriesByMonth,
      stageDistribution
    }
  })
}
