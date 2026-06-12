import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LayoutGrid, Rss } from "lucide-react";
import { cn } from "@/lib/utils";

export function SmmMobileTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  const staticItems = [
    { to: "/smm", label: "Feed", icon: Rss, exact: true },
    { to: "/smm/brands", label: "Clienti", icon: LayoutGrid },
    { to: "/smm/notifications", label: "Notifiche", icon: Bell, disabled: true },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-2xl grid-cols-3 px-2 pt-1 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {staticItems.map((it) => {
          const Icon = it.icon;
          const active = !it.disabled && (it.exact ? path === it.to : path.startsWith(it.to));
          if (it.disabled) {
            return (
              <div
                key={it.label}
                className="flex flex-col items-center gap-0.5 py-1.5 opacity-40 cursor-not-allowed"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium leading-none text-muted-foreground">
                  {it.label}
                </span>
              </div>
            );
          }
          return (
            <Link
              key={it.label}
              to={it.to}
              className="flex flex-col items-center gap-0.5 py-1.5 transition-colors"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {it.label}
              </span>
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
    { to: "/client/approved", label: "Approvati", icon: Calendar, exact: true },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-2xl grid-cols-2 px-2 pt-1 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {items.map((it) => {
          const Icon = it.icon;
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          return (
            <Link
              key={it.label}
              to={it.to}
              className="flex flex-col items-center gap-0.5 py-1.5 transition-colors"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
