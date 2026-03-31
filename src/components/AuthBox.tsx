"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";
import BrandMark from "@/components/BrandMark";

export default function AuthBox() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<"biometric" | "credentials">("biometric");

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

  async function loginWithCredentials(e: React.FormEvent) {
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

  async function loginBiometric() {
    setError(null);
    setLoading(true);

    try {
      // Invocación nativa de WebAuthn (Passkeys) en Supabase
      // @ts-expect-error - Fallback por si la versión de tipos de Supabase no está 100% actualizada
      const auth = supabase.auth as { signInWithWebAuthn?: () => Promise<{ error: unknown }> };
      
      if (typeof auth.signInWithWebAuthn === "function") {
        const { error: authError } = await auth.signInWithWebAuthn();
        if (authError) throw authError;
      } else {
        throw new Error("El módulo WebAuthn no está expuesto. Use credenciales temporales.");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Fallo en lectura biométrica.");
      setMode("credentials"); // Redirección táctica si falla el sensor
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
            {/* ESCÁNER BIOMÉTRICO (MODO PRINCIPAL) */}
            {mode === "biometric" ? (
              <div className="flex flex-col items-center justify-center animate-in zoom-in duration-500">
                <button
                  onClick={loginBiometric}
                  disabled={loading}
                  className="group relative flex h-32 w-32 items-center justify-center rounded-full border border-sky-400/30 bg-sky-500/10 transition-all hover:bg-sky-500/20 active:scale-95 disabled:opacity-50"
                >
                  {/* Láser de Escaneo VFX */}
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div className="h-1 w-full bg-sky-400 shadow-[0_0_15px_rgba(14,165,233,1)] animate-scanline opacity-70" />
                  </div>
                  <div className="absolute inset-0 rounded-full border border-sky-400 opacity-20 group-hover:animate-ping" />
                  
                  <svg className="relative z-10 h-14 w-14 text-sky-400 drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </button>
                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {loading ? "Analizando ADN Digital..." : "Toca para escanear"}
                </p>
              </div>
            ) : (
              /* FORMULARIO DE CREDENCIALES (MODO RESPALDO) */
              <form onSubmit={loginWithCredentials} className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <input
                  type="email"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 shadow-inner disabled:opacity-50"
                  placeholder="director@hocker.one"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 shadow-inner disabled:opacity-50"
                  placeholder="Código de autorización"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim()}
                  className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 shadow-lg transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50"
                >
                  {loading ? "VERIFICANDO..." : "INICIAR CONEXIÓN"}
                </button>
              </form>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-[11px] font-bold uppercase tracking-wide text-rose-300 text-center animate-pulse">
                {error}
              </div>
            )}

            {/* TOGGLE ENTRE MODOS */}
            <div className="pt-4 text-center border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "biometric" ? "credentials" : "biometric");
                  setError(null);
                }}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-sky-400 transition-colors"
              >
                {mode === "biometric" ? "Usar Correo y Contraseña" : "Usar Escáner Biométrico"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
