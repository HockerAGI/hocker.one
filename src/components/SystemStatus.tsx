"use client";

import { getErrorMessage } from "@/lib/errors";
import { useEffect, useMemo, useState } from "react";

type Health = {
  status: string;
  checks?: Record<string, boolean>;
};

export default function SystemStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const c = health?.checks || {};
    return [
      { label: "DB", ok: c.db },
      { label: "Auth", ok: c.supabaseUrl && c.supabaseAnon },
      { label: "NOVA", ok: c.novaAgi && c.novaKey },
      { label: "HMAC", ok: c.commandHmac },
      { label: "Telemetry", ok: c.langfuse },
    ];
  }, [health]);

  async function load() {
    try {
      setError(null);
      const res = await fetch("/api/health", { cache: "no-store" });
      const j = await res.json();

      if (!res.ok) throw new Error(j?.error);
      setHealth(j);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  return (
    <section className="hocker-panel-pro">
      <div className="p-5 border-b border-white/5 flex justify-between">
        <h3 className="text-xs font-black text-sky-400">SYSTEM HEALTH</h3>
        <button onClick={load} className="text-xs text-sky-300">
          REFRESH
        </button>
      </div>

      <div className="p-5 grid gap-3">
        {summary.map((s) => (
          <div key={s.label} className="flex justify-between text-xs">
            <span>{s.label}</span>
            <span className={s.ok ? "text-emerald-400" : "text-rose-400"}>
              {s.ok ? "OK" : "FAIL"}
            </span>
          </div>
        ))}

        {error && (
          <div className="text-rose-400 text-xs mt-3">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}