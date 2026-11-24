"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

type AuthBoxProps = {
  className?: string;
};

export default function AuthBox({ className = "" }: AuthBoxProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    // Passwords are exact strings: spaces may be part of the credential.
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setError("Completa correo y contraseña.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/password-login", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Acceso rechazado.");
      }

      toast.success("Acceso concedido.");
      await new Promise((resolve) => setTimeout(resolve, 200));
      window.location.assign(result.redirectTo || "/owner");
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Acceso rechazado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={[
        "w-full rounded-[26px] border border-white/[0.13] bg-[#0C1729]/95 p-6",
        "shadow-[0_30px_90px_rgba(0,0,0,0.34)] sm:p-8",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-[13px] border border-sky-300/15 bg-sky-300/[0.07] text-sky-300" aria-hidden="true">
          <LockKeyhole className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">Accede a HOCKER ONE</h2>
          <p className="mt-1 text-sm text-slate-300">Usa tu cuenta registrada para continuar.</p>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-[14px] border border-rose-300/15 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200" role="alert">
          {error}
        </div>
      ) : null}

      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-slate-400">Correo</span>
          <input
            value={email}
            type="email"
            required
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="tu@correo.com"
            className="min-h-12 w-full rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-4 text-base text-white outline-none transition focus:border-cyan-300/50 focus:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-cyan-300/20 placeholder:text-slate-700"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-slate-400">Contraseña</span>
          <input
            value={password}
            required
            onChange={(event) => setPassword(event.target.value)}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••"
            className="min-h-12 w-full rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-4 text-base text-white outline-none transition focus:border-sky-300/25 focus:bg-white/[0.04] placeholder:text-slate-700"
          />
          <button type="button" onClick={() => setShowPassword((value) => !value)}
            className="mt-2 inline-flex min-h-10 items-center text-xs font-semibold text-cyan-200 underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-cyan-300"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
            {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          </button>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-cyan-200/30 bg-[#9BE9FF] px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {loading ? "Entrando" : "Entrar"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between border-t border-white/[0.055] pt-4">
        <span className="text-xs text-slate-400">Acceso privado y supervisado</span>
        <Link href="/" className="text-xs font-semibold text-sky-300 transition hover:text-sky-200">
          Volver
        </Link>
      </div>
    </section>
  );
}
