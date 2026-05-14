import { useAppStore } from "@/lib/app-store";
import { Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function RoleSwitch() {
  const { role, setRole } = useAppStore();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs shadow-[var(--shadow-soft)]">
      <button
        onClick={() => setRole("smm")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors",
          role === "smm"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Briefcase className="h-3.5 w-3.5" /> SMM
      </button>
      <button
        onClick={() => setRole("client")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors",
          role === "client"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <User className="h-3.5 w-3.5" /> Cliente
      </button>
    </div>
  );
}