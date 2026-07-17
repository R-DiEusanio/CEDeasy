import { supabase } from "../supabase";

// ─── DB row shape ─────────────────────────────────────────────────────────────

type DbInvite = {
  id: string;
  brand_id: string;
  smm_id: string;
  method: string;
  code: string;
  email: string | null;
  status: string;
  created_at: string | null;
  accepted_at: string | null;
};

export interface Invite {
  id: string;
  brandId: string;
  smmId: string;
  method: "LINK" | "CODE" | "EMAIL";
  code: string;
  email?: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  createdAt: string;
  acceptedAt?: string;
}

function toInvite(row: DbInvite): Invite {
  return {
    id: row.id,
    brandId: row.brand_id,
    smmId: row.smm_id,
    method: row.method as Invite["method"],
    code: row.code,
    email: row.email ?? undefined,
    status: row.status as Invite["status"],
    createdAt: row.created_at ?? "",
    acceptedAt: row.accepted_at ?? undefined,
  };
}

// Codice leggibile tipo "SMM-GIGI-482": usato sia come Codice Invito digitabile
// a mano, sia come suffisso del Link Magico (cedeasy://join/<code>) — un solo
// valore, due presentazioni, niente da tenere sincronizzato.
// normalize("NFD") scompone le lettere accentate in lettera+segno diacritico,
// che il replace successivo scarta già (non essendo a-zA-Z) senza bisogno di
// un regex dedicato ai diacritici.
function generateCode(nameHint?: string): string {
  const slug = (nameHint ?? "")
    .normalize("NFD")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 6)
    .toUpperCase();
  const digits = Math.floor(100 + Math.random() * 900);
  return `SMM-${slug || "CLIENTE"}-${digits}`;
}

// Riusa un invito PENDING già esistente per il brand (evita di generarne uno
// nuovo ogni volta che lo SMM riapre lo sheet "Invita cliente"), altrimenti ne
// crea uno nuovo. Ritenta la generazione del codice in caso di collisione
// (constraint UNIQUE), improbabile ma possibile con un formato così corto.
export async function getOrCreateInvite(brandId: string, smmId: string, nameHint?: string): Promise<Invite> {
  const { data: existing, error: fetchError } = await supabase
    .from("invites")
    .select("*")
    .eq("brand_id", brandId)
    .eq("status", "PENDING")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (existing) return toInvite(existing as DbInvite);

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("invites")
      .insert({
        id: crypto.randomUUID(),
        brand_id: brandId,
        smm_id: smmId,
        method: "LINK",
        code: generateCode(nameHint),
        status: "PENDING",
      })
      .select()
      .single();

    if (!error) return toInvite(data as DbInvite);
    lastError = error.message;
    if (error.code !== "23505") break; // non è una collisione sul codice, non ritentare
  }

  throw new Error(lastError ?? "Impossibile creare l'invito");
}

// Valida un codice invito PRIMA della registrazione (schermata di join) — non
// lo consuma, permette solo di leggere a quale brand appartiene per precompilare
// il form. SECURITY DEFINER lato DB: funziona anche da utente non autenticato.
export async function validateInviteCode(code: string): Promise<{ brandId: string; brandName: string }> {
  const { data, error } = await supabase.rpc("validate_invite", { invite_code: code });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Codice invito non valido o già utilizzato");
  return { brandId: row.brand_id, brandName: row.brand_name };
}

// Consuma il codice (status → ACCEPTED) — chiamata solo DOPO che signUp() è
// andato a buon fine, così un errore di registrazione non brucia il codice.
export async function acceptInviteCode(code: string): Promise<{ brandId: string }> {
  const { data, error } = await supabase.rpc("accept_invite", { invite_code: code });
  if (error) throw new Error(error.message);
  return { brandId: data as string };
}
