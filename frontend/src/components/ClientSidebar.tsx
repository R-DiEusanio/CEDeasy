import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientPosts } from "@/lib/queries";

export function ClientSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { data: posts = [] } = useClientPosts();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const pendingCount = posts.filter((p) => p.status === "pending").length;
  const approvedCount = posts.filter((p) => p.status === "approved").length;

  const isActive = path === "/client" || path === "/client/";

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col border-r border-border bg-card/60 transition-[width] duration-300 ease-in-out sticky top-[57px] h-[calc(100vh-57px)]",
        collapsed ? "w-14" : "w-64",
      )}
    >
      {/* Logo */}
      <Link
        to="/client"
        className={cn(
          "flex items-center gap-2.5 p-4 pb-3 transition-all",
          collapsed && "justify-center px-0",
        )}
      >
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-primary-foreground"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Sparkles className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold leading-none">CedEasy</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              Area Cliente
            </div>
          </div>
        )}
      </Link>

      {/* Divider */}
      <div className="mx-3 mb-2 h-px bg-border" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-2">
        <Link
          to="/client"
          className={cn(
            "flex items-center rounded-xl py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary-soft text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed ? "justify-center px-2" : "gap-3 px-3",
          )}
          title={collapsed ? "Dashboard" : undefined}
        >
          <Home className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>
      </nav>

      {/* Stats summary — solo quando espansa */}
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-xl border border-border bg-background/60 p-3">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Riepilogo
          </span>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[oklch(0.65_0.13_70)]" />
              <span className="text-muted-foreground">Da approvare</span>
              <span className="ml-auto font-semibold tabular-nums">
                {pendingCount}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[oklch(0.5_0.14_150)]" />
              <span className="text-muted-foreground">Approvati</span>
              <span className="ml-auto font-semibold tabular-nums">
                {approvedCount}
              </span>
            </div>
          </div>
        </div>
      )}

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
  );
}
