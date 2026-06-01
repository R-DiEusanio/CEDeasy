import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/app-store";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import type { ProfileDTO } from "@/lib/mock-data";

const schema = z.object({
  email: z.string().trim().email({ message: "Inserisci un'email valida" }).max(255),
  password: z.string().min(6, { message: "Almeno 6 caratteri" }).max(128),
});

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Accedi — CedEasy" },
      { name: "description", content: "Entra in CedEasy per gestire bozze e approvazioni social." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setRole } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 1. Validazione estetica dei campi
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({ email: f.email?.[0], password: f.password?.[0] });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // 2. LOGICA DI AUTENTICAZIONE DIRETTA CON SUPABASE
      // Questo controlla se l'utente esiste e se la password è corretta
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Se Supabase restituisce un errore (account inesistente o pass errata)
        toast.error("Accesso negato: credenziali non valide.");
        setLoading(false);
        return;
      }

      if (data.session) {
        // Legge il profilo per sapere il ruolo e fare redirect corretto
        let destination: "/smm" | "/client" = "/smm";
        try {
          const profile = await api.get<ProfileDTO>("/api/profiles/me");
          destination = profile.role === "CLIENT" ? "/client" : "/smm";
          setRole(profile.role === "CLIENT" ? "client" : "smm");
        } catch {
          // Profilo non ancora creato → crea come SMM di default
          await api.post("/api/profiles", {
            fullName: data.session.user.user_metadata?.full_name ?? email,
            role: "SMM",
          }).catch(() => {});
          setRole("smm");
        }

        toast.success("Bentornato su CedEasy");
        navigate({ to: destination });
      }

    } catch (error) {
      toast.error("Errore di connessione. Riprova più tardi.");
      console.error("Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Accedi al tuo account"
      subtitle="Gestisci brand, bozze e approvazioni in un'unica dashboard."
      badge="Login"
      footer={
        <>
          Non hai ancora un account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Registrati
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nome@brand.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 pl-9"
            />
          </div>
          {errors.email && <p className="text-xs font-medium text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground">
              Password dimenticata?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pl-9 pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Nascondi password" : "Mostra password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-medium text-destructive">{errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full text-base font-semibold text-primary-foreground shadow-[var(--shadow-soft)]"
          style={{ background: "var(--gradient-brand)" }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Accesso in corso…
            </>
          ) : (
            "Accedi"
          )}
        </Button>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          Continuando accetti i Termini e la Privacy Policy di CedEasy.
        </p>
      </form>
    </AuthShell>
  );
}