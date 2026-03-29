import { app, BrowserWindow } from 'electron'
import { getDb } from '../database'
import { clients, clientPhones, clientEmails, settings } from '@shared/schema'
import { eq } from 'drizzle-orm'
import Papa from 'papaparse'
import path from 'path'
import fs from 'fs'
import os from 'os'

export function exportCsv(): string {
  const db = getDb()

  const allClients = db.select().from(clients).all()

  const rows = allClients.map((client) => {
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

    return {
      ID: client.id,
      Name: client.name,
      'Client Type': client.clientType,
      'Project Location': client.projectLocation,
      'Project Name': client.projectName,
      'Project Sum (EUR)': client.projectSum,
      Stage: client.stage,
      Phones: phones.map((p) => `${p.label}: ${p.phone}`).join('; '),
      Emails: emails.map((e) => `${e.label}: ${e.email}`).join('; '),
      'Created At': client.createdAt,
      'Updated At': client.updatedAt
    }
  })

  const csv = Papa.unparse(rows)

  // Save to Desktop/Backup/
  const desktopPath = app.getPath('desktop')
  const backupDir = path.join(desktopPath, 'Backup')
  fs.mkdirSync(backupDir, { recursive: true })

  const date = new Date().toISOString().split('T')[0]
  const filePath = path.join(backupDir, `CRM_Backup_${date}.csv`)

  fs.writeFileSync(filePath, csv, 'utf-8')

  // Update last backup date
  db.insert(settings)
    .values({ key: 'last_backup_date', value: date })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: date }
    })
    .run()

  return filePath
}

export function runMonthlyBackup(): void {
  try {
    const db = getDb()

    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    const lastBackup = db
      .select()
      .from(settings)
      .where(eq(settings.key, 'last_backup_date'))
      .get()

    const lastBackupMonth = lastBackup?.value?.slice(0, 7)

    if (lastBackupMonth === currentMonth) {
      return // Already backed up this month
    }

    const filePath = exportCsv()

    // Notify renderer about backup
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      windows[0].webContents.send('backup:completed', filePath)
    }
  } catch (error) {
    console.error('Monthly backup failed:', error)
  }
}
