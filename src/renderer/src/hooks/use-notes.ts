import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@/lib/api'

export function useNotes(clientId: number | null, followUpId?: number) {
  return useQuery({
    queryKey: ['notes', clientId, followUpId],
    queryFn: () => (clientId ? invoke('notes:list', clientId, followUpId) : []),
    enabled: clientId !== null
  })
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { clientId: number; followUpId?: number; content: string }) =>
      invoke('notes:create', data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['notes', variables.clientId] })
      qc.invalidateQueries({ queryKey: ['client', variables.clientId] })
    }
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, clientId }: { id: number; clientId: number }) =>
      invoke('notes:delete', id),
    onSuccess: (_data, { clientId }) => {
      qc.invalidateQueries({ queryKey: ['notes', clientId] })
      qc.invalidateQueries({ queryKey: ['client', clientId] })
    }
  })
}
