import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";
import {
  CHIDO_SIGNATURE_ALGORITHM,
  CHIDO_SIGNATURE_LAYER_VERSION,
  CHIDO_SIGNATURE_MAX_SKEW_SECONDS,
} from "@/lib/chido-signatures";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Firmas HMAC Chido · Hocker ONE",
  description: "Capa de verificación HMAC para Chido Actions sin ejecución real.",
};

type EventRow = {
  id: string;
  type: string;
  message: string | null;
  created_at: string;
  data: JsonObject | null;
};

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function asText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function safeDate(value: unknown): string {
  const text = asText(value, "");
  if (!text) return "—";
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

async function loadSignatureEvents() {
  const sb = createAdminSupabase();

  const { data } = await sb
    .from("events")
    .select("id,type,message,created_at,data")
    .eq("project_id", "chido-casino")
    .eq("type", "chido.action.signature_check")
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []) as EventRow[];
}

export default async function ChidoSignaturesPage() {
  const events = await loadSignatureEvents();
  const verified = events.filter((event) => asRecord(event.data).signature_verified === true).length;
  const rejected = events.length - verified;

  return (
    <PageShell
      title="Firmas HMAC Chido"
      subtitle="Capa de verificación criptográfica para Chido Actions. No ejecuta acciones reales."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/chido/approvals" className="hocker-button-secondary">Aprobaciones</Link>
          <Link href="/chido/actions" className="hocker-button-secondary">Acciones</Link>
          <Link href="/chido" className="hocker-button-primary">Chido</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Firma no equivale a ejecución">
          Una firma HMAC válida solo confirma integridad, autenticidad del mensaje y aprobación previa. La ejecución real permanece bloqueada.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Versión</p>
            <p className="mt-1 text-xs font-black text-white">{CHIDO_SIGNATURE_LAYER_VERSION}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Algoritmo</p>
            <p className="mt-1 text-sm font-black text-white">HMAC-{CHIDO_SIGNATURE_ALGORITHM}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ventana</p>
            <p className="mt-1 text-sm font-black text-white">{CHIDO_SIGNATURE_MAX_SKEW_SECONDS}s</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ejecución real</p>
            <p className="mt-1 text-sm font-black text-rose-300">Bloqueada</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="hocker-panel-pro p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Verificadas</p>
            <p className="mt-1 text-3xl font-black text-emerald-300">{verified}</p>
          </div>
          <div className="hocker-panel-pro p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Rechazadas</p>
            <p className="mt-1 text-3xl font-black text-rose-300">{rejected}</p>
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Eventos</p>
            <h2 className="mt-1 text-lg font-black text-white">Signature checks recientes</h2>
          </div>

          <div className="divide-y divide-white/5">
            {events.map((event) => {
              const data = asRecord(event.data);
              const ok = data.signature_verified === true;

              return (
                <article key={event.id} className="p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className={ok ? "text-[10px] font-black uppercase tracking-widest text-emerald-300" : "text-[10px] font-black uppercase tracking-widest text-rose-300"}>
                        {ok ? "signature verified" : "signature rejected"}
                      </p>
                      <h3 className="mt-1 text-base font-black text-white">{asText(data.action_id)}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{asText(event.message, "Sin mensaje.")}</p>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{safeDate(event.created_at)}</p>
                  </div>
                </article>
              );
            })}

            {events.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">
                Todavía no hay verificaciones HMAC registradas.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
