import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useClientPosts } from "@/lib/queries";
import { PostClientCard } from "@/components/PostClientCard";
import { BrandMonthCalendar } from "@/components/BrandMonthCalendar";
import { RecentActivityFeed } from "@/components/RecentActivityFeed";
import { CalendarSidebar } from "@/components/CalendarSidebar";
import { PostSkeletonGrid } from "@/components/PostSkeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, LayoutList, Loader2, Calendar, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/mock-data";

export const Route = createFileRoute("/client/approved")({
  component: ApprovedPostsDashboard,
});

function ApprovedPostsDashboard() {
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
    const approvedThisMonth = posts.filter((p) => {
      if (p.status !== "approved") return false;
      const d = new Date(p.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    return { approvedThisMonth };
  }, [posts, currentMonth, currentYear]);

  const approvedPosts = posts.filter((p) => p.status === "approved");
  const selectedPost = posts.find((p) => p.id === selectedPostId) ?? null;

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">Errore nel caricamento dei post</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intestazione */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Post Approvati</h1>
        <p className="text-sm text-muted-foreground">
          {stats.approvedThisMonth.length} post approvati questo mese
        </p>
      </div>

      {/* Filtri vista */}
      <div className="flex gap-2">
        <button
          onClick={() => handleViewChange("list")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            view === "list"
              ? "bg-primary text-white"
              : "border border-border bg-card text-muted-foreground hover:bg-muted",
          )}
        >
          <LayoutList className="h-4 w-4" />
          Lista
        </button>
        <button
          onClick={() => handleViewChange("calendar")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            view === "calendar"
              ? "bg-primary text-white"
              : "border border-border bg-card text-muted-foreground hover:bg-muted",
          )}
        >
          <Calendar className="h-4 w-4" />
          Calendario
        </button>
      </div>

      {/* Contenuto principale */}
      <div
        className={cn(
          "transition-opacity duration-300",
          isTransitioning ? "opacity-50" : "opacity-100",
        )}
      >
        {view === "list" ? (
          <div className="space-y-8">
            <RecentActivityFeed />
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Post</h2>
              {isLoading ? (
                <PostSkeletonGrid />
              ) : approvedPosts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nessun post approvato
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {approvedPosts.map((post) => (
                    <PostClientCard
                      key={post.id}
                      post={post}
                      onSelect={() => setSelectedPostId(post.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="flex gap-6">
            <div className="flex-1">
              <BrandMonthCalendar posts={approvedPosts} />
            </div>
            <CalendarSidebar posts={approvedPosts} />
          </div>
        )}
      </div>

      {/* Dialog per dettagli */}
      <Dialog
        open={selectedPostId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPostId(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedPost && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">{selectedPost.caption}</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedPost.date).toLocaleDateString("it-IT", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm">{selectedPost.content}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
