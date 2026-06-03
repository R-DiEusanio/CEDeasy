import type { ElementType } from "react";
import { CheckCircle2, Clock, Upload, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityType = "new_post" | "approved" | "revision_requested";

interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  time: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "new_post",
    message: "SMM ha caricato un nuovo Reel",
    time: "2 ore fa",
  },
  {
    id: "2",
    type: "approved",
    message: 'Hai approvato "Post estivo 2025"',
    time: "ieri",
  },
  {
    id: "3",
    type: "new_post",
    message: "Nuovo Carosello in attesa di revisione",
    time: "2 giorni fa",
  },
  {
    id: "4",
    type: "revision_requested",
    message: 'Modifica inviata per "Story lancio"',
    time: "3 giorni fa",
  },
  {
    id: "5",
    type: "new_post",
    message: "SMM ha caricato un nuovo Post",
    time: "4 giorni fa",
  },
  {
    id: "6",
    type: "approved",
    message: 'Hai approvato "Reel promo agosto"',
    time: "5 giorni fa",
  },
];

const TYPE_CONFIG: Record<
  ActivityType,
  { icon: ElementType; bg: string; color: string; dot: string }
> = {
  new_post: {
    icon: Upload,
    bg: "bg-[oklch(0.95_0.04_195)]",
    color: "text-[oklch(0.48_0.12_195)]",
    dot: "bg-[oklch(0.62_0.13_195)]",
  },
  approved: {
    icon: CheckCircle2,
    bg: "bg-[oklch(0.95_0.06_150)]",
    color: "text-[oklch(0.42_0.15_150)]",
    dot: "bg-[oklch(0.68_0.17_150)]",
  },
  revision_requested: {
    icon: MessageSquare,
    bg: "bg-[oklch(0.96_0.05_70)]",
    color: "text-[oklch(0.52_0.12_70)]",
    dot: "bg-[oklch(0.78_0.16_80)]",
  },
};

export function RecentActivityFeed() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Ultime attività</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Ultimi 7 giorni
        </span>
      </div>

      {/* Feed */}
      <div className="flex-1 py-2">
        {ACTIVITIES.map((item, idx) => {
          const cfg = TYPE_CONFIG[item.type];
          const Icon = cfg.icon;
          const isLast = idx === ACTIVITIES.length - 1;

          return (
            <div
              key={item.id}
              className="group relative flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
            >
              {/* Linea verticale timeline (non sull'ultimo) */}
              {!isLast && (
                <span
                  className="absolute left-[30px] top-[38px] h-[calc(100%-14px)] w-px bg-border"
                  aria-hidden
                />
              )}

              {/* Icona */}
              <div
                className={cn(
                  "relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                  cfg.bg,
                  cfg.color,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              {/* Testo */}
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs leading-snug text-foreground">{item.message}</p>
                <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                  {item.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <button className="flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Clock className="h-3.5 w-3.5" />
          Mostra tutte le attività
        </button>
      </div>
    </div>
  );
}
