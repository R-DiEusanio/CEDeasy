import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/lib/app-store";
import { BrandMonthCalendar } from "@/components/BrandMonthCalendar";
import { PostCard } from "@/components/PostCard";
import { PostDetailDialog } from "@/components/PostDetailDialog";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, LayoutList, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/smm/brand/$brandId")({
  component: BrandPage,
});

// Helper per generare iniziali e colore (stessa logica della sidebar)
const getBrandUI = (name: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return { initials, hue };
};

function BrandPage() {
  const { brandId } = Route.useParams();
  const { posts, setActiveBrandId } = useAppStore();
  
  // STATO LOCALE PER IL BRAND (visto che dobbiamo caricarlo dal backend)
  const [brand, setBrand] = useState<{id: string, name: string, category?: string} | null>(null);
  const [loading, setLoading] = useState(true);

  // Carichiamo i dettagli del brand dal backend
  useEffect(() => {
    setActiveBrandId(brandId); // Comunichiamo allo store che questo è il brand attivo
    
    fetch(`http://localhost:8080/api/brands/${brandId}`)
      .then(res => res.json())
      .then(data => {
        setBrand(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [brandId, setActiveBrandId]);

  const brandPosts = useMemo(
    () => posts.filter((p) => p.brandId === brandId),
    [posts, brandId],
  );

  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [selected, setSelected] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string | undefined>(undefined);

  if (loading) return <div className="p-10 text-center">Caricamento brand...</div>;
  if (!brand) return <div className="p-10 text-center">Brand non trovato</div>;

  const { initials, hue } = getBrandUI(brand.name);

  const sortedList = [...brandPosts].sort(
    (a, b) => +new Date(a.date) - +new Date(b.date),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex items-center gap-3">
        <Link to="/smm" className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground lg:hidden">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div
          className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, oklch(0.7 0.15 ${hue}), oklch(0.55 0.18 ${hue + 30}))` }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold lg:text-2xl">{brand.name}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {brand.category || "Social Media"} · {brandPosts.length} contenuti
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" /> Nuova bozza
        </Button>
      </div>

      {/* ... resto del JSX rimane uguale ... */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-xl border border-border bg-card p-1 text-sm">
          <button onClick={() => setView("calendar")} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors", view === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            <CalendarDays className="h-4 w-4" /> Calendario
          </button>
          <button onClick={() => setView("list")} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            <LayoutList className="h-4 w-4" /> Lista
          </button>
        </div>
      </div>

      {view === "calendar" ? (
        <BrandMonthCalendar posts={brandPosts} onSelectPost={setSelected} onCreateForDate={(iso) => { setCreateDate(iso); setCreateOpen(true); }} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedList.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Nessun contenuto.</div>
          ) : (
            sortedList.map((p) => <PostCard key={p.id} post={p} onClick={() => setSelected(p.id)} />)
          )}
        </div>
      )}

      <PostDetailDialog postId={selected} onClose={() => setSelected(null)} />
      <CreatePostDialog open={createOpen} onOpenChange={setCreateOpen} brandId={brandId} initialDate={createDate} />
    </div>
  );
}