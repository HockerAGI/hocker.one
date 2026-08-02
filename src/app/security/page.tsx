import type { Metadata } from "next";
import Link from "next/link";
import { Database, Lock, RefreshCw, ShieldCheck, Users } from "lucide-react";

import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import { HOCKER_CLIENT_PORTALS } from "@/lib/hocker-client-portals";
import { getHockerOperationalSnapshot } from "@/lib/hocker-operational-state";
import { HOCKER_GLOBAL_REAL_EXECUTION_LOCK, HOCKER_ROLE_DEFINITIONS } from "@/lib/hocker-roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Seguridad | Hocker ONE",
  description: "Controles aplicados, estados verificables y modelos de seguridad todavía planificados.",
  robots: { index: false, follow: false, noarchive: true },
};

function serviceTone(status: string) {
  if (status === "online") return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  if (status === "configured") return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  if (status === "offline") return "border-rose-300/25 bg-rose-300/10 text-rose-100";
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

function serviceLabel(status: string) {
  if (status === "online") return "Verificado";
  if (status === "configured") return "Configurado";
  if (status === "offline") return "Sin conexión";
  return "Sin verificar";
}

function portalTone(status: string) {
  if (status === "locked") return "border-rose-300/20 bg-rose-300/10 text-rose-100";
  if (status === "ready") return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

export default async function SecurityPage() {
  const operational = await getHockerOperationalSnapshot();
  const supabase = operational.runtime.service_status.supabase;
  const plannedPortals = HOCKER_CLIENT_PORTALS.filter((portal) => portal.status === "planned").length;
  const lockedPortals = HOCKER_CLIENT_PORTALS.filter((portal) => portal.status === "locked").length;
  const rolesWithRealExecution = HOCKER_ROLE_DEFINITIONS.filter((role) => role.can_execute_real_actions !== false);

  return (
    <div className="hko-page-flow space-y-5">
      <HockerPageHeader
        eyebrow="Controles y alcance"
        title="Seguridad verificable"
        text="Esta vista distingue controles presentes en el runtime, políticas declaradas en código y modelos que todavía no están desplegados."
      />

      <section className="hko-map-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="hko-kicker">Última comprobación</p>
            <p className="mt-2 text-sm text-slate-300">{new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Tijuana" }).format(new Date(operational.checked_at))}</p>
            <p className="mt-1 text-xs text-slate-500">La lectura de Supabase confirma acceso autenticado; no sustituye una inspección en vivo de todas las políticas RLS.</p>
          </div>
          <Link href="/security" className="hko-action-secondary inline-flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Actualizar</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="hko-module-card hko-card-tight">
          <Database className="h-5 w-5 text-cyan-200" />
          <div className="mt-4 flex items-start justify-between gap-3">
            <h2 className="text-lg font-black text-white">Supabase</h2>
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${serviceTone(supabase.status)}`}>{serviceLabel(supabase.status)}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{supabase.detail}</p>
        </article>

        <article className="hko-module-card hko-card-tight">
          <Lock className="h-5 w-5 text-cyan-200" />
          <h2 className="mt-4 text-lg font-black text-white">Bloqueo global</h2>
          <p className="mt-2 text-3xl font-black text-white">{HOCKER_GLOBAL_REAL_EXECUTION_LOCK ? "Habilitado" : "Deshabilitado"}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Valor declarado en la política de ejecución del repositorio.</p>
        </article>

        <article className="hko-module-card hko-card-tight">
          <Users className="h-5 w-5 text-cyan-200" />
          <h2 className="mt-4 text-lg font-black text-white">Roles declarados</h2>
          <p className="mt-2 text-3xl font-black text-white">{HOCKER_ROLE_DEFINITIONS.length}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{rolesWithRealExecution.length} rol(es) permiten ejecución real según la definición de código.</p>
        </article>

        <article className="hko-module-card hko-card-tight">
          <ShieldCheck className="h-5 w-5 text-cyan-200" />
          <h2 className="mt-4 text-lg font-black text-white">Portales derivados</h2>
          <p className="mt-2 text-3xl font-black text-white">{HOCKER_CLIENT_PORTALS.length}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{plannedPortals} planificados · {lockedPortals} bloqueados. Ninguno se presenta aquí como despliegue verificado.</p>
        </article>
      </section>

      <section className="hko-map-panel">
        <p className="hko-kicker">Matriz declarada</p>
        <h2 className="mt-2 text-xl font-black text-white">Modelos de portales, no aplicaciones operativas</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Los siguientes registros describen arquitectura, permisos previstos y nivel de riesgo. “Planificado” significa que el portal no existe como producto verificado.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {HOCKER_CLIENT_PORTALS.map((portal) => (
            <article key={portal.portal_id} className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{portal.brand_scope}</p>
                  <h3 className="mt-2 font-black text-white">{portal.name}</h3>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${portalTone(portal.status)}`}>{portal.status === "planned" ? "Planificado" : portal.status === "locked" ? "Bloqueado" : "Definido"}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{portal.notes}</p>
              <p className="mt-3 text-xs text-slate-500">Ruta prevista: {portal.route_prefix}</p>
              <p className="mt-1 text-xs text-slate-500">Riesgo: {portal.risk_level} · acceso cliente: {portal.client_panel_access ? "previsto" : "no permitido"}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="hko-map-panel">
        <p className="hko-kicker">Límite de verificación</p>
        <h2 className="mt-2 text-xl font-black text-white">RLS, grants y hardening requieren telemetría dedicada</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Hocker ONE todavía no ejecuta una inspección completa y recurrente de políticas RLS, grants efectivos, autenticación y configuración del proyecto Supabase. Hasta implementar ese colector, no se mostrará “ready” basándose solo en constantes del repositorio.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/governance" className="hko-action-primary">Revisar gobierno</Link>
          <Link href="/status" className="hko-action-secondary">Ver servicios</Link>
          <Link href="/owner/evidence" className="hko-action-secondary">Ver evidencia</Link>
        </div>
      </section>
    </div>
  );
}
