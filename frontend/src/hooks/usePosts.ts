import useSWR from "swr";
import api from "@/lib/api";
import type { Post } from "@/types";

// Reusable fetcher for arrays of posts
const fetcher = (url: string) => api.get<Post[]>(url).then((r) => r.data);

// Reusable fetcher for a single post item
const oneFetcher = (url: string) => api.get<Post>(url).then((r) => r.data);

/**
 * Hook to fetch the global network activity feed
 */
export function usePosts() {
  const { data, error, mutate, isLoading } = useSWR<Post[]>("/posts/", fetcher);
  return { posts: data ?? [], loading: isLoading, error, mutate };
}

/**
 * Hook to fetch the currently authenticated user's posts
 */
export function useMyPosts() {
  const { data, error, mutate, isLoading } = useSWR<Post[]>(
    "/posts/me/",
    fetcher,
  );
  return { posts: data ?? [], loading: isLoading, error, mutate };
}

/**
 * Hook to fetch posts belonging to an arbitrary user ID context globally.
 * Passing `undefined` or `null` will conditionally skip the SWR request execution.
 */
export function useUserPosts(userId: string | undefined | null) {
  const { data, error, mutate, isLoading } = useSWR<Post[]>(
    userId ? `/posts/user/${userId}/` : null,
    fetcher,
  );
  return { posts: data ?? [], loading: isLoading, error, mutate };
}

/**
 * Hook to fetch a single annotated post item by its unique ID
 */
export function usePost(id: string | null) {
  const { data, error, mutate, isLoading } = useSWR<Post>(
    id ? `/posts/${id}/` : null,
    oneFetcher,
  );
  return { post: data, loading: isLoading, error, mutate };
}
