import Database from 'better-sqlite3'
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import * as schema from '@shared/schema'

let db: BetterSQLite3Database<typeof schema>
let sqlite: Database.Database

export function initDatabase(): void {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'architect-crm.db')

  // Ensure directory exists
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })

  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  db = drizzle(sqlite, { schema })

  // Run migrations
  const migrationsPath = app.isPackaged
    ? path.join(process.resourcesPath, 'drizzle')
    : path.join(__dirname, '../../drizzle')

  migrate(db, { migrationsFolder: migrationsPath })
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  return db
}

export function getSqlite(): Database.Database {
  return sqlite
}
