"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import BrandMark from "@/components/BrandMark";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";

type AuthBoxProps = {
  fixedEmail?: string;
  fixedPassword?: string;
};

export default function AuthBox({
  fixedEmail = "",
  fixedPassword = "",
}: AuthBoxProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const loginEmail = email.trim() || fixedEmail.trim();
    const loginPassword = password || fixedPassword;

    if (!loginEmail || !loginPassword) {
      setError("Faltan credenciales.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
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
    <section className="relative w-full max-w-md overflow-hidden rounded-[34px] border border-white/5 bg-slate-950/82 p-5 shadow-[0_24px_100px_rgba(2,6,23,0.45)] backdrop-blur-3xl sm:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.10),transparent_36%)]" />
      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <BrandMark compact showWordmark={false} />
          <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-sky-300">
            Seguro
          </span>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-300">
            Acceder
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Tu entrada al panel central.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/15 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-correo@dominio.com"
              className="w-full rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-sky-400/30 focus:bg-white/[0.05]"
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
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-sky-400/30 focus:bg-white/[0.05]"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="hocker-button-brand w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
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