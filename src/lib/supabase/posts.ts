import { supabase } from "../supabase";
import type { Post, PostStatus } from "../mock-data";

// ─── DB row shape ─────────────────────────────────────────────────────────────

type DbPost = {
  id: string;
  brand_id: string;
  title: string;
  content: string | null;
  platform: string;
  channel: string;
  media_link: string | null;
  scheduled_date: string;        // "YYYY-MM-DD"
  scheduled_time: string | null; // "HH:mm:ss"
  status: string;
  work_mode: string | null;
  internal_notes: string | null;
  feedback: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_updated_by: string | null;
  brands?: { name: string } | null;
};

// ─── Stato: identico DB ↔ frontend ────────────────────────────────────────────
// Un solo enum condiviso (vedi PostStatus in mock-data.ts): 'da_fare' |
// 'bozza_privata' | 'da_revisionare' | 'da_modificare' | 'approvato' |
// 'programmato' | 'pubblicato' | 'rimandato'. Nessuna traduzione DB↔frontend
// necessaria — chi può scrivere quale stato è deciso da RLS/trigger lato DB
// (lo SMM liberamente, il cliente solo lungo transizioni specifiche in base al
// work_mode del post), non da un mapping diverso per Gestione/Consulenza qui.

// ─── work_mode: mapping bidirezionale DB ↔ frontend ──────────────────────────

const DB_TO_FRONTEND_WORK_MODE: Record<string, Post["workMode"]> = {
  FULL_MANAGEMENT: "gestione",
  CONSULTANCY:     "consulenza",
};

const FRONTEND_TO_DB_WORK_MODE: Record<Post["workMode"], string> = {
  gestione:   "FULL_MANAGEMENT",
  consulenza: "CONSULTANCY",
};

// ─── Converters ───────────────────────────────────────────────────────────────

function toPost(row: DbPost): Post {
  return {
    id:                  row.id,
    brandId:             row.brand_id,
    brandName:           row.brands?.name ?? undefined,
    title:               row.title,
    caption:             row.content ?? "",
    type:                (row.platform as Post["type"]) ?? "Post",
    channel:             (row.channel as Post["channel"]) ?? "instagram",
    date:                row.scheduled_time
                           ? `${row.scheduled_date}T${row.scheduled_time}`
                           : `${row.scheduled_date}T00:00:00`,
    status:              (row.status as PostStatus) ?? "bozza_privata",
    workMode:            DB_TO_FRONTEND_WORK_MODE[row.work_mode ?? "FULL_MANAGEMENT"] ?? "gestione",
    feedback:            row.feedback ?? undefined,
    mediaLink:           row.media_link ?? undefined,
    internalNotes:       row.internal_notes ?? undefined,
    lastUpdatedBy:       row.last_updated_by ?? undefined,
  };
}

// Usata sia dalla creazione SMM (postToDbInsert) sia da createClientPost.
function splitDateTime(date: string): [string, string | undefined] {
  const [datePart, timePart] = (date ?? "").split("T");
  return [datePart, timePart || undefined];
}

