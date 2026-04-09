"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";
import BrandMark from "@/components/BrandMark";

type AuthMode = "password" | "magic_link";

export default function AuthBox() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("password");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setUserEmail(data.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password.trim() || loading) return;

    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;
      setSent(false);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Acceso rechazado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setError(null);
    setLoading(true);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });

      if (authError) throw authError;
      setSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "No se pudo enviar el enlace.");
    } finally {
      setLoading(false);
    }
  }

  if (userEmail) {
    return (
      <section className="relative w-full overflow-hidden rounded-[32px] border border-white/5 bg-slate-950/80 p-5 shadow-[0_24px_100px_rgba(2,6,23,0.42)] backdrop-blur-3xl sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.10),transparent_36%)]" />
        <div className="relative flex flex-col gap-5">
          <BrandMark hero className="w-fit scale-[1.02]" />

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
              Sesión activa
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Bienvenido de vuelta
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {userEmail}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                Estado
              </p>
              <p className="mt-2 text-sm font-bold text-white">Listo</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                Acceso
              </p>
              <p className="mt-2 text-sm font-bold text-white">Privado</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="hocker-button-brand flex-1">
              Entrar al panel
            </Link>
            <Link href="/signout" className="hocker-button-primary flex-1">
              Salir
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden rounded-[32px] border border-white/5 bg-slate-950/80 p-5 shadow-[0_24px_100px_rgba(2,6,23,0.42)] backdrop-blur-3xl sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_40%)]" />
      <div className="relative flex flex-col gap-5">
        <BrandMark hero className="w-fit scale-[1.02]" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
              Acceso seguro
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Iniciar sesión
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              Entra al panel y continúa donde lo dejaste.
            </p>
          </div>
          <div className="hidden rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-sky-300 sm:block">
            Secure
          </div>
        </div>

        <div className="inline-flex w-fit rounded-full border border-white/5 bg-white/[0.03] p-1">
          <button
            type="button"
            aria-pressed={mode === "password"}
            onClick={() => setMode("password")}
            className={[
              "rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] transition-all",
              mode === "password" ? "bg-sky-500 text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.24)]" : "text-slate-400 hover:text-white",
            ].join(" ")}
          >
            Clave
          </button>
          <button
            type="button"
            aria-pressed={mode === "magic_link"}
            onClick={() => setMode("magic_link")}
            className={[
              "rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] transition-all",
              mode === "magic_link" ? "bg-sky-500 text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.24)]" : "text-slate-400 hover:text-white",
            ].join(" ")}
          >
            Enlace
          </button>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Enlace enviado. Revisa tu correo.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-400/15 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {mode === "password" ? (
          <form className="space-y-4" onSubmit={handlePasswordLogin}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                Correo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hola@hockerads.com"
                className="hocker-input"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="hocker-input"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className="hocker-button-brand w-full">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleMagicLink}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                Correo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hola@hockerads.com"
                className="hocker-input"
                autoComplete="email"
              />
            </div>

            <button type="submit" disabled={loading} className="hocker-button-brand w-full">
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
            Acceso privado • Sin ruido
          </p>
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-300 transition hover:text-sky-200">
            Ir al panel
          </Link>
        </div>
      </div>
    </section>
  );
}