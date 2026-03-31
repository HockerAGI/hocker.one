"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";
import BrandMark from "@/components/BrandMark";

export default function AuthBox() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic_link">("password");
  
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

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim() || loading) return;

    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Credenciales rechazadas por la Matriz.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setError(null);
    setLoading(true);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (authError) throw authError;
      setSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Fallo al emitir el enlace táctico.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-700">
      {/* Resplandor VFX trasero */}
      <div className="absolute -inset-1 bg-sky-500/20 rounded-[40px] blur-3xl opacity-30 animate-pulse-slow" />

      <div className="hocker-panel-pro relative flex flex-col items-center p-8 sm:p-12 border border-sky-500/20 shadow-[0_0_40px_rgba(14,165,233,0.1)]">
        <div className="mb-8 flex flex-col items-center w-full">
          <BrandMark showWordmark={true} hero={false} className="mb-8 scale-110" />
          <h2 className="text-xl font-black tracking-tighter text-white uppercase text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            Autorización de Mando
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-400 mt-2">
            Identidad Requerida
          </p>
        </div>

        {userEmail ? (
          <div className="w-full text-center animate-in fade-in">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 mb-6 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <p className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Enlace Establecido</p>
              <p className="text-white font-bold truncate mt-1">{userEmail}</p>
            </div>
            <a
              href="/dashboard"
              className="inline-flex w-full justify-center rounded-2xl bg-sky-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 active:scale-95"
            >
              ENTRAR A LA MATRIZ
            </a>
          </div>
        ) : (
          <div className="w-full space-y-6">
            
            <form onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink} className="w-full space-y-4 animate-in fade-in">
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
              </div>

              {mode === "password" && !sent && (
                <input
                  type="password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 shadow-inner disabled:opacity-50 animate-in slide-in-from-top-2"
                  placeholder="Código de autorización"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}

              {error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-[11px] font-bold uppercase tracking-wide text-rose-300 text-center animate-pulse">
                  {error}
                </div>
              )}

              {sent ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-[11px] font-bold uppercase tracking-wide text-emerald-300 text-center shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-in zoom-in">
                  Protocolo iniciado. Revisa tu bandeja de entrada para acceder directamente.
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !email.trim() || (mode === "password" && !password.trim())}
                  className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 shadow-lg transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50"
                >
                  {loading 
                    ? "PROCESANDO..." 
                    : mode === "password" 
                      ? "INICIAR CONEXIÓN" 
                      : "ENVIAR ENLACE MÁGICO"}
                </button>
              )}
            </form>

            {/* INTERRUPTOR TÁCTICO DE MODO */}
            {!sent && (
              <div className="pt-4 text-center border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "password" ? "magic_link" : "password");
                    setError(null);
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-sky-400 transition-colors"
                >
                  {mode === "password" 
                    ? "Acceder sin contraseña (Enlace Mágico)" 
                    : "Acceder con Contraseña"}
                </button>
              </div>
            )}
            
            {sent && (
              <div className="pt-4 text-center border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setMode("password");
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                  Volver al inicio
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