// work_mode passato esplicitamente: derivato dal brand target da chi chiama
// (createPost), non hardcodato — un post creato dallo SMM eredita la modalità
// in cui si trova il brand in quel momento.
function postToDbInsert(
  dto: Omit<Post, "id" | "workMode">,
  workMode: string,
  createdBy: string | null,
): Omit<DbPost, "id"> {
  const [datePart, timePart] = splitDateTime(dto.date);
  const now = new Date().toISOString();
  return {
    brand_id:        dto.brandId,
    title:           dto.title,
    content:         dto.caption || null,
    platform:        dto.type,
    channel:         dto.channel,
    media_link:      dto.mediaLink ?? null,
    scheduled_date:  datePart,
    scheduled_time:  timePart ?? null,
    status:          "bozza_privata",   // nuovi post sempre bozza privata 🔴
    work_mode:       workMode,
    internal_notes:  dto.internalNotes ?? null,
    feedback:        null,
    created_at:      now,
    updated_at:      now,
    last_updated_by: createdBy,
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

// Vista SMM aggregata "Tutti i clienti" (Dashboard kanban, Calendario, Griglia):
// tutti i post di tutti i brand dello SMM, la RLS posts_smm_full fa già il filtro
// per proprietario — nessun brandId da passare, a differenza di getPosts().
export async function getAllPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*, brands(name)")
    .order("scheduled_date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as DbPost[]).map(toPost);
}

// Vista cliente: filtra per brand_id del cliente loggato
export async function getClientPosts(): Promise<Post[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Utente non autenticato");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("brand_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.brand_id) throw new Error("Brand non trovato per questo cliente");

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("brand_id", profile.brand_id)
    .order("scheduled_date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as DbPost[]).map(toPost);
}

// Bucket "post-approvazione": approvato + programmato + pubblicato, coerente
// con come il cliente vede la propria tab "Approvati" (vedi app/(client)/index.tsx)
const APPROVED_LIKE = ["approvato", "programmato", "pubblicato"];

// Statistiche dashboard cliente
export interface ClientStats {
  brandName: string;
  total: number;
  pending: number;          // da_revisionare — in approvazione
  changesRequested: number; // da_modificare  — modifica richiesta
  approved: number;         // approvato + programmato + pubblicato
  month: string;            // "Luglio 2026"
}

export async function getClientStats(): Promise<ClientStats> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Utente non autenticato");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("brand_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.brand_id) throw new Error("Brand non trovato");

  const [{ data: brandData }, { data: postsData }] = await Promise.all([
    supabase.from("brands").select("name").eq("id", profile.brand_id).single(),
    supabase.from("posts").select("status").eq("brand_id", profile.brand_id),
  ]);

  const rows = (postsData ?? []) as { status: string }[];
  const now = new Date();
  const month = now.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  return {
    brandName:        (brandData as any)?.name ?? "",
    total:            rows.length,
    pending:          rows.filter((r) => r.status === "da_revisionare").length,
    changesRequested: rows.filter((r) => r.status === "da_modificare").length,
    approved:         rows.filter((r) => APPROVED_LIKE.includes(r.status)).length,
    month:            month.charAt(0).toUpperCase() + month.slice(1),
  };
}

// KPI avanzati dashboard cliente
export interface ClientKPIs {
  avgApprovalDays: number | null;
  firstPassRate: number;
  feedbackRate: number;
  qualityColor: 'green' | 'yellow' | 'red';
  qualityLabel: string;
  monthlyChart: { month: string; short: string; count: number }[];
}

