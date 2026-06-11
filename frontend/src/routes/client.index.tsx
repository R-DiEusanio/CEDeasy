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
          {/* Card — Da approvare */}
          <div className="relative overflow-hidden rounded-2xl border border-[oklch(0.91_0.07_80)] bg-[oklch(0.97_0.04_80)] p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:shadow-[var(--shadow-elevated)]">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-[oklch(0.78_0.16_80)] opacity-[0.08]" />
            <div className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.93_0.09_80)] text-[oklch(0.52_0.14_70)]">
              <Clock className="h-4 w-4" />
            </div>
            <div className="pr-12">
              <div className="text-4xl font-bold tracking-tight text-[oklch(0.28_0.06_80)]">
                {stats.pending.length}
              </div>
              <div className="mt-1 text-sm font-medium text-[oklch(0.48_0.08_75)]">
                Da approvare
              </div>
            </div>
            <div className="mt-4 border-t border-[oklch(0.91_0.07_80)] pt-3">
              <span className="flex items-center gap-1 text-xs font-medium text-[oklch(0.55_0.1_70)]">
                Richiede la tua revisione
                <ArrowRight className="ml-auto h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Card — Approvati questo mese */}
          <div className="relative overflow-hidden rounded-2xl border border-[oklch(0.9_0.07_150)] bg-[oklch(0.97_0.04_150)] p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:shadow-[var(--shadow-elevated)]">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-[oklch(0.68_0.17_150)] opacity-[0.08]" />
            <div className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.93_0.09_150)] text-[oklch(0.42_0.15_150)]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="pr-12">
              <div className="text-4xl font-bold tracking-tight text-[oklch(0.25_0.06_150)]">
                {stats.approvedThisMonth.length}
              </div>
              <div className="mt-1 text-sm font-medium text-[oklch(0.42_0.09_150)]">
                Approvati questo mese
              </div>
            </div>
            <div className="mt-4 border-t border-[oklch(0.9_0.07_150)] pt-3">
              <span className="flex items-center gap-1 text-xs font-medium text-[oklch(0.48_0.12_150)]">
                Visualizza storico
                <ArrowRight className="ml-auto h-3 w-3" />
              </span>
            </div>
          </div>
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
      {!isTransitioning && view === "calendar" && posts.length > 0 && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <BrandMonthCalendar
              posts={posts}
              onSelectPost={(id) => setSelectedPostId(id)}
            />
          </div>
          <div className="hidden w-64 shrink-0 lg:sticky lg:top-8 lg:block">
            <CalendarSidebar posts={posts} />
          </div>
        </div>
      )}

      {/* Vista Lista: griglia responsiva */}
      {!isTransitioning && view === "list" && (
        <div className="space-y-8">
          {pendingPosts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[oklch(0.75_0.13_70)]" />
                <h2 className="text-base font-semibold">Da approvare</h2>
                <span className="ml-auto rounded-full bg-[oklch(0.97_0.04_80)] px-2.5 py-0.5 text-xs font-medium text-[oklch(0.52_0.14_70)]">
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

          {approvedPosts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[oklch(0.5_0.15_150)]" />
                <h2 className="text-base font-semibold text-muted-foreground">
                  Già approvati
                </h2>
                <span className="ml-auto rounded-full bg-[oklch(0.97_0.04_150)] px-2.5 py-0.5 text-xs font-medium text-[oklch(0.42_0.15_150)]">
                  {approvedPosts.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
