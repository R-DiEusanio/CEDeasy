import { Link, useRouterState } from "@tanstack/react-router";
import { useAppStore } from "@/lib/app-store";
import { useBrands } from "@/lib/queries";
import { getBrandHue, getBrandInitials } from "@/lib/mock-data";
import { Bell, Home, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandSidebar() {
  const { activeBrandId, setActiveBrandId, userId } = useAppStore();
  const { data: brands = [] } = useBrands(userId);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/60 p-4 lg:flex">
      <Link to="/smm" className="mb-6 flex items-center gap-2 px-2">
        <div
          className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold">CedEasy</div>
          <div className="text-xs text-muted-foreground">Workspace SMM</div>
        </div>
      </Link>

      <nav className="mb-6 space-y-1">
        <Link
          to="/smm"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            path === "/smm"
              ? "bg-primary-soft text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Home className="h-4 w-4" /> Dashboard
        </Link>
        <Link
          to="/smm/notifications"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            path === "/smm/notifications"
              ? "bg-primary-soft text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Bell className="h-4 w-4" /> Notifiche
        </Link>
      </nav>

      <div className="mb-2 flex items-center justify-between px-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Clienti
        </span>
        <button className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-1 overflow-y-auto pr-1">
        {brands.map((b) => {
          const hue = getBrandHue(b.id);
          const active = path.includes(`/smm/brand/${b.id}`) || activeBrandId === b.id;
          return (
            <Link
              key={b.id}
              to="/smm/brand/$brandId"
              params={{ brandId: b.id }}
              onClick={() => setActiveBrandId(b.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors",
                active && path.includes("/brand")
                  ? "bg-primary-soft text-foreground"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, oklch(0.7 0.15 ${hue}), oklch(0.55 0.18 ${hue + 30}))`,
                }}
              >
                {getBrandInitials(b.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{b.name}</div>
                {b.category && (
                  <div className="truncate text-xs text-muted-foreground">{b.category}</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