export async function getClientKPIs(): Promise<ClientKPIs> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utente non autenticato");

  const { data: profile } = await supabase
    .from("profiles")
    .select("brand_id")
    .eq("id", user.id)
    .single();

  if (!profile?.brand_id) throw new Error("Brand non trovato");

  const { data } = await supabase
    .from("posts")
    .select("status, feedback, created_at, updated_at, scheduled_date")
    .eq("brand_id", profile.brand_id);

  const rows = (data ?? []) as {
    status: string;
    feedback: string | null;
    created_at: string | null;
    updated_at: string | null;
    scheduled_date: string;
  }[];

  // Tempo medio approvazione (giorni)
  const approvedRows = rows.filter((r) => APPROVED_LIKE.includes(r.status));
  let avgApprovalDays: number | null = null;
  if (approvedRows.length > 0) {
    const diffs = approvedRows
      .filter((r) => r.created_at && r.updated_at)
      .map((r) => (new Date(r.updated_at!).getTime() - new Date(r.created_at!).getTime()) / 86400000);
    if (diffs.length > 0) avgApprovalDays = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
  }

  // Tasso approvazione al primo invio (senza feedback)
  const approvedNoFeedback = approvedRows.filter((r) => !r.feedback).length;
  const firstPassRate = approvedRows.length > 0
    ? Math.round((approvedNoFeedback / approvedRows.length) * 100)
    : 0;

  // Tasso feedback (qualità SMM)
  const withFeedback = rows.filter((r) => r.feedback).length;
  const feedbackRate = rows.length > 0 ? Math.round((withFeedback / rows.length) * 100) : 0;

  const qualityColor: ClientKPIs['qualityColor'] =
    feedbackRate <= 20 ? 'green' : feedbackRate <= 40 ? 'yellow' : 'red'
  const qualityLabel =
    qualityColor === 'green' ? 'Ottimo' : qualityColor === 'yellow' ? 'Migliorabile' : 'Critico'

  // Grafico ultimi 6 mesi (per scheduled_date)
  const now = new Date();
  const monthlyChart: ClientKPIs['monthlyChart'] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const count = rows.filter((r) => {
      const rd = new Date(r.scheduled_date);
      return rd.getFullYear() === y && rd.getMonth() === m;
    }).length;
    return {
      month: d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
      short: d.toLocaleDateString('it-IT', { month: 'short' }),
      count,
    };
  });

  return { avgApprovalDays, firstPassRate, feedbackRate, qualityColor, qualityLabel, monthlyChart };
}

// ─── Storico e confronto periodi ─────────────────────────────────────────────

export interface MonthSummary {
  label: string;
  short: string;
  year: number;
  monthIndex: number;
  total: number;
  approved: number;
  approvalRate: number;
  withFeedback: number;
  feedbackRate: number;
}

export interface ComparisonBlock {
  label: string;
  total: number;
  approved: number;
  approvalRate: number;
  feedbackRate: number;
}

export interface ClientComparison {
  mom: { current: ComparisonBlock; previous: ComparisonBlock };
  qoq: { current: ComparisonBlock; previous: ComparisonBlock };
  monthlyHistory: MonthSummary[]; // 6 mesi, più recente per primo
}

export async function getClientComparison(): Promise<ClientComparison> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utente non autenticato");

  const { data: profile } = await supabase
    .from("profiles")
    .select("brand_id")
    .eq("id", user.id)
    .single();

  if (!profile?.brand_id) throw new Error("Brand non trovato");

  const { data } = await supabase
    .from("posts")
    .select("status, feedback, scheduled_date")
    .eq("brand_id", profile.brand_id);

  const rows = (data ?? []) as { status: string; feedback: string | null; scheduled_date: string }[];

  const now = new Date();

  // 7 mesi di bucket (indice 0 = 6 mesi fa, indice 6 = mese corrente)
  const months: MonthSummary[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const monthRows = rows.filter((r) => {
      const rd = new Date(r.scheduled_date);
      return rd.getFullYear() === y && rd.getMonth() === m;
    });
    const total = monthRows.length;
    const approved = monthRows.filter((r) => APPROVED_LIKE.includes(r.status)).length;
    const withFeedback = monthRows.filter((r) => r.feedback).length;
    const lbl = d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
    return {
      label: lbl.charAt(0).toUpperCase() + lbl.slice(1),
      short: d.toLocaleDateString("it-IT", { month: "short" }),
      year: y,
      monthIndex: m,
      total,
      approved,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      withFeedback,
      feedbackRate: total > 0 ? Math.round((withFeedback / total) * 100) : 0,
    };
  });

  const toBlock = (m: MonthSummary): ComparisonBlock => ({
    label: m.label,
    total: m.total,
    approved: m.approved,
    approvalRate: m.approvalRate,
    feedbackRate: m.feedbackRate,
  });

  const sumMonths = (ms: MonthSummary[]): ComparisonBlock => {
    const total       = ms.reduce((a, x) => a + x.total, 0);
    const approved    = ms.reduce((a, x) => a + x.approved, 0);
    const withFeedback = ms.reduce((a, x) => a + x.withFeedback, 0);
    const qi = ms.length > 0 ? Math.floor(ms[0].monthIndex / 3) + 1 : 0;
    return {
      label:        ms.length > 0 ? `Q${qi} ${ms[0].year}` : "—",
      total,
      approved,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      feedbackRate: total > 0 ? Math.round((withFeedback / total) * 100) : 0,
    };
  };

  // MoM: mese corrente vs precedente
  const mom = { current: toBlock(months[6]), previous: toBlock(months[5]) };

  // QoQ: trimestre corrente vs precedente (dai 7 mesi disponibili)
  const curQStart = Math.floor(now.getMonth() / 3) * 3;
  const curY      = now.getFullYear();
  let   prevQStart = curQStart - 3;
  let   prevY     = curY;
  if (prevQStart < 0) { prevQStart += 12; prevY -= 1; }

  const inQ = (m: MonthSummary, qs: number, y: number) =>
    m.year === y && [qs, qs + 1, qs + 2].includes(m.monthIndex);

  const qoq = {
    current:  sumMonths(months.filter((m) => inQ(m, curQStart,  curY))),
    previous: sumMonths(months.filter((m) => inQ(m, prevQStart, prevY))),
  };

  return {
    mom,
    qoq,
    monthlyHistory: months.slice(1).reverse(), // 6 mesi, più recente prima
  };
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
  id: string;       // post id
  brandId: string;
  type: "new_post" | "approved" | "revision_requested" | "client_proposed";
  message: string;
  time: string;
  timestamp: Date;
  brandName?: string;
  workMode: Post["workMode"];
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

