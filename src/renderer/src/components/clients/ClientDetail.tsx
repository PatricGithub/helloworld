import { useState } from 'react'
import { Sheet, SheetHeader, SheetTitle, SheetContent, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { useClient, useMarkLost, useSetReminder } from '@/hooks/use-clients'
import { useUploadDocument, useOpenDocument, useDeleteDocument } from '@/hooks/use-documents'
import { useCreateNote, useDeleteNote } from '@/hooks/use-notes'
import { formatDate, formatCurrency } from '@/lib/format'
import { STAGE_LABELS, STAGE_COLORS, CLIENT_TYPE_LABELS } from '@shared/types'
import type { Stage, ClientType } from '@shared/types'
import {
  Pencil,
  Upload,
  FileText,
  Trash2,
  ExternalLink,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Send,
  Bell
} from 'lucide-react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ClientDetailProps {
  clientId: number | null
  onClose: () => void
  onEdit: (id: number) => void
}

export function ClientDetail({ clientId, onClose, onEdit }: ClientDetailProps) {
  const { data: client, isLoading } = useClient(clientId)
  const markLost = useMarkLost()
  const setReminder = useSetReminder()
  const uploadDocument = useUploadDocument()
  const openDocument = useOpenDocument()
  const deleteDocument = useDeleteDocument()
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()

  const [noteText, setNoteText] = useState('')
  const [lostDialogOpen, setLostDialogOpen] = useState(false)
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [reminderValue, setReminderValue] = useState('')
  const [reminderUnit, setReminderUnit] = useState<'days' | 'months'>('days')

  const handleUpload = async () => {
    if (!clientId) return
    const result = await uploadDocument.mutateAsync(clientId)
    if (result && result.length > 0) {
      toast.success(`${result.length} file(s) uploaded`)
    }
  }

  const handleAddNote = async () => {
    if (!clientId || !noteText.trim()) return
    await createNote.mutateAsync({ clientId, content: noteText.trim() })
    setNoteText('')
    toast.success('Note added')
  }

  const handleMarkLost = async () => {
    if (!clientId) return
    await markLost.mutateAsync(clientId)
    setLostDialogOpen(false)
    toast.success('Client marked as lost')
    onClose()
  }

  const handleSetReminder = async () => {
    if (!clientId || !reminderValue) return
    const val = parseInt(reminderValue)
    if (isNaN(val) || val <= 0) {
      toast.error('Enter a valid number')
      return
    }
    const days = reminderUnit === 'months' ? val * 30 : val
    await setReminder.mutateAsync({ id: clientId, days })
    setReminderDialogOpen(false)
    toast.success(`Reminder set for ${val} ${reminderUnit}`)
  }

  const isFinished = client?.stage === 'completed' || client?.stage === 'lost'

  const currentInterval = client?.followUpIntervalDays ?? 7
  const intervalLabel =
    currentInterval >= 30
      ? `${Math.round(currentInterval / 30)} month(s)`
      : `${currentInterval} day(s)`

  return (
    <>
      <Sheet open={clientId !== null} onOpenChange={() => onClose()}>
        <SheetClose onClick={onClose} />
        <SheetHeader>
          <div className="flex items-center justify-between pr-8">
            <SheetTitle>{client?.name || 'Client Details'}</SheetTitle>
            {client && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(client.id)}>
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                {!isFinished && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReminderValue('')
                        setReminderUnit('days')
                        setReminderDialogOpen(true)
                      }}
                    >
                      <Bell className="h-3 w-3 mr-1" /> Remind
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLostDialogOpen(true)}
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Lost
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </SheetHeader>

        <SheetContent>
          {isLoading || !client ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Overview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {CLIENT_TYPE_LABELS[client.clientType as ClientType] || client.clientType}
                  </Badge>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${STAGE_COLORS[client.stage as Stage] || ''}`}
                  >
                    {STAGE_LABELS[client.stage as Stage] || client.stage}
                  </span>
                </div>

                {client.projectName && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Project:</span> {client.projectName}
                  </p>
                )}
                {client.projectLocation && (
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {client.projectLocation}
                  </p>
                )}
                {(client.projectSum ?? 0) > 0 && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Sum:</span>{' '}
                    <span className="font-semibold">{formatCurrency(client.projectSum || 0)}</span>
                  </p>
                )}
                {!isFinished && (
                  <p className="text-sm flex items-center gap-1">
                    <Bell className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Follow-up every</span>{' '}
                    {intervalLabel}
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Contact</h3>
                {client.phones.map((p) => (
                  <p key={p.id} className="text-sm flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{p.label}:</span> {p.phone}
                  </p>
                ))}
                {client.emails.map((e) => (
                  <p key={e.id} className="text-sm flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{e.label}:</span> {e.email}
                  </p>
                ))}
                {client.phones.length === 0 && client.emails.length === 0 && (
                  <p className="text-sm text-muted-foreground">No contact info</p>
                )}
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Documents</h3>
                  <Button variant="outline" size="sm" onClick={handleUpload}>
                    <Upload className="h-3 w-3 mr-1" /> Upload
                  </Button>
                </div>
                {client.documents.length > 0 ? (
                  <div className="space-y-1">
                    {client.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{doc.fileName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {doc.docType}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDocument.mutate(doc.id)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              deleteDocument.mutate({ id: doc.id, clientId: client.id })
                            }
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Notes</h3>
                <div className="flex gap-2">
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleAddNote} disabled={!noteText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {client.notes.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {client.notes.map((note) => (
                      <div key={note.id} className="rounded-lg border px-3 py-2 group">
                        <p className="text-sm">{note.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.createdAt)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => deleteNote.mutate({ id: note.id, clientId: client.id })}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                )}
              </div>

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
                <p>Created: {formatDate(client.createdAt)}</p>
                <p>Updated: {formatDate(client.updatedAt)}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mark Lost Dialog */}
      <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
        <DialogHeader>
          <DialogTitle>Mark as Lost</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark {client?.name} as lost? This means the project did not proceed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLostDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleMarkLost}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Mark as Lost
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Set Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogHeader>
          <DialogTitle>Set Follow-Up Reminder</DialogTitle>
          <DialogDescription>
            Set how often you want to be reminded about {client?.name}.
            Current: every {intervalLabel}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 py-3">
          <Input
            type="number"
            min="1"
            value={reminderValue}
            onChange={(e) => setReminderValue(e.target.value)}
            placeholder="e.g. 14"
            className="w-24"
          />
          <Select
            value={reminderUnit}
            onChange={(e) => setReminderUnit(e.target.value as 'days' | 'months')}
            options={[
              { value: 'days', label: 'Days' },
              { value: 'months', label: 'Months' }
            ]}
            className="w-28"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSetReminder}>
            Set Reminder
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
