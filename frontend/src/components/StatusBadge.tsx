import { Pencil } from "lucide-react";
import type { PostStatus } from "@/lib/mock-data";
import { statusLabel } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const styles: Record<PostStatus, string> = {
  draft: "bg-status-draft-soft text-status-draft",
  pending: "bg-status-pending-soft text-[oklch(0.45_0.13_70)]",
  approved: "bg-status-approved-soft text-[oklch(0.4_0.14_150)]",
};

export function StatusDot({ status }: { status: PostStatus }) {
  const colors: Record<PostStatus, string> = {
    draft: "bg-status-draft",
    pending: "bg-status-pending",
    approved: "bg-status-approved",
  };
  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full", colors[status])} />;
}

export function StatusBadge({
  status,
  hasChanges,
  className,
}: {
  status: PostStatus;
  hasChanges?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        styles[status],
        className,
      )}
    >
      <StatusDot status={status} />
      {statusLabel[status]}
      {hasChanges && <Pencil className="ml-1 h-3 w-3" />}
    </span>
  );
}