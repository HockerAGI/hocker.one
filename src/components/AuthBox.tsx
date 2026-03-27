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

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
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
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? "Error enviando link");
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
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
          className="mt-4 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={signOut}
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <BrandMark compact showWordmark={false} />
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Acceso seguro
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">Login por correo</div>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        Te mando un enlace mágico. Sin contraseñas. Sin fricción.
      </p>

      <div className="mt-4 space-y-3">
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          placeholder="tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {sent ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Revisa tu correo. El enlace ya fue enviado.
          </div>
        ) : null}

        <button
          className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 disabled:opacity-60"
          onClick={sendLink}
          disabled={loading || !email.trim()}
        >
          {loading ? "Enviando…" : "Enviar link"}
        </button>
      </div>
    </div>
  );
}