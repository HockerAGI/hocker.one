// /app/api/orchestrator/run/route.ts

import { NextResponse } from "next/server";

export async function POST() {
  try {
    // 1. Obtener estado del sistema
    const healthRes = await fetch(process.env.BASE_URL + "/api/health", {
      cache: "no-store",
    });

    const health = await healthRes.json();

    const actions: Record<string, unknown>[] = [];

    // 2. REGLAS INTELIGENTES

    // 🔴 Si DB falla → reiniciar nodo
    if (!health?.checks?.db) {
      actions.push({
        command: "restart_db",
        priority: "critical",
      });
    }

    // 🔴 Si NOVA falla → reiniciar core
    if (!health?.checks?.novaAgi) {
      actions.push({
        command: "restart_nova",
        priority: "critical",
      });
    }

    // 🟡 Si telemetría cae → reactivar tracking
    if (!health?.checks?.langfuse) {
      actions.push({
        command: "restart_telemetry",
        priority: "medium",
      });
    }

    // 3. EJECUTAR ACCIONES
    for (const act of actions) {
      await fetch(process.env.BASE_URL + "/api/commands", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          project_id: "hocker-core",
          node_id: "orchestrator",
          command: act.command,
          payload: { auto: true, priority: act.priority },
        }),
      });
    }

    return NextResponse.json({
      ok: true,
      actionsExecuted: actions.length,
      actions,
    });
  } catch (err: Record<string, unknown>) {
    return NextResponse.json(
      { error: err.message || "Fallo en orquestador" },
      { status: 500 }
    );
  }
}