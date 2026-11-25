import Link from "next/link";
import { ArrowRight, Bot, PlugZap, ShieldCheck } from "lucide-react";
import type { AgiRuntimeSummaryLike, IntegrationLike } from "@/types/agi-runtime-summary";

type Props = { summary: AgiRuntimeSummaryLike; preview?: boolean; sessionReadVerified?: boolean };

function statusTag(status: string) {
  if (status === "connected") return { cls: "ok", label: "Verificada" };
  if (status === "configured") return { cls: "partial", label: "Configurada" };
  if (status === "partial") return { cls: "partial", label: "Parcial" };
  return { cls: "missing", label: "No disponible" };
}

export default function OwnerUnifiedTools({ summary, preview = false, sessionReadVerified = false }: Props) {
  const integrations: IntegrationLike[] = Array.isArray(summary.integrations)
    ? (summary.integrations as IntegrationLike[])
    : [];
  const verified = integrations.filter((item) => item.status === "connected" && item.verified === true);
  const configured = integrations.filter((item) => item.status === "configured");
  const featured = integrations;
  const remaining = integrations.length - verified.length - configured.length;

  return (
    <section className="hko-uni-panel hko-uni-tools">
      <div className="hko-uni-panel-head">
        <div>
          <p className="hko-uni-panel-kicker">Herramientas, APIs y servicios</p>
          <p className="hko-uni-panel-title">
            {preview ? `${integrations.length} herramientas del catálogo` : `${verified.length} verificadas · ${configured.length} configuradas · ${remaining} sin verificar`}
          </p>
        </div>
        <span className="hko-status-val info">
          <ShieldCheck className="mr-1 inline h-3 w-3" /> Escritura bajo aprobación
        </span>
      </div>

      <div className="hko-uni-panel-body">
        <details className="hko-mirror-details">
          <summary className="py-2 text-sm font-semibold text-cyan-100">Explorar herramientas adicionales</summary>
          <div className="hko-uni-toolgrid mt-3">
          {featured.map((tool) => {
            const tag = tool.tool_key === "supabase" && sessionReadVerified && tool.verified !== true ? { cls: "partial", label: "Lectura de sesión" } : statusTag(tool.status === "connected" && tool.verified !== true ? "configured" : String(tool.status ?? "missing"));
            return (
              <div key={tool.tool_key ?? tool.name} className="hko-uni-tool" title={tool.status_hint}>
                <span className="hko-uni-tool-name">
                  <PlugZap className="h-3.5 w-3.5 shrink-0 text-sky-300/70" />
                  <span>{tool.name ?? tool.tool_key}<small className="block text-slate-300">{tool.supports_read ? "Capacidad: lectura" : ""}{tool.supports_read && tool.supports_write ? " · " : ""}{tool.supports_write ? "Escritura sujeta a aprobación" : ""}{tool.last_verified_at && tool.verified ? " · " + new Date(tool.last_verified_at).toLocaleString("es-MX", {timeZone:"America/Tijuana"}) : ""}</small></span>
                </span>
                <span className={`hko-uni-tool-tag ${tag.cls}`}>{tag.label}</span>
              </div>
            );
          })}

          {integrations.length === 0 ? (
            <p style={{ fontSize: "0.75rem", color: "rgba(100,116,139,1)", padding: "0.5rem" }}>
              Sin inventario disponible.
            </p>
          ) : null}
          </div>
        </details>

        <p className="mt-3 text-xs leading-5 text-slate-400">
          {preview ? "Catálogo y configuración de esta vista. No representa el inventario de conexiones de Producción." : "Configurada: credenciales presentes. Verificada: lectura reciente comprobada."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
          <Link href="/integrations" className="hocker-button-primary inline-flex items-center gap-2">
            Ver conexiones
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/chat" className="hocker-button-secondary inline-flex items-center gap-2">
            <Bot className="h-3.5 w-3.5" />
            Hablar con NOVA
          </Link>
        </div>
      </div>
    </section>
  );
}
