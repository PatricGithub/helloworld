import { useState, useEffect } from 'react'
import { Sheet, SheetHeader, SheetTitle, SheetContent, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useClient, useCreateClient, useUpdateClient } from '@/hooks/use-clients'
import { STAGES, STAGE_LABELS, CLIENT_TYPES, CLIENT_TYPE_LABELS } from '@shared/types'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ClientDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId: number | null
}

interface PhoneEntry {
  phone: string
  label: string
}

interface EmailEntry {
  email: string
  label: string
}

export function ClientDrawer({ open, onOpenChange, editId }: ClientDrawerProps) {
  const { data: existingClient } = useClient(editId)
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()

  const [name, setName] = useState('')
  const [clientType, setClientType] = useState('b2c')
  const [projectLocation, setProjectLocation] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectSum, setProjectSum] = useState('')
  const [stage, setStage] = useState('inquiry')
  const [followUpIntervalDays, setFollowUpIntervalDays] = useState('7')
  const [phones, setPhones] = useState<PhoneEntry[]>([{ phone: '', label: 'Mobile' }])
  const [emails, setEmails] = useState<EmailEntry[]>([{ email: '', label: 'Primary' }])

  useEffect(() => {
    if (editId && existingClient) {
      setName(existingClient.name)
      setClientType(existingClient.clientType)
      setProjectLocation(existingClient.projectLocation || '')
      setProjectName(existingClient.projectName || '')
      setProjectSum(existingClient.projectSum?.toString() || '')
      setStage(existingClient.stage)
      setFollowUpIntervalDays(existingClient.followUpIntervalDays?.toString() || '7')
      setPhones(
        existingClient.phones.length > 0
          ? existingClient.phones.map((p) => ({ phone: p.phone, label: p.label || 'Mobile' }))
          : [{ phone: '', label: 'Mobile' }]
      )
      setEmails(
        existingClient.emails.length > 0
          ? existingClient.emails.map((e) => ({ email: e.email, label: e.label || 'Primary' }))
          : [{ email: '', label: 'Primary' }]
      )
    } else if (!editId) {
      resetForm()
    }
  }, [editId, existingClient])

  const resetForm = () => {
    setName('')
    setClientType('b2c')
    setProjectLocation('')
    setProjectName('')
    setProjectSum('')
    setStage('inquiry')
    setFollowUpIntervalDays('7')
    setPhones([{ phone: '', label: 'Mobile' }])
    setEmails([{ email: '', label: 'Primary' }])
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Client name is required')
      return
    }

    const data = {
      name: name.trim(),
      clientType,
      projectLocation,
      projectName,
      projectSum: projectSum ? parseFloat(projectSum) : 0,
      stage,
      followUpIntervalDays: followUpIntervalDays ? parseInt(followUpIntervalDays) : 7,
      phones: phones.filter((p) => p.phone.trim()),
      emails: emails.filter((e) => e.email.trim())
    }

    try {
      if (editId) {
        await updateClient.mutateAsync({ ...data, id: editId })
        toast.success('Client updated')
      } else {
        await createClient.mutateAsync(data)
        toast.success('Client created')
      }
      onOpenChange(false)
      resetForm()
    } catch (err) {
      toast.error('Failed to save client')
    }
  }

  const addPhone = () => setPhones((prev) => [...prev, { phone: '', label: 'Mobile' }])
  const removePhone = (index: number) => setPhones((prev) => prev.filter((_, i) => i !== index))
  const updatePhone = (index: number, field: keyof PhoneEntry, value: string) =>
    setPhones((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))

  const addEmail = () => setEmails((prev) => [...prev, { email: '', label: 'Primary' }])
  const removeEmail = (index: number) => setEmails((prev) => prev.filter((_, i) => i !== index))
  const updateEmail = (index: number, field: keyof EmailEntry, value: string) =>
    setEmails((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetClose onClick={() => onOpenChange(false)} />
      <SheetHeader>
        <SheetTitle>{editId ? 'Edit Client' : 'New Client'}</SheetTitle>
      </SheetHeader>
      <SheetContent className="space-y-5">
        <div>
          <label className="text-sm font-medium">Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name or company" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Client Type</label>
            <Select
              value={clientType}
              onChange={(e) => setClientType(e.target.value)}
              options={CLIENT_TYPES.map((t) => ({ value: t, label: CLIENT_TYPE_LABELS[t] }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Stage</label>
            <Select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              options={STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }))}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Project Name</label>
          <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Short project description" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Project Location</label>
            <Input value={projectLocation} onChange={(e) => setProjectLocation(e.target.value)} placeholder="City / address" />
          </div>
          <div>
            <label className="text-sm font-medium">Project Sum (EUR)</label>
            <Input
              type="number"
              value={projectSum}
              onChange={(e) => setProjectSum(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Follow-up every (days)</label>
            <Input
              type="number"
              min="1"
              value={followUpIntervalDays}
              onChange={(e) => setFollowUpIntervalDays(e.target.value)}
              placeholder="7"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Phone Numbers</label>
            <Button variant="ghost" size="sm" onClick={addPhone}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {phones.map((phone, i) => (
              <div key={i} className="flex gap-2">
                <Select
                  value={phone.label}
                  onChange={(e) => updatePhone(i, 'label', e.target.value)}
                  options={[
                    { value: 'Mobile', label: 'Mobile' },
                    { value: 'Office', label: 'Office' },
                    { value: 'Home', label: 'Home' }
                  ]}
                  className="w-28"
                />
                <Input
                  value={phone.phone}
                  onChange={(e) => updatePhone(i, 'phone', e.target.value)}
                  placeholder="+359..."
                  className="flex-1"
                />
                {phones.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removePhone(i)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Email Addresses</label>
            <Button variant="ghost" size="sm" onClick={addEmail}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {emails.map((email, i) => (
              <div key={i} className="flex gap-2">
                <Select
                  value={email.label}
                  onChange={(e) => updateEmail(i, 'label', e.target.value)}
                  options={[
                    { value: 'Primary', label: 'Primary' },
                    { value: 'Billing', label: 'Billing' },
                    { value: 'Work', label: 'Work' }
                  ]}
                  className="w-28"
                />
                <Input
                  value={email.email}
                  onChange={(e) => updateEmail(i, 'email', e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1"
                />
                {emails.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeEmail(i)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSubmit} className="flex-1" disabled={createClient.isPending || updateClient.isPending}>
            {editId ? 'Save Changes' : 'Create Client'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
