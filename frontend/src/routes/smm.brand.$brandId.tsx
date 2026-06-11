import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { useBrands, usePosts } from "@/lib/queries";
import { getBrandHue, getBrandInitials } from "@/lib/mock-data";
import { BrandMonthCalendar } from "@/components/BrandMonthCalendar";
import { PostCard } from "@/components/PostCard";
import { PostDetailDialog } from "@/components/PostDetailDialog";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, Copy, LayoutList, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/smm/brand/$brandId")({
  component: BrandPage,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <p className="mb-3 text-muted-foreground">Brand non trovato</p>
      <Link to="/smm" className="text-primary underline">Torna alla dashboard</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-destructive">{error.message}</div>
  ),
});

function BrandPage() {
  const { brandId } = Route.useParams();
  const { userId } = useAppStore();
  const { data: brands = [] } = useBrands(userId);
  const { data: posts = [], isLoading } = usePosts(brandId);

  const brand = brands.find((b) => b.id === brandId);
  if (brands.length > 0 && !brand) throw notFound();

  const [view, setView] = useState<"calendar" | "list">(
    typeof window !== "undefined" && window.innerWidth < 1024 ? "list" : "calendar",
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string | undefined>(undefined);

  const openCreate = (iso?: string) => {
    setCreateDate(iso);
    setCreateOpen(true);
  };

  const sortedList = [...posts].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  if (isLoading || !brand) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hue = getBrandHue(brand.id);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex items-center gap-3">
        <Link
          to="/smm"
          className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted lg:hidden"
          aria-label="Torna indietro"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div
          className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-bold text-white"
          style={{
            background: `linear-gradient(135deg, oklch(0.7 0.15 ${hue}), oklch(0.55 0.18 ${hue + 30}))`,
          }}
        >
          {getBrandInitials(brand.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold lg:text-2xl">{brand.name}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {brand.category ? `${brand.category} · ` : ""}{posts.length} contenuti
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => {
            navigator.clipboard.writeText(brandId);
            toast.success("ID brand copiato — incollalo al cliente");
          }}
        >
          <Copy className="h-4 w-4" /> ID cliente
        </Button>
        <Button onClick={() => openCreate()} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" /> Nuova bozza
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-xl border border-border bg-card p-1 text-sm">
          <button
            onClick={() => setView("calendar")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
              view === "calendar"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CalendarDays className="h-4 w-4" /> Calendario
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutList className="h-4 w-4" /> Lista
          </button>
        </div>
        <Button size="sm" onClick={() => openCreate()} className="sm:hidden">
          <Plus className="h-4 w-4" /> Bozza
        </Button>
      </div>

      {view === "calendar" ? (
        <BrandMonthCalendar
          posts={posts}
          onSelectPost={(id) => setSelected(id)}
          onCreateForDate={(iso) => openCreate(iso)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedList.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nessun contenuto. Crea la prima bozza.
            </div>
          ) : (
            sortedList.map((p) => (
              <PostCard key={p.id} post={p} onClick={() => setSelected(p.id)} />
            ))
          )}
        </div>
      )}

      <PostDetailDialog postId={selected} onClose={() => setSelected(null)} brandId={brandId} />
      <CreatePostDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        brandId={brandId}
        initialDate={createDate}
      />
    </div>
  );
}
