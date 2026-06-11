import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
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
import type { Post, PostType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { Calendar, Check, Edit2, Loader2, MessageSquare, Pencil, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Preview components (client-only) ──────────────────────────────────────

function PhoneMockup({ hue, caption, type }: { hue: number; caption?: string; type: PostType }) {
  return (
    <div className="flex justify-center bg-zinc-950/10 py-5">
      <div className="relative flex h-80 w-44 flex-col overflow-hidden rounded-[2rem] border-[5px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-zinc-900/30">
        {/* Notch */}
        <div className="flex h-6 shrink-0 items-center justify-center bg-zinc-900">
          <div className="h-2 w-14 rounded-full bg-zinc-800" />
        </div>
        {/* Screen */}
        <div
          className="relative flex-1 overflow-hidden"
          style={{
            background: `linear-gradient(180deg, oklch(0.82 0.14 ${hue}), oklch(0.62 0.19 ${hue + 30}))`,
          }}
        >
          {/* Type badge */}
          <div className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur">
            {typeEmoji[type]} {type}
          </div>
          {/* Caption overlay */}
          {caption && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
              <p className="line-clamp-4 text-[9px] leading-relaxed text-white">{caption}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CarouselPreview({ hue, caption }: { hue: number; caption?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = [hue, hue + 40, hue + 80];

  return (
    <div className="relative overflow-hidden">
      {/* Scroll-snap container */}
      <div
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          setActiveIndex(idx);
        }}
      >
        {slides.map((h, i) => (
          <div
            key={i}
            className="relative aspect-square w-full shrink-0 snap-center"
            style={{
              background: `linear-gradient(135deg, oklch(0.82 0.14 ${h}), oklch(0.65 0.17 ${h + 20}))`,
            }}
          >
            <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white">
              {i + 1}/{slides.length}
            </span>
            {caption && i === 0 && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="line-clamp-2 text-xs text-white">{caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Dot indicators */}
      <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1">
        {slides.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ClientPreviewArea({ post, hue }: { post: Post; hue: number }) {
  if (post.type === "Reel" || post.type === "Story") {
    return <PhoneMockup hue={hue} caption={post.caption} type={post.type} />;
  }
  if (post.type === "Carosello") {
    return <CarouselPreview hue={hue} caption={post.caption} />;
  }
  // Post standard: banner gradient
  return (
    <div
      className="h-48 w-full shrink-0"
      style={{
        background: `linear-gradient(135deg, oklch(0.85 0.12 ${hue}), oklch(0.7 0.15 ${hue + 30}))`,
      }}
    />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

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
  const { data: brandPosts = [] } = usePosts(brandId ?? null);
  const { data: recentPosts = [] } = useRecentPosts(userId);
  const updateStatus = useUpdatePostStatus();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  const { data: comments = [] } = useComments(postId);
  const addCommentMutation = useAddComment();

  const [feedback, setFeedback] = useState("");
  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentText, setCommentText] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editType, setEditType] = useState<PostType>("Post");
  const [editDate, setEditDate] = useState("");

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

  useEffect(() => {
    if (!postId) {
      setIsEditing(false);
      setConfirmDelete(false);
      setShowFeedbackSheet(false);
      setFeedback("");
      setCommentText("");
    }
  }, [postId]);

  if (!post) return null;

  const hue = getBrandHue(post.brandId);
  const isPending = updateStatus.isPending || updatePost.isPending || deletePost.isPending;
  const canComment = role === "smm" || post.status === "pending";
  const showCommentsSection = comments.length > 0 || canComment;

  // ─── Handlers ──────────────────────────────────────────────────────────────

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
        id: post.id,
        status: "revision_requested",
        brandId: post.brandId,
        feedback: feedback.trim(),
      });
      toast.success("Richiesta inviata al Social Media Manager");
      setFeedback("");
      setShowFeedbackSheet(false);
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

  return (
    <>
      <Dialog open={!!postId} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="flex max-h-[90dvh] max-w-lg flex-col overflow-hidden p-0">
          {isEditing ? (
            /* ── Modalità modifica (SMM) ── */
            <div className="overflow-y-auto space-y-4 p-6">
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button onClick={handleSave} disabled={isPending} className="flex-1">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salva modifiche"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* ── Vista normale ── */
            <>
              {/* Preview area — dipende da ruolo + tipo */}
              {role === "client" ? (
                <ClientPreviewArea post={post} hue={hue} />
              ) : (
                <div
                  className="h-40 w-full shrink-0"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.85 0.12 ${hue}), oklch(0.7 0.15 ${hue + 30}))`,
                  }}
                />
              )}

              {/* Contenuto scrollabile */}
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                <DialogHeader className="space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {typeEmoji[post.type]} {post.type}
                    </span>
                    <StatusBadge status={post.status} hasChanges={post.hasChangesRequested} />
                  </div>
                  <DialogTitle className="text-xl">{post.title}</DialogTitle>
                </DialogHeader>

                {post.caption && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{post.caption}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.date).toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </div>

                {post.feedback && (
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-foreground">
                      <MessageSquare className="h-3.5 w-3.5" /> Feedback cliente
                    </div>
                    <p className="text-sm text-muted-foreground">{post.feedback}</p>
                  </div>
                )}

                {/* Commenti */}
                {showCommentsSection && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Commenti
                    </p>
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
                          {addCommentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Azioni SMM (inline nella scroll area) */}
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
                          <Button
                            onClick={handleSendToClient}
                            className="flex-1"
                            disabled={isPending}
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-4 w-4" />
                            )}
                            Invia al cliente
                          </Button>
                        </>
                      )}
                      {post.status === "pending" && (
                        <Button onClick={handleApprove} className="flex-1" disabled={isPending}>
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="mr-2 h-4 w-4" />
                          )}
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
                          {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Elimina definitivamente"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottoni sticky in basso — solo cliente, solo se non approvato */}
              {role === "client" && post.status !== "approved" && (
                <div className="shrink-0 border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={isPending}
                      className="h-12 flex-1 bg-emerald-600 text-base font-semibold hover:bg-emerald-700"
                    >
                      {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-5 w-5" />
                      )}
                      Approva
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowFeedbackSheet(true)}
                      disabled={isPending}
                      className="h-12 flex-1 text-base font-semibold"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifiche
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Sheet per il feedback (sibling del Dialog — evita annidamento Radix) */}
      <Sheet open={showFeedbackSheet} onOpenChange={setShowFeedbackSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Richiedi modifiche</SheetTitle>
          </SheetHeader>
          <Textarea
            autoFocus
            placeholder="Descrivi cosa vorresti cambiare… (es. 'La caption è troppo lunga, abbreviala')"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <SheetFooter className="mt-4 flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowFeedbackSheet(false)}
              disabled={isPending}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              onClick={handleRequestChanges}
              disabled={isPending || !feedback.trim()}
              className="flex-1"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invia richiesta"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
