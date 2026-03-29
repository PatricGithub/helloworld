import { useState } from 'react'
import { useClients } from '@/hooks/use-clients'
import { ClientTable } from '@/components/clients/ClientTable'
import { ClientDrawer } from '@/components/clients/ClientDrawer'
import { ClientDetail } from '@/components/clients/ClientDetail'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search } from 'lucide-react'
import { STAGES, STAGE_LABELS, CLIENT_TYPES, CLIENT_TYPE_LABELS } from '@shared/types'
import type { ClientFilters } from '@shared/api'
import { cn } from '@/lib/utils'

export function ClientBasePage() {
  const [filters, setFilters] = useState<ClientFilters>({})
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)

  const { data: clients, isLoading } = useClients({
    ...filters,
    search: search || undefined
  })

  const handleSearch = (value: string) => {
    setSearch(value)
  }

  const handleStageFilter = (stage: string) => {
    setFilters((prev) => ({
      ...prev,
      stage: prev.stage === stage ? undefined : stage
    }))
  }

  const handleTypeFilter = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      clientType: prev.clientType === type ? undefined : type
    }))
  }

  const handleNewClient = () => {
    setEditId(null)
    setDrawerOpen(true)
  }

  const handleEditClient = (id: number) => {
    setDetailId(null)
    setEditId(id)
    setDrawerOpen(true)
  }

  const handleRowClick = (id: number) => {
    setDetailId(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Client Base</h2>
        <Button onClick={handleNewClient}>
          <Plus className="h-4 w-4" />
          New Client
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CLIENT_TYPES.map((type) => (
          <Badge
            key={type}
            variant={filters.clientType === type ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => handleTypeFilter(type)}
          >
            {CLIENT_TYPE_LABELS[type]}
          </Badge>
        ))}
        <div className="w-px bg-border mx-1" />
        {STAGES.map((stage) => (
          <Badge
            key={stage}
            variant={filters.stage === stage ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => handleStageFilter(stage)}
          >
            {STAGE_LABELS[stage]}
          </Badge>
        ))}
      </div>

      <ClientTable
        clients={clients || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        onEdit={handleEditClient}
      />

      <ClientDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editId={editId}
      />

      <ClientDetail
        clientId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={handleEditClient}
      />
    </div>
  )
}
