import { supabase } from "../supabase";
import type { ProfileDTO } from "../mock-data";

// ─── DB row shape ─────────────────────────────────────────────────────────────

type DbProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;         // "SMM" | "CLIENT" — discriminator della single-table inheritance
  brand_id: string | null; // presente solo per i CLIENT, null per gli SMM
};

// ─── Converters ───────────────────────────────────────────────────────────────

function toProfileDTO(row: DbProfile): ProfileDTO {
  return {
    id:       row.id,
    fullName: row.full_name ?? "",
    email:    row.email    ?? "",
    role:     row.role === "SMM" ? "SMM" : "CLIENT",
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

// Restituisce il profilo dell'utente corrente (equivale a GET /api/profiles/me).
// RLS (profiles_select_own) garantisce che si possa leggere solo id = auth.uid().
export async function getMyProfile(): Promise<ProfileDTO> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Utente non autenticato");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(error.message);
  return toProfileDTO(data as DbProfile);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

// Upsert del profilo dopo signup o login (equivale a POST /api/profiles).
//
// Logica replicata dal ProfileService Java:
//   - Se il profilo esiste già → aggiorna solo full_name
//   - Se non esiste → crea il record completo con id = auth.uid()
//
// email, role e brand_id non vengono mai sovrascritti su un profilo già esistente:
// l'email è immutabile (proviene dall'auth), il role è invariante post-registrazione.
// Nota: prima di questa fix, il payload includeva sempre role/email anche in UPDATE,
// quindi chiamare questa funzione due volte con ruoli diversi per lo stesso account
// (es. testare sia il flusso SMM che quello Cliente con la stessa email) sovrascriveva
// silenziosamente il ruolo esistente. La UPDATE ora tocca solo full_name.
export async function upsertProfile(
  fullName: string,
  role: "SMM" | "CLIENT",
  brandId?: string,
): Promise<ProfileDTO> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Utente non autenticato");

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toProfileDTO(data as DbProfile);
  }

  const payload: Record<string, unknown> = {
    id:        user.id,
    full_name: fullName,
    email:     user.email ?? null,
    role,
  };
  if (brandId) payload.brand_id = brandId;

  const { data, error } = await supabase
    .from("profiles")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toProfileDTO(data as DbProfile);
}

// Restituisce il brand_id del cliente corrente.
// Non fa parte del ProfileDTO pubblico ma è usato internamente quando necessario
// (es. per precaricare il brand nel context senza passare dall'RLS implicito).
export async function getMyBrandId(): Promise<string | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Utente non autenticato");

  const { data, error } = await supabase
    .from("profiles")
    .select("brand_id")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(error.message);
  return (data as Pick<DbProfile, "brand_id">).brand_id;
}
