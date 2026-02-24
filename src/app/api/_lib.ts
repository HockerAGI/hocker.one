// (Reemplazar la función ensureNode dentro de src/app/api/_lib.ts)

export async function ensureNode(sb: any, project_id: string, node_id: string) {
  const nid = String(node_id || "").trim();
  if (!nid) return;

  const { data: existing, error: e1 } = await sb
    .from("nodes")
    .select("id, project_id")
    .eq("id", nid)
    .maybeSingle();

  if (e1) throw new ApiError(500, { error: "No pude validar el nodo." });

  if (existing?.id && existing.project_id !== project_id) {
    throw new ApiError(400, { error: "Ese nodo pertenece a otro proyecto. Cambia el node_id." });
  }

  if (!existing?.id) {
    // ACTUALIZACIÓN HOCKER FABRIC: Marcador de Nodo Virtual/Cloud
    const isCloudNode = nid.startsWith("cloud-") || nid === "hocker-fabric";
    
    const { error: e2 } = await sb.from("nodes").insert({
      id: nid,
      project_id,
      name: isCloudNode ? `Virtual Node: ${nid}` : nid,
      tags: isCloudNode ? ["auto", "cloud", "zero-trust"] : ["auto"],
      status: isCloudNode ? "online" : "offline", // Nodos cloud nacen online
      meta: { 
          source: "control-plane",
          engine: isCloudNode ? "trigger.dev" : "on-premise",
          trust_level: isCloudNode ? "high" : "pending"
      },
    });

    if (e2 && !String(e2.message || "").toLowerCase().includes("duplicate")) {
      throw new ApiError(500, { error: "No pude crear el nodo automáticamente." });
    }
  }
}