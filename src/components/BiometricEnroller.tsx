"use client";

import { useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";

export default function BiometricEnroller() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function enrollDevice() {
    setLoading(true);
    setMsg(null);

    try {
      // @ts-expect-error - Fallback de tipado para métodos experimentales WebAuthn
      const auth = supabase.auth as { enrollWebAuthn?: () => Promise<{ error: unknown }> };

      if (typeof auth.enrollWebAuthn === "function") {
        const { error } = await auth.enrollWebAuthn();
        if (error) throw error;
        setMsg({ text: "Sensor vinculado. Acceso biométrico autorizado.", type: "success" });
      } else {
        throw new Error("El núcleo de WebAuthn requiere activación desde el panel de Supabase.");
      }
    } catch (err: unknown) {
      setMsg({ text: getErrorMessage(err), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hocker-glass-vfx p-6 border border-sky-500/20">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-400/20 text-sky-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-[14px] font-black uppercase tracking-widest text-white">
            Vincular Hardware Actual
          </h3>
          <p className="mt-1 text-[11px] font-medium text-slate-400 leading-relaxed">
            Registra este dispositivo para habilitar el acceso biométrico (Huella / FaceID / PIN) y eliminar el uso de contraseñas.
          </p>

          <button
            onClick={enrollDevice}
            disabled={loading}
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Sincronizando Sensor..." : "Registrar Dispositivo"}
          </button>

          {msg && (
            <div className={`mt-4 rounded-xl border px-4 py-3 text-[10px] font-bold uppercase tracking-widest ${
              msg.type === "success" 
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
                : "border-rose-500/30 bg-rose-500/10 text-rose-400"
            }`}>
              {msg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
