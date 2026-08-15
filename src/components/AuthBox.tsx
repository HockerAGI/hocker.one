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
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Completa correo y contraseña.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Acceso rechazado.");
      }

      toast.success("Acceso concedido.");
      await new Promise((resolve) => setTimeout(resolve, 200));
      window.location.assign(result.redirectTo || "/app/nova");
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Acceso rechazado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={[
        "w-full max-w-[30rem] rounded-[24px] border border-white/[0.07] bg-[#07101f]/92 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.42)] sm:p-6",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-[13px] border border-sky-300/15 bg-sky-300/[0.07] text-sky-300">
          <LockKeyhole className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[13px] font-bold text-white">Acceso</p>
          <p className="mt-0.5 text-xs text-slate-500">Tu espacio privado de Hocker One.</p>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-[14px] border border-rose-300/15 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold text-slate-400">Correo</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="tu@correo.com"
            className="min-h-12 w-full rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-4 text-base text-white outline-none transition focus:border-sky-300/25 focus:bg-white/[0.04] placeholder:text-slate-700"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold text-slate-400">Contraseña</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••"
            className="min-h-12 w-full rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-4 text-base text-white outline-none transition focus:border-sky-300/25 focus:bg-white/[0.04] placeholder:text-slate-700"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-sky-200/20 bg-sky-300 px-4 text-[13px] font-black text-[#031018] transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {loading ? "Entrando" : "Entrar"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between border-t border-white/[0.055] pt-4">
        <span className="text-[10px] text-slate-600">Acceso protegido</span>
        <Link href="/" className="text-[10px] font-bold text-sky-300 transition hover:text-sky-200">
          Volver
        </Link>
      </div>
    </section>
  );
}
