import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@/lib/api'

export function useDocuments(clientId: number | null) {
  return useQuery({
    queryKey: ['documents', clientId],
    queryFn: () => (clientId ? invoke('documents:list', clientId) : []),
    enabled: clientId !== null
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (clientId: number) => invoke('documents:upload', clientId),
    onSuccess: (_data, clientId) => {
      qc.invalidateQueries({ queryKey: ['documents', clientId] })
      qc.invalidateQueries({ queryKey: ['client', clientId] })
    }
  })
}

export function useOpenDocument() {
  return useMutation({
    mutationFn: (id: number) => invoke('documents:open', id)
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, clientId }: { id: number; clientId: number }) =>
      invoke('documents:delete', id),
    onSuccess: (_data, { clientId }) => {
      qc.invalidateQueries({ queryKey: ['documents', clientId] })
      qc.invalidateQueries({ queryKey: ['client', clientId] })
    }
  })
}
