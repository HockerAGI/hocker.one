"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Cpu, ShieldCheck, RotateCw, ExternalLink } from "lucide-react";
import { describeWebGpuPreflight, NOVA_BROWSER_MODEL_CANDIDATES, NOVA_BROWSER_PREFLIGHT_VERSION } from "@/lib/nova-browser-inference-preflight";

type GpuAdapter = { features?: ReadonlySet<string>; limits?: { maxStorageBufferBindingSize?: number } };
type BrowserWithGpu = Navigator & { gpu?: { requestAdapter: () => Promise<GpuAdapter | null> }; deviceMemory?: number };
type Snapshot = {
  ok?: boolean; observed_at?: string;
  agis?: { registered?: number; all_actions_disabled?: boolean };
  evidence?: { last_inference_record_at?: string | null; nova_runtime_heartbeat_fresh?: boolean };
  warnings?: string[];
};
type Device = { eligible: boolean; reason: string; f16: boolean; memoryGb: number | null; bufferMb: number | null };

export default function NovaLocalPreflight() {
  const [device, setDevice] = useState<Device | null>(null);
  const [testingSession, setTestingSession] = useState(false);
  const [sessionText, setSessionText] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let active = true;
    async function inspect() {
      const browser = navigator as BrowserWithGpu;
      let adapter: GpuAdapter | null = null;
      try {
        if (window.isSecureContext && browser.gpu) adapter = await browser.gpu.requestAdapter();
      } catch {
        adapter = null;
      }
      const result = describeWebGpuPreflight({
        secureContext: window.isSecureContext, gpuApi: Boolean(browser.gpu), adapter: Boolean(adapter),
      });
      if (active) setDevice({
        eligible: result.canAttempt, reason: result.reason,
        f16: adapter?.features?.has("shader-f16") === true,
        memoryGb: typeof browser.deviceMemory === "number" ? browser.deviceMemory : null,
        bufferMb: typeof adapter?.limits?.maxStorageBufferBindingSize === "number"
          ? Math.round(adapter.limits.maxStorageBufferBindingSize / 1048576) : null,
      });
    }
    void inspect();
    return () => { active = false; };
  }, []);

  async function validateSession() {
    setTestingSession(true);
    setSessionText(null);
    setSnapshot(null);
    try {
      const response = await fetch("/api/nova/zero-credit/status", {
        method: "GET", credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        setSessionText(response.status === 401 || response.status === 403
          ? "Se requiere una sesión de Hocker One con rol permitido."
          : "El observador no devolvió un resultado verificable (HTTP " + response.status + ").");
        return;
      }
      const body = await response.json() as Snapshot;
      if (body.ok !== true || typeof body.observed_at !== "string") {
        setSessionText("Respuesta recibida, pero el snapshot no pasó la validación.");
        return;
      }
      setSnapshot(body);
      setSessionText("Lectura autenticada verificada; esto NO acredita inferencia.");
    } catch {
      setSessionText("No se pudo conectar al observador de NOVA.");
    } finally {
      setTestingSession(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#030711] px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto w-full max-w-[840px] space-y-6">
        <Link href="/chat" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-sky-200 hover:bg-white/5">
          <ArrowLeft className="h-4 w-4"/> Volver a NOVA
        </Link>
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-sky-300"><Cpu className="h-4 w-4"/> NOVA · modo local</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Preparación WebGPU sin créditos</h1>
          <p className="text-sm leading-6 text-slate-400">Comprobaciones reales del navegador y la sesión. No se descargan modelos, no se ejecuta inferencia ni se modifican memorias, herramientas, AGIs o aprobaciones.</p>
        </div>
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <h2 className="font-semibold">1 · Diagnóstico del dispositivo</h2>
          <p role="status" className="text-sm text-slate-200">{device === null ? "Comprobando WebGPU…" : device.eligible ? "Adaptador WebGPU detectado: candidato, no certificado" : "WebGPU no disponible en esta sesión"}</p>
          {device && <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
            <p>Diagnóstico: <strong className="text-slate-100">{device.reason}</strong></p>
            <p>Shader F16: <strong className="text-slate-100">{device.f16 ? "Sí" : "No / desconocido"}</strong></p>
            <p>RAM aproximada: <strong className="text-slate-100">{device.memoryGb === null ? "No reportada" : String(device.memoryGb) + " GB"}</strong></p>
            <p>Buffer GPU máximo: <strong className="text-slate-100">{device.bufferMb === null ? "No reportado" : String(device.bufferMb) + " MB"}</strong></p>
          </div>}
          <p className="text-xs text-slate-500">El límite de un buffer no equivale a VRAM total. La presencia de WebGPU no demuestra que un modelo esté instalado o genere respuestas.</p>
        </section>
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <h2 className="font-semibold">2 · Modelos candidatos del catálogo oficial</h2>
          {NOVA_BROWSER_MODEL_CANDIDATES.map(model => (
            <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-white/10 p-3 text-sm" key={model.id}>
              <div><p>{model.label}</p><p className="text-xs text-slate-500">{model.id}</p></div>
              <span className="text-xs text-slate-400">VRAM estimada: {Math.ceil(model.vramMB)} MB</span>
            </div>
          ))}
          <p className="text-xs text-amber-200">No cargaremos JavaScript remoto dentro de la sesión Owner. El siguiente enlace abre el motor oficial en otro origen, únicamente cuando decidas probarlo.</p>
          <a href="https://chat.webllm.ai/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-sky-300/30 px-4 text-sm text-sky-200 hover:bg-sky-300/10">
            Probar WebLLM en otra pestaña <ExternalLink className="h-4 w-4"/>
          </a>
          <p className="text-xs text-slate-500">La prueba externa no recibe tu sesión, memoria ni secretos de Hocker One. No es una prueba de inferencia integrada de NOVA.</p>
        </section>
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-sky-300"/> 3 · Observación autenticada</h2>
          <button type="button" disabled={testingSession} onClick={() => void validateSession()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-300 px-4 text-sm font-semibold text-slate-950 disabled:opacity-40">
            <RotateCw className="h-4 w-4"/> Consultar estado con mi sesión
          </button>
          {sessionText && <p role="status" className="text-sm text-slate-300">{sessionText}</p>}
          {snapshot && <div className="space-y-1 text-sm text-slate-300">
            <p>Observado: {snapshot.observed_at}</p>
            <p>AGIs registradas: {snapshot.agis?.registered ?? "Desconocido"}</p>
            <p>Acciones bloqueadas globalmente: {snapshot.agis?.all_actions_disabled === true ? "Sí" : "No acreditado"}</p>
            <p>Última inferencia registrada: {snapshot.evidence?.last_inference_record_at ?? "Sin evidencia"}</p>
            <p>Heartbeat reciente de NOVA: {snapshot.evidence?.nova_runtime_heartbeat_fresh === true ? "Sí" : "No acreditado"}</p>
            <p>Advertencias: {snapshot.warnings?.length ?? "No disponible"}</p>
          </div>}
          <p className="text-xs leading-5 text-slate-500">Solo GET de un endpoint existente protegido por sesión. Los endpoints Owner/internal de Memory Mirror y feeds no se ejecutan sin su autorización; no se solicita ninguna clave en el navegador.</p>
        </section>
        <p className="text-xs text-slate-600">Versión {NOVA_BROWSER_PREFLIGHT_VERSION}. Inferencia local en Hocker One: NO INSTALADA / NO PROBADA.</p>
      </div>
    </main>
  );
}
