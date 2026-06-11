import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/lib/app-store";
import { Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function RoleSwitch() {
  const { role, setRole } = useAppStore();
  const navigate = useNavigate();

  const switchTo = (newRole: "smm" | "client") => {
    setRole(newRole);
    navigate({ to: newRole === "smm" ? "/smm" : "/client" });
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs shadow-[var(--shadow-soft)]">
      <button
        onClick={() => switchTo("smm")}
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
        onClick={() => switchTo("client")}
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