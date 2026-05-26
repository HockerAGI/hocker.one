"use client";

import { useEffect, useMemo, useState } from "react";

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

const ORDER = ["web", "vercel", "supabase", "nova", "agent", "pwa", "android", "api"] as const;

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
    <section className="hko-native-status" aria-label="Estado real de Hocker ONE">
      <header className="hko-native-status-head">
        <div>
          <p>Estado real</p>
          <h2>{ready ? `${activeCount}/${items.length} activos` : "Verificando..."}</h2>
        </div>

        <div className={allActive ? "hko-native-status-pill is-active" : "hko-native-status-pill is-inactive"}>
          <span />
          {allActive ? "Todo conectado" : "Revisión activa"}
        </div>
      </header>

      <div className="hko-native-status-list">
        {items.map((item) => (
          <article
            key={item.key}
            className={item.active ? "hko-native-status-row is-active" : "hko-native-status-row is-inactive"}
          >
            <span className="hko-native-status-dot" aria-hidden="true" />

            <div>
              <p>{item.label}</p>
              <strong>{item.detail}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
