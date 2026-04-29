"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Cpu,
  Database,
  Globe2,
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

const ORDER = ["web", "vercel", "supabase", "nova", "pwa", "android", "api"];

const ICONS = {
  web: Globe2,
  vercel: Rocket,
  supabase: Database,
  nova: Sparkles,
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

        const next = ORDER.map((key) => ({
          key,
          ...data.checks[key],
        })).filter((item) => item.label);

        if (alive) {
          setItems(next);
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

    const timer = window.setInterval(() => {
      void loadStatus();
    }, 30000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const activeCount = useMemo(() => items.filter((item) => item.active).length, [items]);
  const allActive = ready && activeCount === items.length;

  return (
    <section className="hko-safe-status" aria-label="Estado real de Hocker ONE">
      <header className="hko-safe-status-head">
        <div>
          <span>Estado real</span>
          <strong>{ready ? `${activeCount}/${items.length} activos` : "Verificando..."}</strong>
        </div>

        <i className={allActive ? "is-active" : "is-inactive"} aria-hidden="true" />
      </header>

      <div className="hko-safe-status-grid">
        {items.map((item) => {
          const Icon = ICONS[item.key as keyof typeof ICONS] || Activity;

          return (
            <article
              key={item.key}
              className={`hko-safe-status-card ${item.active ? "is-active" : "is-inactive"}`}
            >
              <div className="hko-safe-status-icon">
                <Icon size={20} />
              </div>

              <div className="hko-safe-status-copy">
                <span>{item.label}</span>
                <strong>{item.detail}</strong>
              </div>

              <i aria-hidden="true" />
            </article>
          );
        })}
      </div>

      <div className="hko-safe-map">
        <div className="hko-safe-map-copy">
          <span>Mapa vivo</span>
          <strong>Conexiones</strong>
        </div>

        <div className="hko-safe-map-stage">
          <div className="hko-safe-map-orbit hko-safe-map-orbit-a" />
          <div className="hko-safe-map-orbit hko-safe-map-orbit-b" />

          <div className="hko-safe-map-core">
            <img src="/brand/hocker-one-logo.png" alt="Hocker ONE" />
          </div>

          <div className="hko-safe-map-list">
            {items.map((item) => (
              <div
                key={`chip-${item.key}`}
                className={`hko-safe-map-chip ${item.active ? "is-active" : "is-inactive"}`}
              >
                <span />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
