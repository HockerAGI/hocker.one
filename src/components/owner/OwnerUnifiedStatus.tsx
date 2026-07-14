import { Activity, Bot, Database, ShieldCheck, Cpu, Zap } from "lucide-react";
import type { HockerLiveSummary } from "@/lib/hocker-live-summary";
import type { HockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";

type Props = {
  liveSummary: HockerLiveSummary | null;
  pulse: HockerLivePulseSummary;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "hace segundos";
  if (diff < 3_600_000) return `hace ${Math.round(diff / 60_000)} min`;
  if (diff < 86_400_000) return `hace ${Math.round(diff / 3_600_000)} h`;
  return `hace ${Math.round(diff / 86_400_000)} d`;
}

function levelTone(level: string | null): "info" | "warn" | "error" {
  if (level === "error") return "error";
  if (level === "warn") return "warn";
  return "info";
}

export default function OwnerUnifiedStatus({ liveSummary, pulse }: Props) {
  const agent = liveSummary?.agent;
  const agentState = agent?.state_label ?? "Sin señal";
  const agentTone = agent?.state === "activo" ? "ok" : agent?.state === "sin_senal_reciente" ? "warn" : "err";

  const security = liveSummary?.security;
  const ownerGate = security?.owner_gate === "activo" ? "ok" : "warn";
  const executionLock = liveSummary?.production?.execution_lock ? "ok" : "warn";

  const novaTone = pulse.source === "supabase" ? "ok" : "warn";

  const counts = pulse.counts;
  const events = liveSummary?.recent_events?.slice(0, 6) ?? [];
  const commands = liveSummary?.recent_commands?.slice(0, 4) ?? [];

  return (
    <section className="hko-uni-panel hko-uni-status">
      <div className="hko-uni-panel-head">
        <div>
          <p className="hko-uni-panel-kicker">Sistema en vivo</p>
          <p className="hko-uni-panel-title">Estado real</p>
        </div>
        <span className="hko-status-val ok">Tiempo real</span>
      </div>
      <div className="hko-uni-panel-body">
        {/* Status rows */}
        <div className="hko-status-row">
          <div className="hko-status-row-left">
            <span className="hko-status-icon"><Zap className="h-4 w-4" /></span>
            <div>
              <div className="hko-status-label">NOVA orquestador</div>
              <div className="hko-status-detail">{pulse.source === "supabase" ? "Conectado · Railway" : "Verificando"}</div>
            </div>
          </div>
          <span className={`hko-status-val ${novaTone}`}>{novaTone === "ok" ? "Activo" : "Pendiente"}</span>
        </div>

        <div className="hko-status-row">
          <div className="hko-status-row-left">
            <span className="hko-status-icon"><Bot className="h-4 w-4" /></span>
            <div>
              <div className="hko-status-label">Agente físico</div>
              <div className="hko-status-detail">{agent?.platform ? `· ${agent.platform}` : "Nodo espejo"} · {timeAgo(agent?.last_seen_at ?? null)}</div>
            </div>
          </div>
          <span className={`hko-status-val ${agentTone}`}>{agentState}</span>
        </div>

        <div className="hko-status-row">
          <div className="hko-status-row-left">
            <span className="hko-status-icon"><ShieldCheck className="h-4 w-4" /></span>
            <div>
              <div className="hko-status-label">Owner Gate</div>
              <div className="hko-status-detail">Permisos protegidos</div>
            </div>
          </div>
          <span className={`hko-status-val ${ownerGate}`}>{ownerGate === "ok" ? "Activo" : "Revisar"}</span>
        </div>

        <div className="hko-status-row">
          <div className="hko-status-row-left">
            <span className="hko-status-icon"><Cpu className="h-4 w-4" /></span>
            <div>
              <div className="hko-status-label">Ejecución</div>
              <div className="hko-status-detail">Bloqueada sin aprobación</div>
            </div>
          </div>
          <span className={`hko-status-val ${executionLock}`}>Bloqueada</span>
        </div>

        {/* Pulse stat grid */}
        <div>
          <p className="hko-uni-panel-kicker" style={{ marginBottom: "0.5rem" }}>Pulso IA</p>
          <div className="hko-uni-statgrid">
            <div className="hko-uni-stat"><span>Memoria</span><strong>{counts.active_memory}</strong></div>
            <div className="hko-uni-stat"><span>AGIs activos</span><strong>{counts.active_agi_updates}</strong></div>
            <div className="hko-uni-stat"><span>Errores</span><strong>{counts.prevented_errors}</strong></div>
            <div className="hko-uni-stat"><span>Aprendizaje</span><strong>{counts.approved_learning}</strong></div>
          </div>
        </div>

        {/* Recent commands */}
        {commands.length > 0 && (
          <div>
            <p className="hko-uni-panel-kicker" style={{ marginBottom: "0.5rem" }}>Comandos recientes</p>
            <div className="hko-uni-feed">
              {commands.map((cmd) => (
                <div key={cmd.id} className="hko-uni-feed-item">
                  <span className={`hko-uni-feed-dot ${cmd.status === "error" ? "error" : cmd.status === "done" ? "info" : "warn"}`} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p className="hko-uni-feed-text">{cmd.command ?? "—"}</p>
                    <p className="hko-uni-feed-time">{cmd.status} · {timeAgo(cmd.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent events */}
        <div>
          <p className="hko-uni-panel-kicker" style={{ marginBottom: "0.5rem" }}>Eventos recientes</p>
          <div className="hko-uni-feed">
            {events.length === 0 ? (
              <p className="hko-uni-feed-empty">Sin eventos recientes.</p>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="hko-uni-feed-item">
                  <span className={`hko-uni-feed-dot ${levelTone(evt.level)}`} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p className="hko-uni-feed-text">{evt.message ?? evt.type ?? "Evento"}</p>
                    <p className="hko-uni-feed-time">{timeAgo(evt.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
