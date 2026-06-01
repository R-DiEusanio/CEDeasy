import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Brand, Post, ProfileDTO } from "./mock-data";

// ─── Profile ────────────────────────────────────────────────────────────────

export function useMyProfile() {
  return useQuery<ProfileDTO>({
    queryKey: ["profile", "me"],
    queryFn: () => api.get<ProfileDTO>("/api/profiles/me"),
    retry: false,
    staleTime: Infinity,
  });
}

export function useUpsertProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Pick<ProfileDTO, "fullName" | "role">) =>
      api.post<ProfileDTO>("/api/profiles", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", "me"] }),
  });
}

// ─── Brands ─────────────────────────────────────────────────────────────────

export function useBrands(smmId: string | null | undefined) {
  return useQuery<Brand[]>({
    queryKey: ["brands", smmId],
    queryFn: () => api.get<Brand[]>(`/api/brands/smm/${smmId}`),
    enabled: !!smmId,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Omit<Brand, "id">) => api.post<Brand>("/api/brands", dto),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["brands", vars.smmId] }),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Brand> }) =>
      api.put<Brand>(`/api/brands/${id}`, dto),
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["brands", data.smmId] }),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, smmId }: { id: string; smmId: string }) =>
      api.delete(`/api/brands/${id}`).then(() => ({ id, smmId })),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["brands", vars.smmId] }),
  });
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export function usePosts(brandId: string | null | undefined) {
  return useQuery<Post[]>({
    queryKey: ["posts", brandId],
    queryFn: () => api.get<Post[]>(`/api/posts/brand/${brandId}`),
    enabled: !!brandId,
  });
}

export function useClientPosts() {
  return useQuery<Post[]>({
    queryKey: ["client", "posts"],
    queryFn: () => api.get<Post[]>("/api/client/posts"),
  });
}

export function useRecentPosts(smmId: string | null | undefined) {
  return useQuery<Post[]>({
    queryKey: ["posts", "recent", smmId],
    queryFn: () => api.get<Post[]>(`/api/posts/smm/${smmId}/recent`),
    enabled: !!smmId,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Omit<Post, "id" | "hasChangesRequested">) =>
      api.post<Post>("/api/posts", dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["posts", data.brandId] });
      qc.invalidateQueries({ queryKey: ["posts", "recent"] });
    },
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Post> }) =>
      api.put<Post>(`/api/posts/${id}`, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["posts", data.brandId] });
      qc.invalidateQueries({ queryKey: ["posts", "recent"] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, brandId }: { id: string; brandId: string }) =>
      api.delete(`/api/posts/${id}`).then(() => ({ brandId })),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["posts", vars.brandId] });
      qc.invalidateQueries({ queryKey: ["posts", "recent"] });
    },
  });
}

export function useUpdatePostStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, feedback }: { id: string; status: string; feedback?: string }) =>
      api.patch<Post>(`/api/posts/${id}/status`, { status, ...(feedback ? { feedback } : {}) }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["posts", data.brandId] });
      qc.invalidateQueries({ queryKey: ["posts", "recent"] });
      qc.invalidateQueries({ queryKey: ["client", "posts"] });
    },
  });
}
