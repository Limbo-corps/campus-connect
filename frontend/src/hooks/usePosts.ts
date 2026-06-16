import useSWR from 'swr'
import api from '@/lib/api'
import type { Post } from '@/types'

const fetcher = (url: string) => api.get<Post[]>(url).then(r => r.data)

export function usePosts() {
  const { data, error, mutate, isLoading } = useSWR<Post[]>('/posts/', fetcher)
  return { posts: data ?? [], loading: isLoading, error, mutate }
}

export function useMyPosts() {
  const { data, error, mutate, isLoading } = useSWR<Post[]>('/posts/me/', fetcher)
  return { posts: data ?? [], loading: isLoading, error, mutate }
}

const oneFetcher = (url: string) => api.get<Post>(url).then(r => r.data)

export function usePost(id: string | null) {
  const { data, error, mutate, isLoading } = useSWR<Post>(
    id ? `/posts/${id}/` : null,
    oneFetcher
  )
  return { post: data, loading: isLoading, error, mutate }
}
