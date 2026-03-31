export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "") || "";
    const expectedKey = String(process.env.COMMAND_HMAC_SECRET || "").trim();

    if (!expectedKey || authHeader !== expectedKey) {
      throw new ApiError(401, { error: "Firma de delegación inválida." });
    }

    const sb = createAdminSupabase();
    // ... Lógica de filtrado de comandos ...

    let count = 0;
    for (const cmd of cloudCommands) {
      try {
        await tasks.trigger("hocker-core-executor", { commandId: cmd.id });
        count++;
      } catch (err: unknown) {
        console.error(`[NOVA] Falla en despacho ${cmd.id}:`, getErrorMessage(err));
      }
    }

    return json({ ok: true, dispatched: count });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    return json(apiErr.body, apiErr.status);
  }
}
