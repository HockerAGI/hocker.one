"use client";

import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import { useMemo, useState } from "react";

type CommandPayload = Record<string, unknown>;

type CommandResponse = {
  ok?: boolean;
  item?: {
    id?: string;
    status?: string;
  };
  error?: string;
  message?: string;
};

function parseJsonSafe(value: string): { ok: true; data: CommandPayload } | { ok: false; error: string } {
  const raw = value.trim();
  if (!raw) return { ok: true, data: {} };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "El JSON debe ser un objeto." };
    }
    return { ok: true, data: parsed as CommandPayload };
  } catch {
    return { ok: false, error: "JSON inválido." };
  }
}

export default function CommandBox() {
  const { projectId, nodeId } = useWorkspace();
  const [command, setCommand] = useState("");
  const [payload, setPayload] = useState("{\n  \n}");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(() => command.trim().length > 0 && !loading, [command, loading]);

  async function send() {
    const text = command.trim();
    if (!text || loading) return;

    const parsed = parseJsonSafe(payload);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          node_id: nodeId,
          command: text,
          payload: parsed.data,
          needs_approval: needsApproval,
        }),
      });

      const data: unknown = await res.json();
      const body = data && typeof data === "object" ? (data as CommandResponse) : null;

      if (!res.ok) {
        throw new Error(body?.error || body?.message || "No se pudo enviar la orden.");
      }

      setCommand("");
      setPayload("{\n  \n}");
      setNeedsApproval(false);
      setNotice(
        typeof body?.item?.id === "string"
          ? `Orden enviada: ${body.item.id}`
          : "Orden enviada.",
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="hocker-panel-pro space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-sky-400">
          Inyector táctico
        </h3>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
          {projectId}
        </span>
      </div>

      <label className="block space-y-2">
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
          Orden
        </span>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm text-white outline-none transition focus:border-sky-500/40"
          placeholder="deploy / scan / status"
          autoComplete="off"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
          Datos JSON
        </span>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className="min-h-32 w-full rounded-2xl border border-white/5 bg-black/40 p-4 font-mono text-[11px] text-slate-200 outline-none transition focus:border-sky-500/40"
          spellCheck={false}
          placeholder='{"key":"value"}'
        />
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
        <input
          type="checkbox"
          checked={needsApproval}
          onChange={(e) => setNeedsApproval(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-black/30 text-sky-500 focus:ring-sky-500/30"
        />
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
          Requiere aprobación
        </span>
      </label>

      {notice ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-[11px] font-bold uppercase tracking-wide text-emerald-300">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-[11px] font-bold uppercase tracking-wide text-rose-300">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void send()}
        disabled={!canSend}
        className="w-full rounded-2xl bg-sky-500 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-sky-400 active:scale-[0.99] disabled:opacity-50"
      >
        {loading ? "Procesando..." : "Ejecutar orden"}
      </button>
    </section>
  );
}