function toActivity(row: DbPost, currentUserId: string | null): Activity {
  const timestamp = new Date(row.updated_at || row.created_at || new Date());
  const actionByMe = row.last_updated_by === currentUserId;

  const createdAt = row.created_at ? new Date(row.created_at).getTime() : 0;
  const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : 0;
  const isEdit = updatedAt - createdAt > 60_000; // più di 1 minuto → è una modifica

  let type: Activity["type"] = "new_post";
  // "Hai caricato/modificato" ha senso solo se l'azione è dello SMM stesso — in
  // Consulenza il post/la modifica può essere del cliente, va attribuita a lui.
  let message = isEdit
    ? actionByMe ? `Hai modificato il post "${row.title}"` : `Il cliente ha modificato "${row.title}"`
    : actionByMe ? `Hai caricato un nuovo ${row.platform}` : `Il cliente ha caricato un nuovo ${row.platform}`;

  if (APPROVED_LIKE.includes(row.status)) {
    type = "approved";
    message = actionByMe
      ? `Hai approvato "${row.title}"`
      : `Il cliente ha approvato "${row.title}"`;
  } else if (row.status === "da_modificare") {
    type = "revision_requested";
    message = actionByMe
      ? `Modifica inviata per "${row.title}"`
      : `Il cliente ha richiesto modifiche su "${row.title}"`;
  } else if (row.status === "da_revisionare" && row.work_mode === "CONSULTANCY") {
    // In Consulenza, l'unico modo di arrivare a "da_revisionare" è il cliente
    // che invia la propria bozza all'SMM per la revisione.
    type = "client_proposed";
    message = `Il cliente ha proposto "${row.title}" da rivedere`;
  }

  return {
    id:        row.id,
    brandId:   row.brand_id,
    type,
    message,
    time:      formatTimeAgo(timestamp),
    timestamp,
    brandName: row.brands?.name ?? undefined,
    workMode:  DB_TO_FRONTEND_WORK_MODE[row.work_mode ?? "FULL_MANAGEMENT"] ?? "gestione",
  };
}

