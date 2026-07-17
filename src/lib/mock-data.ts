// Tipi che rispecchiano esattamente i DTO del backend Java

// Stato unico del post (sostituisce il vecchio semaforo a 3 stati + flag
// hasChangesRequested e la colonna planning_status, mai collegata alla UI).
// Un post ha sempre uno solo di questi 8 stati, liberamente spostabile dallo
// SMM; il cliente può spostarlo solo lungo transizioni specifiche (RLS+trigger).
export type PostStatus =
  | "da_fare"
  | "bozza_privata"
  | "da_revisionare"
  | "da_modificare"
  | "approvato"
  | "programmato"
  | "pubblicato"
  | "rimandato";
export type PostType = "Post" | "Reel" | "Carosello" | "Story";
export type Channel = "instagram" | "facebook";
export type WorkMode = "gestione" | "consulenza";
export type BrandColor = "orange" | "violet" | "blue" | "green";

export interface Post {
  id: string;
  brandId: string;
  brandName?: string;
  title: string;
  caption: string;
  type: PostType;
  channel: Channel;
  date: string; // ISO "YYYY-MM-DDThh:mm:ss"
  status: PostStatus;
  workMode: WorkMode;
  feedback?: string;
  mediaLink?: string;
  internalNotes?: string;
  lastUpdatedBy?: string; // profile id di chi ha fatto l'ultima modifica di contenuto
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
  workMode: WorkMode;
  color: BrandColor;
  // Scheda Strategia — materiale SMM-only (vedi trigger prevent_client_brand_field_change)
  toneOfVoice?: string;
  obiettivo?: string;
  target?: string;
  posizionamento?: string;
  frequenzaPubblicazione?: string;
  canaliAttivi?: Channel[];
  hashtagRicorrenti?: string;
  linkUtili?: string;
}

// Colore scelto dallo SMM alla creazione del cliente (selettore a 4 pallini) —
// usato per avatar/dot ovunque il brand compaia (pillole header, card, calendario).
export const BRAND_COLOR_HEX: Record<BrandColor, string> = {
  orange: "#F5A623",
  violet: "#6C5CE7",
  blue: "#29B6E8",
  green: "#2ECC71",
};

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

export const typeEmoji: Record<PostType, string> = {
  Post: "🖼️",
  Reel: "🎬",
  Carosello: "🗂️",
  Story: "✨",
};
