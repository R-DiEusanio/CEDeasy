import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useClientPosts } from "@/lib/queries";
import { getPostHue, typeEmoji } from "@/lib/mock-data";
import { PostClientCard } from "@/components/PostClientCard";
import { BrandMonthCalendar } from "@/components/BrandMonthCalendar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, Clock, CalendarDays, LayoutList, Loader2, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/mock-data";

export const Route = createFileRoute("/client/")({
  component: ClientDashboard,
});

function ClientDashboard() {
  const { data: posts = [], isLoading, isError } = useClientPosts();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stats = useMemo(() => {
    const pending = posts.filter((p) => p.status === "pending");
    const approvedThisMonth = posts.filter((p) => {
      if (p.status !== "approved") return false;
      const d = new Date(p.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    return { pending, approvedThisMonth };
  }, [posts, currentMonth, currentYear]);

  const pendingPosts = posts.filter((p) => p.status === "pending");
  const approvedPosts = posts.filter((p) => p.status === "approved");
  const selectedPost = posts.find((p) => p.id === selectedPostId) ?? null;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        Impossibile caricare i contenuti. Riprova più tardi.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intestazione + contatori + toggle: rimangono stretti */}
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Intestazione */}
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">Ciao! 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingPosts.length > 0
              ? `Hai ${pendingPosts.length} contenut${pendingPosts.length === 1 ? "o" : "i"} da revisionare.`
              : "Nessun contenuto da revisionare al momento. Sei in pari! ✓"}
          </p>
        </div>

        {/* Contatori */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[oklch(0.95_0.05_70)] text-[oklch(0.5_0.13_70)]">
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-3xl font-bold">{stats.pending.length}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">Da approvare</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[oklch(0.95_0.08_150)] text-[oklch(0.4_0.14_150)]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-3xl font-bold">{stats.approvedThisMonth.length}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">Approvati questo mese</div>
          </div>
        </div>

        {/* Toggle vista */}
        {posts.length > 0 && (
          <div className="inline-flex rounded-xl border border-border bg-card p-1 text-sm">
            <button
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutList className="h-4 w-4" /> Lista
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
                view === "calendar"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarDays className="h-4 w-4" /> Calendario
            </button>
          </div>
        )}
      </div>

      {/* Vista Calendario: usa tutta la larghezza disponibile */}
      {view === "calendar" && posts.length > 0 && (
        <BrandMonthCalendar
          posts={posts}
          onSelectPost={(id) => setSelectedPostId(id)}
        />
      )}

      {/* Vista Lista: rimane stretta */}
      {view === "list" && (
        <div className="mx-auto max-w-2xl space-y-6">
          {pendingPosts.length > 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[oklch(0.75_0.13_70)]" />
                Da approvare
              </h2>
              <div className="space-y-4">
                {pendingPosts.map((p) => (
                  <PostClientCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}

          {approvedPosts.length > 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[oklch(0.5_0.15_150)]" />
                Già approvati
              </h2>
              <div className="space-y-4">
                {approvedPosts.map((p) => (
                  <PostClientCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}

          {posts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Nessun contenuto disponibile. Il tuo social media manager sta preparando i post.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Dialog post selezionato dal calendario */}
      <Dialog
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPostId(null)}
      >
        <DialogContent className="max-w-md overflow-hidden p-0">
          {selectedPost && (
            <PostCalendarDetailView
              post={selectedPost}
              onClose={() => setSelectedPostId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PostCalendarDetailView({
  post,
  onClose,
}: {
  post: Post;
  onClose: () => void;
}) {
  const hue = getPostHue(post.type);

  return (
    <div>
      {/* Gradient header */}
      <div
        className="h-32 w-full"
        style={{
          background: `linear-gradient(135deg, oklch(0.85 0.12 ${hue}), oklch(0.7 0.15 ${hue + 30}))`,
        }}
      />
      {/* Contenuto */}
      <div className="p-5">
        <div className="mb-4">
          <span className="text-xs font-medium text-muted-foreground">
            {typeEmoji[post.type]} {post.type}
          </span>
          <h2 className="mt-1 text-lg font-bold">{post.title}</h2>
          {post.caption && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{post.caption}</p>
          )}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.date).toLocaleDateString("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
        </div>

        {post.feedback && (
          <div className="mb-4 rounded-xl border border-border bg-muted/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium">
              <MessageSquare className="h-3 w-3" /> Tuo messaggio precedente
            </div>
            <p className="text-xs text-muted-foreground">{post.feedback}</p>
          </div>
        )}

        {/* Azioni inline */}
        <PostClientCard
          post={post}
          onActionComplete={onClose}
        />
      </div>
    </div>
  );
}
