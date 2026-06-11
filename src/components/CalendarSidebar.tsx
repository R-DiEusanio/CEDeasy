import type { Post, PostType, PostStatus } from "@/lib/mock-data";
import { typeEmoji } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CalendarClock, BarChart2 } from "lucide-react";

const STATUS_DOT: Record<PostStatus, string> = {
  draft:    "bg-[oklch(0.62_0.22_25)]",
  pending:  "bg-[oklch(0.78_0.16_80)]",
  approved: "bg-[oklch(0.68_0.17_150)]",
};

const STATUS_PILL: Record<PostStatus, string> = {
  draft:    "bg-[oklch(0.96_0.04_25)]  text-[oklch(0.42_0.16_25)]",
  pending:  "bg-[oklch(0.97_0.05_80)]  text-[oklch(0.45_0.13_72)]",
  approved: "bg-[oklch(0.96_0.06_150)] text-[oklch(0.36_0.14_150)]",
};

const STATUS_LABEL: Record<PostStatus, string> = {
  draft:    "Bozza",
  pending:  "In attesa",
  approved: "Approvato",
};

const ALL_TYPES: PostType[] = ["Post", "Reel", "Carosello", "Story"];

function getWeekBounds(): { monday: Date; sunday: Date; label: string } {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const label = `${monday.getDate()} – ${sunday.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  })}`;
  return { monday, sunday, label };
}

export function CalendarSidebar({ posts }: { posts: Post[] }) {
  const { monday, sunday, label: weekLabel } = getWeekBounds();

  const thisWeekPosts = posts
    .filter((p) => {
      const d = new Date(p.date);
      return d >= monday && d <= sunday;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const typeCounts = ALL_TYPES.map((type) => ({
    type,
    count: posts.filter((p) => p.type === type).length,
  })).filter((t) => t.count > 0);
  const maxCount = Math.max(...typeCounts.map((t) => t.count), 1);

  return (
    <div className="space-y-4">
      {/* ── Post in scadenza questa settimana ──────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Questa settimana</h3>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {weekLabel}
          </span>
        </div>

        <div className="p-3">
          {thisWeekPosts.length === 0 ? (
            <p className="rounded-xl bg-muted/40 px-3 py-4 text-center text-xs text-muted-foreground">
              Nessun post questa settimana
            </p>
          ) : (
            <div className="space-y-1.5">
              {thisWeekPosts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      "mt-[5px] h-2 w-2 shrink-0 rounded-full",
                      STATUS_DOT[p.status],
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium leading-snug">
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(p.date).toLocaleDateString("it-IT", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                      STATUS_PILL[p.status],
                    )}
                  >
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Distribuzione per tipo ─────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <BarChart2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Distribuzione</h3>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {posts.length} post totali
          </span>
        </div>

        <div className="space-y-3 p-4">
          {typeCounts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nessun post</p>
          ) : (
            typeCounts.map(({ type, count }) => (
              <div key={type} className="flex items-center gap-2.5">
                <span className="w-5 text-center text-base leading-none">
                  {typeEmoji[type]}
                </span>
                <span className="w-16 shrink-0 text-xs text-muted-foreground">
                  {type}
                </span>
                <div className="flex-1 overflow-hidden rounded-full bg-muted/60" style={{ height: "6px" }}>
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-4 text-right text-xs font-semibold tabular-nums">
                  {count}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Mini riepilogo stati ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            {
              label: "In attesa",
              count: posts.filter((p) => p.status === "pending").length,
              bg: "bg-[oklch(0.97_0.05_80)]",
              text: "text-[oklch(0.45_0.13_72)]",
              dot: "bg-[oklch(0.78_0.16_80)]",
            },
            {
              label: "Approvati",
              count: posts.filter((p) => p.status === "approved").length,
              bg: "bg-[oklch(0.96_0.06_150)]",
              text: "text-[oklch(0.36_0.14_150)]",
              dot: "bg-[oklch(0.68_0.17_150)]",
            },
          ] as const
        ).map(({ label, count, bg, text, dot }) => (
          <div key={label} className={cn("rounded-xl p-3", bg)}>
            <div className={cn("mb-1 flex items-center gap-1.5")}>
              <div className={cn("h-1.5 w-1.5 rounded-full", dot)} />
              <span className={cn("text-[10px] font-semibold uppercase tracking-wide", text)}>
                {label}
              </span>
            </div>
            <span className={cn("text-2xl font-bold tabular-nums", text)}>
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
