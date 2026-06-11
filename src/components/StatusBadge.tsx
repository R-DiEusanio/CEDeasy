import { cn } from "@/lib/utils";
import type { PostStatus } from "@/lib/mock-data";
import { STATUS_CONFIG, getVisualStatus } from "@/lib/status-config";

export function StatusDot({
  status,
  hasChanges,
}: {
  status: PostStatus;
  hasChanges?: boolean;
}) {
  const { dotClass } = STATUS_CONFIG[getVisualStatus(status, hasChanges)];
  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full", dotClass)} />;
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
  const { label, Icon, badgeClass } = STATUS_CONFIG[getVisualStatus(status, hasChanges)];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        badgeClass,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
