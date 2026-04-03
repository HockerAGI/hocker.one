'use client';

import { useState } from 'react';

// Tipos estrictos para evitar fugas o inyecciones
type CommandPayload = Record<string, unknown>;

interface CommandResponse {
  ok?: boolean;
  success?: boolean;
  data?: { id: string; status: string };
  error?: string;
  message?: string;
}

// Parseo seguro sin 'any'
function parseJsonSafe(value: string): { ok: true; data: CommandPayload } | { ok: false; error: string } {
  const raw = value.trim();
  if (!raw) return { ok: true, data: {} };
  
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "CRÍTICO: El payload debe ser un objeto JSON válido." };
    }
    return { ok: true, data: parsed as CommandPayload };
  } catch {
    return { ok: false, error: "CRÍTICO: Sintaxis JSON inválida." };
  }
}

export default function CommandBox({ projectId, nodeId }: { projectId: string; nodeId: string }) {
  const [command, setCommand] = useState<string>("");
  const [payloadStr, setPayloadStr] = useState<string>("{\n  \n}");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDispatch = async () => {
    if (!command.trim()) {
      setStatus("error");
      setFeedback("Se requiere un identificador de comando.");
      return;
    }

    const parsed = parseJsonSafe(payloadStr);
    if (!parsed.ok) {
      setStatus("error");
      setFeedback(parsed.error);
      return;
    }

    setStatus("loading");
    setFeedback("Orquestando comando...");

    try {
      const res = await fetch("/api/commands/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          nodeId,
          command: command.trim(),
          payload: parsed.data,
        }),
      });

      const data = (await res.json()) as CommandResponse;

      if (!res.ok || data.error) {
        throw new Error(data.error || "Fallo en la comunicación con el orquestador.");
      }

      setStatus("success");
      setFeedback(`Comando encolado con éxito. ID: ${data.data?.id}`);
      setCommand("");
      setPayloadStr("{\n  \n}");

      setTimeout(() => {
        setStatus("idle");
        setFeedback(null);
      }, 4000);

    } catch (err: unknown) {
      setStatus("error");
      setFeedback(err instanceof Error ? err.message : "Error desconocido en el despliegue.");
    }
  };

  return (
    <div className="bg-hocker-panel border border-white/10 rounded-xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-hocker-accent/50 transition-colors">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-hocker-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      <h3 className="text-sm font-mono text-hocker-accent mb-4 uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 bg-hocker-accent rounded-full animate-pulse"></span>
        Terminal de Enlace
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 font-mono mb-1">Directiva (Comando)</label>
          <input
            type="text"
            className="w-full bg-[#0a0a0c] border border-white/5 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-hocker-accent/50 focus:ring-1 focus:ring-hocker-accent/50 transition-all placeholder:text-gray-700"
            placeholder="ej. sync_biometrics"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            disabled={status === "loading"}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 font-mono mb-1">Carga Útil (JSON Payload)</label>
          <textarea
            className="w-full bg-[#0a0a0c] border border-white/5 rounded-lg px-4 py-2 text-hocker-success font-mono text-sm focus:outline-none focus:border-hocker-success/50 focus:ring-1 focus:ring-hocker-success/50 transition-all h-32 resize-none"
            value={payloadStr}
            onChange={(e) => setPayloadStr(e.target.value)}
            disabled={status === "loading"}
            spellCheck={false}
          />
        </div>

        <button
          onClick={handleDispatch}
          disabled={status === "loading"}
          className="w-full bg-hocker-accent/10 hover:bg-hocker-accent text-hocker-accent hover:text-black border border-hocker-accent/30 font-bold font-mono text-sm py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
        >
          {status === "loading" ? "Procesando..." : "Ejecutar Directiva"}
        </button>

        {feedback && (
          <div className={`p-3 rounded-md text-xs font-mono border ${
            status === "success" ? "bg-hocker-success/10 border-hocker-success/30 text-hocker-success" : 
            status === "error" ? "bg-hocker-alert/10 border-hocker-alert/30 text-hocker-alert" : 
            "bg-white/5 border-white/10 text-gray-400"
          }`}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
