"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Globe2, ShieldCheck, Sparkles } from "lucide-react";

type Check = {
  active: boolean;
  label: string;
  detail: string;
};

type StatusResponse = {
  ok: boolean;
  checks: {
    web: Check;
    vercel: Check;
    supabase: Check;
    nova: Check;
  };
};

type ViewCheck = Check & {
  key: string;
};

const icons = {
  web: Globe2,
  vercel: Activity,
  supabase: ShieldCheck,
  nova: Sparkles
};

const fallbackChecks: ViewCheck[] = [
  { key: "web", label: "Web", detail: "Verificando", active: false },
  { key: "vercel", label: "Vercel", detail: "Verificando", active: false },
  { key: "supabase", label: "Supabase", detail: "Verificando", active: false },
  { key: "nova", label: "NOVA", detail: "Verificando", active: false }
];

export default function HockerLiveStatus() {
  const [checks, setChecks] = useState<ViewCheck[]>(fallbackChecks);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/system/status", {
          cache: "no-store",
          headers: {
            accept: "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("status_unavailable");
        }

        const data = (await response.json()) as StatusResponse;

        const nextChecks: ViewCheck[] = [
          { key: "web", ...data.checks.web },
          { key: "vercel", ...data.checks.vercel },
          { key: "supabase", ...data.checks.supabase },
          { key: "nova", ...data.checks.nova }
        ];

        if (alive) {
          setChecks(nextChecks);
          setLoaded(true);
        }
      } catch {
        if (alive) {
          setChecks([
            { key: "web", label: "Web", detail: "Sin respuesta", active: false },
            { key: "vercel", label: "Vercel", detail: "Sin respuesta", active: false },
            { key: "supabase", label: "Supabase", detail: "Sin respuesta", active: false },
            { key: "nova", label: "NOVA", detail: "Sin respuesta", active: false }
          ]);
          setLoaded(true);
        }
      }
    }

    void loadStatus();

    const timer = window.setInterval(() => {
      void loadStatus();
    }, 30000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const summary = useMemo(() => {
    const activeCount = checks.filter((item) => item.active).length;
    return `${activeCount}/${checks.length} activos`;
  }, [checks]);

  return (
    <section className="hkr-real-status" aria-label="Estado real del sistema">
      <div className="hkr-real-status-head">
        <div>
          <p>Estado real</p>
          <strong>{loaded ? summary : "Verificando..."}</strong>
        </div>
        <span className={checks.every((item) => item.active) ? "is-green" : "is-red"} />
      </div>

      <div className="hkr-real-status-grid">
        {checks.map((item) => {
          const Icon = icons[item.key as keyof typeof icons] || Activity;

          return (
            <div
              className={`hkr-real-status-card ${item.active ? "is-active" : "is-inactive"}`}
              key={item.key}
            >
              <Icon size={19} />
              <div>
                <p>{item.label}</p>
                <strong>{item.detail}</strong>
              </div>
              <span />
            </div>
          );
        })}
      </div>
    </section>
  );
}
