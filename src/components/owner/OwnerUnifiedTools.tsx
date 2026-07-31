import Link from "next/link";
import { ArrowRight, Bot, PlugZap, ShieldCheck } from "lucide-react";
import type { AgiRuntimeSummaryLike, IntegrationLike } from "@/types/agi-runtime-summary";

type Props = { summary: AgiRuntimeSummaryLike };

function statusTag(status: string) {
  if (status === "configured" || status === "connected") return { cls: "ok", label: "Conectado" };
  if (status === "partial") return { cls: "partial", label: "Revisar" };
  return { cls: "missing", label: "Falta conectar" };
}

export default function OwnerUnifiedTools({ summary }: Props) {
  const integrations: IntegrationLike[] = Array.isArray(summary.integrations)
    ? (summary.integrations as IntegrationLike[])
    : [];
  const configured = integrations.filter((i) => i.status === "configured" || i.status === "connected");
  const partial = integrations.filter((i) => i.status === "partial");
  const missing = integrations.filter((i) =>
    i.status === "missing" ||
    i.status === "missing_key" ||
    i.status === "missing_code" ||
    i.status === "blocked"
  );
  const featured = [...configured, ...partial, ...missing].slice(0, 12);

  return (
    <section className="hko-uni-panel hko-uni-tools">
      <div className="hko-uni-panel-head">
        <div>
          <p className="hko-uni-panel-kicker">Herramientas, APIs y servicios</p>
          <p className="hko-uni-panel-title">
            {configured.length} conectadas · {partial.length} necesitan revisión · {missing.length} pendientes
          </p>
        </div>
        <span className="hko-status-val info">
          <ShieldCheck className="mr-1 inline h-3 w-3" /> Protegidas por aprobación
        </span>
      </div>

      <div className="hko-uni-panel-body">
        <div className="hko-uni-toolgrid">
          {featured.map((tool) => {
            const tag = statusTag(String(tool.status ?? "missing"));
            return (
              <div key={tool.tool_key ?? tool.name} className="hko-uni-tool">
                <span className="hko-uni-tool-name">
                  <PlugZap className="h-3.5 w-3.5 shrink-0 text-sky-300/70" />
                  <span>{tool.name ?? tool.tool_key}</span>
                </span>
                <span className={`hko-uni-tool-tag ${tag.cls}`}>{tag.label}</span>
              </div>
            );
          })}

          {integrations.length === 0 && (
            <p style={{ fontSize: "0.75rem", color: "rgba(100,116,139,1)", padding: "0.5rem" }}>
              Comprobando herramientas conectadas…
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
          <Link href="/integrations" className="hocker-button-primary inline-flex items-center gap-2">
            Ver herramientas y APIs
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/chat" className="hocker-button-secondary inline-flex items-center gap-2">
            <Bot className="h-3.5 w-3.5" />
            Pedir una acción a NOVA
          </Link>
        </div>
      </div>
    </section>
  );
}
