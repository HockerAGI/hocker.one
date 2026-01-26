"use client";

import React, { useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function AuthBox() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    if (!email || !password) return setMsg("Escribe email y password.");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return setMsg(error.message);
      setMsg("Cuenta creada. Si Supabase pide confirmación por correo, revisa tu email.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    window.location.href = "/dashboard";
  }

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setMode("signin")}
          style={{ padding: "8px 10px", cursor: "pointer", opacity: mode === "signin" ? 1 : 0.6 }}
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => setMode("signup")}
          style={{ padding: "8px 10px", cursor: "pointer", opacity: mode === "signup" ? 1 : 0.6 }}
        >
          Crear cuenta
        </button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
        />
        <input
          placeholder="Password"
          value={password}
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
        />
        <button onClick={submit} style={{ padding: "10px 12px", cursor: "pointer" }}>
          {mode === "signin" ? "Entrar" : "Crear"}
        </button>

        {msg ? <div style={{ fontSize: 13, opacity: 0.85 }}>{msg}</div> : null}
      </div>
    </div>
  );
}