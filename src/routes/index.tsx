import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Briefcase, Sparkles, User } from "lucide-react";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CedEasy — Approva i tuoi contenuti social, semplice." },
      {
        name: "description",
        content:
          "CedEasy è la piattaforma per Social Media Manager e clienti per gestire bozze, approvazioni e modifiche dei contenuti social.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const { setRole } = useAppStore();
  const navigate = useNavigate();

  const enter = (role: "smm" | "client", path: string) => {
    setRole(role);
    navigate({ to: path });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <header className="flex items-center gap-2">
          <div
            className="grid h-10 w-10 place-items-center rounded-2xl text-primary-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold">CedEasy</div>
            <div className="text-xs text-muted-foreground">Approvazioni social, senza caos</div>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-status-approved" /> Prototipo demo
          </span>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            Bozze, approvazioni e modifiche.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              In un solo posto.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Scegli con quale ruolo vuoi entrare nella demo di CedEasy.
          </p>

          <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
            <button
              onClick={() => enter("smm", "/smm")}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 text-left shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
            >
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl text-primary-foreground"
                style={{ background: "var(--gradient-brand)" }}
              >
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Sono un Social Media Manager</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Gestisci più brand, calendario editoriale, bozze e feedback dei clienti.
                </p>
              </div>
              <span className="mt-2 text-sm font-medium text-primary">Entra come SMM →</span>
            </button>

            <button
              onClick={() => enter("client", "/client")}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 text-left shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-status-approved-soft text-[oklch(0.4_0.14_150)]">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Sono il Cliente / Brand</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Approva i contenuti o richiedi modifiche in pochi tap, anche dal telefono.
                </p>
              </div>
              <span className="mt-2 text-sm font-medium text-primary">Entra come Cliente →</span>
            </button>
          </div>

          <div className="mt-10 flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">
              Accedi
            </Link>
            <span className="h-3 w-px bg-border" />
            <Link to="/register" className="hover:text-foreground">
              Crea un account
            </Link>
            <span className="h-3 w-px bg-border" />
            <Link to="/smm" className="hover:text-foreground">
              Demo SMM
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
