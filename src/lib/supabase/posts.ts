import { supabase } from "../supabase";
import type { Post } from "../mock-data";

// ─── DB row shape ─────────────────────────────────────────────────────────────

type DbPost = {
  id: string;
  brand_id: string;
  title: string;
  content: string | null;
  platform: string;
  media_link: string | null;
  scheduled_date: string;        // "YYYY-MM-DD"
  scheduled_time: string | null; // "HH:mm:ss"
  status: string;
  work_mode: string | null;
  internal_notes: string | null;
  feedback: string | null;
  created_at: string | null;
  updated_at: string | null;
  brands?: { name: string } | null;
};

// ─── Semaforo: mapping bidirezionale DB ↔ frontend ───────────────────────────
//
//  DB (uppercase)       Frontend Post           Semaforo
//  PENDING            → { draft,    false }   🔴 bozza privata (mai vista dal cliente)
//  DRAFT              → { draft,    false }   🔴 bozza privata (mai vista dal cliente)
//  REVISION_REQUESTED → { pending,  false }   🟡 inviato al cliente, attesa risposta
//  CHANGES_REQUESTED  → { draft,    true  }   🔴⚠ cliente ha richiesto modifiche
//  APPROVED           → { approved, false }   🟢 approvato
//  PUBLISHED          → { approved, false }   🟢 pubblicato

const DB_TO_FRONTEND: Record<string, Pick<Post, "status" | "hasChangesRequested">> = {
  PENDING:             { status: "draft",    hasChangesRequested: false },
  DRAFT:               { status: "draft",    hasChangesRequested: false },
  REVISION_REQUESTED:  { status: "pending",  hasChangesRequested: false },
  CHANGES_REQUESTED:   { status: "draft",    hasChangesRequested: true },
  APPROVED:            { status: "approved", hasChangesRequested: false },
  PUBLISHED:           { status: "approved", hasChangesRequested: false },
};

// Mapping per updatePostStatus() — lo status che i componenti mandano corrisponde
// all'AZIONE eseguita, non al valore DB da scrivere.
//
//  "pending"            → REVISION_REQUESTED   SMM "Invia al cliente"      🔴→🟡
//  "approved"           → APPROVED             Cliente/SMM approva          →🟢
//  "revision_requested" → CHANGES_REQUESTED    Cliente "Richiedi mod."      🟡→🔴⚠
//  "draft"              → PENDING              SMM reset a bozza privata    →🔴
const FRONTEND_STATUS_TO_DB: Record<string, string> = {
  pending:             "REVISION_REQUESTED",
  approved:            "APPROVED",
  revision_requested:  "CHANGES_REQUESTED",
  draft:               "PENDING",
};

// ─── Converters ───────────────────────────────────────────────────────────────

function toPost(row: DbPost): Post {
  const mapped = DB_TO_FRONTEND[row.status] ?? { status: "draft" as const, hasChangesRequested: false };
  return {
    id:                  row.id,
    brandId:             row.brand_id,
    brandName:           row.brands?.name ?? undefined,
    title:               row.title,
    caption:             row.content ?? "",
    type:                (row.platform as Post["type"]) ?? "Post",
    date:                row.scheduled_time
                           ? `${row.scheduled_date}T${row.scheduled_time}`
                           : `${row.scheduled_date}T00:00:00`,
    status:              mapped.status,
    hasChangesRequested: mapped.hasChangesRequested,
    feedback:            row.feedback ?? undefined,
    mediaLink:           row.media_link ?? undefined,
    internalNotes:       row.internal_notes ?? undefined,
  };
}

