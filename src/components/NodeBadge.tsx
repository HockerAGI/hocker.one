"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function NodeBadge() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [userEmail, setUserEmail] = useState<string>("");

  // Nota: envs en client requieren prefijo NEXT_PUBLIC. Aquí solo mostramos un default estático.
  const defaultNodeId = "local-node-01";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
    });
  }, [supabase]);

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div><b>Usuario:</b> {userEmail || "—"}</div>
      <div><b>Node default:</b> {defaultNodeId}</div>
      <div style={{ opacity: 0.75 }}>HOCKER ONE (Control Plane) listo.</div>
    </div>
  );
}