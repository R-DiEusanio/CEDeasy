import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Brand, Post, ProfileDTO } from "./mock-data";

import { getMyProfile, upsertProfile }                    from "./supabase/profiles";
import { getBrands, createBrand, updateBrand, deleteBrand } from "./supabase/brands";
import {
  getPosts, getClientPosts, getRecentPosts, getRecentActivities,
  createPost, updatePost, deletePost, updatePostStatus,
} from "./supabase/posts";
import { getComments, addComment } from "./supabase/comments";
import type { Comment } from "./supabase/comments";
import type { Activity } from "./supabase/posts";

// ─── Profile ──────────────────────────────────────────────────────────────────

export function useMyProfile() {
  return useQuery<ProfileDTO>({
    queryKey:  ["profile", "me"],
    queryFn:   getMyProfile,
    retry:     false,
    staleTime: Infinity,
  });
}

export function useUpsertProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Pick<ProfileDTO, "fullName" | "role">) =>
      upsertProfile(dto.fullName, dto.role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", "me"] }),
  });
}

// ─── Brands ───────────────────────────────────────────────────────────────────

// smmId è usato solo per `enabled` — il filtro DB è gestito da RLS, non dal client.
export function useBrands(smmId: string | null | undefined) {
  return useQuery<Brand[]>({
    queryKey: ["brands"],
    queryFn:  getBrands,
    enabled:  !!smmId,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Omit<Brand, "id">) => createBrand(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Brand> }) => updateBrand(id, dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

// smmId rimane nel tipo di input per retrocompatibilità con i componenti chiamanti.
export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; smmId: string }) => deleteBrand(vars.id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

// ─── Activities ───────────────────────────────────────────────────────────────

export function useRecentActivities() {
  return useQuery<Activity[]>({
    queryKey:       ["activities", "recent"],
    queryFn:        getRecentActivities,
    refetchInterval: POST_POLL_MS,
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

// POST_POLL_MS: intervallo di polling per aggiornamenti cross-session
// (es. SMM vede in automatico cosa ha scritto/fatto il cliente e viceversa).
const POST_POLL_MS = 15_000;

export function usePosts(brandId: string | null | undefined) {
  return useQuery<Post[]>({
    queryKey:       ["posts", brandId],
    queryFn:        () => getPosts(brandId!),
    enabled:        !!brandId,
    refetchInterval: POST_POLL_MS,
  });
}

export function useClientPosts() {
  return useQuery<Post[]>({
    queryKey:       ["client", "posts"],
    queryFn:        getClientPosts,
    refetchInterval: POST_POLL_MS,
  });
}

// smmId è usato solo per `enabled` — RLS garantisce che l'SMM veda solo i propri post.
export function useRecentPosts(smmId: string | null | undefined) {
  return useQuery<Post[]>({
    queryKey:       ["posts", "recent", smmId],
    queryFn:        getRecentPosts,
    enabled:        !!smmId,
    refetchInterval: POST_POLL_MS,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Omit<Post, "id" | "hasChangesRequested">) => createPost(dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["posts", data.brandId] });
      qc.invalidateQueries({ queryKey: ["posts", "recent"] });
    },
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Post> }) => updatePost(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["posts", data.brandId] });
      qc.invalidateQueries({ queryKey: ["posts", "recent"] });
    },
  });
}

// brandId rimane nel tipo di input per invalidare la cache della vista brand corretta.
export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; brandId: string }) => deletePost(vars.id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["posts", vars.brandId] });
      qc.invalidateQueries({ queryKey: ["posts", "recent"] });
    },
  });
}

export function useUpdatePostStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, feedback }: { id: string; status: string; brandId: string; feedback?: string }) =>
      updatePostStatus(id, status, feedback),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["posts", vars.brandId] });
      qc.invalidateQueries({ queryKey: ["posts", "recent"] });
      qc.invalidateQueries({ queryKey: ["client", "posts"] });
    },
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useComments(postId: string | null | undefined) {
  return useQuery<Comment[]>({
    queryKey:       ["comments", postId],
    queryFn:        () => getComments(postId!),
    enabled:        !!postId,
    refetchInterval: POST_POLL_MS,
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: string }) =>
      addComment(postId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.postId] });
    },
  });
}

export type { Comment };
