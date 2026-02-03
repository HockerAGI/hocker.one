"use client";

import React, { useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function AuthBox() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function submit() {
    setMsg("");
    if (!email || !password) return setMsg("Escribe email y password.");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);

    window.location.href = "/dashboard";
  }

  return (
    <div style={{ border: "1px solid #e6eefc", borderRadius: 16, padding: 16, background: "#fff" }}>
      <h2 style={{ marginTop: 0 }}>Iniciar sesión</h2>

      <div style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }}
        />
        <input
          placeholder="Password"
          value={password}
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }}
        />
        <button
          onClick={submit}
          style={{
            padding: "12px 14px",
            cursor: "pointer",
            borderRadius: 12,
            border: "1px solid #1e5eff",
            background: "#1e5eff",
            color: "#fff"
          }}
        >
          Entrar
        </button>

        {msg ? <div style={{ fontSize: 13, opacity: 0.85 }}>{msg}</div> : null}
      </div>
    </div>
  );
}