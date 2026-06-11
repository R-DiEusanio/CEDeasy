import { AlertTriangle, Calendar } from "lucide-react";
import type { Post } from "@/lib/mock-data";
import { getPostHue, typeEmoji } from "@/lib/mock-data";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
  });
}

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

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full overflow-hidden rounded-2xl bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]",
        post.hasChangesRequested
          ? "border-2 border-[oklch(0.68_0.2_25)] shadow-[0_0_0_1px_oklch(0.68_0.2_25_/_0.15)]"
          : "border border-border shadow-[var(--shadow-soft)]",
      )}
      style={{ transitionDuration: "200ms" }}
    >
      <div
        className="relative h-28 w-full"
        style={{
          background: post.hasChangesRequested
            ? `linear-gradient(135deg, oklch(0.88 0.08 25), oklch(0.78 0.12 30))`
            : `linear-gradient(135deg, oklch(0.85 0.12 ${hue}), oklch(0.7 0.15 ${hue + 30}))`,
        }}
      >
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          {typeEmoji[post.type]} {post.type}
        </span>
        {post.hasChangesRequested && (
          <span className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[oklch(0.95_0.06_25)] text-[oklch(0.4_0.18_25)] shadow">
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 font-semibold text-foreground">{post.title}</h3>
          <StatusBadge status={post.status} hasChanges={post.hasChangesRequested} />
        </div>
        {!compact && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{post.caption}</p>
        )}
        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(post.date)}
        </div>
      </div>
    </button>
  );
}
