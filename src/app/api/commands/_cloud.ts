await sb
  .from("commands")
  .update({
    status: "error",
    error: "Firma inválida o ausente.",
    finished_at: nowIso(),
  })
  .eq("id", cmd.id)
  .eq("project_id", project_id);

await sb
  .from("commands")
  .update({
    status: "running",
    started_at: nowIso(),
  })
  .eq("id", cmd.id)
  .eq("project_id", project_id);

await sb
  .from("commands")
  .update({
    status: "done",
    result: resultData,
    error: null,
    executed_at: nowIso(),
    finished_at: nowIso(),
  })
  .eq("id", cmd.id)
  .eq("project_id", project_id);

await sb
  .from("commands")
  .update({
    status: "error",
    error: msg,
    finished_at: nowIso(),
  })
  .eq("id", cmd.id)
  .eq("project_id", project_id);