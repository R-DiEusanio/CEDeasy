import { createFileRoute, Link } from "@tanstack/react-router";
import { brands } from "@/lib/mock-data";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/smm/brands")({
  component: BrandsPage,
});

function BrandsPage() {
  const { posts } = useAppStore();
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">I tuoi brand</h1>
      <div className="space-y-3">
        {brands.map((b) => {
          const bp = posts.filter((p) => p.brandId === b.id);
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
                  background: `linear-gradient(135deg, oklch(0.7 0.15 ${b.hue}), oklch(0.55 0.18 ${b.hue + 30}))`,
                }}
              >
                {b.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{b.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {b.category} · {bp.length} contenuti
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}