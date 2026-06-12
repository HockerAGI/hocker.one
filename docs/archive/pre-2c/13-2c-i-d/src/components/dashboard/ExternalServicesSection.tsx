"use client";

import { Radio, Server } from "lucide-react";
import type { ExternalServiceItem } from "@/lib/external-services";
import {
  externalStatusLabel,
  externalStatusTone,
} from "@/lib/external-services";

type Props = {
  services: ExternalServiceItem[];
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

function formatEndpoint(endpoint: string): string {
  if (!endpoint || endpoint === "no-configurado") return "No configurado";
  return endpoint;
}

export default function ExternalServicesSection({ services }: Props) {
  if (!services.length) {
    return (
      <div className="rounded-[22px] border border-white/10 bg-[#0b1526] p-4 text-sm text-slate-400">
        Sin servicios externos registrados.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {services.map((service) => (
        <article
          key={service.key}
          className="rounded-[22px] border border-white/10 bg-[#0b1526] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-200">
                {service.kind === "agent" ? <Server size={18} /> : <Radio size={18} />}
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-white">
                  {service.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  {service.subtitle}
                </p>
              </div>
            </div>

            <span
              className={[
                "shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]",
                externalStatusTone(service.status),
              ].join(" ")}
            >
              {externalStatusLabel(service.status)}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-500">
                Endpoint
              </p>
              <p className="mt-2 truncate text-sm text-slate-300">
                {formatEndpoint(service.endpoint)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-500">
                Último chequeo
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {formatTime(service.lastCheckedAt)}
              </p>
            </div>
          </div>

          <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-slate-300">
            {service.note}
          </p>
        </article>
      ))}
    </div>
  );
}
