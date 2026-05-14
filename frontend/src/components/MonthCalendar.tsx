import type { Post } from "@/lib/mock-data";
import { StatusDot } from "./StatusBadge";
import { cn } from "@/lib/utils";

export function MonthCalendar({
  posts,
  onSelect,
}: {
  posts: Post[];
  onSelect: (id: string) => void;
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const postsByDay = new Map<number, Post[]>();
  posts.forEach((p) => {
    const d = new Date(p.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      const arr = postsByDay.get(day) ?? [];
      arr.push(p);
      postsByDay.set(day, arr);
    }
  });

  const monthLabel = today.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">{monthLabel}</h3>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, i) => {
          const isToday = day === today.getDate();
          const dayPosts = day ? postsByDay.get(day) ?? [] : [];
          return (
            <div
              key={i}
              className={cn(
                "min-h-[88px] rounded-xl border border-transparent p-2 text-left",
                day && "bg-muted/40 hover:bg-muted",
                isToday && "border-primary bg-primary-soft",
              )}
            >
              {day && (
                <>
                  <div
                    className={cn(
                      "mb-1 text-xs font-semibold",
                      isToday ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onSelect(p.id)}
                        className="flex w-full items-center gap-1.5 truncate rounded-md bg-card px-1.5 py-1 text-left text-[10px] font-medium shadow-sm transition-colors hover:bg-accent"
                      >
                        <StatusDot status={p.status} />
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
    </div>
  );
}