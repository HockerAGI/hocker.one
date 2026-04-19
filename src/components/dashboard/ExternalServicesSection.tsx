"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CircleDot, Clock3, RefreshCw } from "lucide-react";

import type { ExternalServiceItem } from "@/lib/external-services";
import { externalStatusLabel, externalStatusTone } from "@/lib/external-services";

type Props = {
  services: ExternalServiceItem[];
  onRefresh?: () => void;
};

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ExternalServicesSection({ services, onRefresh }: Props) {
  const ordered = [...services].sort((a, b) => {
    const rank = { live: 0, pending: 1, offline: 2 } as const;
    return rank[a.status] - rank[b.status];
  });

  return (
    <section className="rounded-[32px] border border-white/5 bg-white/[0.03] p-5 shadow-[0_18px_70px_rgba(2,6,23,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-sky-300/80">
            Conexiones
          </p>
          <h3 className="mt-2 text-lg font-black text-white">Servicios externos</h3>
        </div>

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300 transition-all hover:border-sky-400/20 hover:bg-sky-400/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refrescar
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4">
        {ordered.map((service, index) => (
          <motion.article
            key={service.key}
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
            className="group relative overflow-hidden rounded-[26px] border border-white/5 bg-slate-950/45 p-4"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_28%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                    {service.kind}
                  </p>
                  <h4 className="mt-2 text-sm font-black text-white">{service.title}</h4>
                  <p className="mt-1 text-xs text-slate-400">{service.subtitle}</p>
                </div>

                <span
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]",
                    externalStatusTone(service.status),
                  ].join(" ")}
                >
                  <CircleDot className="h-3.5 w-3.5" />
                  {externalStatusLabel(service.status)}
                </span>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.34em] text-slate-500">
                  Endpoint
                </p>
                <p className="mt-1 break-all text-sm text-sky-200">{service.endpoint}</p>
              </div>

              <p className="rounded-2xl border border-white/5 bg-slate-950/55 px-4 py-3 text-sm leading-relaxed text-slate-300">
                {service.note}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  <Clock3 className="h-4 w-4 text-sky-300" />
                  {formatTime(service.lastCheckedAt)}
                </div>

                <a
                  href={service.endpoint === "no-configurado" ? "#" : service.endpoint}
                  target={service.endpoint === "no-configurado" ? "_self" : "_blank"}
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-sky-300 transition hover:text-sky-200"
                >
                  Abrir
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}