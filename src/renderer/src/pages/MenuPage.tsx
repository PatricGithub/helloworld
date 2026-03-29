import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { Download, Plus, FolderOpen, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

export function MenuPage() {
  const qc = useQueryClient()

  const { data: backups, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: () => invoke('backup:list')
  })

  const createBackup = useMutation({
    mutationFn: () => invoke('backup:run'),
    onSuccess: (filePath) => {
      qc.invalidateQueries({ queryKey: ['backups'] })
      toast.success('Backup created successfully')
    },
    onError: () => {
      toast.error('Failed to create backup')
    }
  })

  const handleOpen = async (filePath: string) => {
    await invoke('backup:open', filePath)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Menu</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Backups</CardTitle>
            <Button
              onClick={() => createBackup.mutate()}
              disabled={createBackup.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              {createBackup.isPending ? 'Creating...' : 'New Backup'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            CSV exports of all client data. Saved to Desktop/Backup/.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading backups...</p>
          ) : !backups || backups.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No backups yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "New Backup" to create your first export
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.filePath}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">{backup.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(backup.date)} &middot; {backup.sizeKb} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpen(backup.filePath)}
                  >
                    <FolderOpen className="h-3 w-3 mr-1" />
                    Show in Folder
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
