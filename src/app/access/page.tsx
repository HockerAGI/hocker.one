import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";
import {
  HOCKER_ACCESS_EVENTS,
  HOCKER_ACCESS_POLICY_VERSION,
  HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
  HOCKER_ROLE_DEFINITIONS,
} from "@/lib/hocker-roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Access Policy · Hocker ONE",
  description: "Roles mínimos y permisos base para Hocker ONE.",
};

type EventRow = {
  id: string;
  type: string;
  message: string | null;
  created_at: string;
  data: JsonObject | null;
};

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function asText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function safeDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

async function loadAccessEvents() {
  const sb = createAdminSupabase();

  const { data } = await sb
    .from("events")
    .select("id,type,message,created_at,data")
    .eq("project_id", "hocker-one")
    .eq("type", HOCKER_ACCESS_EVENTS.check)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []) as EventRow[];
}

export default async function AccessPage() {
  const events = await loadAccessEvents();

  return (
    <PageShell
      title="Access Policy"
      subtitle="Roles mínimos, permisos base y bloqueo global de ejecución real."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/status" className="hocker-button-secondary">Status</Link>
          <Link href="/integrations" className="hocker-button-secondary">Integraciones</Link>
          <Link href="/dashboard" className="hocker-button-primary">Dashboard</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Bloqueo global activo">
          Esta capa define quién puede ver, solicitar, auditar o validar. Ningún rol puede ejecutar acciones reales todavía. execution_lock permanece activo.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Policy</p>
            <p className="mt-1 text-xs font-black text-white">{HOCKER_ACCESS_POLICY_VERSION}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Roles</p>
            <p className="mt-1 text-3xl font-black text-white">{HOCKER_ROLE_DEFINITIONS.length}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Eventos access</p>
            <p className="mt-1 text-3xl font-black text-white">{events.length}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Execution lock</p>
            <p className="mt-1 text-sm font-black text-rose-300">{String(HOCKER_GLOBAL_REAL_EXECUTION_LOCK)}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {HOCKER_ROLE_DEFINITIONS.map((role) => (
            <article key={role.role} className="hocker-panel-pro overflow-hidden">
              <div className="border-b border-white/5 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{role.role}</p>
                    <h2 className="mt-1 text-lg font-black text-white">{role.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{role.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-300">
                    real execution false
                  </span>
                </div>
              </div>

              <div className="p-5">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Permisos</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {role.permissions.map((permission) => (
                    <span key={permission} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Auditoría</p>
            <h2 className="mt-1 text-lg font-black text-white">Access checks recientes</h2>
          </div>

          <div className="divide-y divide-white/5">
            {events.map((event) => {
              const data = asRecord(event.data);
              const allowed = data.allowed === true;

              return (
                <article key={event.id} className="p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className={allowed ? "text-[10px] font-black uppercase tracking-widest text-emerald-300" : "text-[10px] font-black uppercase tracking-widest text-rose-300"}>
                        {allowed ? "granted" : "denied"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{asText(event.message, "Sin mensaje.")}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        role: {asText(data.role)} · permission: {asText(data.permission)}
                      </p>
                    </div>
                    <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-500">{safeDate(event.created_at)}</p>
                  </div>
                </article>
              );
            })}

            {events.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">
                Todavía no hay access checks registrados.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
