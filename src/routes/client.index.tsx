import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useClientPosts } from "@/lib/queries";
import { getPostHue, typeEmoji } from "@/lib/mock-data";
import { PostClientCard } from "@/components/PostClientCard";
import { BrandMonthCalendar } from "@/components/BrandMonthCalendar";
import { RecentActivityFeed } from "@/components/RecentActivityFeed";
import { CalendarSidebar } from "@/components/CalendarSidebar";
import { PostSkeletonGrid } from "@/components/PostSkeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, Clock, CalendarDays, LayoutList, Loader2, Calendar, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/mock-data";

export const Route = createFileRoute("/client/")({
  component: ClientDashboard,
});

function ClientDashboard() {
  const { data: posts = [], isLoading, isError } = useClientPosts();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleViewChange = (newView: "list" | "calendar") => {
    if (newView === view) return;
    clearTimeout(transitionTimer.current);
    setIsTransitioning(true);
    setView(newView);
    transitionTimer.current = setTimeout(() => setIsTransitioning(false), 300);
  };

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
      {/* Sezione superiore: colonna sinistra (stats + toggle) + destra (feed) */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Colonna sinistra */}
        <div className="min-w-0 flex-1 space-y-6">
        {/* Contatore gigante — hero section */}
        {pendingPosts.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <Clock className="h-7 w-7" />
              </div>
              <div>
                <div className="text-6xl font-bold leading-none tracking-tight text-amber-900">
                  {pendingPosts.length}
                </div>
                <div className="mt-1 text-sm font-semibold text-amber-700">
                  {pendingPosts.length === 1 ? "post da revisionare" : "post da revisionare"}
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-amber-700/80">
              Tocca un post per approvarlo o richiedere modifiche.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-[var(--shadow-soft)]">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-900">Sei in pari!</div>
              <div className="mt-0.5 text-sm text-emerald-700">
                Nessun contenuto da revisionare al momento.
              </div>
            </div>
          </div>
        )}

        {/* Stat secondaria — approvati questo mese */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">Approvati questo mese</span>
          <span className="ml-auto text-2xl font-bold tabular-nums">
            {stats.approvedThisMonth.length}
          </span>
        </div>

        {/* Toggle vista */}
        {posts.length > 0 && (
          <div className="inline-flex rounded-xl border border-border bg-card p-1 text-sm">
            <button
              onClick={() => handleViewChange("list")}
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
              onClick={() => handleViewChange("calendar")}
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
        </div>{/* /colonna sinistra */}

        {/* Colonna destra: activity feed — solo su desktop */}
        <div className="hidden w-72 shrink-0 lg:block">
          <RecentActivityFeed />
        </div>
      </div>{/* /sezione superiore flex */}

      {/* Skeleton — visibile solo durante la transizione tra viste */}
      {isTransitioning && <PostSkeletonGrid count={6} />}

      {/* Vista Calendario: 2 colonne su desktop (calendario + sidebar) */}
      {!isTransitioning && view === "calendar" && pendingPosts.length > 0 && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <BrandMonthCalendar
              posts={pendingPosts}
              onSelectPost={(id) => setSelectedPostId(id)}
            />
          </div>
          <div className="hidden w-64 shrink-0 lg:sticky lg:top-8 lg:block">
            <CalendarSidebar posts={pendingPosts} />
          </div>
        </div>
      )}

      {/* Vista Lista: griglia responsiva */}
      {!isTransitioning && view === "list" && (
        <div className="space-y-8">
          {pendingPosts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                <h2 className="text-base font-semibold">Da approvare</h2>
                <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  {pendingPosts.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {pendingPosts.map((p) => (
                  <PostClientCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}

          {pendingPosts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Nessun contenuto da revisionare. Controlla i post approvati nella sezione "Approvati".
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