function postToDbInsert(dto: Omit<Post, "id" | "hasChangesRequested">): Omit<DbPost, "id"> {
  const [datePart, timePart] = (dto.date ?? "").split("T");
  const now = new Date().toISOString();
  return {
    brand_id:       dto.brandId,
    title:          dto.title,
    content:        dto.caption || null,
    platform:       dto.type,
    media_link:     dto.mediaLink ?? null,
    scheduled_date: datePart,
    scheduled_time: timePart ?? null,
    status:         "PENDING",         // nuovi post sempre bozza privata 🔴
    work_mode:      "FULL_MANAGEMENT",
    internal_notes: dto.internalNotes ?? null,
    feedback:       null,
    created_at:     now,
    updated_at:     now,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

// Vista calendario SMM: tutti i post di un brand, ordinati per data
export async function getPosts(brandId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("brand_id", brandId)
    .order("scheduled_date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as DbPost[]).map(toPost);
}

// Vista cliente: RLS esclude già PENDING e DRAFT — nessun filtro manuale necessario
export async function getClientPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("scheduled_date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as DbPost[]).map(toPost);
}

// Feed recente SMM: RLS garantisce già che l'SMM veda solo i propri brand
export async function getRecentPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*, brands(name)")
    .order("updated_at", { ascending: false })
    .limit(6);

  if (error) throw new Error(error.message);
  return (data as DbPost[]).map(toPost);
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export interface Activity {
  id: string;
  type: "new_post" | "approved" | "revision_requested";
  message: string;
  time: string;
  timestamp: Date;
  brandName?: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "ora";
  if (diffMins < 60) return `${diffMins}m fa`;
  if (diffHours < 24) return `${diffHours}h fa`;
  if (diffDays === 1) return "ieri";
  if (diffDays < 7) return `${diffDays} giorni fa`;
  return `${Math.floor(diffDays / 7)} settimane fa`;
}

function toActivity(row: DbPost): Activity {
  const timestamp = new Date(row.updated_at || row.created_at || new Date());
  let type: Activity["type"] = "new_post";
  let message = `SMM ha caricato un nuovo ${row.platform}`;

  if (row.status === "APPROVED" || row.status === "PUBLISHED") {
    type = "approved";
    message = `Hai approvato "${row.title}"`;
  } else if (row.status === "CHANGES_REQUESTED") {
    type = "revision_requested";
    message = `Modifica inviata per "${row.title}"`;
  }

  return {
    id: row.id,
    type,
    message,
    time: formatTimeAgo(timestamp),
    timestamp,
    brandName: row.brands?.name ?? undefined,
  };
}

// Attività recenti: ultimi 7 giorni, ordinati per updated_at descending
export async function getRecentActivities(): Promise<Activity[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("posts")
    .select("*, brands(name)")
    .gte("updated_at", sevenDaysAgo.toISOString())
    .order("updated_at", { ascending: false })
    .limit(6);

  if (error) throw new Error(error.message);
  return (data as DbPost[]).map(toActivity);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createPost(dto: Omit<Post, "id" | "hasChangesRequested">): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .insert({ id: crypto.randomUUID(), ...postToDbInsert(dto) })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toPost(data as DbPost);
}

export async function updatePost(id: string, dto: Partial<Post>): Promise<Post> {
  const patch: Partial<DbPost> & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (dto.title         !== undefined) patch.title          = dto.title;
  if (dto.caption       !== undefined) patch.content        = dto.caption ?? null;
  if (dto.type          !== undefined) patch.platform       = dto.type;
  if (dto.mediaLink     !== undefined) patch.media_link     = dto.mediaLink ?? null;
  if (dto.internalNotes !== undefined) patch.internal_notes = dto.internalNotes ?? null;
  if (dto.feedback      !== undefined) patch.feedback       = dto.feedback ?? null;
  if (dto.date !== undefined) {
    const [datePart, timePart] = dto.date.split("T");
    patch.scheduled_date = datePart;
    patch.scheduled_time = timePart ?? null;
  }

  const { data, error } = await supabase
    .from("posts")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toPost(data as DbPost);
}

// Cancella commenti prima del post (nessun ON DELETE CASCADE nel DB)
export async function deletePost(id: string): Promise<void> {
  const { error: commentsError } = await supabase
    .from("comments")
    .delete()
    .eq("post_id", id);
  if (commentsError) throw new Error(commentsError.message);

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// Cambio di status — cuore del semaforo e del tasto "Invia al cliente".
// `frontendStatus` è il valore che i componenti React passano (invariato rispetto a prima),
// la traduzione verso il DB avviene qui dentro.
// Niente .select() dopo l'update: se il nuovo status è PENDING/DRAFT la RLS del
// cliente blocca la lettura della riga aggiornata, causando un 406.
// brandId non è necessario qui — viene passato al caller tramite le vars della mutation.
export async function updatePostStatus(
  id: string,
  frontendStatus: string,
  feedback?: string,
): Promise<void> {
  const dbStatus = FRONTEND_STATUS_TO_DB[frontendStatus] ?? frontendStatus.toUpperCase();

  const { error } = await supabase
    .from("posts")
    .update({
      status:     dbStatus,
      feedback:   feedback ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
