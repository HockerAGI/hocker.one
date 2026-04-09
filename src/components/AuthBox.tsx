"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";

type AuthBoxProps = {
  fixedEmail: string;
  fixedPassword: string;
  className?: string;
};

export default function AuthBox({
  fixedEmail,
  fixedPassword,
  className = "",
}: AuthBoxProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: fixedEmail,
        password: fixedPassword,
      });

      if (authError) throw authError;

      toast.success("Acceso concedido.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Acceso rechazado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={`relative w-full max-w-[34rem] overflow-hidden rounded-[36px] border border-white/5 bg-slate-950/82 p-5 shadow-[0_30px_120px_rgba(2,6,23,0.5)] backdrop-blur-3xl sm:p-7 ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />
      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-sky-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Cuenta lista
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
            Sesión privada
          </span>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-300">
            Entrada segura
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Inicia sesión
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            El acceso queda resuelto sin mostrar credenciales en pantalla.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/15 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input type="hidden" name="email" value={fixedEmail} />
          <input type="hidden" name="password" value={fixedPassword} />

          <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/60">
                <Sparkles className="h-5 w-5 text-sky-300" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                  Inicio cinematográfico
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Logo grande, panel limpio, una sola acción.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="hocker-button-brand w-full justify-center py-4 text-[10px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando
              </>
            ) : (
              "Entrar ahora"
            )}
          </button>
        </form>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
            Acceso privado
          </p>
          <a
            href="/"
            className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-300 transition hover:text-sky-200"
          >
            Volver
          </a>
        </div>
      </div>
    </section>
  );
}