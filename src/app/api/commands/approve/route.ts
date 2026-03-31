export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Aprobación_Manual", metadata: { endpoint: "/api/commands/approve" } });
  try {
    const body = await parseBody(req);
    const id = String(body.id ?? "").trim();
    const ctx = await requireProjectRole(body.project_id, ["owner", "admin"]);

    // ...Validación de firma y estado...

    await tasks.trigger("hocker-core-executor", { commandId: id });
    
    return json({ ok: true, message: "Orden autorizada. Ejecución en curso." });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    return json(apiErr.body, apiErr.status);
  }
}
