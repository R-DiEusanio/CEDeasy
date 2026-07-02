// Tipi che rispecchiano esattamente i DTO del backend Java

export type PostStatus = "draft" | "pending" | "approved";
export type PostType = "Post" | "Reel" | "Carosello" | "Story";

export interface Post {
  id: string;
  brandId: string;
  brandName?: string;
  title: string;
  caption: string;
  type: PostType;
  date: string; // ISO "YYYY-MM-DDThh:mm:ss"
  status: PostStatus;
  hasChangesRequested: boolean;
  feedback?: string;
  mediaLink?: string;
  internalNotes?: string;
}

export interface Brand {
  id: string;
  name: string;
  category?: string;
  smmId: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  tiktokUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  telegramUrl?: string;
  linkedinUrl?: string;
}

export interface ProfileDTO {
  id: string;
  fullName: string;
  email: string;
  role: "SMM" | "CLIENT";
}

// Utility: calcola le iniziali dal nome del brand
export function getBrandInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Utility: calcola un colore deterministico (hue 0-360) dall'id del brand
export function getBrandHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  }
  return hash % 360;
}

// Utility: hue del post basato sul tipo
export function getPostHue(type: PostType): number {
  const map: Record<PostType, number> = {
    Post: 200,
    Reel: 270,
    Carosello: 150,
    Story: 30,
  };
  return map[type] ?? 200;
}

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
