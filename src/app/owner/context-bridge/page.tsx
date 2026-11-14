import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { getActiveContextBridgeManifest } from "@/lib/context-bridge";
import { requireOwnerAal2Page } from "@/lib/owner-session-gate";
import ContextBridgeActivationPanel from "./ContextBridgeActivationPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Context Bridge",
  description: "Activación humana y verificable de Context Bridge bajo Owner MFA.",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export default async function OwnerContextBridgePage() {
  await requireOwnerAal2Page("/owner/context-bridge");
  const active = asRecord(await getActiveContextBridgeManifest("hocker-one"));
  const coverage = Array.isArray(active.coverage)
    ? active.coverage.map(asRecord)
    : [];
  const legacyActiveWithoutApproval = active.state === "active" && !String(active.approval_id ?? "").trim();

  return (
    <PageShell
      title="Context Bridge"
      subtitle="Continuidad operativa con activación humana Owner+AAL2, evidencia one-time y cobertura verificable."
    >
      <div className="flex flex-col gap-6">
        <section className="hocker-panel-pro p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-500">
            Manifiesto activo
          </p>
          {Object.keys(active).length > 0 ? (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">ID</p>
                <p className="mt-1 break-all text-sm font-bold text-white">{String(active.id ?? "—")}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Estado</p>
                <p className={`mt-1 text-sm font-bold ${legacyActiveWithoutApproval ? "text-amber-300" : "text-emerald-300"}`}>
                  {legacyActiveWithoutApproval ? "Histórico · verificar" : String(active.state ?? "sin verificar")}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Aprobación</p>
                <p className="mt-1 break-all text-sm font-bold text-white">
                  {String(active.approval_id ?? "—")}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-amber-200">No existe un manifiesto activo para hocker-one.</p>
          )}

          {legacyActiveWithoutApproval ? (
            <p role="status" className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.055] p-3 text-sm leading-6 text-amber-100">
              El manifiesto marcado activo es histórico y no tiene un approval_id asociado.
              No equivale a una nueva aprobación Owner ni a cobertura reciente de las seis fuentes.
              Revisa la evidencia antes de activar una actualización con MFA.
            </p>
          ) : null}

          {coverage.length > 0 ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {coverage.map((item, index) => (
                <div key={String(item.domain_key ?? `coverage-${index}`)} className="rounded-xl border border-white/8 bg-black/20 p-3">
                  <p className="text-[10px] font-bold text-white">{String(item.domain_key ?? "provider")}</p>
                  <p className={`mt-1 text-xs font-black uppercase tracking-widest ${
                    item.status === "complete" ? "text-emerald-300" : "text-amber-300"
                  }`}>
                    {String(item.status ?? "unknown")}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <ContextBridgeActivationPanel />
      </div>
    </PageShell>
  );
}
