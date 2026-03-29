import { useQuery } from '@tanstack/react-query'
import { invoke } from '@/lib/api'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => invoke('dashboard:stats')
  })
}
