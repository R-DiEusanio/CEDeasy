import { useState } from "react";
import { Check, MessageSquare, Pencil, Calendar, Loader2 } from "lucide-react";
import type { Post } from "@/lib/mock-data";
import { getPostHue, typeEmoji } from "@/lib/mock-data";
import { useUpdatePostStatus } from "@/lib/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
  const isPending = updateStatus.isPending;

  const handleApprove = async () => {
    try {
      await updateStatus.mutateAsync({ id: post.id, status: "approved", brandId: post.brandId });
      toast.success("Post approvato!");
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
        brandId: post.brandId,
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

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]",
        isApproved && "border-emerald-200",
        hasChanges && !isApproved && "border-amber-200",
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
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground backdrop-blur">
          {typeEmoji[post.type]} {post.type}
        </span>
        {hasChanges && !isApproved && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            <Pencil className="h-3 w-3" /> Modifiche
          </span>
        )}
        {isApproved && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
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

        {post.feedback && (
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <MessageSquare className="h-3 w-3" /> Il tuo messaggio precedente
            </div>
            <p className="text-xs text-muted-foreground">{post.feedback}</p>
          </div>
        )}

        {/* Azioni — solo se non ancora approvato */}
        {!isApproved && !showFeedback && (
          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleApprove}
              disabled={isPending}
              className="h-10 flex-1 bg-emerald-600 font-semibold hover:bg-emerald-700"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
              Approva
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFeedback(true)}
              disabled={isPending}
              className="h-10 flex-1 font-semibold text-xs"
            >
              <Pencil className="mr-1 h-3.5 w-3.5" /> Modifica
            </Button>
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
              <Button
                variant="ghost"
                onClick={() => {
                  setShowFeedback(false);
                  setFeedback("");
                }}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
