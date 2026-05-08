import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BrandSidebar } from "@/components/BrandSidebar";
import { SmmMobileTabBar } from "@/components/MobileTabBar";
import { RoleSwitch } from "@/components/RoleSwitch";

export const Route = createFileRoute("/smm")({
  component: SmmLayout,
});

function SmmLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <BrandSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div
              className="grid h-8 w-8 place-items-center rounded-xl text-primary-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              <span className="text-sm font-bold">C</span>
            </div>
            <span className="text-sm font-bold">CedEasy</span>
          </div>
          <div className="hidden text-sm text-muted-foreground lg:block">Workspace</div>
          <RoleSwitch />
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <SmmMobileTabBar />
    </div>
  );
}