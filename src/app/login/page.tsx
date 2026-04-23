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

      if (error) {
        throw error;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setErrorText(getErrorMessage(err) || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`relative min-h-screen overflow-hidden ${styles.scene}`}>
      <div className={styles.grid} />
      <div className={styles.noise} />
      <div className={styles.scan} />
      <div className={styles.orbOne} />
      <div className={styles.orbTwo} />
      <div className={styles.orbThree} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <section className={`w-full max-w-[440px] rounded-[32px] p-5 sm:p-6 ${styles.panel}`}>
          <div className="relative mb-6 rounded-[28px] p-5 sm:p-6">
            <div className={styles.logoWrap}>
              <div className="relative px-4 py-6 sm:px-5 sm:py-7">
                <div className={styles.logoGlow} />
                <div className="relative mx-auto w-full max-w-[320px]">
                  <Image
                    src="/brand/hocker-one-logo.png"
                    alt="Hocker ONE"
                    width={1200}
                    height={320}
                    priority
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.field}
              />
            </div>

            <div>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.field}
              />
            </div>

            {errorText ? (
              <div className={`rounded-2xl px-4 py-3 text-sm ${styles.statusError}`}>
                {errorText}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-[18px] px-4 py-4 text-sm uppercase ${styles.primaryBtn}`}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
