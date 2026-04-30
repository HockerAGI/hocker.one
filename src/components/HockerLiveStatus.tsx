"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  Cpu,
  Database,
  Globe2,
  Network,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

type Check = {
  active: boolean;
  label: string;
  detail: string;
};

type StatusResponse = {
  ok: boolean;
  checks: Record<string, Check>;
};

type ViewCheck = Check & {
  key: string;
};

type IconType = ComponentType<{
  size?: number;
  className?: string;
}>;

const ORDER = ["web", "vercel", "supabase", "nova", "agent", "pwa", "android", "api"] as const;

const ICONS: Record<string, IconType> = {
  web: Globe2,
  vercel: Rocket,
  supabase: Database,
  nova: Sparkles,
  agent: Network,
  pwa: Smartphone,
  android: ShieldCheck,
  api: Cpu,
};

const FALLBACK: ViewCheck[] = ORDER.map((key) => ({
  key,
  label: key.toUpperCase(),
  detail: "Verificando",
  active: false,
}));

export default function HockerLiveStatus() {
  const [items, setItems] = useState<ViewCheck[]>(FALLBACK);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/system/status", {
          cache: "no-store",
          headers: { accept: "application/json" },
        });

        if (!response.ok) throw new Error("status_unavailable");

        const data = (await response.json()) as StatusResponse;

        const next = ORDER
          .map((key) => {
            const check = data.checks[key];
            if (!check) return null;
            return { key, ...check };
          })
          .filter(Boolean) as ViewCheck[];

        if (alive) {
          setItems(next.length ? next : FALLBACK);
          setReady(true);
        }
      } catch {
        if (alive) {
          setItems(
            FALLBACK.map((item) => ({
              ...item,
              detail: "Sin respuesta",
              active: false,
            })),
          );
          setReady(true);
        }
      }
    }

    void loadStatus();
    const timer = window.setInterval(() => void loadStatus(), 30000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const activeCount = useMemo(() => items.filter((item) => item.active).length, [items]);
  const allActive = ready && activeCount === items.length;

  return (
    <section className="hko-live-status" aria-label="Estado real de Hocker ONE">
      <header className="hko-live-status-head">
        <div>
          <p>Estado real</p>
          <h2>{ready ? `${activeCount}/${items.length} activos` : "Verificando..."}</h2>
        </div>

        <div className={allActive ? "hko-live-status-pill is-active" : "hko-live-status-pill is-inactive"}>
          <span />
          {allActive ? "Todo conectado" : "Revisión activa"}
        </div>
      </header>

      <div className="hko-live-status-grid">
        {items.map((item) => {
          const Icon = ICONS[item.key] || Activity;

          return (
            <article
              key={item.key}
              className={item.active ? "hko-live-status-card is-active" : "hko-live-status-card is-inactive"}
            >
              <div className="hko-live-status-icon">
                <Icon size={19} />
              </div>

              <div className="hko-live-status-copy">
                <p>{item.label}</p>
                <strong>{item.detail}</strong>
              </div>

              <span className="hko-live-status-dot" aria-hidden="true" />
            </article>
          );
        })}
      </div>
    </section>
  );
}
