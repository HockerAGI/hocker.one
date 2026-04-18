import type { FastifyInstance } from "fastify";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { json, readJsonBody, requireAuth, toHttpError } from "../lib/http.js";
import {
  appendAuditRecord,
  auditTrailEvent,
  createAuditFingerprint,
  verifyAuditChain,
} from "../lib/audit-chain.js";

function asInt(value: unknown, fallback = 500): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

export async function jurixRoutes(app: FastifyInstance) {
  app.get("/v1/jurix/audit/chain", async (req, reply) => {
    try {
      requireAuth(req);
      const q = req.query as Record<string, unknown>;
      const project_id = String(q.project_id ?? "hocker-one").trim();
      const limit = asInt(q.limit, 500);

      const sb = createAdminSupabase();
      const { data, error } = await sb
        .from("audit_logs")
        .select("id,project_id,actor_user_id,action,context,created_at")
        .eq("project_id", project_id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(limit);

      if (error) throw error;

      return json(reply, 200, { ok: true, chain: data ?? [] });
    } catch (error) {
      const e = toHttpError(error);
      return json(reply, e.status, { ok: false, error: e.message });
    }
  });

  app.get("/v1/jurix/audit/verify", async (req, reply) => {
    try {
      requireAuth(req);
      const q = req.query as Record<string, unknown>;
      const project_id = String(q.project_id ?? "hocker-one").trim();
      const limit = asInt(q.limit, 5000);

      const result = await verifyAuditChain(project_id, limit);
      return json(reply, 200, { ok: true, result });
    } catch (error) {
      const e = toHttpError(error);
      return json(reply, e.status, { ok: false, error: e.message });
    }
  });

  app.get("/v1/jurix/audit/fingerprint", async (req, reply) => {
    try {
      requireAuth(req);
      const q = req.query as Record<string, unknown>;
      const project_id = String(q.project_id ?? "hocker-one").trim();

      const result = await createAuditFingerprint(project_id);
      return json(reply, 200, { ok: true, result });
    } catch (error) {
      const e = toHttpError(error);
      return json(reply, e.status, { ok: false, error: e.message });
    }
  });

  app.post("/v1/jurix/audit/log", async (req, reply) => {
    try {
      requireAuth(req);
      const body = await readJsonBody<Record<string, unknown>>(req);

      const row = await auditTrailEvent({
        project_id: String(body.project_id ?? "hocker-one").trim(),
        event_type: String(body.event_type ?? "manual").trim(),
        entity_type: String(body.entity_type ?? "system").trim(),
        entity_id: body.entity_id == null ? null : String(body.entity_id),
        actor_type: String(body.actor_type ?? "system").trim(),
        actor_id: body.actor_id == null ? null : String(body.actor_id),
        role: String(body.role ?? "nova").trim(),
        action: String(body.action ?? "log").trim(),
        severity: String(body.severity ?? "info").trim(),
        payload: (body.payload && typeof body.payload === "object" && !Array.isArray(body.payload))
          ? (body.payload as Record<string, unknown>)
          : {},
      });

      return json(reply, 200, { ok: true, row });
    } catch (error) {
      const e = toHttpError(error);
      return json(reply, e.status, { ok: false, error: e.message });
    }
  });

  app.post("/v1/jurix/audit/append", async (req, reply) => {
    try {
      requireAuth(req);
      const body = await readJsonBody<Record<string, unknown>>(req);

      const row = await appendAuditRecord({
        project_id: String(body.project_id ?? "hocker-one").trim(),
        action: String(body.action ?? "manual_append").trim(),
        actor_user_id: body.actor_user_id == null ? null : String(body.actor_user_id),
        context: (body.context && typeof body.context === "object" && !Array.isArray(body.context))
          ? (body.context as Record<string, unknown>)
          : {},
      });

      return json(reply, 200, { ok: true, row });
    } catch (error) {
      const e = toHttpError(error);
      return json(reply, e.status, { ok: false, error: e.message });
    }
  });
}