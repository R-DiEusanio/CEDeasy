import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { BrandSidebar } from "@/components/BrandSidebar";
import { SmmMobileTabBar } from "@/components/MobileTabBar";
import { Search, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/smm")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: SmmLayout,
});

function SmmLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Disconnesso");
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <BrandSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:px-6">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <div
              className="grid h-8 w-8 place-items-center rounded-xl text-primary-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              <span className="text-sm font-bold">C</span>
            </div>
            <span className="text-sm font-bold">CedEasy</span>
          </div>

          {/* Search — solo desktop */}
          <div className="relative hidden flex-1 max-w-sm lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cerca post, brand…"
              className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="ml-auto">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Esci
            </button>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <SmmMobileTabBar />
    </div>
  );
}
