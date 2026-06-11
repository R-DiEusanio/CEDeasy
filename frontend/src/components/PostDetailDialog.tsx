import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/app-store";
import {
  usePosts,
  useRecentPosts,
  useUpdatePostStatus,
  useUpdatePost,
  useDeletePost,
  useComments,
  useAddComment,
} from "@/lib/queries";
import { getBrandHue, typeEmoji } from "@/lib/mock-data";
import type { PostType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { Calendar, Check, Edit2, Loader2, MessageSquare, Pencil, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function PostDetailDialog({
  postId,
  onClose,
  brandId,
}: {
  postId: string | null;
  onClose: () => void;
  brandId?: string;
}) {
  const { role, userId } = useAppStore();
  const { data: brandPosts = [] }  = usePosts(brandId ?? null);
  const { data: recentPosts = [] } = useRecentPosts(userId);
  const updateStatus       = useUpdatePostStatus();
  const updatePost         = useUpdatePost();
  const deletePost         = useDeletePost();

  const { data: comments = [] } = useComments(postId);
  const addCommentMutation      = useAddComment();

  const [feedback, setFeedback]         = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentText, setCommentText]   = useState("");

  const [isEditing, setIsEditing]   = useState(false);
  const [editTitle, setEditTitle]   = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editType, setEditType]     = useState<PostType>("Post");
  const [editDate, setEditDate]     = useState("");

  const post =
    brandPosts.find((p) => p.id === postId) ?? recentPosts.find((p) => p.id === postId);

  useEffect(() => {
    if (post && isEditing) {
      setEditTitle(post.title);
      setEditCaption(post.caption ?? "");
      setEditType(post.type as PostType);
      setEditDate(post.date.slice(0, 10));
    }
  }, [isEditing, post?.id]);

  // reset completo quando il dialog si chiude
  useEffect(() => {
    if (!postId) {
      setIsEditing(false);
      setConfirmDelete(false);
      setShowFeedback(false);
      setFeedback("");
      setCommentText("");
    }
  }, [postId]);

  if (!post) return null;

  const hue = getBrandHue(post.brandId);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleApprove = async () => {
    try {
      await updateStatus.mutateAsync({ id: post.id, status: "approved", brandId: post.brandId });
      toast.success("Post approvato!");
      onClose();
    } catch {
      toast.error("Errore durante l'approvazione");
    }
  };

  const handleSendToClient = async () => {
    try {
      await updateStatus.mutateAsync({ id: post.id, status: "pending", brandId: post.brandId });
      toast.success("Inviato al cliente per approvazione");
      onClose();
    } catch {
      toast.error("Errore durante l'invio");
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      toast.error("Scrivi cosa vuoi modificare");
      return;
    }
    try {
      await updateStatus.mutateAsync({
        id:       post.id,
        status:   "revision_requested",
        brandId:  post.brandId,
        feedback: feedback.trim(),
      });
      toast.success("Richiesta inviata al Social Media Manager");
      setFeedback("");
      setShowFeedback(false);
      onClose();
    } catch {
      toast.error("Errore durante l'invio della richiesta");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !postId) return;
    try {
      await addCommentMutation.mutateAsync({ postId, body: commentText.trim() });
      setCommentText("");
    } catch {
      toast.error("Errore nell'invio del commento");
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error("Il titolo è obbligatorio");
      return;
    }
    try {
      await updatePost.mutateAsync({
        id: post.id,
        dto: {
          brandId: post.brandId,
          title: editTitle.trim(),
          caption: editCaption,
          type: editType,
          date: `${editDate}T09:00:00`,
          status: post.status,
          hasChangesRequested: post.hasChangesRequested,
        },
      });
      toast.success("Post aggiornato");
      setIsEditing(false);
    } catch {
      toast.error("Errore durante il salvataggio");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync({ id: post.id, brandId: post.brandId });
      toast.success("Post eliminato");
      onClose();
    } catch {
      toast.error("Errore durante l'eliminazione");
    }
  };

  // ─── Variabili derivate ──────────────────────────────────────────────────────

  const isPending = updateStatus.isPending || updatePost.isPending || deletePost.isPending;

  // SMM può sempre commentare; cliente solo quando il post è 🟡 (REVISION_REQUESTED)
  const canComment         = role === "smm" || post.status === "pending";
  const showCommentsSection = comments.length > 0 || canComment;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog open={!!postId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        {/* Banner colorato basato sul brand */}
        <div
          className="h-40 w-full flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, oklch(0.85 0.12 ${hue}), oklch(0.7 0.15 ${hue + 30}))`,
          }}
        />

        {isEditing ? (
          /* ── Modalità modifica ── */
          <div className="space-y-4 p-6">
            <DialogHeader>
              <DialogTitle>Modifica bozza</DialogTitle>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label>Titolo</Label>
              <Input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titolo del post"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Caption</Label>
              <Textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={editType} onValueChange={(v) => setEditType(v as PostType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Post">Post</SelectItem>
                    <SelectItem value="Reel">Reel</SelectItem>
                    <SelectItem value="Carosello">Carosello</SelectItem>
                    <SelectItem value="Story">Story</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isPending} className="flex-1">
                Annulla
              </Button>
              <Button onClick={handleSave} disabled={isPending} className="flex-1">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva modifiche"}
              </Button>
            </div>
          </div>
        ) : (
          /* ── Vista normale — scrollabile per contenere commenti ── */
          <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto space-y-4 p-6">

            {/* Header: tipo + status badge + titolo */}
            <DialogHeader className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {typeEmoji[post.type]} {post.type}
                </span>
                <StatusBadge status={post.status} hasChanges={post.hasChangesRequested} />
              </div>
              <DialogTitle className="text-xl">{post.title}</DialogTitle>
            </DialogHeader>

            <p className="text-sm leading-relaxed text-muted-foreground">{post.caption}</p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString("it-IT", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>

            {/* Feedback "Richiedi modifiche" salvato sul post */}
            {post.feedback && (
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-foreground">
                  <MessageSquare className="h-3.5 w-3.5" /> Feedback cliente
                </div>
                <p className="text-sm text-muted-foreground">{post.feedback}</p>
              </div>
            )}

            {/* ── Sezione commenti ──────────────────────────────────────── */}
            {showCommentsSection && (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Commenti
                </p>

                {/* Lista messaggi bubble */}
                {comments.length > 0 && (
                  <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                    {comments.map((c) => {
                      const isMe = c.authorId === userId;
                      return (
                        <div key={c.id} className={cn("flex gap-2", isMe && "flex-row-reverse")}>
                          <div
                            className={cn(
                              "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                              isMe
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground",
                            )}
                          >
                            <p className="mb-0.5 text-[11px] font-medium opacity-70">
                              {isMe ? "Tu" : role === "smm" ? "Cliente" : "SMM"}
                            </p>
                            <p className="leading-snug">{c.body}</p>
                            <p className="mt-1 text-[10px] opacity-50">
                              {new Date(c.createdAt).toLocaleString("it-IT", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Input: SMM sempre, cliente solo su post 🟡 */}
                {canComment && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={
                        role === "smm" ? "Lascia una nota interna…" : "Scrivi un commento…"
                      }
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment();
                      }}
                      rows={2}
                      className="resize-none text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                      className="h-auto self-end"
                    >
                      {addCommentMutation.isPending
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── Azioni SMM ───────────────────────────────────────────── */}
            {role === "smm" && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {post.status === "draft" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        disabled={isPending}
                        className="flex-1"
                      >
                        <Edit2 className="mr-2 h-4 w-4" /> Modifica
                      </Button>
                      <Button onClick={handleSendToClient} className="flex-1" disabled={isPending}>
                        {isPending
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Send className="mr-2 h-4 w-4" />}
                        Invia al cliente
                      </Button>
                    </>
                  )}
                  {post.status === "pending" && (
                    <Button onClick={handleApprove} className="flex-1" disabled={isPending}>
                      {isPending
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Check className="mr-2 h-4 w-4" />}
                      Segna come approvato
                    </Button>
                  )}
                </div>

                {!confirmDelete ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                    disabled={isPending}
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Elimina post
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                      disabled={isPending}
                      className="flex-1"
                    >
                      Annulla
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isPending}
                      className="flex-1"
                    >
                      {isPending
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : "Elimina definitivamente"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── Azioni Cliente ───────────────────────────────────────── */}
            {role === "client" && post.status !== "approved" && (
              <div className="space-y-3">
                {!showFeedback ? (
                  <div className="flex gap-2">
                    <Button onClick={handleApprove} className="flex-1" disabled={isPending}>
                      {isPending
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Check className="mr-2 h-4 w-4" />}
                      Approva
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowFeedback(true)}
                      className="flex-1"
                      disabled={isPending}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Richiedi modifiche
                    </Button>
                  </div>
                ) : (
                  <>
                    <Textarea
                      placeholder="Scrivi cosa vorresti cambiare…"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                      required
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setShowFeedback(false)}
                        className="flex-1"
                        disabled={isPending}
                      >
                        Annulla
                      </Button>
                      <Button onClick={handleRequestChanges} className="flex-1" disabled={isPending}>
                        {isPending
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : "Invia richiesta"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
