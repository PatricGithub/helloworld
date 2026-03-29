import type {
  ClientWithRelations,
  CreateClientInput,
  UpdateClientInput,
  ClientFilters,
  FollowUpFilters,
  DashboardStats,
  Note,
  Document as DocType
} from '@shared/api'
import type { Client, FollowUp } from '@shared/api'

// In-memory storage for browser development
let nextId = 1
let clients: (Client & { phones: any[]; emails: any[] })[] = []
let followUps: FollowUp[] = []
let notes: Note[] = []
let documents: DocType[] = []
let mockBackups: { fileName: string; filePath: string; date: string; sizeKb: number }[] = []

function genId() {
  return nextId++
}

function now() {
  return new Date().toISOString()
}

// Seed some demo data
function seedData() {
  // Start empty — no demo data
  clients = []
  followUps = []
  notes = []
  documents = []
  nextId = 1
}

seedData()

// Mock API implementation
const mockHandlers: Record<string, (...args: any[]) => any> = {
  'clients:list': (filters?: ClientFilters) => {
    let result = [...clients]
    if (filters?.search) {
      const s = filters.search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          (c.projectName || '').toLowerCase().includes(s) ||
          (c.projectLocation || '').toLowerCase().includes(s)
      )
    }
    if (filters?.stage) {
      result = result.filter((c) => c.stage === filters.stage)
    }
    if (filters?.clientType) {
      result = result.filter((c) => c.clientType === filters.clientType)
    }
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  'clients:get': (id: number) => {
    const client = clients.find((c) => c.id === id)
    if (!client) return null
    return {
      ...client,
      documents: documents.filter((d) => d.clientId === id),
      notes: notes
        .filter((n) => n.clientId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      followUps: followUps
        .filter((f) => f.clientId === id)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    }
  },

  'clients:create': (data: CreateClientInput) => {
    const id = genId()
    const client = {
      id,
      name: data.name,
      clientType: data.clientType,
      projectLocation: data.projectLocation || '',
      projectName: data.projectName || '',
      projectSum: data.projectSum || 0,
      stage: data.stage || 'inquiry',
      followUpIntervalDays: data.followUpIntervalDays ?? 7,
      createdAt: now(),
      updatedAt: now(),
      phones: data.phones.map((p) => ({ id: genId(), clientId: id, ...p })),
      emails: data.emails.map((e) => ({ id: genId(), clientId: id, ...e }))
    }
    clients.push(client)
    // Auto-create first follow-up
    if (client.stage !== 'completed' && client.stage !== 'lost') {
      const dueDate = new Date(Date.now() + client.followUpIntervalDays * 86400000)
        .toISOString()
        .split('T')[0]
      followUps.push({
        id: genId(),
        clientId: id,
        task: 'Check on project',
        dueDate,
        isCompleted: 0,
        createdAt: now()
      })
    }
    return client
  },

  'clients:update': (data: UpdateClientInput) => {
    const idx = clients.findIndex((c) => c.id === data.id)
    if (idx === -1) throw new Error('Client not found')
    const updated = {
      ...clients[idx],
      ...(data.name !== undefined && { name: data.name }),
      ...(data.clientType !== undefined && { clientType: data.clientType }),
      ...(data.projectLocation !== undefined && { projectLocation: data.projectLocation }),
      ...(data.projectName !== undefined && { projectName: data.projectName }),
      ...(data.projectSum !== undefined && { projectSum: data.projectSum }),
      ...(data.stage !== undefined && { stage: data.stage }),
      ...(data.followUpIntervalDays !== undefined && {
        followUpIntervalDays: data.followUpIntervalDays
      }),
      updatedAt: now(),
      ...(data.phones && {
        phones: data.phones.map((p) => ({ id: genId(), clientId: data.id, ...p }))
      }),
      ...(data.emails && {
        emails: data.emails.map((e) => ({ id: genId(), clientId: data.id, ...e }))
      })
    }
    clients[idx] = updated
    return updated
  },

  'clients:delete': (id: number) => {
    clients = clients.filter((c) => c.id !== id)
    followUps = followUps.filter((f) => f.clientId !== id)
    notes = notes.filter((n) => n.clientId !== id)
    documents = documents.filter((d) => d.clientId !== id)
  },

  'clients:mark-lost': (id: number) => {
    const idx = clients.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Client not found')
    clients[idx] = { ...clients[idx], stage: 'lost', updatedAt: now() }
    return clients[idx]
  },

  'clients:set-reminder': (id: number, days: number) => {
    const idx = clients.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Client not found')
    clients[idx] = { ...clients[idx], followUpIntervalDays: days, updatedAt: now() }
    // Remove existing pending follow-ups and create new one
    followUps = followUps.filter(
      (f) => !(f.clientId === id && f.isCompleted === 0)
    )
    const dueDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
    followUps.push({
      id: genId(),
      clientId: id,
      task: 'Check on project',
      dueDate,
      isCompleted: 0,
      createdAt: now()
    })
    return clients[idx]
  },

  'follow-ups:list': (filters?: FollowUpFilters) => {
    const today = new Date().toISOString().split('T')[0]
    const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    let result = followUps.filter((f) => f.isCompleted === 0)

    if (filters?.clientId) {
      result = result.filter((f) => f.clientId === filters.clientId)
    }

    switch (filters?.tab) {
      case 'overdue':
        result = result.filter((f) => f.dueDate < today)
        break
      case 'today':
        result = result.filter((f) => f.dueDate === today)
        break
      case 'week':
        result = result.filter((f) => f.dueDate >= today && f.dueDate <= weekEnd)
        break
      case 'upcoming':
        result = result.filter((f) => f.dueDate >= today)
        break
    }

    return result
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((f) => {
        const client = clients.find((c) => c.id === f.clientId)
        return { ...f, client: client || null }
      })
  },

  'follow-ups:create': (data: { clientId: number; task: string; dueDate: string }) => {
    const fu = {
      id: genId(),
      clientId: data.clientId,
      task: data.task,
      dueDate: data.dueDate,
      isCompleted: 0,
      createdAt: now()
    }
    followUps.push(fu)
    return fu
  },

  'follow-ups:toggle': (id: number) => {
    const fu = followUps.find((f) => f.id === id)
    if (!fu) throw new Error('Not found')
    fu.isCompleted = fu.isCompleted === 0 ? 1 : 0
    // If marking complete, auto-create next follow-up based on client interval
    if (fu.isCompleted === 1) {
      const client = clients.find((c) => c.id === fu.clientId)
      if (client && client.stage !== 'completed' && client.stage !== 'lost') {
        const days = client.followUpIntervalDays ?? 7
        const dueDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
        followUps.push({
          id: genId(),
          clientId: fu.clientId,
          task: 'Check on project',
          dueDate,
          isCompleted: 0,
          createdAt: now()
        })
      }
    }
    return fu
  },

  'follow-ups:delete': (id: number) => {
    followUps = followUps.filter((f) => f.id !== id)
  },

  'notes:list': (clientId: number, followUpId?: number) => {
    let result = notes.filter((n) => n.clientId === clientId)
    if (followUpId !== undefined) {
      result = result.filter((n) => n.followUpId === followUpId)
    }
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  'notes:create': (data: { clientId: number; followUpId?: number; content: string }) => {
    const note = {
      id: genId(),
      clientId: data.clientId,
      followUpId: data.followUpId || null,
      content: data.content,
      createdAt: now()
    }
    notes.push(note)
    return note
  },

  'notes:delete': (id: number) => {
    notes = notes.filter((n) => n.id !== id)
  },

  'documents:list': (clientId: number) => {
    return documents.filter((d) => d.clientId === clientId)
  },

  'documents:upload': (_clientId: number) => {
    alert('Document upload is only available in the Electron app')
    return null
  },

  'documents:open': (_id: number) => {
    alert('Document open is only available in the Electron app')
  },

  'documents:delete': (id: number) => {
    documents = documents.filter((d) => d.id !== id)
  },

  'dashboard:stats': (): DashboardStats => {
    const today = new Date().toISOString().split('T')[0]

    const followUpsDueToday = followUps.filter(
      (f) => f.dueDate === today && f.isCompleted === 0
    ).length

    const totalClients = clients.filter(
      (c) => c.stage !== 'completed' && c.stage !== 'lost'
    ).length

    const revenueEarned = clients
      .filter((c) => c.stage === 'completed')
      .reduce((sum, c) => sum + (c.projectSum || 0), 0)

    const completedCount = clients.filter((c) => c.stage === 'completed').length
    const lostCount = clients.filter((c) => c.stage === 'lost').length
    const totalFinished = completedCount + lostCount
    const successRate =
      totalFinished > 0 ? Math.round((completedCount / totalFinished) * 100) : 0

    // Group by month
    const monthCounts: Record<string, number> = {}
    clients.forEach((c) => {
      const month = c.createdAt.slice(0, 7)
      monthCounts[month] = (monthCounts[month] || 0) + 1
    })
    const inquiriesByMonth = Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }))

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
  },

  'backup:run': () => {
    const date = new Date().toISOString().split('T')[0]
    const fileName = `CRM_Backup_${date}.csv`
    mockBackups.unshift({
      fileName,
      filePath: `Desktop/Backup/${fileName}`,
      date: new Date().toISOString(),
      sizeKb: Math.round(Math.random() * 50 + 5)
    })
    return `Desktop/Backup/${fileName}`
  },

  'backup:list': () => {
    return [...mockBackups]
  },

  'backup:open': (_filePath: string) => {
    alert('Show in folder is only available in the Electron app')
  }
}

// Install mock API on window
export function installMockApi() {
  if (typeof window !== 'undefined' && !window.api) {
    ;(window as any).api = {
      invoke: async (channel: string, ...args: any[]) => {
        const handler = mockHandlers[channel]
        if (!handler) {
          console.warn(`Mock API: No handler for channel "${channel}"`)
          return null
        }
        // Simulate async delay
        await new Promise((r) => setTimeout(r, 50))
        return handler(...args)
      }
    }
    console.log(
      '%c[Dev Mode] Using mock API — data is in-memory only',
      'color: #f59e0b; font-weight: bold'
    )
  }
}
