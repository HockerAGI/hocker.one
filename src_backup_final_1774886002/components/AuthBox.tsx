import { getErrorMessage } from "@/lib/errors";
"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import BrandMark from "@/components/BrandMark";

export default function AuthBox() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
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

  async function sendLink() {
    setError(null);
    setLoading(true);

    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setSent(true);
    } catch (e: unknown) {
      setError(e ? getErrorMessage(e) ?? "No se pudo enviar el enlace.");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSent(false);
    setEmail("");
  }

  if (userEmail) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/30 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <BrandMark compact showWordmark={false} />
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
              Sesión activa
            </div>
            <div className="mt-1 text-sm font-semibold text-white">{userEmail}</div>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          onClick={signOut}
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/30 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <BrandMark compact showWordmark={false} />
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
            Acceso privado
          </div>
          <div className="mt-1 text-sm font-semibold text-white">Entrar con enlace</div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300">
        Recibe un enlace en tu correo y entra de forma directa y segura.
      </p>

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim() && !loading) sendLink();
        }}
      >
        <input
          type="email"
          autoComplete="email"
          disabled={loading || sent}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60 disabled:bg-slate-950/60"
          placeholder="Ej. director@hocker.one"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {sent ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Revisa tu correo. El enlace mágico ya fue enviado.
          </div>
        ) : null}

        {!sent && (
          <button
            type="submit"
            className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || !email.trim()}
          >
            {loading ? "Generando acceso seguro…" : "Enviar enlace mágico"}
          </button>
        )}
      </form>
    </div>
  );
}