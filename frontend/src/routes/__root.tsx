import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";

import "./../styles.css"; // Import diretto del CSS
import { AppStoreProvider } from "@/lib/app-store";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppStoreProvider>
        {/* Outlet è il punto dove vengono renderizzate le tue pagine (Login, SMM, ecc.) */}
        <Outlet />
        <Toaster position="top-center" />
      </AppStoreProvider>
    </QueryClientProvider>
  );
}