import { useState } from 'react'
import { useFollowUps, useToggleFollowUp, useCreateFollowUp } from '@/hooks/use-follow-ups'
import { useCreateNote } from '@/hooks/use-notes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, isOverdue, isToday } from '@/lib/format'
import { STAGE_LABELS, STAGE_COLORS } from '@shared/types'
import type { Stage } from '@shared/types'
import type { FollowUpFilters, FollowUpWithClient } from '@shared/api'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Send,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { useClients } from '@/hooks/use-clients'

type Tab = 'overdue' | 'today' | 'week' | 'upcoming' | 'all'

const TABS: { value: Tab; label: string }[] = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'upcoming', label: 'All Upcoming' },
  { value: 'all', label: 'All' }
]

export function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [noteTexts, setNoteTexts] = useState<Record<number, string>>({})
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newClientId, setNewClientId] = useState('')

  const filters: FollowUpFilters = { tab: activeTab }
  const { data: followUps, isLoading } = useFollowUps(filters)
  const toggleFollowUp = useToggleFollowUp()
  const createNote = useCreateNote()
  const createFollowUp = useCreateFollowUp()
  const { data: allClients } = useClients()

  const handleToggle = async (id: number) => {
    await toggleFollowUp.mutateAsync(id)
    toast.success('Follow-up marked as complete')
  }

  const handleAddNote = async (clientId: number, followUpId: number) => {
    const text = noteTexts[followUpId]
    if (!text?.trim()) return
    await createNote.mutateAsync({ clientId, followUpId, content: text.trim() })
    setNoteTexts((prev) => ({ ...prev, [followUpId]: '' }))
    toast.success('Note added')
  }

  const handleCreateFollowUp = async () => {
    if (!newClientId || !newTask.trim() || !newDueDate) {
      toast.error('All fields are required')
      return
    }
    await createFollowUp.mutateAsync({
      clientId: parseInt(newClientId),
      task: newTask.trim(),
      dueDate: newDueDate
    })
    setCreateDialogOpen(false)
    setNewTask('')
    setNewDueDate('')
    setNewClientId('')
    toast.success('Follow-up created')
  }

  const getRowBg = (fu: FollowUpWithClient) => {
    if (fu.isCompleted) return 'bg-gray-50 opacity-60'
    if (isOverdue(fu.dueDate)) return 'bg-red-50'
    if (isToday(fu.dueDate)) return 'bg-amber-50'
    return ''
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Follow-Ups</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Follow-Up
        </Button>
      </div>

      <div className="flex gap-2">
        {TABS.map((tab) => (
          <Badge
            key={tab.value}
            variant={activeTab === tab.value ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </Badge>
        ))}
      </div>

      <div className="rounded-xl border bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading follow-ups...</div>
        ) : !followUps || followUps.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No follow-ups found</div>
        ) : (
          <div className="divide-y">
            {followUps.map((fu) => (
              <div key={fu.id} className={cn('transition-colors', getRowBg(fu))}>
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === fu.id ? null : fu.id)}
                >
                  <button className="shrink-0">
                    {expandedId === fu.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  <span className={cn('text-sm w-24 shrink-0', isOverdue(fu.dueDate) && !fu.isCompleted && 'text-red-600 font-medium')}>
                    {formatDate(fu.dueDate)}
                  </span>

                  <span className="text-sm font-medium w-40 truncate">
                    {fu.client?.name || 'Unknown'}
                  </span>

                  <span className="text-sm text-muted-foreground w-32 truncate">
                    {fu.client?.phones[0]?.phone || '-'}
                  </span>

                  <span className="text-sm flex-1 truncate">{fu.task}</span>

                  {fu.client && (
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium shrink-0 ${STAGE_COLORS[fu.client.stage as Stage] || ''}`}
                    >
                      {STAGE_LABELS[fu.client.stage as Stage] || fu.client.stage}
                    </span>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggle(fu.id)
                    }}
                    disabled={fu.isCompleted === 1}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {fu.isCompleted ? 'Done' : 'Complete'}
                  </Button>
                </div>

                {expandedId === fu.id && fu.client && (
                  <div className="px-12 pb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="font-medium">{fu.client.name}</p>
                        {fu.client.projectName && (
                          <p className="text-muted-foreground">Project: {fu.client.projectName}</p>
                        )}
                        {fu.client.projectLocation && (
                          <p className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {fu.client.projectLocation}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        {fu.client.phones.map((p) => (
                          <p key={p.id} className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" /> {p.label}: {p.phone}
                          </p>
                        ))}
                        {fu.client.emails.map((e) => (
                          <p key={e.id} className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" /> {e.label}: {e.email}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2">Notes</p>
                      <div className="flex gap-2 mb-2">
                        <Textarea
                          value={noteTexts[fu.id] || ''}
                          onChange={(e) =>
                            setNoteTexts((prev) => ({ ...prev, [fu.id]: e.target.value }))
                          }
                          placeholder="Add a note..."
                          rows={2}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          onClick={() => handleAddNote(fu.clientId, fu.id)}
                          disabled={!noteTexts[fu.id]?.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Follow-Up Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogHeader>
          <DialogTitle>New Follow-Up</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-sm font-medium">Client</label>
            <Select
              value={newClientId}
              onChange={(e) => setNewClientId(e.target.value)}
              placeholder="Select a client"
              options={(allClients || []).map((c) => ({ value: String(c.id), label: c.name }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Task</label>
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="e.g. Follow up on offer"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Due Date</label>
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateFollowUp}>Create</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
