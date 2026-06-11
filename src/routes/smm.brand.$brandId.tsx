import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { useBrands, usePosts } from "@/lib/queries";
import { getBrandHue, getBrandInitials, type Post } from "@/lib/mock-data";
import { BrandMonthCalendar } from "@/components/BrandMonthCalendar";
import { PostCard } from "@/components/PostCard";
import { PostDetailDialog } from "@/components/PostDetailDialog";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, Copy, Kanban, LayoutList, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/smm/brand/$brandId")({
  component: BrandPage,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <p className="mb-3 text-muted-foreground">Brand non trovato</p>
      <Link to="/smm" className="text-primary underline">
        Torna alla dashboard
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-destructive">{error.message}</div>
  ),
});

type ViewMode = "calendar" | "kanban" | "list";

function BrandPage() {
  const { brandId } = Route.useParams();
  const { userId } = useAppStore();
  const { data: brands = [] } = useBrands(userId);
  const { data: posts = [], isLoading } = usePosts(brandId);

  const brand = brands.find((b) => b.id === brandId);
  if (brands.length > 0 && !brand) throw notFound();

  const [view, setView] = useState<ViewMode>(
    typeof window !== "undefined" && window.innerWidth < 1024 ? "list" : "kanban",
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string | undefined>(undefined);

  const openCreate = (iso?: string) => {
    setCreateDate(iso);
    setCreateOpen(true);
  };

  const sortedList = [...posts].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const kanbanColumns: {
    id: string;
    label: string;
    headerClass: string;
    dotClass: string;
    posts: Post[];
  }[] = [
    {
      id: "draft",
      label: "Bozze",
      headerClass: "border-slate-200 bg-slate-50",
      dotClass: "bg-slate-400",
      posts: sortedList.filter((p) => p.status === "draft" && !p.hasChangesRequested),
    },
    {
      id: "pending",
      label: "Inviati",
      headerClass: "border-amber-200 bg-amber-50",
      dotClass: "bg-amber-500",
      posts: sortedList.filter((p) => p.status === "pending"),
    },
    {
      id: "changes",
      label: "Da Modificare",
      headerClass: "border-rose-200 bg-rose-50",
      dotClass: "bg-rose-500",
      posts: sortedList.filter((p) => p.hasChangesRequested),
    },
    {
      id: "approved",
      label: "Approvati",
      headerClass: "border-emerald-200 bg-emerald-50",
      dotClass: "bg-emerald-500",
      posts: sortedList.filter((p) => p.status === "approved"),
    },
  ];

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
      {/* Brand header */}
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
            {brand.category ? `${brand.category} · ` : ""}
            {posts.length} contenuti
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

      {/* View toggle + mobile CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-card p-1 text-sm">
          {(
            [
              { id: "calendar", label: "Calendario", Icon: CalendarDays },
              { id: "kanban", label: "Kanban", Icon: Kanban },
              { id: "list", label: "Lista", Icon: LayoutList },
            ] as { id: ViewMode; label: string; Icon: React.ComponentType<{ className?: string }> }[]
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
                view === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => openCreate()} className="sm:hidden">
          <Plus className="h-4 w-4" /> Bozza
        </Button>
      </div>

      {/* Views */}
      {view === "calendar" && (
        <BrandMonthCalendar
          posts={posts}
          onSelectPost={(id) => setSelected(id)}
          onCreateForDate={(iso) => openCreate(iso)}
        />
      )}

      {view === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-3 lg:min-w-0">
            {kanbanColumns.map((col) => (
              <div key={col.id} className="w-72 shrink-0 lg:w-auto lg:flex-1">
                {/* Column header */}
                <div
                  className={cn(
                    "mb-3 flex items-center gap-2 rounded-xl border px-3 py-2",
                    col.headerClass,
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", col.dotClass)} />
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold tabular-nums">
                    {col.posts.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="min-h-28 space-y-2 rounded-xl bg-muted/40 p-2">
                  {col.posts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Nessun post
                    </div>
                  ) : (
                    col.posts.map((p) => (
                      <PostCard key={p.id} post={p} onClick={() => setSelected(p.id)} compact />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "list" && (
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
