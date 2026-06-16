import useSWR from 'swr'
import api from '@/lib/api'
import type { Comment } from '@/types'

const fetcher = (url: string) => api.get<Comment[]>(url).then(r => r.data)

export function useComments(postId: string | null) {
  const { data, error, mutate, isLoading } = useSWR<Comment[]>(
    postId ? `/comments/post/${postId}/` : null,
    fetcher
  )
  return { comments: data ?? [], loading: isLoading, error, mutate }
}
