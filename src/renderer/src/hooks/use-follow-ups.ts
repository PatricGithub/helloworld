import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@/lib/api'
import type { FollowUpFilters } from '@shared/api'

export function useFollowUps(filters?: FollowUpFilters) {
  return useQuery({
    queryKey: ['follow-ups', filters],
    queryFn: () => invoke('follow-ups:list', filters)
  })
}

export function useCreateFollowUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { clientId: number; task: string; dueDate: string }) =>
      invoke('follow-ups:create', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['client'] })
    }
  })
}

export function useToggleFollowUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => invoke('follow-ups:toggle', id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['client'] })
    }
  })
}

export function useDeleteFollowUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => invoke('follow-ups:delete', id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}
