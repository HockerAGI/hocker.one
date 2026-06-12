import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  HOCKER_ACCESS_GRANT_EVENTS,
  HOCKER_ACCESS_GRANTS_VERSION,
  asRecord,
  asStringArray,
  asText,
} from "@/lib/hocker-access-grants";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Access Grants · Hocker ONE",
  description: "Gestor owner de solicitudes, aprobaciones y revocaciones de portales derivados.",
};

type EventRow = {
  id: string;
  type: string;
  message: string | null;
  created_at: string;
  data: JsonObject | null;
};

function safeDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function badgeClass(type: string): string {
  if (type === HOCKER_ACCESS_GRANT_EVENTS.decision) return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (type === HOCKER_ACCESS_GRANT_EVENTS.revoke) return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  return "border-cyan-400/20 bg-cyan-500/10 text-cyan-300";
}

async function loadGrantEvents(): Promise<EventRow[]> {
  try {
    const sb = createAdminSupabase();

    const { data } = await sb
      .from("events")
      .select("id,type,message,created_at,data")
      .eq("project_id", "hocker-one")
      .in("type", [
        HOCKER_ACCESS_GRANT_EVENTS.request,
        HOCKER_ACCESS_GRANT_EVENTS.decision,
        HOCKER_ACCESS_GRANT_EVENTS.revoke,
      ])
      .order("created_at", { ascending: false })
      .limit(40);

    return (data ?? []) as EventRow[];
  } catch {
    return [];
  }
}

export default async function SecurityGrantsPage() {
  const events = await loadGrantEvents();

  const requests = events.filter((event) => event.type === HOCKER_ACCESS_GRANT_EVENTS.request);
  const decisions = events.filter((event) => event.type === HOCKER_ACCESS_GRANT_EVENTS.decision);
  const revokes = events.filter((event) => event.type === HOCKER_ACCESS_GRANT_EVENTS.revoke);

  return (
    <PageShell
      title="Access Grants"
      subtitle="Solicitudes, aprobaciones y revocaciones lógicas para portales derivados. No crea sesiones reales todavía."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/owner" className="hocker-button-secondary">Owner</Link>
          <Link href="/security" className="hocker-button-secondary">Security</Link>
          <Link href="/access" className="hocker-button-primary">Access</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Modo seguro">
          Este gestor audita decisiones de acceso en Supabase events. Todavía no crea usuarios reales, sesiones, JWTs ni accesos externos activos.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Versión</p>
            <p className="mt-1 text-xs font-black text-white">{HOCKER_ACCESS_GRANTS_VERSION}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Solicitudes</p>
            <p className="mt-1 text-3xl font-black text-cyan-300">{requests.length}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Decisiones</p>
            <p className="mt-1 text-3xl font-black text-emerald-300">{decisions.length}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Revocaciones</p>
            <p className="mt-1 text-3xl font-black text-rose-300">{revokes.length}</p>
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Auditoría</p>
            <h2 className="mt-1 text-lg font-black text-white">Eventos recientes de grants</h2>
          </div>

          <div className="divide-y divide-white/5">
            {events.map((event) => {
              const data = asRecord(event.data);
              const permissions = asStringArray(data.permissions).length
                ? asStringArray(data.permissions)
                : asStringArray(data.allowed_requested_permissions);

              return (
                <article key={event.id} className="p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${badgeClass(event.type)}`}>
                        {event.type}
                      </span>
                      <h3 className="mt-3 text-base font-black text-white">
                        {asText(data.portal_name, asText(data.portal_id, "portal"))}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {event.message ?? "Evento sin mensaje"}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        grantee: {asText(data.grantee_email, "—")} · status: {asText(data.status, "—")}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        grant_id: {asText(data.grant_id, "—")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {permissions.length ? permissions.map((permission) => (
                          <span key={permission} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                            {permission}
                          </span>
                        )) : (
                          <span className="text-xs text-slate-500">Sin permisos listados</span>
                        )}
                      </div>
                    </div>
                    <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {safeDate(event.created_at)}
                    </p>
                  </div>
                </article>
              );
            })}

            {events.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">
                Todavía no hay eventos de grants.
              </div>
            ) : null}
          </div>
        </section>

        <section className="hocker-panel-pro p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Regla</p>
          <h2 className="mt-1 text-xl font-black text-white">Aprobar no crea acceso real todavía.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Las decisiones quedan como eventos auditables. La activación real de usuarios, sesiones y permisos por tenant se hará después del hardening Auth/RLS.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
