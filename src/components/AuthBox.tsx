"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import BrandMark from "@/components/BrandMark";
import { getErrorMessage } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type AuthMode = "signIn" | "signUp";

export default function AuthBox() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6;
  }, [email, password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);

    try {
      const supabase = createBrowserSupabase();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/dashboard`
          : undefined;

      if (mode === "signIn") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        toast.success("Sesión iniciada.");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: displayName.trim() ? { name: displayName.trim() } : undefined,
        },
      });

      if (error) throw error;

      toast.success("Cuenta creada. Revisa tu correo si la confirmación está activa.");
      setMode("signIn");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-[30px] border border-white/5 bg-slate-950/80 p-5 shadow-[0_24px_120px_rgba(2,6,23,0.45)] backdrop-blur-3xl sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <BrandMark compact />
        <button
          type="button"
          aria-pressed={mode === "signUp"}
          onClick={() => setMode((current) => (current === "signIn" ? "signUp" : "signIn"))}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 transition-all hover:bg-white/[0.06]"
        >
          {mode === "signIn" ? "Registro" : "Login"}
        </button>
      </div>

      <div className="mb-5">
        <h2 className="text-xl font-black tracking-tight text-white">
          {mode === "signIn" ? "Entrar" : "Crear cuenta"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Acceso al control central del ecosistema.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signUp" ? (
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Nombre
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Armando / Equipo"
              className="w-full rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-sky-400/30"
              autoComplete="name"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Correo
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contacto@hockerads.com"
            className="w-full rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-sky-400/30"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-sky-400/30"
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="hocker-button-brand w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Procesando..." : mode === "signIn" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>
    </section>
  );
}