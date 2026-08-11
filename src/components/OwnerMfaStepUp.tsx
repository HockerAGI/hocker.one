"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, QrCode, ShieldCheck } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";

type Stage = "loading" | "challenge" | "enroll" | "verify-enrollment" | "complete";

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

type OwnerMfaStepUpProps = {
  returnTo: string;
};

function safeDestination(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/owner";
}

export default function OwnerMfaStepUp({ returnTo }: OwnerMfaStepUpProps) {
  const destination = useMemo(() => safeDestination(returnTo), [returnTo]);
  const [stage, setStage] = useState<Stage>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function inspectMfa() {
      try {
        const supabase = createBrowserSupabase();
        const { data: assurance, error: assuranceError } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assuranceError) throw assuranceError;

        if (assurance.currentLevel === "aal2") {
          if (!cancelled) {
            setStage("complete");
            window.location.replace(destination);
          }
          return;
        }

        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const verifiedTotp = (factors?.totp ?? []).find((factor) => factor.status === "verified");
        if (cancelled) return;

        if (verifiedTotp) {
          setFactorId(verifiedTotp.id);
          setStage("challenge");
        } else {
          setStage("enroll");
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err) || "No se pudo consultar el estado MFA.");
          setStage("enroll");
        }
      }
    }

    void inspectMfa();
    return () => {
      cancelled = true;
    };
  }, [destination]);

  async function startEnrollment() {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const supabase = createBrowserSupabase();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Hocker ONE Owner",
      });
      if (enrollError) throw enrollError;
      if (!data?.id || !data.totp?.qr_code || !data.totp?.secret) {
        throw new Error("Supabase no devolvió un factor TOTP configurable.");
      }

      setEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setFactorId(data.id);
      setCode("");
      setStage("verify-enrollment");
    } catch (err) {
      setError(getErrorMessage(err) || "No se pudo iniciar la configuración MFA.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (busy) return;
    const cleanCode = code.replace(/\s+/g, "");
    if (!factorId || !/^\d{6}$/.test(cleanCode)) {
      setError("Ingresa el código de 6 dígitos de tu autenticador.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const supabase = createBrowserSupabase();
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: cleanCode,
      });
      if (verifyError) throw verifyError;

      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) throw assuranceError;
      if (assurance.currentLevel !== "aal2") {
        throw new Error("La sesión todavía no alcanzó el nivel AAL2 requerido.");
      }

      setStage("complete");
      window.location.replace(destination);
    } catch (err) {
      setError(getErrorMessage(err) || "No se pudo verificar el segundo factor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-950/90 p-5 shadow-[0_28px_100px_rgba(2,6,23,0.55)] sm:p-7">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
            Owner step-up
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
            Verificación de dos factores
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Las operaciones críticas de Chido requieren una sesión Owner en AAL2. Usa una app TOTP compatible.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {stage === "loading" || stage === "complete" ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4 text-sm text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
          {stage === "complete" ? "Verificación completada. Redirigiendo…" : "Consultando seguridad de la sesión…"}
        </div>
      ) : null}

      {stage === "enroll" ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-start gap-3">
            <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
            <div>
              <p className="font-bold text-white">Configura TOTP una sola vez</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Se generará un QR y una clave de configuración para tu autenticador. No se guardan en Hocker ONE.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={startEnrollment}
            disabled={busy}
            className="hocker-button-brand mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Configurar segundo factor
          </button>
        </div>
      ) : null}

      {stage === "verify-enrollment" && enrollment ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white p-4">
            <Image
              src={enrollment.qrCode}
              alt="Código QR para configurar TOTP"
              width={240}
              height={240}
              unoptimized
              className="mx-auto h-auto w-full max-w-[240px]"
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              Clave manual de respaldo de configuración
            </p>
            <code className="mt-2 block break-all rounded-xl bg-black/30 px-3 py-2 text-xs text-cyan-100">
              {enrollment.secret}
            </code>
          </div>
        </div>
      ) : null}

      {(stage === "challenge" || stage === "verify-enrollment") ? (
        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              Código del autenticador
            </span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-center text-xl font-black tracking-[0.35em] text-white outline-none focus:border-cyan-300/40"
            />
          </label>
          <button
            type="button"
            onClick={verifyCode}
            disabled={busy}
            className="hocker-button-brand w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Verificar y continuar
          </button>
        </div>
      ) : null}

      <p className="mt-5 text-xs leading-5 text-slate-500">
        El segundo factor eleva únicamente la sesión autenticada. No sustituye las reglas de autorización, auditoría ni Owner Gate del servidor.
      </p>
    </section>
  );
}
