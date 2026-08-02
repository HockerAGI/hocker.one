import { Bot, ShieldCheck, Cpu, Zap } from "lucide-react";
import type { HockerLiveSummary } from "@/lib/hocker-live-summary";
import type { HockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";
import type { VerifiedServiceState } from "@/lib/verified-agi-runtime";

type Props = {
  liveSummary: HockerLiveSummary | null;
  pulse: HockerLivePulseSummary;
  novaService: VerifiedServiceState;
  checkedAt: string;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "sin fecha";
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

export default function OwnerUnifiedStatus({ liveSummary, pulse, novaService, checkedAt }: Props) {
  const agent = liveSummary?.agent;
  const agentState = agent?.state_label ?? "Sin señal";
  const agentTone = agent?.state === "activo" ? "ok" : agent?.state === "sin_senal_reciente" ? "warn" : "err";

  const security = liveSummary?.security;
  const ownerGate = security?.owner_gate === "activo" ? "ok" : "warn";
  const executionLock = liveSummary?.production?.execution_lock ? "ok" : "warn";
  const novaTone = novaService.status === "online" ? "ok" : novaService.status === "offline" ? "err" : "warn";
  const novaLabel = novaService.status === "online" ? "Verificada" : novaService.status === "offline" ? "Sin señal" : "Sin verificar";

  const counts = pulse.counts;
  const events = liveSummary?.recent_events?.slice(0, 6) ?? [];
  const commands = liveSummary?.recent_commands?.slice(0, 4) ?? [];

  return (
    <section className="hko-uni-panel hko-uni-status">
      <div className="hko-uni-panel-head">
        <div>
          <p className="hko-uni-panel-kicker">Estado operativo</p>
          <p className="hko-uni-panel-title">Señal y evidencia</p>
        </div>
        <span className="hko-status-val warn">{timeAgo(checkedAt)}</span>
      </div>
      <div className="hko-uni-panel-body">
        <div className="hko-status-row">
          <div className="hko-status-row-left">
            <span className="hko-status-icon"><Zap className="h-4 w-4" /></span>
            <div>
              <div className="hko-status-label">NOVA runtime</div>
              <div className="hko-status-detail">{novaService.detail}</div>
            </div>
          </div>
          <span className={`hko-status-val ${novaTone}`}>{novaLabel}</span>
        </div>

        <div className="hko-status-row">
          <div className="hko-status-row-left">
            <span className="hko-status-icon"><Bot className="h-4 w-4" /></span>
            <div>
              <div className="hko-status-label">Agente físico</div>
              <div className="hko-status-detail">{agent?.platform ?? "Nodo local"} · {timeAgo(agent?.last_seen_at ?? null)}</div>
            </div>
          </div>
          <span className={`hko-status-val ${agentTone}`}>{agentState}</span>
        </div>

        <div className="hko-status-row">
          <div className="hko-status-row-left">
            <span className="hko-status-icon"><ShieldCheck className="h-4 w-4" /></span>
            <div>
              <div className="hko-status-label">Owner Gate</div>
              <div className="hko-status-detail">Regla de aprobación en la sesión privada</div>
            </div>
          </div>
          <span className={`hko-status-val ${ownerGate}`}>{ownerGate === "ok" ? "Configurado" : "Revisar"}</span>
        </div>

        <div className="hko-status-row">
          <div className="hko-status-row-left">
            <span className="hko-status-icon"><Cpu className="h-4 w-4" /></span>
            <div>
              <div className="hko-status-label">Escritura automática</div>
              <div className="hko-status-detail">Debe permanecer bloqueada sin aprobación</div>
            </div>
          </div>
          <span className={`hko-status-val ${executionLock}`}>{executionLock === "ok" ? "Bloqueada" : "Revisar"}</span>
        </div>

        <div>
          <p className="hko-uni-panel-kicker" style={{ marginBottom: "0.5rem" }}>Registros en Supabase</p>
          <div className="hko-uni-statgrid">
            <div className="hko-uni-stat"><span>Memorias registradas</span><strong>{counts.active_memory}</strong></div>
            <div className="hko-uni-stat"><span>Actualizaciones AGI</span><strong>{counts.active_agi_updates}</strong></div>
            <div className="hko-uni-stat"><span>Patrones de error</span><strong>{counts.prevented_errors}</strong></div>
            <div className="hko-uni-stat"><span>Aprendizajes aprobados</span><strong>{counts.approved_learning}</strong></div>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">Estos valores son registros persistidos; no prueban actividad en tiempo real.</p>
        </div>

        {commands.length > 0 ? (
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
        ) : null}

        <div>
          <p className="hko-uni-panel-kicker" style={{ marginBottom: "0.5rem" }}>Eventos registrados</p>
          <div className="hko-uni-feed">
            {events.length === 0 ? (
              <p className="hko-uni-feed-empty">Sin eventos disponibles.</p>
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
