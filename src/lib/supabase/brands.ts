import { supabase } from "../supabase";
import type { Brand } from "../mock-data";

// ─── DB row shape ─────────────────────────────────────────────────────────────

type DbBrand = {
  id: string;
  name: string;
  category: string | null;
  smm_id: string;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  tiktok_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  telegram_url: string | null;
  linkedin_url: string | null;
  work_mode: string;
  created_at: string | null;
};

// ─── work_mode: mapping bidirezionale DB ↔ frontend ──────────────────────────

const DB_TO_FRONTEND_WORK_MODE: Record<string, Brand["workMode"]> = {
  FULL_MANAGEMENT: "gestione",
  CONSULTANCY:     "consulenza",
};

const FRONTEND_TO_DB_WORK_MODE: Record<Brand["workMode"], string> = {
  gestione:   "FULL_MANAGEMENT",
  consulenza: "CONSULTANCY",
};

// ─── Converters ───────────────────────────────────────────────────────────────

function toBrand(row: DbBrand): Brand {
  return {
    id:           row.id,
    name:         row.name,
    category:     row.category    ?? undefined,
    smmId:        row.smm_id,
    ownerName:    row.owner_name  ?? undefined,
    email:        row.email       ?? undefined,
    phone:        row.phone       ?? undefined,
    tiktokUrl:    row.tiktok_url  ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    facebookUrl:  row.facebook_url  ?? undefined,
    telegramUrl:  row.telegram_url  ?? undefined,
    linkedinUrl:  row.linkedin_url  ?? undefined,
    workMode:     DB_TO_FRONTEND_WORK_MODE[row.work_mode] ?? "gestione",
  };
}

function toDbInsert(dto: Omit<Brand, "id">): Omit<DbBrand, "id" | "created_at"> {
  return {
    name:         dto.name,
    category:     dto.category    ?? null,
    smm_id:       dto.smmId,
    owner_name:   dto.ownerName   ?? null,
    email:        dto.email       ?? null,
    phone:        dto.phone       ?? null,
    tiktok_url:   dto.tiktokUrl   ?? null,
    instagram_url:dto.instagramUrl ?? null,
    facebook_url: dto.facebookUrl  ?? null,
    telegram_url: dto.telegramUrl  ?? null,
    linkedin_url: dto.linkedinUrl  ?? null,
    work_mode:    FRONTEND_TO_DB_WORK_MODE[dto.workMode],
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

// RLS (brands_smm_full) filtra già per smm_id = auth.uid() — nessun parametro necessario.
// Il smmId rimane nella queryKey di TanStack Query solo come discriminatore di cache.
export async function getBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as DbBrand[]).map(toBrand);
}

// Usata dalla schermata profilo cliente per leggere il proprio brand collegato.
// RLS (brands_client_read) deve permettere la SELECT dove id = profiles.brand_id dell'utente.
export async function getBrandById(id: string): Promise<Brand> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return toBrand(data as DbBrand);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createBrand(dto: Omit<Brand, "id">): Promise<Brand> {
  const { data, error } = await supabase
    .from("brands")
    .insert({ id: crypto.randomUUID(), ...toDbInsert(dto) })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toBrand(data as DbBrand);
}

export async function updateBrand(id: string, dto: Partial<Brand>): Promise<Brand> {
  // smm_id non è mai aggiornabile (invariante di ownership del brand)
  const patch: Partial<Omit<DbBrand, "id" | "smm_id" | "created_at">> = {};

  if (dto.name         !== undefined) patch.name          = dto.name;
  if (dto.category     !== undefined) patch.category      = dto.category     ?? null;
  if (dto.ownerName    !== undefined) patch.owner_name    = dto.ownerName    ?? null;
  if (dto.email        !== undefined) patch.email         = dto.email        ?? null;
  if (dto.phone        !== undefined) patch.phone         = dto.phone        ?? null;
  if (dto.tiktokUrl    !== undefined) patch.tiktok_url    = dto.tiktokUrl    ?? null;
  if (dto.instagramUrl !== undefined) patch.instagram_url = dto.instagramUrl ?? null;
  if (dto.facebookUrl  !== undefined) patch.facebook_url  = dto.facebookUrl  ?? null;
  if (dto.telegramUrl  !== undefined) patch.telegram_url  = dto.telegramUrl  ?? null;
  if (dto.linkedinUrl  !== undefined) patch.linkedin_url  = dto.linkedinUrl  ?? null;
  // Cambio Gestione↔Consulenza: scelta esclusiva dello SMM, in qualsiasi momento (Task 1.2)
  if (dto.workMode     !== undefined) patch.work_mode     = FRONTEND_TO_DB_WORK_MODE[dto.workMode];

  const { data, error } = await supabase
    .from("brands")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toBrand(data as DbBrand);
}

// Nota: fallisce se esistono post agganciati al brand senza ON DELETE CASCADE nel DB.
// In quel caso bisogna eliminare prima i post (o aggiungere CASCADE alla FK).
export async function deleteBrand(id: string): Promise<void> {
  const { error } = await supabase
    .from("brands")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
