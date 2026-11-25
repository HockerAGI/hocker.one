import "server-only";
import { createServerSupabase } from "@/lib/supabase-server";
import { requirePrivateSession } from "@/lib/require-private-session";

function date(value: string | null) {
  return value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Tijuana" }).format(new Date(value))
    : "Sin fecha";
}

export default async function LiveSessionSignals({ projectId }: { projectId: string }) {
  await requirePrivateSession(projectId);
  const sb = await createServerSupabase();
  const [nodes, commands, events] = await Promise.allSettled([
    sb.from("nodes").select("id,name,last_seen_at").eq("project_id", projectId).order("last_seen_at", { ascending: false }).limit(20),
    sb.from("commands").select("id,command,status,created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(8),
    sb.from("events").select("id,type,message,created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(8),
  ]);
  const nodeRows = nodes.status === "fulfilled" && !nodes.value.error ? nodes.value.data : null;
  const commandRows = commands.status === "fulfilled" && !commands.value.error ? commands.value.data : null;
  const eventRows = events.status === "fulfilled" && !events.value.error ? events.value.data : null;
  return <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
    <h2 className="text-lg font-semibold text-white">Señales de tu proyecto</h2>
    <p className="text-sm text-slate-400">Lectura directa con tu sesión y permisos. Los registros no prueban por sí solos que un nodo esté activo.</p>
    <div className="grid gap-3 xl:grid-cols-3">
      <div className="space-y-2 rounded-xl border border-white/10 p-3"><h3 className="font-medium">Nodos</h3>
        {nodeRows === null ? <p className="text-sm text-amber-100">Consulta sin verificar.</p> : nodeRows.length === 0 ? <p className="text-sm text-slate-400">Sin registros visibles con tu sesión.</p> : nodeRows.map(row => <div key={row.id} className="border-t border-white/10 py-2"><p className="break-words text-sm">{row.name || row.id}</p><p className="text-xs text-slate-400">Última señal: {date(row.last_seen_at)}</p></div>)}
      </div>
      <div className="space-y-2 rounded-xl border border-white/10 p-3"><h3 className="font-medium">Comandos recientes</h3>
        {commandRows === null ? <p className="text-sm text-amber-100">Consulta sin verificar.</p> : commandRows.length === 0 ? <p className="text-sm text-slate-400">Sin registros visibles con tu sesión.</p> : commandRows.map(row => <div key={row.id} className="border-t border-white/10 py-2"><p className="break-words text-sm">{row.command || "Comando"} · {row.status || "Sin estado"}</p><p className="text-xs text-slate-400">{date(row.created_at)}</p></div>)}
      </div>
      <div className="space-y-2 rounded-xl border border-white/10 p-3"><h3 className="font-medium">Eventos recientes</h3>
        {eventRows === null ? <p className="text-sm text-amber-100">Consulta sin verificar.</p> : eventRows.length === 0 ? <p className="text-sm text-slate-400">Sin registros visibles con tu sesión.</p> : eventRows.map(row => <div key={row.id} className="border-t border-white/10 py-2"><p className="break-words text-sm">{row.message || row.type || "Evento"}</p><p className="text-xs text-slate-400">{date(row.created_at)}</p></div>)}
      </div>
    </div>
  </section>;
}
