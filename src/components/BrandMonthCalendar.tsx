import type { Post, PostType } from "@/lib/mock-data";
import { getVisualStatus } from "@/lib/status-config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Image, Film, Layers, Sparkles } from "lucide-react";
import { useState } from "react";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function getPostPillClass(p: Post): string {
  const vs = getVisualStatus(p.status, p.hasChangesRequested);
  const map = {
    draft: "bg-slate-100 text-slate-600",
    pending: "bg-amber-50 text-amber-700",
    changes_requested: "bg-rose-50 text-rose-700",
    approved: "bg-emerald-50 text-emerald-700",
  };
  return map[vs];
}

function PostTypeIcon({ type }: { type: PostType }) {
  if (type === "Reel")      return <Film     className="h-3 w-3 shrink-0" />;
  if (type === "Carosello") return <Layers   className="h-3 w-3 shrink-0" />;
  if (type === "Story")     return <Sparkles className="h-3 w-3 shrink-0" />;
  return                           <Image    className="h-3 w-3 shrink-0" />;
}

export function BrandMonthCalendar({
  posts,
  onSelectPost,
  onCreateForDate,
}: {
  posts: Post[];
  onSelectPost: (id: string) => void;
  onCreateForDate?: (iso: string) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const postsByDay = new Map<number, Post[]>();
  posts.forEach((p) => {
    const dt = new Date(p.date);
    if (dt.getMonth() === month && dt.getFullYear() === year) {
      const day = dt.getDate();
      const arr = postsByDay.get(day) ?? [];
      arr.push(p);
      postsByDay.set(day, arr);
    }
  });

  const monthLabel = cursor.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const isCurrentMonth = (d: number) =>
    today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;

  const shift = (delta: number) =>
    setCursor(new Date(year, month + delta, 1));

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Mese precedente">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Mese successivo">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Oggi
          </Button>
        </div>
        <h3 className="text-base font-semibold capitalize sm:text-lg">{monthLabel}</h3>
      </div>

      {/* Wrapper a contrasto che isola visivamente la griglia */}
      <div className="rounded-xl bg-muted/50 p-2 ring-1 ring-border/40 sm:p-3">
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:gap-2 sm:text-xs">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((day, i) => {
          const dayPosts = day ? postsByDay.get(day) ?? [] : [];
          const isToday = day ? isCurrentMonth(day) : false;
          const iso = day ? new Date(year, month, day).toISOString() : "";
          return (
            <div
              key={i}
              className={cn(
                "group relative flex min-h-[64px] flex-col overflow-hidden rounded-xl border border-transparent p-1.5 text-left sm:aspect-square sm:min-h-0 sm:p-2",
                day && "bg-card hover:bg-muted/60",
                isToday && "border-primary bg-primary-soft",
              )}
            >
              {day && (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[11px] font-semibold sm:text-xs",
                        isToday ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {day}
                    </span>
                    {onCreateForDate && (
                      <button
                        onClick={() => onCreateForDate(iso)}
                        aria-label="Crea bozza in questa data"
                        className="grid h-5 w-5 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-primary group-hover:opacity-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onSelectPost(p.id)}
                        className={cn(
                          "flex w-full items-center gap-1 truncate rounded-full px-1.5 py-0.5 text-left text-[10px] font-semibold transition-all hover:opacity-80 active:scale-95",
                          getPostPillClass(p),
                        )}
                      >
                        <PostTypeIcon type={p.type} />
                        <span className="truncate">{p.title}</span>
                      </button>
                    ))}
                    {dayPosts.length > 3 && (
                      <div className="px-1 text-[10px] text-muted-foreground">
                        +{dayPosts.length - 3}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      </div>{/* /wrapper contrasto */}
    </div>
  );
}