import { tasks } from "@trigger.dev/sdk/v3";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { ApiError, json, toApiError } from "../../_lib";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));

    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    const secret = process.env.COMMAND_HMAC_SECRET;

    if (!secret || token !== secret) {
      throw new ApiError(401, { error: "Unauthorized." });
    }

    const sb = createAdminSupabase();

    const { data, error } = await sb
      .from("commands")
      .select("id")
      .eq("status", "queued")
      .eq("needs_approval", false)
      .limit(50);

    if (error) throw new ApiError(500, { error: "Query failed." });

    let count = 0;

    for (const row of data ?? []) {
      if (!row.id) continue;

      await tasks.trigger("hocker-core-executor", {
        commandId: row.id,
      });

      count++;
    }

    return json({ ok: true, dispatched: count });
  } catch (err) {
    const e = toApiError(err);
    return json(e.payload, e.status);
  }
}