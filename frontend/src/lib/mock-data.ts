// 1. TIPI E INTERFACCE (Le "regole" dei dati)
export type PostStatus = "draft" | "pending" | "approved";
export type PostType = "Post" | "Reel" | "Carosello" | "Story";

export interface Post {
  id: string;
  brandId: string;
  title: string;
  caption: string;
  type: PostType;
  date: string; // ISO
  status: PostStatus;
  feedback?: string;
  hasChangesRequested?: boolean;
  imageHue?: number;
}

export interface Brand {
  id: string;
  name: string;
  category: string;
  initials: string;
  hue: number;
}

// 2. DATI INIZIALI (Vuoti, perché useremo quelli del Backend)
export const brands: Brand[] = [];
export const initialPosts: Post[] = [];

// 3. MAPPATURE GRAFICHE (Etichette e Icone per la UI)
export const statusLabel: Record<PostStatus, string> = {
  draft: "Bozza privata",
  pending: "In approvazione",
  approved: "Approvato",
};

export const typeEmoji: Record<PostType, string> = {
  Post: "🖼️",
  Reel: "🎬",
  Carosello: "🗂️",
  Story: "✨",
};