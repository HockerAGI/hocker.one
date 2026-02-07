"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

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
        options: { emailRedirectTo: `${origin}/auth/callback` }
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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm text-slate-600">Conectado como</div>
        <div className="mt-1 font-medium">{userEmail}</div>
        <button
          className="mt-3 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          onClick={signOut}
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold">Login</div>
      <p className="mt-1 text-sm text-slate-600">Te mando un link por correo. Sin contraseñas.</p>

      <div className="mt-3 flex gap-2">
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          onClick={sendLink}
          disabled={loading || !email.includes("@")}
        >
          {loading ? "Enviando…" : "Enviar"}
        </button>
      </div>

      {sent && <div className="mt-3 text-sm text-emerald-700">Listo. Abre el link en tu correo.</div>}
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
    </div>
  );
}