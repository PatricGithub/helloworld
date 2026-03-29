import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  clients,
  clientPhones,
  clientEmails,
  documents,
  followUps,
  notes
} from './schema'

// Domain types
export type Client = InferSelectModel<typeof clients>
export type NewClient = InferInsertModel<typeof clients>
export type ClientPhone = InferSelectModel<typeof clientPhones>
export type NewClientPhone = InferInsertModel<typeof clientPhones>
export type ClientEmail = InferSelectModel<typeof clientEmails>
export type NewClientEmail = InferInsertModel<typeof clientEmails>
export type Document = InferSelectModel<typeof documents>
export type NewDocument = InferInsertModel<typeof documents>
export type FollowUp = InferSelectModel<typeof followUps>
export type NewFollowUp = InferInsertModel<typeof followUps>
export type Note = InferSelectModel<typeof notes>
export type NewNote = InferInsertModel<typeof notes>

// Composite types
export type ClientWithRelations = Client & {
  phones: ClientPhone[]
  emails: ClientEmail[]
}

export type FollowUpWithClient = FollowUp & {
  client: ClientWithRelations
}

export type ClientFull = ClientWithRelations & {
  documents: Document[]
  notes: Note[]
  followUps: FollowUp[]
}

export type CreateClientInput = {
  name: string
  clientType: string
  projectLocation?: string
  projectName?: string
  projectSum?: number
  stage?: string
  followUpIntervalDays?: number
  phones: { phone: string; label: string }[]
  emails: { email: string; label: string }[]
}

export type UpdateClientInput = Partial<CreateClientInput> & { id: number }

export type ClientFilters = {
  search?: string
  stage?: string
  clientType?: string
}

export type FollowUpFilters = {
  tab?: 'overdue' | 'today' | 'week' | 'upcoming' | 'all'
  clientId?: number
}

export type DashboardStats = {
  followUpsDueToday: number
  totalClients: number
  revenueEarned: number
  successRate: number
  inquiriesByMonth: { month: string; count: number }[]
  stageDistribution: { name: string; value: number }[]
}

export type BackupEntry = {
  fileName: string
  filePath: string
  date: string
  sizeKb: number
}

// IPC channel contract
export type ApiChannels = {
  'clients:list': (filters?: ClientFilters) => ClientWithRelations[]
  'clients:get': (id: number) => ClientFull | null
  'clients:create': (data: CreateClientInput) => Client
  'clients:update': (data: UpdateClientInput) => Client
  'clients:delete': (id: number) => void
  'clients:set-reminder': (id: number, days: number) => Client
  'clients:mark-lost': (id: number) => Client
  'follow-ups:list': (filters?: FollowUpFilters) => FollowUpWithClient[]
  'follow-ups:create': (data: { clientId: number; task: string; dueDate: string }) => FollowUp
  'follow-ups:toggle': (id: number) => FollowUp
  'follow-ups:delete': (id: number) => void
  'notes:list': (clientId: number, followUpId?: number) => Note[]
  'notes:create': (data: { clientId: number; followUpId?: number; content: string }) => Note
  'notes:delete': (id: number) => void
  'documents:list': (clientId: number) => Document[]
  'documents:upload': (clientId: number) => Document[] | null
  'documents:open': (id: number) => void
  'documents:delete': (id: number) => void
  'dashboard:stats': () => DashboardStats
  'backup:run': () => string
  'backup:list': () => BackupEntry[]
  'backup:open': (filePath: string) => void
}
