"use client";

import Image from "next/image";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorText("Completa correo y contraseña.");
      return;
    }

    setLoading(true);
    setErrorText("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) throw error;

      router.replace("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setErrorText(getErrorMessage(err) || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.scene}>
      <section className={styles.card} aria-label="Acceso Hocker ONE">
        <div className={styles.logoBox}>
          <Image
            src="/brand/hocker-one-logo.png"
            alt="Hocker ONE"
            width={1200}
            height={320}
            priority
            className={styles.logo}
          />
        </div>

        <div className={styles.copy}>
          <p>Centro de control</p>
          <h1>Acceso operativo</h1>
          <span>Entra con credenciales reales del ecosistema.</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.field}
          />

          <input
            type="password"
            autoComplete="current-password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.field}
          />

          {errorText ? <div className={styles.statusError}>{errorText}</div> : null}

          <button type="submit" disabled={loading} className={styles.primaryBtn}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
