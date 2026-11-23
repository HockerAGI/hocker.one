"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Cloud, Database, Github, RefreshCw, ShieldCheck } from "lucide-react";

type ProviderStatus = {
  configured?: boolean;
  verified_read?: boolean;
  state?: string;
};

type ReadinessResponse = {
  ok?: boolean;
  checked_at?: string;
  checked_environment?: string;
  production_scope_verified?: boolean;
  github_identity_kind?: "pat" | "github_app" | "missing" | "not_checked";
  github_read_probe_repositories?: string[];
  github?: ProviderStatus;
  vercel?: ProviderStatus;
  owner_gate_reason?: string;
};

type Props = {
  supabase: {
    verified: boolean;
    agiCount: number | null;
    checkedAt: string | null;
  };
};

function safeTimestamp(value: string | null | undefined): string {
  if (!value) return "Sin comprobación";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sin comprobación" : date.toLocaleString("es-MX");
}

export default function OwnerProviderMirror({ supabase }: Props) {
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [accessReason, setAccessReason] = useState<"session" | "mfa" | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const verify = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch("/api/agi/runtime/integrations/readiness", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        signal,
      });
      const data = await response.json() as ReadinessResponse;
      if (!response.ok || data.ok !== true) {
        setReadiness(null);
        setAccessReason(response.status === 401 ? "session" :
          response.status === 403 && data.owner_gate_reason === "owner_mfa_required" ? "mfa" : null);
        setError(response.status !== 401 && response.status !== 403);
        return;
      }
      setReadiness(data);
      setAccessReason(null);
      setError(false);
    } catch {
      if (signal?.aborted) return;
      setReadiness(null);
      setAccessReason(null);
      setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void verify(controller.signal);
    return () => controller.abort();
  }, [verify]);

  const production = readiness?.ok === true &&
    readiness.checked_environment === "production" &&
    readiness.production_scope_verified === true;
  const githubVerified = production && readiness?.github?.configured === true &&
    readiness.github.verified_read === true;
  const vercelVerified = production && readiness?.vercel?.configured === true &&
    readiness.vercel.verified_read === true;
  const githubConfigured = production && readiness?.github?.configured === true;
  const vercelConfigured = production && readiness?.vercel?.configured === true;
  const githubKind = readiness?.github_identity_kind === "github_app" ? "GitHub App" :
    readiness?.github_identity_kind === "pat" ? "PAT" : "Sin identificar";
  const repositoryCount = Array.isArray(readiness?.github_read_probe_repositories)
    ? readiness.github_read_probe_repositories.length : 0;

  return (
    <section className="hko-uni-panel hko-uni-mirror" aria-labelledby="hko-mirror-heading">
      <div className="hko-mirror-heading">
        <div>
          <p className="hko-uni-panel-kicker">Conexiones esenciales</p>
          <h2 className="hko-mirror-title" id="hko-mirror-heading">Todo lo importante, en un vistazo</h2>
          <p className="hko-mirror-description">Comprobaciones reales, no una lista de credenciales guardadas.</p>
        </div>
        <button className="hko-mirror-refresh" type="button" onClick={() => void verify()}
          disabled={loading} aria-label="Actualizar estado de integraciones">
          <RefreshCw size={17} aria-hidden="true" className={loading ? "hko-mirror-spin" : ""} />
          <span>{loading ? "Comprobando" : "Actualizar"}</span>
        </button>
      </div>

      <div className="hko-mirror-grid" aria-live="polite" aria-busy={loading}>
        <article className="hko-mirror-card">
          <div className="hko-mirror-card-top">
            <span className="hko-mirror-icon"><Database size={20} aria-hidden="true" /></span>
            <span className={"hko-mirror-state " + (supabase.verified ? "is-verified" : "is-pending")}>
              {supabase.verified ? "Lectura confirmada" : "Sin verificar"}
            </span>
          </div>
          <h3>Supabase</h3>
          <p className="hko-mirror-card-value">
            {supabase.verified && supabase.agiCount !== null ? String(supabase.agiCount) + " AGIs" : "Datos no disponibles"}
          </p>
          <p className="hko-mirror-card-caption">Registros persistidos · no actividad en tiempo real</p>
        </article>

        <article className="hko-mirror-card">
          <div className="hko-mirror-card-top">
            <span className="hko-mirror-icon"><Github size={20} aria-hidden="true" /></span>
            <span className={"hko-mirror-state " + (githubVerified ? "is-verified" : "is-pending")}>
              {loading && !readiness ? "Comprobando" : githubVerified ? "Lectura confirmada" : githubConfigured ? "Configurado" : "Sin verificar"}
            </span>
          </div>
          <h3>GitHub</h3>
          <p className="hko-mirror-card-value">{githubVerified ? String(repositoryCount) + " repositorios" : "Sin lectura confirmada"}</p>
          <p className="hko-mirror-card-caption">{githubVerified ? "Autenticación utilizada: " + githubKind : "Validación protegida por Owner MFA"}</p>
        </article>

        <article className="hko-mirror-card">
          <div className="hko-mirror-card-top">
            <span className="hko-mirror-icon"><Cloud size={20} aria-hidden="true" /></span>
            <span className={"hko-mirror-state " + (vercelVerified ? "is-verified" : "is-pending")}>
              {loading && !readiness ? "Comprobando" : vercelVerified ? "Lectura confirmada" : vercelConfigured ? "Configurado" : "Sin verificar"}
            </span>
          </div>
          <h3>Vercel</h3>
          <p className="hko-mirror-card-value">{vercelVerified ? "Proyecto accesible" : vercelConfigured ? "Pendiente de lectura" : "Conexión pendiente"}</p>
          <p className="hko-mirror-card-caption">Acceso del runtime a la API · distinto del despliegue web</p>
        </article>
      </div>

      <div className="hko-mirror-footer">
        <div className="hko-mirror-proof">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>{accessReason === "mfa" ? "Completa MFA Owner para consultar GitHub y Vercel." :
            accessReason === "session" ? "Inicia sesión como Owner para verificar las integraciones." :
            error ? "No se pudo consultar el estado de proveedores. Reintenta." :
            loading && !readiness ? "Consultando conexiones protegidas..." :
            "Consulta de solo lectura · Owner Gate activo"}</span>
        </div>
        <div className="hko-mirror-links">
          {accessReason === "mfa" ? <Link href="/auth/mfa?returnTo=%2Fowner">Verificar MFA</Link> : null}
          {accessReason === "session" ? <Link href="/login">Iniciar sesión</Link> : null}
          <Link href="/integrations">Ver todas las integraciones</Link>
        </div>
      </div>

      <details className="hko-mirror-details">
        <summary>Ver fuente y fecha de cada estado</summary>
        <div className="hko-mirror-details-grid">
          <p><CheckCircle2 size={14} aria-hidden="true" /> Supabase: conteo consultado desde la base de datos. {safeTimestamp(supabase.checkedAt)}.</p>
          <p><CheckCircle2 size={14} aria-hidden="true" /> GitHub: {githubVerified ? "lectura verificada con " + githubKind : "sin lectura certificada"}. {safeTimestamp(readiness?.checked_at)}.</p>
          <p><CheckCircle2 size={14} aria-hidden="true" /> Vercel: {vercelVerified ? "lectura verificada" : "sin lectura certificada"}. {safeTimestamp(readiness?.checked_at)}.</p>
          {readiness?.github_identity_kind === "pat" ? <p className="hko-mirror-note">La lectura por PAT no certifica la GitHub App.</p> : null}
        </div>
      </details>
    </section>
  );
}
