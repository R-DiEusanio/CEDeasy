import { AlertTriangle, Check, Clock, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PostStatus } from "./mock-data";

export type VisualStatus = "draft" | "pending" | "changes_requested" | "approved";

export interface StatusConfig {
  label: string;
  Icon: LucideIcon;
  dotClass: string;
  badgeClass: string;
}

export const STATUS_CONFIG: Record<VisualStatus, StatusConfig> = {
  draft: {
    label: "Bozza privata",
    Icon: FileText,
    dotClass: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-600",
  },
  pending: {
    label: "In approvazione",
    Icon: Clock,
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700",
  },
  changes_requested: {
    label: "Modifica richiesta",
    Icon: AlertTriangle,
    dotClass: "bg-rose-500",
    badgeClass: "bg-rose-50 text-rose-700",
  },
  approved: {
    label: "Approvato",
    Icon: Check,
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
};

export function getVisualStatus(status: PostStatus, hasChanges?: boolean): VisualStatus {
  if (hasChanges && status === "draft") return "changes_requested";
  return status;
}
