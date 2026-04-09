"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import BrandMark from "@/components/BrandMark";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";

type Mode = "password" | "magic_link";

export default function AuthBox() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && (mode === "magic_link" || password.trim().length >= 6);
  }, [email, password, mode]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);

    try {
      if (mode === "password") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        toast.success("Acceso concedido.");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) throw error;

      toast.success("Enlace enviado. Revisa tu correo.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/5 bg-slate-950/75 p-5 shadow-[0_24px_120px_rgba(2,6,23,0.45)] backdrop-blur-3xl sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_32%)]" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <BrandMark compact className="px-0 py-0 shadow-none" />
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
            Acceso seguro
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white font-display">
            Entra al control central
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            Una sola sesión para operar, revisar y mover el ecosistema sin ruido.
          </p>
        </div>

        <div className="hidden rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-emerald-300 sm:inline-flex">
          Live
        </div>
      </div>

      <form className="relative mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/5 bg-white/[0.03] p-1">
          <button
            type="button"
            aria-pressed={mode === "password"}
            onClick={() => setMode("password")}
            className={`rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
              mode === "password"
                ? "bg-sky-500 text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.18)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Contraseña
          </button>

          <button
            type="button"
            aria-pressed={mode === "magic_link"}
            onClick={() => setMode("magic_link")}
            className={`rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
              mode === "magic_link"
                ? "bg-sky-500 text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.18)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Enlace rápido
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Correo
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
            className="hocker-input"
          />
        </div>

        {mode === "password" ? (
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Contraseña
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="hocker-input"
            />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="hocker-button-brand w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Procesando..." : mode === "password" ? "Iniciar sesión" : "Enviar enlace"}
        </button>

        <div className="flex flex-wrap gap-2 pt-1">
          <span className="hocker-chip">Acceso privado</span>
          <span className="hocker-chip">Sesión segura</span>
          <span className="hocker-chip">Interfaz premium</span>
        </div>
      </form>
    </section>
  );
}