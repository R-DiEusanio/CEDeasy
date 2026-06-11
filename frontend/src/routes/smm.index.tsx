import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { useBrands, useRecentPosts } from "@/lib/queries";
import { getBrandHue, getBrandInitials } from "@/lib/mock-data";
import { PostCard } from "@/components/PostCard";
import { PostDetailDialog } from "@/components/PostDetailDialog";
import { StatusDot } from "@/components/StatusBadge";
import { ArrowRight, CheckCircle2, Clock, FileEdit, Loader2 } from "lucide-react";

export const Route = createFileRoute("/smm/")({
  component: SmmDashboard,
});

function SmmDashboard() {
  const { userId } = useAppStore();
  const { data: brands = [], isLoading: brandsLoading } = useBrands(userId);
  const { data: recentPosts = [], isLoading: postsLoading } = useRecentPosts(userId);
  const [selected, setSelected] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"draft" | "pending" | "approved" | "changes" | null>(null);

  const stats = {
    drafts: recentPosts.filter((p) => p.status === "draft").length,
    pending: recentPosts.filter((p) => p.status === "pending").length,
    approved: recentPosts.filter((p) => p.status === "approved").length,
    changes: recentPosts.filter((p) => p.hasChangesRequested).length,
  };

  const displayedPosts =
    activeFilter === null
      ? [...recentPosts].slice(0, 6)
      : recentPosts.filter((p) => {
          if (activeFilter === "draft") return p.status === "draft";
          if (activeFilter === "pending") return p.status === "pending";
          if (activeFilter === "approved") return p.status === "approved";
          if (activeFilter === "changes") return p.hasChangesRequested;
          return true;
        });

  if (brandsLoading || postsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 lg:px-8 lg:py-10">
      <div>
        <h1 className="text-2xl font-bold lg:text-3xl">Buongiorno 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ecco cosa sta succedendo oggi sui tuoi {brands.length} brand.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<FileEdit className="h-4 w-4" />} label="Bozze" value={stats.drafts} tone="draft" isActive={activeFilter === "draft"} onClick={() => setActiveFilter(activeFilter === "draft" ? null : "draft")} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="In attesa" value={stats.pending} tone="pending" isActive={activeFilter === "pending"} onClick={() => setActiveFilter(activeFilter === "pending" ? null : "pending")} />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Approvati" value={stats.approved} tone="approved" isActive={activeFilter === "approved"} onClick={() => setActiveFilter(activeFilter === "approved" ? null : "approved")} />
        <StatCard icon={<FileEdit className="h-4 w-4" />} label="Modifiche richieste" value={stats.changes} tone="draft" isActive={activeFilter === "changes"} onClick={() => setActiveFilter(activeFilter === "changes" ? null : "changes")} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Brand</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {brands.map((b) => {
            const hue = getBrandHue(b.id);
            const bPosts = recentPosts.filter((p) => p.brandId === b.id);
            return (
              <Link
                key={b.id}
                to="/smm/brand/$brandId"
                params={{ brandId: b.id }}
                className="group rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-xl text-sm font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, oklch(0.7 0.15 ${hue}), oklch(0.55 0.18 ${hue + 30}))`,
                    }}
                  >
                    {getBrandInitials(b.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{b.name}</div>
                    {b.category && (
                      <div className="truncate text-xs text-muted-foreground">{b.category}</div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <StatusDot status="pending" />
                    {bPosts.filter((p) => p.status === "pending").length} pending
                  </span>
                  <span className="flex items-center gap-1">
                    <StatusDot status="approved" />
                    {bPosts.filter((p) => p.status === "approved").length} ok
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {(activeFilter !== null || displayedPosts.length > 0) && (
        <section>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              {activeFilter
                ? ({ draft: "Bozze", pending: "In attesa", approved: "Approvati", changes: "Modifiche richieste" } as const)[activeFilter]
                : "Activity feed globale"}
            </h2>
            {activeFilter && (
              <button
                onClick={() => setActiveFilter(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                × Cancella filtro
              </button>
            )}
          </div>
          {displayedPosts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedPosts.map((p) => (
                <PostCard key={p.id} post={p} onClick={() => setSelected(p.id)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessun post in questa categoria.</p>
          )}
        </section>
      )}

      <PostDetailDialog postId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "draft" | "pending" | "approved";
  isActive: boolean;
  onClick: () => void;
}) {
  const toneClass = {
    draft: "bg-status-draft-soft text-status-draft",
    pending: "bg-status-pending-soft text-[oklch(0.45_0.13_70)]",
    approved: "bg-status-approved-soft text-[oklch(0.4_0.14_150)]",
  }[tone];
  return (
    <button
      onClick={onClick}
      className={`w-full cursor-pointer rounded-2xl border bg-card p-4 text-left shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] ${isActive ? "border-current ring-2 ring-current ring-offset-1" : "border-border"}`}
    >
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </button>
  );
}
