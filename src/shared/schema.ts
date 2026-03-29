import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  clientType: text('client_type').notNull().default('b2c'),
  projectLocation: text('project_location').default(''),
  projectName: text('project_name').default(''),
  projectSum: real('project_sum').default(0),
  stage: text('stage').notNull().default('inquiry'),
  followUpIntervalDays: integer('follow_up_interval_days').default(7),
  createdAt: text('created_at')
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`(datetime('now'))`)
    .notNull()
})

export const clientPhones = sqliteTable('client_phones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  phone: text('phone').notNull(),
  label: text('label').default('Mobile')
})

export const clientEmails = sqliteTable('client_emails', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  label: text('label').default('Primary')
})

export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  docType: text('doc_type').default('other'),
  uploadedAt: text('uploaded_at')
    .default(sql`(datetime('now'))`)
    .notNull()
})

export const followUps = sqliteTable('follow_ups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  task: text('task').notNull(),
  dueDate: text('due_date').notNull(),
  isCompleted: integer('is_completed').default(0).notNull(),
  createdAt: text('created_at')
    .default(sql`(datetime('now'))`)
    .notNull()
})

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  followUpId: integer('follow_up_id').references(() => followUps.id, { onDelete: 'set null' }),
  content: text('content').notNull(),
  createdAt: text('created_at')
    .default(sql`(datetime('now'))`)
    .notNull()
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
})
