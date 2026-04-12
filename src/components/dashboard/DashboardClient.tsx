"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Clock3,
  CircleDot,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { DashboardSummary } from "@/lib/hocker-dashboard";
import { getAppStatusLabel, getStatusTone } from "@/lib/hocker-dashboard";

type DashboardClientProps = {
  summary: DashboardSummary;
};

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.42em] text-sky-300/80">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/6 bg-white/[0.035] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_28%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
          {label}
        </p>
        <div className="text-3xl font-black tracking-tight text-white">{value}</div>
        <p className="text-sm text-slate-400">{hint}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "live" | "ready" | "pending" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]",
        getStatusTone(status),
      ].join(" ")}
    >
      <CircleDot className="h-3 w-3" />
      {getAppStatusLabel(status)}
    </span>
  );
}

export default function DashboardClient({ summary }: DashboardClientProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.20),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_25%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[36px] border border-white/6 bg-white/[0.035] p-6 shadow-[0_40px_140px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_28%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="rounded-[24px] border border-white/6 bg-black/30 p-3 shadow-[0_14px_50px_rgba(0,0,0,0.2)]">
                  <Image
                    src="/brand/hocker-one-isotype.png"
                    alt="Hocker One"
                    width={60}
                    height={60}
                    priority
                    className="h-14 w-14 object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.42em] text-sky-300/80">
                    Hocker ONE · Control Plane
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
                    Un solo centro.
                    <span className="block text-sky-300">Todo el ecosistema delante.</span>
                  </h1>
                </div>
              </div>

              <p className="max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Vista completa del ecosistema, con lectura real desde Supabase, estructura lista
                para integrar Chido Casino y todos los módulos que ya están definidos en la
                documentación.
              </p>

              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  Supabase conectado
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-sky-300">
                  <Sparkles className="h-4 w-4" />
                  Integración lista
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {summary.metrics.map((metric) => (
                <StatCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  hint={metric.hint}
                />
              ))}
            </div>
          </div>
        </motion.section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
            className="rounded-[34px] border border-white/6 bg-white/[0.03] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-7"
          >
            <SectionTitle
              eyebrow="Apps y webs"
              title="Diez nodos core, listos para enchufar."
              subtitle="La documentación sí marca un núcleo claro: Hocker ONE, Hocker Ads, Chido Casino, Hocker Drive Cloud, Hocker Hub, Hocker Up, NEXPA, Trackhok, Hocker Wallet y Hocker Supply."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
              {summary.apps.map((app, index) => (
                <motion.article
                  key={app.key}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.03 * index, ease: "easeOut" }}
                  className="group relative overflow-hidden rounded-[28px] border border-white/6 bg-[#09111f]/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_30%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative flex h-full flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.38em] text-slate-500">
                          {app.key.replaceAll("-", " / ")}
                        </p>
                        <h3 className="mt-2 text-xl font-black tracking-tight text-white">
                          {app.title}
                        </h3>
                      </div>
                      <StatusPill status={app.status} />
                    </div>

                    <p className="text-sm leading-relaxed text-slate-300">{app.subtitle}</p>

                    <div className="mt-auto rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                        Integración
                      </p>
                      <p className="mt-1 text-sm font-semibold text-sky-200">
                        {app.integration}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
            className="rounded-[34px] border border-white/6 bg-white/[0.03] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-7"
          >
            <SectionTitle
              eyebrow="AGIs y Shadows"
              title="Quince nodos operativos, si sumas la capa Shadow."
              subtitle="Aquí vive la jerarquía: NOVA, Syntia, Vertx, Numia, Jurix, Hostia, Candy Ads, Nova Ads, PRO IA, Trackhok, NEXPA, Curvewind, Chido Wins, Chido Gerente y Shadows."
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              {summary.agis.map((agi, index) => (
                <motion.article
                  key={agi.key}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.02 * index, ease: "easeOut" }}
                  className="rounded-[26px] border border-white/6 bg-[#09111f]/85 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.38em] text-slate-500">
                        {agi.integration}
                      </p>
                      <h3 className="mt-2 text-lg font-black tracking-tight text-white">
                        {agi.title}
                      </h3>
                    </div>
                    <StatusPill status={agi.status} />
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{agi.subtitle}</p>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: "easeOut" }}
            className="rounded-[34px] border border-white/6 bg-white/[0.03] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          >
            <SectionTitle
              eyebrow="Actividad reciente"
              title="Lectura viva del sistema."
              subtitle="Eventos, cambios y señales de operación en tiempo real."
            />

            <div className="mt-6 space-y-3">
              {summary.recentEvents.length === 0 ? (
                <div className="rounded-[22px] border border-white/6 bg-black/20 px-4 py-5 text-sm text-slate-400">
                  Aún no hay eventos recientes.
                </div>
              ) : (
                summary.recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-[22px] border border-white/6 bg-black/20 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{event.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{event.detail}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        {event.at}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
            className="rounded-[34px] border border-white/6 bg-white/[0.03] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          >
            <SectionTitle
              eyebrow="Puente listo"
              title="Deja las puertas abiertas para las próximas apps."
              subtitle="Aquí se enchufan Hocker Ads Wallet, Drive Wallet, BrandMatrix IA, WebForge Quantum, API Forge y todo lo que siga naciendo."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                "BrandMatrix IA",
                "WebForge Quantum",
                "API Forge",
                "Guardian Quantum",
                "TalentIA",
                "Learning Hub",
                "Quantum Drive Cloud",
                "Nova Health Check",
              ].map((moduleName) => (
                <div
                  key={moduleName}
                  className="rounded-[24px] border border-white/6 bg-[#09111f]/80 p-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                    Listo para integrar
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-white">{moduleName}</h3>
                    <ArrowUpRight className="h-4 w-4 text-sky-300" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[26px] border border-sky-400/10 bg-sky-500/8 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.36em] text-sky-300">
                Chido Casino
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Queda como nodo preparado. En cuanto metas su esquema final, este panel lo toma
                sin tocar la estructura madre.
              </p>
            </div>

            <div className="mt-4 rounded-[26px] border border-white/6 bg-black/20 p-5">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-sky-300" />
                <p className="text-sm font-semibold text-white">Resumen operativo</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                    Apps activas
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {summary.apps.filter((app) => app.status === "live").length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                    AGIs activas
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {summary.agis.filter((agi) => agi.status === "live").length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                    Cola viva
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {summary.recentCommands.length}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}