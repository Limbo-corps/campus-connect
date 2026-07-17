// @/lib/users/api.ts
import api from "@/lib/api";
import type { User, ProfileUpdate } from "@/types";

export async function getUsers(): Promise<User[]> {
  try {
    const { data } = await api.get<User[]>("/users/");
    return data;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
}

export async function getUser(id: string): Promise<User> {
  try {
    const { data } = await api.get<User>(`/users/${id}/`);
    return data;
  } catch (error) {
    console.error(`Failed to fetch user ${id}:`, error);
    throw error;
  }
}

export async function getUserByUsername(username: string): Promise<User> {
  try {
    const { data } = await api.get<User>(
      `/users/username/${encodeURIComponent(username)}/`,
    );
    return data;
  } catch (error) {
    console.error(`Failed to fetch user "${username}":`, error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<User> {
  try {
    const { data } = await api.get<User>("/auth/me/");
    return data;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    throw error;
  }
}

export async function updateProfile(profile: ProfileUpdate): Promise<User> {
  try {
    const { data } = await api.patch<User>("/auth/me/", profile);
    return data;
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw error;
  }
}
