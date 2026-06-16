import useSWR from 'swr'
import api from '@/lib/api'
import type { Campus } from '@/types'

const fetcher = (url: string) => api.get<Campus[]>(url).then(r => r.data)

export function useCampuses() {
  const { data, error, mutate, isLoading } = useSWR<Campus[]>('/campuses/', fetcher)
  return { campuses: data ?? [], loading: isLoading, error, mutate }
}
