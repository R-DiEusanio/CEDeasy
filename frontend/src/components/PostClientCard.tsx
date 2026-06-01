import { useState } from "react";
import { Check, MessageSquare, Pencil, Calendar, Loader2 } from "lucide-react";
import type { Post } from "@/lib/mock-data";
import { getPostHue, typeEmoji } from "@/lib/mock-data";
import { useUpdatePostStatus } from "@/lib/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function PostClientCard({
  post,
  onActionComplete,
}: {
  post: Post;
  onActionComplete?: () => void;
}) {
  const hue = getPostHue(post.type);
  const updateStatus = useUpdatePostStatus();

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  const isApproved = post.status === "approved";
  const hasChanges = post.hasChangesRequested;

  const handleApprove = async () => {
    try {
      await updateStatus.mutateAsync({ id: post.id, status: "approved" });
      toast.success("Post approvato! ✓");
      onActionComplete?.();
    } catch {
      toast.error("Errore durante l'approvazione");
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
        feedback: feedback.trim(),
      });
      toast.success("Richiesta inviata!");
      setFeedback("");
      setShowFeedback(false);
      onActionComplete?.();
    } catch {
      toast.error("Errore durante l'invio della richiesta");
    }
  };

  const isPending = updateStatus.isPending;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)] transition-all",
        isApproved && "border-[oklch(0.85_0.12_150)]",
        hasChanges && !isApproved && "border-[oklch(0.85_0.12_70)]",
        !isApproved && !hasChanges && "border-border",
      )}
    >
      {/* Gradient header */}
      <div
        className="relative h-24 w-full sm:h-28"
        style={{
          background: `linear-gradient(135deg, oklch(0.85 0.12 ${hue}), oklch(0.7 0.15 ${hue + 30}))`,
        }}
      >
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          {typeEmoji[post.type]} {post.type}
        </span>
        {hasChanges && !isApproved && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[oklch(0.97_0.05_70)] px-2.5 py-1 text-xs font-medium text-[oklch(0.5_0.13_70)]">
            <Pencil className="h-3 w-3" /> Modifiche richieste
          </span>
        )}
        {isApproved && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[oklch(0.97_0.08_150)] px-2.5 py-1 text-xs font-medium text-[oklch(0.4_0.14_150)]">
            <Check className="h-3 w-3" /> Approvato
          </span>
        )}
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-semibold text-foreground">{post.title}</h3>
          {post.caption && (
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{post.caption}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {formatDate(post.date)}
        </div>

        {/* Feedback precedente */}
        {post.feedback && (
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <MessageSquare className="h-3 w-3" /> Il tuo messaggio precedente
            </div>
            <p className="text-xs text-muted-foreground">{post.feedback}</p>
          </div>
        )}

        {/* Azioni — solo se pending */}
        {!isApproved && !showFeedback && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleApprove}
              disabled={isPending}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all",
                "bg-[oklch(0.5_0.15_150)] text-white hover:bg-[oklch(0.45_0.15_150)] active:scale-95",
                isPending && "cursor-not-allowed opacity-60",
              )}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Approva
            </button>
            <button
              onClick={() => setShowFeedback(true)}
              disabled={isPending}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all",
                "bg-[oklch(0.75_0.13_70)] text-white hover:bg-[oklch(0.7_0.13_70)] active:scale-95",
                isPending && "cursor-not-allowed opacity-60",
              )}
            >
              <Pencil className="h-4 w-4" /> Richiedi Modifica
            </button>
          </div>
        )}

        {/* Campo feedback inline */}
        {!isApproved && showFeedback && (
          <div className="space-y-2 pt-1">
            <Textarea
              autoFocus
              placeholder="Descrivi cosa vorresti cambiare… (es. 'La caption è troppo lunga, abbreviala')"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowFeedback(false);
                  setFeedback("");
                }}
                disabled={isPending}
                className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Annulla
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={isPending || !feedback.trim()}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-all",
                  "bg-[oklch(0.75_0.13_70)] text-white hover:bg-[oklch(0.7_0.13_70)]",
                  (isPending || !feedback.trim()) && "cursor-not-allowed opacity-60",
                )}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invia richiesta"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
