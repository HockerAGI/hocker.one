"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";
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
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (authError) throw authError;
      setSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Fallo en el protocolo de acceso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-700">
      {/* Resplandor VFX trasero */}
      <div className="absolute -inset-1 bg-sky-500/20 rounded-[40px] blur-3xl opacity-30 animate-pulse-slow" />
      
      <div className="hocker-panel-pro relative flex flex-col items-center p-8 sm:p-12 border border-sky-500/20 shadow-[0_0_40px_rgba(14,165,233,0.1)]">
        <div className="mb-10 flex flex-col items-center w-full">
          <BrandMark showWordmark={true} hero={false} className="mb-8 scale-110" />
          <h2 className="text-xl font-black tracking-tighter text-white uppercase text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            Autorización de Mando
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-400 mt-2">
            Identidad Requerida
          </p>
        </div>

        {userEmail ? (
          <div className="w-full text-center">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 mb-6 shadow-inner">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Sesión Activa</p>
              <p className="text-sky-300 font-bold truncate mt-1">{userEmail}</p>
            </div>
            <a
              href="/dashboard"
              className="inline-flex w-full justify-center rounded-2xl bg-sky-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 active:scale-95"
            >
              ENTRAR A LA MATRIZ
            </a>
          </div>
        ) : (
          <form
            className="w-full space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim() && !loading) sendLink();
            }}
          >
            <div className="relative">
              <input
                type="email"
                autoComplete="email"
                disabled={loading || sent}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 shadow-inner disabled:opacity-50"
                placeholder="director@hocker.one"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-[11px] font-bold uppercase tracking-wide text-rose-300 text-center">
                {error}
              </div>
            )}

            {sent ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-[11px] font-bold uppercase tracking-wide text-emerald-300 text-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                Enlace de acceso enviado a su terminal.
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 shadow-lg transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50"
              >
                {loading ? "VERIFICANDO IDENTIDAD..." : "SOLICITAR ACCESO"}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
