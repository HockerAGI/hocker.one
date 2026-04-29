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
        const res = await fetch("/api/system/status", {
          cache: "no-store",
          headers: { accept: "application/json" },
        });

        if (!res.ok) throw new Error("status_unavailable");

        const data = (await res.json()) as StatusResponse;

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
    <section className="hko-status-suite" aria-label="Estado real de Hocker ONE">
      <div className="hko-status-head">
        <div>
          <p>Estado real</p>
          <strong>{ready ? `${activeCount}/${items.length} activos` : "Verificando..."}</strong>
        </div>
        <span className={allActive ? "is-active" : "is-inactive"} />
      </div>

      <div className="hko-status-grid">
        {items.map((item) => {
          const Icon = ICONS[item.key as keyof typeof ICONS] || Activity;

          return (
            <article
              key={item.key}
              className={`hko-status-card ${item.active ? "is-active" : "is-inactive"}`}
            >
              <Icon size={20} />
              <div>
                <p>{item.label}</p>
                <strong>{item.detail}</strong>
              </div>
              <span />
            </article>
          );
        })}
      </div>

      <div className="hko-map-card">
        <div className="hko-section-title">
          <p>Mapa vivo</p>
          <h2>Conexiones</h2>
        </div>

        <div className="hko-orbit-map">
          <div className="hko-orbit hko-orbit-a" />
          <div className="hko-orbit hko-orbit-b" />
          <div className="hko-orbit hko-orbit-c" />

          <div className="hko-map-center">
            <img src="/brand/hocker-one-logo.png" alt="Hocker ONE" />
          </div>

          {items.map((item) => (
            <div
              key={`map-${item.key}`}
              className={`hko-map-node hko-map-node-${item.key} ${
                item.active ? "is-active" : "is-inactive"
              }`}
            >
              <span />
              <strong>{item.label}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
