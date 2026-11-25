import Link from "next/link";
import { Bot, ShieldCheck, Zap, Activity } from "lucide-react";
import type { HomeEvidence } from "@/lib/owner-home-evidence";
import type { VerifiedServiceState } from "@/lib/verified-agi-runtime";

function date(value: string | null) {
  return value && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now()
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Tijuana" }).format(new Date(value))
    : "Sin fecha válida";
}

export default function OwnerUnifiedStatus({ evidence, novaService }: { evidence: HomeEvidence; novaService: VerifiedServiceState }) {
  const novaTone = novaService.status === "online" ? "ok" : novaService.status === "offline" ? "err" : "warn";
  const seen = evidence.agent?.lastSeen;
  return <section className="hko-uni-panel hko-uni-status">
    <div className="hko-uni-panel-head">
      <h2 className="hko-uni-panel-title">Operación</h2>
      <Link href="/live" className="text-sm font-semibold text-sky-200">Ver operación</Link>
    </div>
    <div className="hko-uni-panel-body">
      <p className="text-xs text-slate-300">Consulta: {date(evidence.checkedAt)} · Tijuana</p>
      <div className="hko-status-row">
        <div className="hko-status-row-left"><span className="hko-status-icon"><Zap className="h-4 w-4" /></span><div><div className="hko-status-label">Motor dedicado de NOVA</div><div className="hko-status-detail">{novaService.detail}</div></div></div>
        <span className={`hko-status-val ${novaTone}`}>{novaService.status === "online" ? "Responde" : novaService.status === "offline" ? "Sin respuesta" : "Sin verificar"}</span>
      </div>
      <div className="hko-status-row">
        <div className="hko-status-row-left"><span className="hko-status-icon"><Bot className="h-4 w-4" /></span><div><div className="hko-status-label">Agente físico</div><div className="hko-status-detail">{evidence.agent?.name ?? "Nodo local"} · {seen ? date(seen) : "Sin señal registrada en la consulta"}</div></div></div>
        <span className="hko-status-val warn">{seen && date(seen) !== "Sin fecha válida" ? "Última señal" : "Sin verificar"}</span>
      </div>
      <div className="hko-status-row">
        <div className="hko-status-row-left"><span className="hko-status-icon"><ShieldCheck className="h-4 w-4" /></span><div><div className="hko-status-label">Owner Gate</div><div className="hko-status-detail">Aprobación y ejecución separadas</div></div></div>
        <span className={`hko-status-val ${evidence.ownerRole && evidence.ownerMfa === true ? "ok" : "warn"}`}>{evidence.ownerRole && evidence.ownerMfa === true ? "MFA verificado" : "Sesión sin certificar"}</span>
      </div>
      <div className="hko-status-row">
        <div className="hko-status-row-left"><span className="hko-status-icon"><Activity className="h-4 w-4" /></span><div><div className="hko-status-label">Escritura automática</div><div className="hko-status-detail">La política exige aprobación. No es una prueba de ejecución.</div></div></div>
        <span className="hko-status-val info">Política</span>
      </div>
      <details className="hko-mirror-details">
        <summary>Registros de memoria</summary>
        <div className="hko-uni-statgrid mt-3">
          {Object.entries({ "Memorias activas": evidence.memory.active, "Actualizaciones AGI": evidence.memory.updates, "Patrones de error": evidence.memory.patterns, "Aprendizajes aprobados": evidence.memory.learning }).map(([label,value]) => <div key={label} className="hko-uni-stat"><span>{label}</span><strong>{value ?? "—"}</strong></div>)}
        </div>
        <p className="mt-2 text-xs text-slate-300">Los valores sin verificar no son cero. {evidence.environment === "preview" ? "Consulta protegida en Producción." : "Registros persistidos, no actividad en vivo."}</p>
        <Link href="/memory" className="mt-2 inline-flex min-h-11 items-center text-sm text-sky-200">Abrir memoria</Link>
      </details>
    </div>
  </section>;
}
export function OwnerHomeActivity({ evidence }: { evidence: HomeEvidence }) {
  return <section className="hko-uni-panel hko-home-activity">
    <div className="hko-uni-panel-head"><h2 className="hko-uni-panel-title">Actividad reciente</h2><Link href="/live" className="text-sm font-semibold text-sky-200">Ver historial</Link></div>
    <div className="hko-uni-panel-body">
      <p className="text-sm text-slate-300">Eventos visibles con tu sesión.</p>
      {evidence.events === null ? <p className="py-3 text-sm text-amber-100">Consulta no disponible con los permisos actuales.</p> : evidence.events.length === 0 ? <p className="py-3 text-sm text-slate-300">Sin eventos visibles.</p> : <div className="hko-uni-feed mt-3">{evidence.events.map(event => <div key={event.id} className="hko-uni-feed-item"><span className="hko-uni-feed-dot info"/><div className="min-w-0"><p className="hko-uni-feed-text break-words">{event.type ?? "Evento registrado"}</p><p className="hko-uni-feed-time">{date(event.created_at)}</p></div></div>)}</div>}
    </div>
  </section>;
}
