"use client";

import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

const LOGO_SRC = "/brand/hocker-one-logo.png";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [okText, setOkText] = useState("");

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) return null;

    return createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorText("");
    setOkText("");

    if (!supabase) {
      setErrorText("Falta la conexión principal.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorText("Completa correo y contraseña.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setErrorText(error.message || "No se pudo iniciar sesión.");
        return;
      }

      setOkText("Acceso correcto. Entrando...");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErrorText("Ocurrió un error al entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`relative min-h-screen overflow-hidden text-white ${styles.scene}`}>
      <div className={styles.grid} />
      <div className={styles.noise} />
      <div className={styles.scan} />
      <div className={styles.orbOne} />
      <div className={styles.orbTwo} />
      <div className={styles.orbThree} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className={`w-full max-w-[480px] rounded-[30px] p-5 sm:p-6 ${styles.panel}`}>
          <div className="relative mb-6 rounded-[24px] p-5 sm:p-6">
            <div className={styles.logoWrap}>
              <div className="relative px-4 py-6 sm:px-6 sm:py-8">
                <div className={styles.logoGlow} />
                <div className="relative mx-auto w-full max-w-[360px]">
                  <Image
                    src={LOGO_SRC}
                    alt="Hocker One"
                    width={900}
                    height={280}
                    priority
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-sky-300/90">
                acceso seguro
              </p>
              <p className="text-sm text-slate-300">
                Entra con tu correo y contraseña.
              </p>
            </div>
          </div>

          <div className={`mb-5 ${styles.miniLine}`} />

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[11px] font-black uppercase tracking-[0.22em] text-slate-300"
              >
                Correo
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.field}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-black uppercase tracking-[0.22em] text-slate-300"
                >
                  Contraseña
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${styles.secondaryBtn}`}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
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

            {okText ? (
              <div className={`rounded-2xl px-4 py-3 text-sm ${styles.statusOk}`}>
                {okText}
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
        </div>
      </div>
    </main>
  );
}
