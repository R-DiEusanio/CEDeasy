import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Briefcase } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAppStore, type Role } from "@/lib/app-store";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, { message: "Inserisci il tuo nome" }).max(80),
  email: z.string().trim().email({ message: "Inserisci un'email valida" }).max(255),
  password: z.string().min(8, { message: "Almeno 8 caratteri" }).max(128),
});

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Crea il tuo account — CedEasy" },
      { name: "description", content: "Registrati su CedEasy e inizia a gestire le approvazioni social." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { setRole } = useAppStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setLocalRole] = useState<Role>("smm");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // 1. Validazione
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({ name: f.name?.[0], email: f.email?.[0], password: f.password?.[0] });
      return;
    }
    
    setErrors({});
    setLoading(true);

    try {
      // 2. REGISTRAZIONE SU SUPABASE
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Passiamo nome e ruolo come metadati
          data: {
            full_name: name,
            role: role === "smm" ? "SMM" : "CLIENTE",
          },
        },
      });

      if (error) {
        toast.error("Errore durante la registrazione: " + error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Se abbiamo già una sessione (email confirmation disabilitata), creiamo subito il profilo
        if (data.session) {
          await api.post("/api/profiles", {
            fullName: name,
            role: role === "smm" ? "SMM" : "CLIENT",
          }).catch(() => { /* il profilo verrà creato al prossimo login */ });
        }
        toast.success("Account creato con successo!");
        toast.info("Ora puoi effettuare l'accesso.");
        navigate({ to: "/login" });
      }

    } catch (err) {
      toast.error("Errore imprevisto.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Crea il tuo account"
      subtitle="Pochi secondi per iniziare a usare CedEasy."
      badge="Registrazione"
      footer={
        <>
          Hai già un account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Accedi
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label>Tipo di account</Label>
          <div className="grid grid-cols-2 gap-2">
            <RoleCard
              active={role === "smm"}
              onClick={() => setLocalRole("smm")}
              icon={<Briefcase className="h-4 w-4" />}
              title="SMM"
              desc="Gestisco brand"
            />
            <RoleCard
              active={role === "client"}
              onClick={() => setLocalRole("client")}
              icon={<User className="h-4 w-4" />}
              title="Cliente"
              desc="Approvo contenuti"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Mario Rossi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 pl-9"
            />
          </div>
          {errors.name && <p className="text-xs font-medium text-destructive">{errors.name}</p>}
        </div>

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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Minimo 8 caratteri"
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
              <Loader2 className="h-4 w-4 animate-spin" /> Creazione account…
            </>
          ) : (
            "Crea account"
          )}
        </Button>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          Registrandoti accetti i Termini e la Privacy Policy di CedEasy.
        </p>
      </form>
    </AuthShell>
  );
}

// Funzione RoleCard (rimane uguale)
function RoleCard({ active, onClick, icon, title, desc }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
        active
          ? "border-primary bg-primary-soft shadow-[var(--shadow-soft)]"
          : "border-border bg-background hover:border-foreground/20",
      )}
    >
      <div
        className={cn(
          "grid h-8 w-8 place-items-center rounded-lg",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {icon}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-[11px] text-muted-foreground">{desc}</div>
    </button>
  );
}