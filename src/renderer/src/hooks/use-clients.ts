import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@/lib/api'
import type { ClientFilters, CreateClientInput, UpdateClientInput } from '@shared/api'

export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => invoke('clients:list', filters)
  })
}

export function useClient(id: number | null) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => (id ? invoke('clients:get', id) : null),
    enabled: id !== null
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateClientInput) => invoke('clients:create', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
    }
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateClientInput) => invoke('clients:update', data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['client', variables.id] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
    }
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => invoke('clients:delete', id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}

export function useMarkLost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => invoke('clients:mark-lost', id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
    }
  })
}

export function useSetReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) =>
      invoke('clients:set-reminder', id, days),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['client', id] })
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
    }
  })
}
