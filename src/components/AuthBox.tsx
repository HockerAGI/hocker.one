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
    } catch (e: any) {
      setError(e?.message ?? "No se pudo enviar el enlace.");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSent(false);
    setEmail("");
  }

  // Vista cuando el usuario ya tiene sesión activa
  if (userEmail) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <BrandMark compact showWordmark={false} />
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Sesión activa
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{userEmail}</div>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          onClick={signOut}
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  // Vista para ingresar correo
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <BrandMark compact showWordmark={false} />
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Acceso privado
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">Entrar con enlace</div>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        Recibe un enlace en tu correo y entra de forma directa y segura.
      </p>

      {/* Convertido a <form> para habilitar el "Enter" del teclado */}
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
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 disabled:bg-slate-50"
          placeholder="Ej. director@hocker.one"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error ? (
          <div className="animate-in fade-in slide-in-from-top-1 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {sent ? (
          <div className="animate-in fade-in slide-in-from-top-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Revisa tu correo. El enlace mágico ya fue enviado.
          </div>
        ) : null}

        {!sent && (
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            disabled={loading || !email.trim()}
          >
            {loading ? "Generando acceso seguro…" : "Enviar enlace mágico"}
          </button>
        )}
      </form>
    </div>
  );
}
