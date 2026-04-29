"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
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

type IconType = ComponentType<{
  size?: number;
  className?: string;
}>;

const ORDER = ["web", "vercel", "supabase", "nova", "pwa", "android", "api"] as const;

const ICONS: Record<string, IconType> = {
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

        const next = ORDER
          .map((key) => {
            const check = data.checks[key];
            if (!check) return null;
            return { key, ...check };
          })
          .filter(Boolean) as ViewCheck[];

        if (alive) {
          setItems(next.length > 0 ? next : FALLBACK);
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
  const allActive = ready && items.length > 0 && activeCount === items.length;

  return (
    <section className="h1-status-clean" aria-label="Estado real de Hocker ONE">
      <header className="h1-status-clean-head">
        <div>
          <span>Estado real</span>
          <strong>{ready ? `${activeCount}/${items.length} activos` : "Verificando..."}</strong>
        </div>
        <i className={allActive ? "is-active" : "is-inactive"} aria-hidden="true" />
      </header>

      <div className="h1-status-clean-grid">
        {items.map((item) => {
          const Icon = ICONS[item.key] || Activity;

          return (
            <article
              key={item.key}
              className={`h1-status-clean-card ${item.active ? "is-active" : "is-inactive"}`}
            >
              <div className="h1-status-clean-icon">
                <Icon size={20} />
              </div>

              <div className="h1-status-clean-copy">
                <span>{item.label}</span>
                <strong>{item.detail}</strong>
              </div>

              <i aria-hidden="true" />
            </article>
          );
        })}
      </div>

      <div className="h1-status-clean-map">
        <div className="h1-status-clean-map-title">
          <span>Mapa vivo</span>
          <strong>Conexiones</strong>
        </div>

        <div className="h1-status-clean-map-stage">
          <div className="h1-status-clean-core">
            <img src="/brand/hocker-one-logo.png" alt="Hocker ONE" />
          </div>

          <div className="h1-status-clean-lines" aria-hidden="true" />

          <div className="h1-status-clean-chip-grid">
            {items.map((item) => (
              <div
                key={`chip-${item.key}`}
                className={`h1-status-clean-chip ${item.active ? "is-active" : "is-inactive"}`}
              >
                <span />
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
