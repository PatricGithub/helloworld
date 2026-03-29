import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/format'
import { STAGE_LABELS, STAGE_COLORS, CLIENT_TYPE_LABELS } from '@shared/types'
import type { ClientWithRelations } from '@shared/api'
import type { Stage, ClientType } from '@shared/types'

interface ClientTableProps {
  clients: ClientWithRelations[]
  isLoading: boolean
  onRowClick: (id: number) => void
  onEdit: (id: number) => void
}

type SortField = 'name' | 'clientType' | 'projectName' | 'projectLocation' | 'projectSum' | 'stage' | 'createdAt'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 15

export function ClientTable({ clients, isLoading, onRowClick, onEdit }: ClientTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = [...clients].sort((a, b) => {
    let aVal = a[sortField] ?? ''
    let bVal = b[sortField] ?? ''
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    }
    const cmp = String(aVal).localeCompare(String(bVal))
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-foreground">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
        )}
      </span>
    </th>
  )

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white">
        <div className="p-8 text-center text-muted-foreground">Loading clients...</div>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border bg-white">
        <div className="p-8 text-center text-muted-foreground">
          No clients found. Create your first client to get started.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white">
      <table className="w-full">
        <thead className="border-b bg-gray-50/50">
          <tr>
            <SortHeader field="name">Name</SortHeader>
            <SortHeader field="clientType">Type</SortHeader>
            <SortHeader field="projectName">Project</SortHeader>
            <SortHeader field="projectLocation">Location</SortHeader>
            <SortHeader field="projectSum">Sum</SortHeader>
            <SortHeader field="stage">Stage</SortHeader>
            <SortHeader field="createdAt">Created</SortHeader>
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {paginated.map((client) => (
            <tr
              key={client.id}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onRowClick(client.id)}
            >
              <td className="px-4 py-3 text-sm font-medium">{client.name}</td>
              <td className="px-4 py-3">
                <Badge variant="secondary" className="text-xs">
                  {CLIENT_TYPE_LABELS[client.clientType as ClientType] || client.clientType}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{client.projectName}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{client.projectLocation}</td>
              <td className="px-4 py-3 text-sm">{formatCurrency(client.projectSum || 0)}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${STAGE_COLORS[client.stage as Stage] || 'bg-gray-100 text-gray-700'}`}
                >
                  {STAGE_LABELS[client.stage as Stage] || client.stage}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDate(client.createdAt)}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(client.id)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of{' '}
            {sorted.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
