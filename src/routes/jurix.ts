import { FastifyInstance } from "fastify";
import { requireAuth, readJsonBody, json, toHttpError } from "../lib/http.js";
import { createAuditFingerprint, auditTrailEvent, verifyAuditChain } from "../lib/audit-chain.js";

export async function jurixRoutes(app: FastifyInstance) {
  app.get("/v1/jurix/audit/chain", async (req, reply) => {
    try {
      requireAuth(req);
      const q = req.query as Record<string, unknown>;
      const project_id = String(q.project_id || "hocker-one");
      const limit = Number(q.limit || 500) || 500;

      const { data, error } = await app.supabase
        .from("audit_chain")
        .select("*")
        .eq("project_id", project_id)
        .order("seq", { ascending: true })
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
      const project_id = String(q.project_id || "hocker-one");
      const result = await verifyAuditChain(project_id, Number(q.limit || 5000) || 5000);
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
      const project_id = String(q.project_id || "hocker-one");
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
      const body = await readJsonBody<any>(req);

      const row = await auditTrailEvent({
        project_id: String(body.project_id || "hocker-one"),
        event_type: String(body.event_type || "manual"),
        entity_type: String(body.entity_type || "system"),
        entity_id: body.entity_id ?? null,
        actor_type: body.actor_type ?? "system",
        actor_id: body.actor_id ?? null,
        role: String(body.role || "nova"),
        action: String(body.action || "log"),
        severity: body.severity ?? "info",
        payload: body.payload ?? {}
      });

      return json(reply, 200, { ok: true, row });
    } catch (error) {
      const e = toHttpError(error);
      return json(reply, e.status, { ok: false, error: e.message });
    }
  });
}