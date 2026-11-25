import { randomBytes } from "node:crypto";

type Payload = Record<string, unknown>;
type TraceLike = { update: (payload?: unknown) => void; event: (payload?: unknown) => void; flushAsync: () => Promise<void> };
function record(value: unknown): Payload { return value && typeof value === "object" && !Array.isArray(value) ? value as Payload : {}; }
function text(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value.slice(0, 120) : fallback; }
function nowNs() { return (BigInt(Date.now()) * 1_000_000n).toString(); }
const attr = (key: string, value: string) => ({ key, value: { stringValue: value } });

/** Completed, request-local OTLP observations. Do not export raw inputs,
 * outputs, user IDs, error bodies, credentials or arbitrary metadata.
 * Supabase audit records remain the authority for material operations. */
export function getLangfuse() {
  return { trace(payload?: unknown): TraceLike {
    const config = record(payload);
    const name = text(config.name, "Hocker operation");
    const endpoint = text(record(config.metadata).endpoint, "");
    const started = nowNs();
    const traceId = randomBytes(16).toString("hex");
    const rootId = randomBytes(8).toString("hex");
    const events: Array<{ name: string; time: string; error: boolean; id: string }> = [];
    let flushed = false;
    return {
      update() { /* Intentionally do not export identity or arbitrary tags. */ },
      event(payload) {
        if (flushed || events.length >= 50) return;
        const item = record(payload);
        events.push({name: text(item.name, "Operation event"), time: nowNs(), error: item.level === "ERROR", id: randomBytes(8).toString("hex")});
      },
      async flushAsync() {
        if (flushed) return;
        flushed = true;
        const publicKey = process.env.LANGFUSE_PUBLIC_KEY?.trim();
        const secretKey = process.env.LANGFUSE_SECRET_KEY?.trim();
        if (!publicKey || !secretKey) return;
        try {
          const url = new URL("/api/public/otel/v1/traces", process.env.LANGFUSE_BASE_URL?.trim() || "https://cloud.langfuse.com");
          if (url.protocol !== "https:" || url.username || url.password) throw new Error("LANGFUSE_ENDPOINT_INVALID");
          const environment = process.env.VERCEL_ENV || "development";
          const shared = [attr("langfuse.trace.name",name),attr("langfuse.environment",environment)];
          if (endpoint) shared.push(attr("langfuse.trace.metadata.endpoint",endpoint));
          const end = nowNs();
          const spans = [
            {traceId,spanId:rootId,name,kind:1,startTimeUnixNano:started,endTimeUnixNano:end,attributes:[...shared,attr("langfuse.observation.type","span")],status:{code:events.some(e=>e.error)?2:0}},
            ...events.map(e=>({traceId,spanId:e.id,parentSpanId:rootId,name:e.name,kind:1,startTimeUnixNano:e.time,endTimeUnixNano:e.time,attributes:[...shared,attr("langfuse.observation.type","event")],status:{code:e.error?2:0}}))
          ];
          const res = await fetch(url,{method:"POST",headers:{Authorization:"Basic "+Buffer.from(publicKey+":"+secretKey).toString("base64"),"Content-Type":"application/json","x-langfuse-ingestion-version":"4"},redirect:"error",cache:"no-store",signal:AbortSignal.timeout(2500),body:JSON.stringify({resourceSpans:[{resource:{attributes:[attr("service.name","hocker-one")]},scopeSpans:[{scope:{name:"hocker-one.operational"},spans}]}]})});
          if (!res.ok) { console.warn("Langfuse OTLP export rejected", {status:res.status}); return; }
          const ack = await res.json().catch(()=>null) as {partialSuccess?:{rejectedSpans?:number|string}} | null;
          if (!ack || Number(ack.partialSuccess?.rejectedSpans ?? 0) > 0) console.warn("Langfuse OTLP export not fully confirmed");
        } catch { console.warn("Langfuse OTLP export unavailable"); }
      },
    };
  }};
}
