import { supabase } from "../supabase";

// ─── Tipo pubblico ────────────────────────────────────────────────────────────

// Campo del post a cui un suggerimento SMM (flusso Consulenza) fa riferimento.
// undefined = commento generico (uso attuale lato Gestione).
export type CommentTargetField = "title" | "caption" | "platform" | "media_link" | "scheduled_date";

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  targetField?: CommentTargetField;
}

// ─── DB row shape ─────────────────────────────────────────────────────────────

type DbComment = {
  id: string;
  post_id: string;
  author_id: string | null;
  body: string;
  created_at: string | null;
  target_field: string | null;
};

// ─── Converter ────────────────────────────────────────────────────────────────

function toComment(row: DbComment): Comment {
  return {
    id:          row.id,
    postId:      row.post_id,
    authorId:    row.author_id ?? "",
    body:        row.body,
    createdAt:   row.created_at ?? new Date().toISOString(),
    targetField: (row.target_field as CommentTargetField | null) ?? undefined,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

// RLS (comments_client_read / comments_smm_all) filtra già i commenti visibili
// per l'utente corrente — nessun filtro manuale necessario.
export async function getComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as DbComment[]).map(toComment);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

// RLS (comments_client_insert) blocca già a livello DB l'insert del cliente
// se il post non è REVISION_REQUESTED — il check nel componente è solo UI.
// targetField: solo per i suggerimenti SMM nel flusso Consulenza (comments_smm_full
// non ha restrizioni di colonna, quindi solo la UI SMM lo valorizza).
export async function addComment(postId: string, body: string, targetField?: CommentTargetField): Promise<Comment> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Utente non autenticato");

  const { data, error } = await supabase
    .from("comments")
    .insert({
      id:           crypto.randomUUID(),
      post_id:      postId,
      author_id:    user.id,
      body:         body.trim(),
      created_at:   new Date().toISOString(),
      target_field: targetField ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toComment(data as DbComment);
}
