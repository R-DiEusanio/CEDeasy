import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Calendar, LayoutGrid, Rss } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/app-store";

export function SmmMobileTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { activeBrandId } = useAppStore();

  const staticItems = [
    { to: "/smm", label: "Feed", icon: Rss, exact: true },
    { to: "/smm/brands", label: "Brand", icon: LayoutGrid },
  ] as const;

  const calendarActive = path.startsWith("/smm/brand/");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-2xl grid-cols-3 px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {staticItems.map((it) => {
          const Icon = it.icon;
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          return (
            <Link
              key={it.label}
              to={it.to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {it.label}
            </Link>
          );
        })}

        {/* Calendario: attivo solo se un brand è già stato selezionato */}
        {activeBrandId ? (
          <Link
            to="/smm/brand/$brandId"
            params={{ brandId: activeBrandId }}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
              calendarActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Calendar className="h-5 w-5" />
            Calendario
          </Link>
        ) : (
          <span
            className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium text-muted-foreground/40 cursor-not-allowed select-none"
            title="Seleziona prima un brand"
          >
            <Calendar className="h-5 w-5" />
            Calendario
          </span>
        )}
      </div>
    </nav>
  );
}

export function ClientMobileTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/client", label: "Da approvare", icon: Bell, exact: true },
    { to: "/client", label: "Approvati", icon: Calendar, exact: true },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto grid max-w-2xl grid-cols-2 px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {items.map((it) => {
          const Icon = it.icon;
          const active = "exact" in it && it.exact ? path === it.to : path.startsWith(it.to);
          return (
            <Link
              key={it.label}
              to={it.to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}