import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
// Importa solo i tipi, non i dati mockati
import { type Post, type PostStatus } from "./mock-data";

export type Role = "smm" | "client";

interface AppState {
  role: Role;
  setRole: (r: Role) => void;
  activeBrandId: string;
  setActiveBrandId: (id: string) => void;
  posts: Post[];
  // Aggiungiamo una funzione per ricaricare i dati manualmente se serve
  refreshPosts: () => Promise<void>;
  updatePost: (id: string, patch: Partial<Post>) => void;
  addPost: (post: Post) => void;
  setStatus: (id: string, status: PostStatus) => void;
  requestChanges: (id: string, feedback: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("smm");
  // IMPORTANTE: Qui dovrai mettere un UUID reale che hai su Supabase per vedere i dati all'inizio
  const [activeBrandId, setActiveBrandId] = useState<string>(""); 
  const [posts, setPosts] = useState<Post[]>([]);

  // Funzione per recuperare i dati dal Backend Java
  const fetchPosts = async (brandId: string) => {
    if (!brandId) return;
    try {
      const response = await fetch(`http://localhost:8080/api/posts/brand/${brandId}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Errore fetch posts:", error);
    }
  };

  // Ogni volta che cambia il brand selezionato, scarica i post nuovi
  useEffect(() => {
    fetchPosts(activeBrandId);
  }, [activeBrandId]);

  const value = useMemo<AppState>(
    () => ({
      role,
      setRole,
      activeBrandId,
      setActiveBrandId,
      posts,
      refreshPosts: () => fetchPosts(activeBrandId),
      updatePost: (id, patch) =>
        setPosts((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))),
      addPost: (post) => setPosts((p) => [post, ...p]),
      setStatus: (id, status) =>
        setPosts((p) => p.map((x) => (x.id === id ? { ...x, status } : x))),
      requestChanges: (id, feedback) =>
        setPosts((p) =>
          p.map((x) =>
            x.id === id
              ? { ...x, hasChangesRequested: true, feedback, status: "pending" }
              : x,
          ),
        ),
    }),
    [role, activeBrandId, posts],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AppStore missing");
  return v;
}