import { supabase } from "./supabase";

const BASE = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:8080";

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => authFetch(path).then((r) => json<T>(r)),
  post: <T>(path: string, body: unknown) =>
    authFetch(path, { method: "POST", body: JSON.stringify(body) }).then((r) => json<T>(r)),
  put: <T>(path: string, body: unknown) =>
    authFetch(path, { method: "PUT", body: JSON.stringify(body) }).then((r) => json<T>(r)),
  patch: <T>(path: string, body: unknown) =>
    authFetch(path, { method: "PATCH", body: JSON.stringify(body) }).then((r) => json<T>(r)),
  delete: (path: string) => authFetch(path, { method: "DELETE" }).then((r) => json<void>(r)),
};
