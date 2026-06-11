import { AlertTriangle, Calendar } from "lucide-react";
import type { Post } from "@/lib/mock-data";
import { getPostHue, typeEmoji } from "@/lib/mock-data";
import { StatusBadge } from "./StatusBadge";
import { getVisualStatus, type VisualStatus } from "@/lib/status-config";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
  });
}

// Usa le CSS custom properties del design system per i bordi delle kanban card
const ACCENT_BORDER_COLOR: Record<VisualStatus, string> = {
  draft: "var(--color-status-draft)",
  pending: "var(--color-status-pending)",
  changes_requested: "var(--color-status-changes)",
  approved: "var(--color-status-approved)",
};

export function PostCard({
  post,
  onClick,
  compact,
}: {
  post: Post;
  onClick?: () => void;
  compact?: boolean;
}) {
  const hue = getPostHue(post.type);
  const visualStatus = getVisualStatus(post.status, post.hasChangesRequested);

  // Compact: card orizzontale con bordo sinistro colorato — usata nelle colonne Kanban
  if (compact) {
    return (
      <button
        onClick={onClick}
        className="group w-full rounded-xl border border-border bg-card px-3 py-2.5 text-left shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-elevated)]"
        style={{
          borderLeftWidth: "4px",
          borderLeftColor: ACCENT_BORDER_COLOR[visualStatus],
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-base leading-none">{typeEmoji[post.type]}</span>
          <StatusBadge
            status={post.status}
            hasChanges={post.hasChangesRequested}
            className="shrink-0"
          />
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-xs font-semibold leading-tight text-foreground">
          {post.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(post.date)}
        </div>
      </button>
    );
  }

  // Full card: thumbnail quadrata + badge + titolo + data
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full overflow-hidden rounded-2xl bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]",
        post.hasChangesRequested
          ? "border-2 border-rose-400 shadow-[var(--shadow-soft)]"
          : "border border-border shadow-[var(--shadow-soft)]",
      )}
      style={{ transitionDuration: "200ms" }}
    >
      {/* Thumbnail quadrata */}
      <div
        className="relative aspect-square w-full"
        style={{
          background: post.hasChangesRequested
            ? `linear-gradient(135deg, oklch(0.88 0.08 25), oklch(0.78 0.12 30))`
            : `linear-gradient(135deg, oklch(0.85 0.12 ${hue}), oklch(0.7 0.15 ${hue + 30}))`,
        }}
      >
        {/* Icona changes — top left */}
        {post.hasChangesRequested && (
          <span className="absolute left-2.5 top-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600 shadow-sm">
            <AlertTriangle className="h-3 w-3" />
          </span>
        )}
        {/* Icona formato — top right */}
        <span className="absolute right-2.5 top-2.5 rounded-full bg-card/90 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur">
          {typeEmoji[post.type]} {post.type}
        </span>
      </div>

      {/* Body */}
      <div className="space-y-1.5 p-3">
        <StatusBadge status={post.status} hasChanges={post.hasChangesRequested} />
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{post.title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(post.date)}
        </div>
      </div>
    </button>
  );
}
