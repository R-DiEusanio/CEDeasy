import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  badge?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, badge, children, footer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-brand)" }}
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-2 self-start">
          <div
            className="grid h-10 w-10 place-items-center rounded-2xl text-primary-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold leading-tight">CedEasy</div>
            <div className="text-xs text-muted-foreground">Approvazioni social, senza caos</div>
          </div>
        </Link>

        <main className="flex flex-1 flex-col justify-center py-10">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)] sm:p-8">
            {badge && (
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-status-approved" />
                {badge}
              </span>
            )}
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          {footer && (
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          )}
        </main>
      </div>
    </div>
  );
}