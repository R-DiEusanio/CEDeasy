import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Calendar, LayoutGrid, Rss } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/app-store";

export function SmmMobileTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { activeBrandId } = useAppStore();

  const items = [
    { to: "/smm", label: "Feed", icon: Rss, exact: true },
    { to: "/smm/brands", label: "Brand", icon: LayoutGrid },
    {
      to: "/smm/brand/$brandId",
      params: { brandId: activeBrandId },
      label: "Calendario",
      icon: Calendar,
    },
    { to: "/smm/notifications", label: "Notifiche", icon: Bell },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-2xl grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {items.map((it) => {
          const Icon = it.icon;
          const active =
            "exact" in it && it.exact ? path === it.to : path.startsWith(it.to.split("/$")[0]);
          const props =
            "params" in it
              ? { to: it.to, params: it.params as { brandId: string } }
              : { to: it.to };
          return (
            <Link
              key={it.label}
              {...(props as any)}
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
      </div>
    </nav>
  );
}

export function ClientMobileTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/client", label: "Da approvare", icon: Bell, exact: true },
    { to: "/client/approved", label: "Approvati", icon: Calendar },
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