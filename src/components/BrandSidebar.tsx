import { Link, useRouterState } from "@tanstack/react-router";
import { useAppStore } from "@/lib/app-store";
import { useBrands } from "@/lib/queries";
import { getBrandHue, getBrandInitials } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight, Home, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CreateBrandDialog } from "./CreateBrandDialog";

export function BrandSidebar() {
  const { activeBrandId, setActiveBrandId, userId } = useAppStore();
  const { data: brands = [] } = useBrands(userId);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [createOpen, setCreateOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex shrink-0 flex-col border-r border-border bg-card/60 sticky top-0 h-screen transition-[width] duration-300 ease-in-out",
          collapsed ? "w-[60px]" : "w-72",
        )}
      >
        {/* Logo */}
        <Link
          to="/smm"
          className={cn(
            "flex items-center gap-2 px-4 py-5",
            collapsed && "justify-center px-0",
          )}
        >
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold leading-none">CedEasy</div>
              <div className="mt-0.5 text-xs text-muted-foreground">Workspace SMM</div>
            </div>
          )}
        </Link>

        <div className="mx-3 mb-2 h-px bg-border" />

        {/* Nav */}
        <nav className="mb-4 space-y-1 px-2">
          <Link
            to="/smm"
            className={cn(
              "flex items-center rounded-xl py-2 text-sm font-medium transition-colors",
              path === "/smm"
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed ? "justify-center px-2" : "gap-3 px-3",
            )}
            title={collapsed ? "Dashboard" : undefined}
          >
            <Home className="h-4 w-4 shrink-0" />
            {!collapsed && "Dashboard"}
          </Link>
        </nav>

        {/* Brands header */}
        <div
          className={cn(
            "mb-2 flex items-center px-3",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Clienti
            </span>
          )}
          <button
            onClick={() => setCreateOpen(true)}
            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Nuovo cliente"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Brand list */}
        <div className="flex-1 space-y-1 overflow-y-auto px-2">
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
                  "flex items-center rounded-xl px-2 py-2 text-sm transition-colors",
                  active && path.includes("/brand")
                    ? "bg-primary-soft text-foreground"
                    : "text-foreground hover:bg-muted",
                  collapsed ? "justify-center" : "gap-3",
                )}
                title={collapsed ? b.name : undefined}
              >
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.7 0.15 ${hue}), oklch(0.55 0.18 ${hue + 30}))`,
                  }}
                >
                  {getBrandInitials(b.name)}
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{b.name}</div>
                    {b.category && (
                      <div className="truncate text-xs text-muted-foreground">{b.category}</div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Collapse toggle */}
        <div className="border-t border-border p-2">
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className={cn(
              "flex w-full items-center rounded-xl p-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed ? "justify-center" : "gap-2",
            )}
            aria-label={collapsed ? "Espandi sidebar" : "Comprimi sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Comprimi</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <CreateBrandDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
