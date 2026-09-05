import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import { loadAgiConversationContext } from "@/lib/agi-session-store";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_LIMIT = 30;

export async function GET(req: Request): Promise<Response> {
  try {
    const query = parseQuery(req);
    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
    const threadId = query.get("thread_id");
    const limit = Math.max(1, Math.min(Number(query.get("limit") || 20), MAX_LIMIT));
    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
    const db = createAdminSupabase();

    if (threadId) {
      const { data: session, error } = await db.from("agi_sessions")
        .select("id,thread_id,project_id,agi_id,user_id,title,summary,status,created_at,updated_at")
        .eq("project_id", ctx.project_id).eq("agi_id", "nova").eq("thread_id", threadId).eq("user_id", ctx.user.id).maybeSingle();
      if (error || !session) return json({ ok: false, error: "Sesión NOVA no encontrada." }, error ? 500 : 404);
      const conversation = await loadAgiConversationContext({
        session_id: session.id, project_id: ctx.project_id, agi_id: "nova", user_id: ctx.user.id,
        limit: Math.min(60, Math.max(1, Number(query.get("messages") || 24))),
      });
      return json({ ok: true, session: { id: session.id, thread_id: session.thread_id, project_id: session.project_id, agi_id: session.agi_id, title: session.title, summary: session.summary, status: session.status, created_at: session.created_at, updated_at: session.updated_at }, messages: conversation.recent_messages });
    }

    const { data: sessions, error } = await db.from("agi_sessions")
      .select("id,thread_id,project_id,agi_id,title,summary,status,created_at,updated_at")
      .eq("project_id", ctx.project_id).eq("agi_id", "nova").eq("user_id", ctx.user.id)
      .order("updated_at", { ascending: false }).limit(limit);
    if (error) throw new Error("NOVA_HISTORY_READ_FAILED: " + error.message);
    return json({ ok: true, project_id: ctx.project_id, sessions: sessions ?? [], count: sessions?.length ?? 0 });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}