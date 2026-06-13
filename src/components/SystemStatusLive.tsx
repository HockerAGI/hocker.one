"use client";

import { useEffect, useState } from "react";

type Check = { active: boolean; label: string; detail: string };

type StatusPayload = {
  ok?: boolean;
  timestamp?: string;
  runtime?: { node?: string; environment?: string };
  checks?: Record<string, Check>;
};

const CHECK_ORDER = ["web", "api", "supabase", "nova", "agent", "vercel", "pwa", "android"];

export default function SystemStatusLive() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<StatusPayload | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/system/status", {
          method: "GET",
          cache: "no-store",
        });
        const json = (await res.json().catch(() => ({}))) as StatusPayload;
        if (!active) return;
        setData(json);
        setState(res.ok ? "ready" : "error");
      } catch {
        if (!active) return;
        setState("error");
        setData(null);
      }
    }

    void load();
    const id = setInterval(load, 20000);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (state === "loading") {
    return (
      <p className="text-sm text-slate-400" aria-live="polite">
        Verificando el estado real del sistema…
      </p>
    );
  }

  if (state === "error" || !data?.checks) {
    return (
      <div className="rounded-[28px] border border-rose-400/30 bg-rose-500/5 p-5 text-sm text-rose-200">
        No se pudo leer el estado real del sistema en este momento. Vuelve a intentarlo en unos segundos.
      </div>
    );
  }

  const checks = data.checks;
  const ordered = CHECK_ORDER.filter((key) => checks[key]);
  const extra = Object.keys(checks).filter((key) => !CHECK_ORDER.includes(key));
  const keys = [...ordered, ...extra];

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {keys.map((key) => {
          const check = checks[key];

          return (
            <article key={key} className="hko-module-card">
              <span
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]",
                  check.active
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-rose-400/30 bg-rose-400/10 text-rose-300",
                ].join(" ")}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
                {check.active ? "En línea" : "Sin respuesta"}
              </span>
              <h3 className="mt-4 text-xl font-black text-white">{check.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{check.detail}</p>
            </article>
          );
        })}
      </section>
      <p className="text-xs text-slate-500">
        Lectura real vía <span className="font-mono">/api/system/status</span>
        {data.runtime?.environment ? ` · entorno: ${data.runtime.environment}` : ""}. Se actualiza cada 20 s.
      </p>
    </div>
  );
}
