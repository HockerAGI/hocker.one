"use client";

import { motion } from "framer-motion";
import { CircleDot, Clock3, ExternalLink, ServerCog } from "lucide-react";
import type { ExternalServiceItem } from "@/lib/external-services";
import { externalStatusLabel, externalStatusTone } from "@/lib/external-services";

type Props = {
  services: ExternalServiceItem[];
};

function timeLabel(input: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(input));
}

export default function ExternalServicesSection({ services }: Props) {
  const connected = services.filter((service) => service.status === "live").length;

  return (
    <section className="rounded-[34px] border border-white/6 bg-white/[0.03] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-7">
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.42em] text-sky-300/80">
          Servicios externos
        </p>
        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Conectados, visibles y sin maquillaje.
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
          Aquí se muestran los servicios que sostienen la operación. Si algo está apagado o sin
          configuración, se ve tal cual.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
          {services.length} servicios
        </span>
        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
          {connected} online
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {services.map((service, index) => (
          <motion.article
            key={service.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.03 * index, ease: "easeOut" }}
            className="group relative overflow-hidden rounded-[28px] border border-white/6 bg-[#09111f]/80 p-5"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_30%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.38em] text-slate-500">
                    {service.kind === "orchestrator" ? "Orquestador" : "Agente físico"}
                  </p>
                  <h3 className="mt-2 text-xl font-black tracking-tight text-white">
                    {service.title}
                  </h3>
                </div>

                <span
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]",
                    externalStatusTone(service.status),
                  ].join(" ")}
                >
                  <CircleDot className="h-3 w-3" />
                  {externalStatusLabel(service.status)}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-slate-300">{service.subtitle}</p>

              <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                  Endpoint
                </p>
                <p className="mt-1 break-all text-sm text-sky-200">{service.endpoint}</p>
              </div>

              <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                {service.note}
              </div>

              <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  {timeLabel(service.lastCheckedAt)}
                </span>

                <span className="inline-flex items-center gap-2">
                  <ServerCog className="h-4 w-4" />
                  {service.kind}
                </span>
              </div>

              <a
                href={service.endpoint === "no-configurado" ? "#" : service.endpoint}
                target={service.endpoint === "no-configurado" ? "_self" : "_blank"}
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-sky-300 transition hover:text-sky-200"
              >
                Ver servicio
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}