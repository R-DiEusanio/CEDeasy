import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/app-store";
import { typeEmoji } from "@/lib/mock-data"; // Rimosso 'brands'
import { StatusBadge } from "./StatusBadge";
import { Calendar, Check, MessageSquare, Pencil, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function PostDetailDialog({
  postId,
  onClose,
}: {
  postId: string | null;
  onClose: () => void;
}) {
  const { posts, role, setStatus, requestChanges } = useAppStore();
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const post = posts.find((p) => p.id === postId);
  if (!post) return null;

  // Hue dinamico come nella card
  const hue = post.imageHue ?? 200; 

  const handleApprove = async () => {
    try {
      await setStatus(post.id, "approved");
      toast.success("Post approvato!");
      onClose();
    } catch (e) {
      toast.error("Errore durante l'approvazione");
    }
  };

  const handleSendToClient = async () => {
    try {
      await setStatus(post.id, "pending");
      toast.success("Inviato al cliente");
      onClose();
    } catch (e) {
      toast.error("Errore nell'invio");
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      toast.error("Scrivi cosa vuoi modificare");
      return;
    }
    try {
      await requestChanges(post.id, feedback);
      toast.success("Richiesta inviata");
      setFeedback("");
      setShowFeedback(false);
      onClose();
    } catch (e) {
      toast.error("Errore nell'invio del feedback");
    }
  };

  return (
    <Dialog open={!!postId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <div
          className="h-40 w-full"
          style={{
            background: `linear-gradient(135deg, oklch(0.85 0.12 ${hue}), oklch(0.7 0.15 ${hue + 30}))`,
          }}
        />
        <div className="space-y-4 p-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {typeEmoji[post.type] || "📱"} {post.type}
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

          {post.feedback && (
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium text-foreground">
                <MessageSquare className="h-3.5 w-3.5" /> Feedback cliente
              </div>
              <p className="text-sm text-muted-foreground">{post.feedback}</p>
            </div>
          )}

          {/* ... Logica bottoni SMM / Client rimane uguale ... */}
          {role === "smm" && (
            <div className="flex flex-wrap gap-2">
              {post.status === "draft" && (
                <Button onClick={handleSendToClient} className="flex-1">
                  <Send className="mr-2 h-4 w-4" /> Invia al cliente
                </Button>
              )}
              {post.status === "pending" && (
                <Button onClick={handleApprove} className="flex-1">
                  <Check className="mr-2 h-4 w-4" /> Segna come approvato
                </Button>
              )}
            </div>
          )}

          {role === "client" && post.status !== "approved" && (
            <div className="space-y-3">
              {!showFeedback ? (
                <div className="flex gap-2">
                  <Button onClick={handleApprove} className="flex-1">
                    <Check className="mr-2 h-4 w-4" /> Approva
                  </Button>
                  <Button variant="outline" onClick={() => setShowFeedback(true)} className="flex-1">
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
                    <Button variant="ghost" onClick={() => setShowFeedback(false)} className="flex-1">
                      Annulla
                    </Button>
                    <Button onClick={handleRequestChanges} className="flex-1">
                      Invia richiesta
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}