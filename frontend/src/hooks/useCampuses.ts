import useSWR from "swr";
import api from "@/lib/api";
import type { Campus } from "@/types";

const fetcher = async <T>(url: string): Promise<T> => {
  const { data } = await api.get<T>(url);
  return data;
};

export function useCampuses() {
  const { data, error, mutate, isLoading } = useSWR<Campus[]>(
    "/campuses/",
    fetcher,
  );

  const getCampus = async (id: string): Promise<Campus> => {
    const { data } = await api.get<Campus>(`/campuses/${id}/`);
    return data;
  };

  const createCampus = async (campus: Partial<Campus>): Promise<Campus> => {
    const { data } = await api.post<Campus>("/campuses/", campus);
    await mutate();
    return data;
  };

  const updateCampus = async (
    id: string,
    campus: Partial<Campus>,
  ): Promise<Campus> => {
    const { data } = await api.patch<Campus>(`/campuses/${id}/`, campus);

    await mutate();
    return data;
  };

  const deleteCampus = async (id: string): Promise<void> => {
    await api.delete(`/campuses/${id}/`);
    await mutate();
  };

  const joinCampus = async (id: string): Promise<void> => {
    await api.post(`/campuses/${id}/join/`);
    await mutate();
  };

  const leaveCampus = async (): Promise<void> => {
    await api.post("/campuses/leave/");
    await mutate();
  };

  return {
    campuses: data ?? [],
    loading: isLoading,
    error,

    mutate,

    getCampus,

    createCampus,
    updateCampus,
    deleteCampus,

    joinCampus,
    leaveCampus,
  };
}
