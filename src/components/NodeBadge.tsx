"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function NodeBadge() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [userEmail, setUserEmail] = useState<string>("");

  const defaultNodeId = process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID || "node-hocker-01";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
    });
  }, [supabase]);

  return (
    <div style={{ border: "1px solid #e6eefc", borderRadius: 16, padding: 14, display: "flex", gap: 12, flexWrap: "wrap", background: "#fff" }}>
      <div><b>Usuario:</b> {userEmail || "—"}</div>
      <div><b>Node default:</b> {defaultNodeId}</div>
      <div style={{ opacity: 0.75 }}>Control Plane activo.</div>
    </div>
  );
}