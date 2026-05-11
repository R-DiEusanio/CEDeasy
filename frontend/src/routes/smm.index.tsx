import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { brands } from "@/lib/mock-data";
import { PostCard } from "@/components/PostCard";
import { PostDetailDialog } from "@/components/PostDetailDialog";
import { StatusDot } from "@/components/StatusBadge";
import { ArrowRight, CheckCircle2, Clock, FileEdit } from "lucide-react";

export const Route = createFileRoute("/smm/")({
  component: SmmDashboard,
});

function SmmDashboard() {
  const { posts } = useAppStore();
  const [selected, setSelected] = useState<string | null>(null);

  const stats = useMemo(() => {
    return {
      drafts: posts.filter((p) => p.status === "draft").length,
      pending: posts.filter((p) => p.status === "pending").length,
      approved: posts.filter((p) => p.status === "approved").length,
      changes: posts.filter((p) => p.hasChangesRequested).length,
    };
  }, [posts]);

  const recent = [...posts].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 lg:px-8 lg:py-10">
      <div>
        <h1 className="text-2xl font-bold lg:text-3xl">Buongiorno 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ecco cosa sta succedendo oggi sui tuoi {brands.length} brand.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<FileEdit className="h-4 w-4" />} label="Bozze" value={stats.drafts} tone="draft" />
        <StatCard icon={<Clock className="h-4 w-4" />} label="In attesa" value={stats.pending} tone="pending" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Approvati" value={stats.approved} tone="approved" />
        <StatCard icon={<FileEdit className="h-4 w-4" />} label="Modifiche richieste" value={stats.changes} tone="draft" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Brand</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {brands.map((b) => {
            const bPosts = posts.filter((p) => p.brandId === b.id);
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
                      background: `linear-gradient(135deg, oklch(0.7 0.15 ${b.hue}), oklch(0.55 0.18 ${b.hue + 30}))`,
                    }}
                  >
                    {b.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{b.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{b.category}</div>
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

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Activity feed globale</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((p) => (
            <PostCard key={p.id} post={p} onClick={() => setSelected(p.id)} />
          ))}
        </div>
      </section>

      <PostDetailDialog postId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "draft" | "pending" | "approved";
}) {
  const toneClass = {
    draft: "bg-status-draft-soft text-status-draft",
    pending: "bg-status-pending-soft text-[oklch(0.45_0.13_70)]",
    approved: "bg-status-approved-soft text-[oklch(0.4_0.14_150)]",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}