import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore } from "@/lib/app-store";
import { useBrands } from "@/lib/queries";
import { getBrandHue, getBrandInitials } from "@/lib/mock-data";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/smm/brands")({
  component: BrandsPage,
});

function BrandsPage() {
  const { userId } = useAppStore();
  const { data: brands = [], isLoading } = useBrands(userId);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">I tuoi brand</h1>
      <div className="space-y-3">
        {brands.length === 0 && (
          <p className="text-sm text-muted-foreground">Nessun brand ancora. Creane uno dalla dashboard.</p>
        )}
        {brands.map((b) => {
          const hue = getBrandHue(b.id);
          return (
            <Link
              key={b.id}
              to="/smm/brand/$brandId"
              params={{ brandId: b.id }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]"
            >
              <div
                className="grid h-12 w-12 place-items-center rounded-xl text-sm font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, oklch(0.7 0.15 ${hue}), oklch(0.55 0.18 ${hue + 30}))`,
                }}
              >
                {getBrandInitials(b.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{b.name}</div>
                {b.category && (
                  <div className="truncate text-xs text-muted-foreground">{b.category}</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
