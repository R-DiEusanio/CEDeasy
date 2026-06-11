import { cn } from "@/lib/utils";

export function PostSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {/* Header — replica l'area gradiente della PostClientCard */}
      <div className="relative h-24 w-full bg-muted sm:h-28">
        <div className="absolute left-3 top-3 h-5 w-14 rounded-full bg-muted-foreground/10" />
        <div className="absolute right-3 top-3 h-5 w-20 rounded-full bg-muted-foreground/10" />
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        {/* Titolo */}
        <div className="h-4 w-3/4 rounded-lg bg-muted" />

        {/* Caption — 3 righe con lunghezze decrescenti */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded-md bg-muted" />
          <div className="h-3 w-5/6 rounded-md bg-muted" />
          <div className="h-3 w-2/3 rounded-md bg-muted" />
        </div>

        {/* Data */}
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 rounded bg-muted" />
          <div className="h-3 w-36 rounded-md bg-muted" />
        </div>

        {/* Pulsanti azione */}
        <div className="flex gap-2 pt-1">
          <div className="h-10 flex-1 rounded-xl bg-muted" />
          <div className="h-10 flex-1 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

/** Griglia di N skeleton — stessa struttura del grid layout della vista lista. */
export function PostSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-8">
      {/* Fake section header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded-lg bg-muted" />
          <div className="ml-auto h-5 w-7 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
