// @/hooks/useFollow.ts
import useSWR from "swr";

import api from "@/lib/api";
import type { User } from "@/types";

type FollowRecord = {
  user: User;
  created_at: string;
};

// Reusable fetcher for user collections
const usersFetcher = (url: string) =>
  api.get<FollowRecord[]>(url).then((r) => r.data.map((item) => item.user));

/**
 * Hook to fetch the list of users following a given user.
 * Passing `undefined` or `null` skips the request.
 */
export function useFollowers(userId: string | undefined | null) {
  const { data, error, mutate, isLoading } = useSWR<User[]>(
    userId ? `/users/${userId}/followers/` : null,
    usersFetcher,
  );

  return {
    followers: data ?? [],
    loading: isLoading,
    error,
    mutate,
  };
}

/**
 * Hook to fetch the list of users that a given user is following.
 * Passing `undefined` or `null` skips the request.
 */
export function useFollowing(userId: string | undefined | null) {
  const { data, error, mutate, isLoading } = useSWR<User[]>(
    userId ? `/users/${userId}/following/` : null,
    usersFetcher,
  );

  return {
    following: data ?? [],
    loading: isLoading,
    error,
    mutate,
  };
}

// Plain user-collection fetcher (endpoints that return User[] directly).
const plainUsersFetcher = (url: string) =>
  api.get<User[]>(url).then((r) => r.data);

/**
 * Hook to fetch the current user's mutuals — people who follow them back.
 * These are exactly the users they're allowed to start a direct message with.
 */
export function useMutuals() {
  const { data, error, mutate, isLoading } = useSWR<User[]>(
    "/users/me/mutuals/",
    plainUsersFetcher,
  );

  return {
    mutuals: data ?? [],
    loading: isLoading,
    error,
    mutate,
  };
}

/**
 * Follows a target user.
 */
export async function followUser(userId: string) {
  const { data } = await api.post(`/users/${userId}/follow/`);
  return data;
}

/**
 * Unfollows a target user.
 */
export async function unfollowUser(userId: string) {
  const { data } = await api.delete(`/users/${userId}/follow/`);
  return data;
}