// Attività recenti: ultimi 7 giorni, ordinati per updated_at descending.
// Esclude bozza_privata: nessuno ha ancora agito su un post ancora privato,
// non c'è niente su cui lo SMM debba agire — evita rumore prima dell'invio.
export async function getRecentActivities(): Promise<Activity[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("posts")
    .select("*, brands(name)")
    .gte("updated_at", sevenDaysAgo.toISOString())
    .neq("status", "bozza_privata")
    .order("updated_at", { ascending: false })
    .limit(6);

  if (error) throw new Error(error.message);
  return (data as DbPost[]).map((row) => toActivity(row, user?.id ?? null));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createPost(dto: Omit<Post, "id" | "workMode">): Promise<Post> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("work_mode")
    .eq("id", dto.brandId)
    .single();

  if (brandError) throw new Error(brandError.message);

  const { data, error } = await supabase
    .from("posts")
    .insert({ id: crypto.randomUUID(), ...postToDbInsert(dto, (brand as { work_mode: string }).work_mode, user?.id ?? null) })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toPost(data as DbPost);
}

// Creazione post lato Cliente (flusso Consulenza): sempre CLIENT_DRAFT/CONSULTANCY,
// brand_id derivato dal profilo del chiamante (mai passato dal client, per coerenza
// con getClientPosts/getClientStats) — la RLS posts_client_insert rifiuta comunque
// qualsiasi combinazione non valida (brand non in Consulenza, status diverso, ecc.).
export interface CreateClientPostDto {
  title: string;
  caption: string;
  type: Post["type"];
  channel: Post["channel"];
  date: string;
  mediaLink?: string;
}

export async function createClientPost(dto: CreateClientPostDto): Promise<Post> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Utente non autenticato");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("brand_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.brand_id) throw new Error("Brand non trovato per questo cliente");

  const [datePart, timePart] = splitDateTime(dto.date);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      id:             crypto.randomUUID(),
      brand_id:       profile.brand_id,
      title:          dto.title,
      content:        dto.caption || null,
      platform:       dto.type,
      channel:        dto.channel,
      media_link:     dto.mediaLink ?? null,
      scheduled_date: datePart,
      scheduled_time: timePart ?? null,
      status:         "bozza_privata",
      work_mode:      "CONSULTANCY",
      internal_notes: null,
      feedback:       null,
      created_at:     now,
      updated_at:     now,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toPost(data as DbPost);
}

// last_updated_by viene impostato anche qui (non solo in updatePostStatus): è l'unico modo
// per il cliente di sapere, in Consulenza, se l'ultima modifica al CONTENUTO del post
// (non allo status) è stata fatta dall'SMM piuttosto che da lui stesso (Task 7.2, Q2).
export async function updatePost(id: string, dto: Partial<Post>): Promise<Post> {
  const { data: { user } } = await supabase.auth.getUser();

  const patch: Partial<DbPost> & { updated_at: string } = {
    updated_at:      new Date().toISOString(),
    last_updated_by: user?.id ?? null,
  };

  if (dto.title         !== undefined) patch.title          = dto.title;
  if (dto.caption       !== undefined) patch.content        = dto.caption ?? null;
  if (dto.type          !== undefined) patch.platform       = dto.type;
  if (dto.channel       !== undefined) patch.channel        = dto.channel;
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

// Cambio di status — cuore del semaforo e del tasto "Invia al cliente"/"Invia all'SMM"/
// "Sposta in un altro stato". Il valore è identico DB↔frontend (vedi PostStatus in
// mock-data.ts): chi può scriverlo è deciso da RLS/trigger lato DB, non da una
// traduzione qui. Niente .select() dopo l'update: se il nuovo status non è più
// leggibile dal cliente (es. torna "da_modificare"), la RLS blocca la lettura
// della riga aggiornata, causando un 406.
// brandId non è necessario qui — viene passato al caller tramite le vars della mutation.
export async function updatePostStatus(
  id: string,
  status: PostStatus,
  feedback?: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("posts")
    .update({
      status,
      feedback:         feedback ?? null,
      updated_at:       new Date().toISOString(),
      last_updated_by:  user?.id ?? null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
