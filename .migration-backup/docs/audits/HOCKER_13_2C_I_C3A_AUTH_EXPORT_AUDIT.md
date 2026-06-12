# HOCKER ONE · 13-2C-I-C3-A Auth/Login + Evidence Export Audit

## Objetivo

Auditar login/AuthBox y export-audit antes de fusionar. No se modifica producto en esta fase.

## Seguridad

- No se borra nada.
- No se fusiona nada todavía.
- No se toca runtime.
- No se toca middleware/proxy.
- No se exponen secretos.
- No se agregan endpoints productivos.

## Git

- Branch: `nova/phase13-2c-i-c3a-auth-export-audit`
- HEAD: `ae94e10`


## `src/components/AuthBox.tsx`

**Estado:** existe

- Líneas: `176`
- SHA256: `804d29712f23f39edf86197752faac0bc6f9a284ddd7bc28b36c26512669bdf5`

### Referencias

```text
src/components/AuthBox.tsx:11:type AuthBoxProps = {
src/components/AuthBox.tsx:15:export default function AuthBox({ className = "" }: AuthBoxProps) {
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:143:src/components/AuthBox.tsx:40:      const response = await fetch("/api/auth/password-login", {
docs/audits/HOCKER_13_2C_I_C2_UI_LEGACY_VALUE_FUSION.md:20:- `AuthBox.tsx`: requiere comparación contra `/login`.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:5:Auditar login/AuthBox y export-audit antes de fusionar. No se modifica producto en esta fase.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:22:## `src/components/AuthBox.tsx`
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:5:      "file": "src/components/AuthBox.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:22:        "export default function AuthBox({ className = \"\" }: AuthBoxProps) {"
```

### Señales sensibles / server-only / mutación

```text
20:  const [password, setPassword] = useState("");
29:    const cleanPassword = password.trim();
40:      const response = await fetch("/api/auth/password-login", {
41:        method: "POST",
45:          password: cleanPassword,
133:              value={password}
135:              type="password"
136:              autoComplete="current-password"
```

### Contenido

```tsx
import Link from "next/link";
"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Sparkles, LockKeyhole, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";

type AuthBoxProps = {
  className?: string;
};

export default function AuthBox({ className = "" }: AuthBoxProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);

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
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Acceso rechazado.");
      }

      toast.success("Acceso concedido.");
      await new Promise((resolve) => setTimeout(resolve, 250));
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
        "relative w-full max-w-[34rem] overflow-hidden rounded-[36px] border border-white/5",
        "bg-slate-950/82 p-5 shadow-[0_30px_120px_rgba(2,6,23,0.5)] sm:p-7",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-sky-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Cuenta lista
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
            Sesión privada
          </span>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-300">
            Entrada segura
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Inicia sesión
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Acceso con Supabase Auth para mantener la matriz limpia, segura y sincronizada.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/15 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : (
          <div className="rounded-2xl border border-sky-400/10 bg-sky-500/5 px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-sky-300" />
              Acceso privado con confirmación inmediata.
            </div>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-4 transition-all focus-within:border-sky-400/20 focus-within:bg-white/[0.045]">
            <label className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500">
              Correo
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="tu@correo.com"
              className="mt-2 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-4 transition-all focus-within:border-sky-400/20 focus-within:bg-white/[0.045]">
            <label className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500">
              Contraseña
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••"
              className="mt-2 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="hocker-button-brand w-full justify-center py-4 text-[10px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando acceso
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Entrar ahora
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
            Acceso privado
          </p>
          <Link
            href="/"
            className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-300 transition hover:text-sky-200"
          >
            Volver
          </Link>
        </div>
      </div>
    </section>
  );
}
```

## `src/app/login/page.tsx`

**Estado:** existe

- Líneas: `108`
- SHA256: `ce3feec3206bbba07650d37abd18b18c205218c98cadfcf0b5fee53d31a197c2`

### Referencias

```text
src/app/agis/page.tsx:15:    <div className="hko-page-flow space-y-5">
src/app/commands/page.tsx:14:    <div className="hko-page-flow space-y-4">
src/app/globals.css:321:.hko-page-shell {
src/app/globals.css:326:.hko-page-card {
src/app/globals.css:334:.hko-page-head {
src/app/globals.css:342:.hko-page-head.is-compact {
src/app/globals.css:346:.hko-page-title-block {
src/app/globals.css:350:.hko-page-eyebrow {
src/app/globals.css:359:.hko-page-title-block h1 {
src/app/globals.css:368:.hko-page-title-block > p {
src/app/globals.css:376:.hko-page-chips,
src/app/globals.css:377:.hko-page-actions {
src/app/globals.css:383:.hko-page-chips {
src/app/globals.css:387:.hko-page-chips span {
src/app/globals.css:711:  .hko-page-card,
src/app/globals.css:719:  .hko-page-head,
src/app/globals.css:957:.hko-page-card,
src/app/globals.css:964:.hko-page-card::before {
src/app/globals.css:977:.hko-page-head,
src/app/globals.css:978:.hko-page-body,
src/app/globals.css:979:.hko-page-actions,
src/app/globals.css:980:.hko-page-title-block {
src/app/globals.css:1105:.hko-page-flow { padding-bottom: 9.5rem; }
src/app/globals.css:1106:@media (min-width: 768px) { .hko-page-flow { padding-bottom: 2rem; } }
src/app/globals.css:1195:.hko-page-flow { padding-bottom: 9.5rem; }
src/app/globals.css:1196:@media (min-width: 768px) { .hko-page-flow { padding-bottom: 2rem; } }
src/app/globals.css:1294:  .hko-page-flow {
src/app/globals.css:1320:  .hko-page-card,
src/app/globals.css:1332:  .hko-page-eyebrow {
src/app/globals.css:1336:  .hko-page-title-block h1 {
src/app/globals.css:1341:  .hko-page-title-block > p,
src/app/globals.css:1977:.hko-page,
src/app/globals.css:1978:.hko-owner-page {
src/app/globals.css:2716:.hko-page-flow {
src/app/owner/page.tsx:38:    <div className="hko-page-flow space-y-5">
src/app/apps/page.tsx:14:    <div className="hko-page-flow space-y-5">
src/app/servicios/page.tsx:13:  { title: "Landing pages", text: "Páginas claras para captar clientes.", icon: Globe2 },
src/app/live/page.tsx:138:    <main className="hko-page-flow space-y-4">
src/app/app/actividad/page.tsx:12:export { default } from "../../live/page";
src/app/app/ecosistema/page.tsx:12:export { default } from "../../map/page";
src/app/app/nova/page.legacy-13fixa1.tsx:12:export { default } from "../../chat/page";
src/app/app/page.tsx:12:export { default } from "../dashboard/page";
src/app/app/pendientes/page.tsx:12:export { default } from "../../commands/page";
src/components/AppNav.tsx:50:            aria-current={active ? "page" : undefined}
src/components/BottomDock.tsx:29:              aria-current={active ? "page" : undefined}
src/components/PageShell.tsx:35:    <section className={cn("hko-page-shell", className)}>
src/components/PageShell.tsx:36:      <div className="hko-page-card">
src/components/PageShell.tsx:37:        <header className={compact ? "hko-page-head is-compact" : "hko-page-head"}>
src/components/PageShell.tsx:38:          <div className="hko-page-title-block">
src/components/PageShell.tsx:39:            {eyebrow ? <p className="hko-page-eyebrow">{eyebrow}</p> : null}
src/components/PageShell.tsx:46:              <div className="hko-page-chips">
src/components/PageShell.tsx:53:          {actions ? <div className="hko-page-actions">{actions}</div> : null}
src/components/PageShell.tsx:58:        <div className="hko-page-body">{children}</div>
src/components/Sidebar.tsx:68:              aria-current={active ? "page" : undefined}
src/lib/hocker-public-private-topology.ts:137:      public_pages_must_not_expose_runtime_state: true,
src/lib/hocker-public-private-topology.ts:138:      private_pages_require_session: true,
src/lib/hocker-public-private-topology.ts:139:      private_pages_noindex: true,
src/lib/hocker-public-private-topology.ts:140:      protected_pages_noindex: true,
src/lib/hocker-provider-orchestrator.ts:152:      key: "pagespeed_insights",
src/lib/hocker-diagnostics-provider-router.ts:5:  | "pagespeed_insights"
src/lib/hocker-diagnostics-provider-router.ts:53:      "pagespeed_insights",
src/lib/hocker-diagnostics-provider-router.ts:93:      key: "pagespeed_insights",
src/lib/hocker-diagnostics-provider-router.ts:156:  const psi = providers.find((provider) => provider.key === "pagespeed_insights");
docs/ops/post-guardrails-production-validation.md:29:- Public pages validated.
docs/ops/post-guardrails-production-validation.md:30:- Private pages redirect as expected.
docs/ops/production-smoke-test.md:9:- Public pages.
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:4:src/app/owner/actions/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:5:src/app/owner/agis/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:6:src/app/owner/apps/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:7:src/app/owner/command-center/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:8:src/app/owner/ecosystem/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:9:src/app/owner/evidence/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:11:src/app/owner/nova/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:12:src/app/owner/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:123:src/app/commands/page.tsx:21:        <p className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 text-sm leading-relaxed text-slate-300">Las acciones sensibles deben quedar protegidas por aprobación, owner gate o ejecución bloqueada cuando corresponda.</p>
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:127:src/app/login/page.tsx:35:      const response = await fetch("/api/auth/password-login", {
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:142:src/app/live/page.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:33:        "file": "src/app/launch/page.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:39:        "file": "src/app/security/rls/page.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:403:          "file": "HOCKER_FULL_SOURCE_CODE_AUDIT_20260524_213950/repos/hocker.one/src/app/launch/page.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:410:          "file": "HOCKER_FULL_SOURCE_CODE_AUDIT_20260524_213950/repos/hocker.one/src/app/security/rls/page.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:688:          "file": "HOCKER_13_ZERO_REAL_AUDIT_20260524_192900/source/hocker.one/src/app/launch/page.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:695:          "file": "HOCKER_13_ZERO_REAL_AUDIT_20260524_192900/source/hocker.one/src/app/security/rls/page.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:384:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:385:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:473:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:384:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:474:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:385:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_AUDIT.json:5:    "owner_nova_page": "src/app/owner/nova/page.tsx",
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:49:## Owner NOVA page
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:236:## `src/app/login/page.tsx`
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:246:src/app/agis/page.tsx:15:    <div className="hko-page-flow space-y-5">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:247:src/app/commands/page.tsx:14:    <div className="hko-page-flow space-y-4">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:248:src/app/globals.css:321:.hko-page-shell {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:249:src/app/globals.css:326:.hko-page-card {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:250:src/app/globals.css:334:.hko-page-head {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:251:src/app/globals.css:342:.hko-page-head.is-compact {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:252:src/app/globals.css:346:.hko-page-title-block {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:253:src/app/globals.css:350:.hko-page-eyebrow {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:254:src/app/globals.css:359:.hko-page-title-block h1 {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:255:src/app/globals.css:368:.hko-page-title-block > p {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:256:src/app/globals.css:376:.hko-page-chips,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:257:src/app/globals.css:377:.hko-page-actions {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:258:src/app/globals.css:383:.hko-page-chips {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:259:src/app/globals.css:387:.hko-page-chips span {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:260:src/app/globals.css:711:  .hko-page-card,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:261:src/app/globals.css:719:  .hko-page-head,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:262:src/app/globals.css:957:.hko-page-card,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:263:src/app/globals.css:964:.hko-page-card::before {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:264:src/app/globals.css:977:.hko-page-head,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:265:src/app/globals.css:978:.hko-page-body,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:266:src/app/globals.css:979:.hko-page-actions,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:267:src/app/globals.css:980:.hko-page-title-block {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:268:src/app/globals.css:1105:.hko-page-flow { padding-bottom: 9.5rem; }
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:269:src/app/globals.css:1106:@media (min-width: 768px) { .hko-page-flow { padding-bottom: 2rem; } }
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:270:src/app/globals.css:1195:.hko-page-flow { padding-bottom: 9.5rem; }
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:271:src/app/globals.css:1196:@media (min-width: 768px) { .hko-page-flow { padding-bottom: 2rem; } }
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:272:src/app/globals.css:1294:  .hko-page-flow {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:273:src/app/globals.css:1320:  .hko-page-card,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:274:src/app/globals.css:1332:  .hko-page-eyebrow {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:275:src/app/globals.css:1336:  .hko-page-title-block h1 {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:276:src/app/globals.css:1341:  .hko-page-title-block > p,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:277:src/app/globals.css:1977:.hko-page,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:278:src/app/globals.css:1978:.hko-owner-page {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:279:src/app/globals.css:2716:.hko-page-flow {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:280:src/app/owner/page.tsx:38:    <div className="hko-page-flow space-y-5">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:281:src/app/apps/page.tsx:14:    <div className="hko-page-flow space-y-5">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:282:src/app/servicios/page.tsx:13:  { title: "Landing pages", text: "Páginas claras para captar clientes.", icon: Globe2 },
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:283:src/app/live/page.tsx:138:    <main className="hko-page-flow space-y-4">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:284:src/app/app/actividad/page.tsx:12:export { default } from "../../live/page";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:285:src/app/app/ecosistema/page.tsx:12:export { default } from "../../map/page";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:286:src/app/app/nova/page.legacy-13fixa1.tsx:12:export { default } from "../../chat/page";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:287:src/app/app/page.tsx:12:export { default } from "../dashboard/page";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:288:src/app/app/pendientes/page.tsx:12:export { default } from "../../commands/page";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:289:src/components/AppNav.tsx:50:            aria-current={active ? "page" : undefined}
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:290:src/components/BottomDock.tsx:29:              aria-current={active ? "page" : undefined}
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:291:src/components/PageShell.tsx:35:    <section className={cn("hko-page-shell", className)}>
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:292:src/components/PageShell.tsx:36:      <div className="hko-page-card">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:293:src/components/PageShell.tsx:37:        <header className={compact ? "hko-page-head is-compact" : "hko-page-head"}>
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:294:src/components/PageShell.tsx:38:          <div className="hko-page-title-block">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:295:src/components/PageShell.tsx:39:            {eyebrow ? <p className="hko-page-eyebrow">{eyebrow}</p> : null}
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:296:src/components/PageShell.tsx:46:              <div className="hko-page-chips">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:297:src/components/PageShell.tsx:53:          {actions ? <div className="hko-page-actions">{actions}</div> : null}
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:298:src/components/PageShell.tsx:58:        <div className="hko-page-body">{children}</div>
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:299:src/components/Sidebar.tsx:68:              aria-current={active ? "page" : undefined}
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:300:src/lib/hocker-public-private-topology.ts:137:      public_pages_must_not_expose_runtime_state: true,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:301:src/lib/hocker-public-private-topology.ts:138:      private_pages_require_session: true,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:302:src/lib/hocker-public-private-topology.ts:139:      private_pages_noindex: true,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:303:src/lib/hocker-public-private-topology.ts:140:      protected_pages_noindex: true,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:304:src/lib/hocker-provider-orchestrator.ts:152:      key: "pagespeed_insights",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:305:src/lib/hocker-diagnostics-provider-router.ts:5:  | "pagespeed_insights"
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:306:src/lib/hocker-diagnostics-provider-router.ts:53:      "pagespeed_insights",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:307:src/lib/hocker-diagnostics-provider-router.ts:93:      key: "pagespeed_insights",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:308:src/lib/hocker-diagnostics-provider-router.ts:156:  const psi = providers.find((provider) => provider.key === "pagespeed_insights");
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:309:docs/ops/post-guardrails-production-validation.md:29:- Public pages validated.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:310:docs/ops/post-guardrails-production-validation.md:30:- Private pages redirect as expected.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:311:docs/ops/production-smoke-test.md:9:- Public pages.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:312:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:4:src/app/owner/actions/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:313:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:5:src/app/owner/agis/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:314:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:6:src/app/owner/apps/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:315:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:7:src/app/owner/command-center/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:316:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:8:src/app/owner/ecosystem/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:317:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:9:src/app/owner/evidence/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:318:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:11:src/app/owner/nova/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:319:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:12:src/app/owner/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:320:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:123:src/app/commands/page.tsx:21:        <p className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 text-sm leading-relaxed text-slate-300">Las acciones sensibles deben quedar protegidas por aprobación, owner gate o ejecución bloqueada cuando corresponda.</p>
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:321:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:127:src/app/login/page.tsx:35:      const response = await fetch("/api/auth/password-login", {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:322:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:142:src/app/live/page.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:323:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:33:        "file": "src/app/launch/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:324:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:39:        "file": "src/app/security/rls/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:325:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:403:          "file": "HOCKER_FULL_SOURCE_CODE_AUDIT_20260524_213950/repos/hocker.one/src/app/launch/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:326:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:410:          "file": "HOCKER_FULL_SOURCE_CODE_AUDIT_20260524_213950/repos/hocker.one/src/app/security/rls/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:327:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:688:          "file": "HOCKER_13_ZERO_REAL_AUDIT_20260524_192900/source/hocker.one/src/app/launch/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:328:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:695:          "file": "HOCKER_13_ZERO_REAL_AUDIT_20260524_192900/source/hocker.one/src/app/security/rls/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:329:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:330:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:331:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:332:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:333:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:334:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:335:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:336:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:337:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:384:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:338:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:385:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:339:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:473:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:384:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:340:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:474:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:385:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:341:docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_AUDIT.json:5:    "owner_nova_page": "src/app/owner/nova/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:342:docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:49:## Owner NOVA page
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:343:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:236:## `src/app/login/page.tsx`
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:344:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:246:src/app/agis/page.tsx:15:    <div className="hko-page-flow space-y-5">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:345:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:247:src/app/commands/page.tsx:14:    <div className="hko-page-flow space-y-4">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:346:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:248:src/app/globals.css:321:.hko-page-shell {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:347:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:249:src/app/globals.css:326:.hko-page-card {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:348:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:250:src/app/globals.css:334:.hko-page-head {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:349:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:251:src/app/globals.css:342:.hko-page-head.is-compact {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:350:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:252:src/app/globals.css:346:.hko-page-title-block {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:351:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:253:src/app/globals.css:350:.hko-page-eyebrow {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:352:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:254:src/app/globals.css:359:.hko-page-title-block h1 {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:353:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:255:src/app/globals.css:368:.hko-page-title-block > p {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:354:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:256:src/app/globals.css:376:.hko-page-chips,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:355:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:257:src/app/globals.css:377:.hko-page-actions {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:356:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:258:src/app/globals.css:383:.hko-page-chips {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:357:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:259:src/app/globals.css:387:.hko-page-chips span {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:358:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:260:src/app/globals.css:711:  .hko-page-card,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:359:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:261:src/app/globals.css:719:  .hko-page-head,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:360:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:262:src/app/globals.css:957:.hko-page-card,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:361:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:263:src/app/globals.css:964:.hko-page-card::before {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:362:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:264:src/app/globals.css:977:.hko-page-head,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:363:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:265:src/app/globals.css:978:.hko-page-body,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:364:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:266:src/app/globals.css:979:.hko-page-actions,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:365:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:267:src/app/globals.css:980:.hko-page-title-block {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:366:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:268:src/app/globals.css:1105:.hko-page-flow { padding-bottom: 9.5rem; }
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:367:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:269:src/app/globals.css:1106:@media (min-width: 768px) { .hko-page-flow { padding-bottom: 2rem; } }
```

### Señales sensibles / server-only / mutación

```text
15:  const [password, setPassword] = useState("");
24:    const cleanPassword = password.trim();
35:      const response = await fetch("/api/auth/password-login", {
36:        method: "POST",
40:          password: cleanPassword,
91:            type="password"
92:            autoComplete="current-password"
94:            value={password}
```

### Contenido

```tsx
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
      const response = await fetch("/api/auth/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Acceso rechazado.");
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
      window.location.assign(result.redirectTo || "/owner");
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
```

## `src/lib/export-audit.ts`

**Estado:** existe

- Líneas: `18`
- SHA256: `8487558324bc63e9e14e2a428447cb9a589c36094e43dfd6e4bb3d0922db984f`

### Referencias

```text
docs/audits/HOCKER_13_2C_I_C2_UI_LEGACY_VALUE_FUSION.md:21:- `export-audit.ts`: server-only; fase futura para `/api/owner/evidence/export`.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:5:Auditar login/AuthBox y export-audit antes de fusionar. No se modifica producto en esta fase.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:18:- Branch: `nova/phase13-2c-i-c3a-auth-export-audit`
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:36:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:5:Auditar login/AuthBox y export-audit antes de fusionar. No se modifica producto en esta fase.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:594:## `src/lib/export-audit.ts`
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:46:      "file": "src/lib/export-audit.ts",
```

### Señales sensibles / server-only / mutación

```text
1:import PDFDocument from "pdfkit";
```

### Contenido

```tsx
import PDFDocument from "pdfkit";

export function generateAuditPDF(logs: any[]) {
  const doc = new PDFDocument();

  doc.fontSize(18).text("Reporte de Auditoría - HOCKER", { align: "center" });

  logs.forEach((log) => {
    doc.moveDown();
    doc.fontSize(10).text(`Acción: ${log.action}`);
    doc.text(`Rol: ${log.role}`);
    doc.text(`Fecha: ${log.created_at}`);
    doc.text(`Entidad: ${log.entity_type}`);
  });

  doc.end();

  return doc;
}```

## `src/app/owner/evidence/page.tsx`

**Estado:** existe

- Líneas: `29`
- SHA256: `e60dfbfc29ab1012c217c3669708ffd56ce6b161105976554d1e32f3793d3d22`

### Referencias

```text
src/app/agis/page.tsx:15:    <div className="hko-page-flow space-y-5">
src/app/commands/page.tsx:14:    <div className="hko-page-flow space-y-4">
src/app/globals.css:321:.hko-page-shell {
src/app/globals.css:326:.hko-page-card {
src/app/globals.css:334:.hko-page-head {
src/app/globals.css:342:.hko-page-head.is-compact {
src/app/globals.css:346:.hko-page-title-block {
src/app/globals.css:350:.hko-page-eyebrow {
src/app/globals.css:359:.hko-page-title-block h1 {
src/app/globals.css:368:.hko-page-title-block > p {
src/app/globals.css:376:.hko-page-chips,
src/app/globals.css:377:.hko-page-actions {
src/app/globals.css:383:.hko-page-chips {
src/app/globals.css:387:.hko-page-chips span {
src/app/globals.css:711:  .hko-page-card,
src/app/globals.css:719:  .hko-page-head,
src/app/globals.css:957:.hko-page-card,
src/app/globals.css:964:.hko-page-card::before {
src/app/globals.css:977:.hko-page-head,
src/app/globals.css:978:.hko-page-body,
src/app/globals.css:979:.hko-page-actions,
src/app/globals.css:980:.hko-page-title-block {
src/app/globals.css:1105:.hko-page-flow { padding-bottom: 9.5rem; }
src/app/globals.css:1106:@media (min-width: 768px) { .hko-page-flow { padding-bottom: 2rem; } }
src/app/globals.css:1195:.hko-page-flow { padding-bottom: 9.5rem; }
src/app/globals.css:1196:@media (min-width: 768px) { .hko-page-flow { padding-bottom: 2rem; } }
src/app/globals.css:1294:  .hko-page-flow {
src/app/globals.css:1320:  .hko-page-card,
src/app/globals.css:1332:  .hko-page-eyebrow {
src/app/globals.css:1336:  .hko-page-title-block h1 {
src/app/globals.css:1341:  .hko-page-title-block > p,
src/app/globals.css:1977:.hko-page,
src/app/globals.css:1978:.hko-owner-page {
src/app/globals.css:2716:.hko-page-flow {
src/app/owner/page.tsx:38:    <div className="hko-page-flow space-y-5">
src/app/apps/page.tsx:14:    <div className="hko-page-flow space-y-5">
src/app/servicios/page.tsx:13:  { title: "Landing pages", text: "Páginas claras para captar clientes.", icon: Globe2 },
src/app/live/page.tsx:138:    <main className="hko-page-flow space-y-4">
src/app/app/actividad/page.tsx:12:export { default } from "../../live/page";
src/app/app/ecosistema/page.tsx:12:export { default } from "../../map/page";
src/app/app/nova/page.legacy-13fixa1.tsx:12:export { default } from "../../chat/page";
src/app/app/page.tsx:12:export { default } from "../dashboard/page";
src/app/app/pendientes/page.tsx:12:export { default } from "../../commands/page";
src/components/AppNav.tsx:50:            aria-current={active ? "page" : undefined}
src/components/BottomDock.tsx:29:              aria-current={active ? "page" : undefined}
src/components/PageShell.tsx:35:    <section className={cn("hko-page-shell", className)}>
src/components/PageShell.tsx:36:      <div className="hko-page-card">
src/components/PageShell.tsx:37:        <header className={compact ? "hko-page-head is-compact" : "hko-page-head"}>
src/components/PageShell.tsx:38:          <div className="hko-page-title-block">
src/components/PageShell.tsx:39:            {eyebrow ? <p className="hko-page-eyebrow">{eyebrow}</p> : null}
src/components/PageShell.tsx:46:              <div className="hko-page-chips">
src/components/PageShell.tsx:53:          {actions ? <div className="hko-page-actions">{actions}</div> : null}
src/components/PageShell.tsx:58:        <div className="hko-page-body">{children}</div>
src/components/Sidebar.tsx:68:              aria-current={active ? "page" : undefined}
src/lib/hocker-public-private-topology.ts:137:      public_pages_must_not_expose_runtime_state: true,
src/lib/hocker-public-private-topology.ts:138:      private_pages_require_session: true,
src/lib/hocker-public-private-topology.ts:139:      private_pages_noindex: true,
src/lib/hocker-public-private-topology.ts:140:      protected_pages_noindex: true,
src/lib/hocker-provider-orchestrator.ts:152:      key: "pagespeed_insights",
src/lib/hocker-diagnostics-provider-router.ts:5:  | "pagespeed_insights"
src/lib/hocker-diagnostics-provider-router.ts:53:      "pagespeed_insights",
src/lib/hocker-diagnostics-provider-router.ts:93:      key: "pagespeed_insights",
src/lib/hocker-diagnostics-provider-router.ts:156:  const psi = providers.find((provider) => provider.key === "pagespeed_insights");
docs/ops/post-guardrails-production-validation.md:29:- Public pages validated.
docs/ops/post-guardrails-production-validation.md:30:- Private pages redirect as expected.
docs/ops/production-smoke-test.md:9:- Public pages.
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:4:src/app/owner/actions/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:5:src/app/owner/agis/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:6:src/app/owner/apps/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:7:src/app/owner/command-center/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:8:src/app/owner/ecosystem/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:9:src/app/owner/evidence/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:11:src/app/owner/nova/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:12:src/app/owner/page.tsx
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:123:src/app/commands/page.tsx:21:        <p className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 text-sm leading-relaxed text-slate-300">Las acciones sensibles deben quedar protegidas por aprobación, owner gate o ejecución bloqueada cuando corresponda.</p>
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:127:src/app/login/page.tsx:35:      const response = await fetch("/api/auth/password-login", {
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:142:src/app/live/page.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:33:        "file": "src/app/launch/page.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:39:        "file": "src/app/security/rls/page.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:403:          "file": "HOCKER_FULL_SOURCE_CODE_AUDIT_20260524_213950/repos/hocker.one/src/app/launch/page.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:410:          "file": "HOCKER_FULL_SOURCE_CODE_AUDIT_20260524_213950/repos/hocker.one/src/app/security/rls/page.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:688:          "file": "HOCKER_13_ZERO_REAL_AUDIT_20260524_192900/source/hocker.one/src/app/launch/page.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:695:          "file": "HOCKER_13_ZERO_REAL_AUDIT_20260524_192900/source/hocker.one/src/app/security/rls/page.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:384:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:385:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:473:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:384:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:474:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:385:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_AUDIT.json:5:    "owner_nova_page": "src/app/owner/nova/page.tsx",
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:49:## Owner NOVA page
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:236:## `src/app/login/page.tsx`
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:246:src/app/agis/page.tsx:15:    <div className="hko-page-flow space-y-5">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:247:src/app/commands/page.tsx:14:    <div className="hko-page-flow space-y-4">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:248:src/app/globals.css:321:.hko-page-shell {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:249:src/app/globals.css:326:.hko-page-card {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:250:src/app/globals.css:334:.hko-page-head {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:251:src/app/globals.css:342:.hko-page-head.is-compact {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:252:src/app/globals.css:346:.hko-page-title-block {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:253:src/app/globals.css:350:.hko-page-eyebrow {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:254:src/app/globals.css:359:.hko-page-title-block h1 {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:255:src/app/globals.css:368:.hko-page-title-block > p {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:256:src/app/globals.css:376:.hko-page-chips,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:257:src/app/globals.css:377:.hko-page-actions {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:258:src/app/globals.css:383:.hko-page-chips {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:259:src/app/globals.css:387:.hko-page-chips span {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:260:src/app/globals.css:711:  .hko-page-card,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:261:src/app/globals.css:719:  .hko-page-head,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:262:src/app/globals.css:957:.hko-page-card,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:263:src/app/globals.css:964:.hko-page-card::before {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:264:src/app/globals.css:977:.hko-page-head,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:265:src/app/globals.css:978:.hko-page-body,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:266:src/app/globals.css:979:.hko-page-actions,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:267:src/app/globals.css:980:.hko-page-title-block {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:268:src/app/globals.css:1105:.hko-page-flow { padding-bottom: 9.5rem; }
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:269:src/app/globals.css:1106:@media (min-width: 768px) { .hko-page-flow { padding-bottom: 2rem; } }
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:270:src/app/globals.css:1195:.hko-page-flow { padding-bottom: 9.5rem; }
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:271:src/app/globals.css:1196:@media (min-width: 768px) { .hko-page-flow { padding-bottom: 2rem; } }
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:272:src/app/globals.css:1294:  .hko-page-flow {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:273:src/app/globals.css:1320:  .hko-page-card,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:274:src/app/globals.css:1332:  .hko-page-eyebrow {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:275:src/app/globals.css:1336:  .hko-page-title-block h1 {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:276:src/app/globals.css:1341:  .hko-page-title-block > p,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:277:src/app/globals.css:1977:.hko-page,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:278:src/app/globals.css:1978:.hko-owner-page {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:279:src/app/globals.css:2716:.hko-page-flow {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:280:src/app/owner/page.tsx:38:    <div className="hko-page-flow space-y-5">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:281:src/app/apps/page.tsx:14:    <div className="hko-page-flow space-y-5">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:282:src/app/servicios/page.tsx:13:  { title: "Landing pages", text: "Páginas claras para captar clientes.", icon: Globe2 },
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:283:src/app/live/page.tsx:138:    <main className="hko-page-flow space-y-4">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:284:src/app/app/actividad/page.tsx:12:export { default } from "../../live/page";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:285:src/app/app/ecosistema/page.tsx:12:export { default } from "../../map/page";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:286:src/app/app/nova/page.legacy-13fixa1.tsx:12:export { default } from "../../chat/page";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:287:src/app/app/page.tsx:12:export { default } from "../dashboard/page";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:288:src/app/app/pendientes/page.tsx:12:export { default } from "../../commands/page";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:289:src/components/AppNav.tsx:50:            aria-current={active ? "page" : undefined}
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:290:src/components/BottomDock.tsx:29:              aria-current={active ? "page" : undefined}
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:291:src/components/PageShell.tsx:35:    <section className={cn("hko-page-shell", className)}>
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:292:src/components/PageShell.tsx:36:      <div className="hko-page-card">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:293:src/components/PageShell.tsx:37:        <header className={compact ? "hko-page-head is-compact" : "hko-page-head"}>
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:294:src/components/PageShell.tsx:38:          <div className="hko-page-title-block">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:295:src/components/PageShell.tsx:39:            {eyebrow ? <p className="hko-page-eyebrow">{eyebrow}</p> : null}
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:296:src/components/PageShell.tsx:46:              <div className="hko-page-chips">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:297:src/components/PageShell.tsx:53:          {actions ? <div className="hko-page-actions">{actions}</div> : null}
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:298:src/components/PageShell.tsx:58:        <div className="hko-page-body">{children}</div>
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:299:src/components/Sidebar.tsx:68:              aria-current={active ? "page" : undefined}
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:300:src/lib/hocker-public-private-topology.ts:137:      public_pages_must_not_expose_runtime_state: true,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:301:src/lib/hocker-public-private-topology.ts:138:      private_pages_require_session: true,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:302:src/lib/hocker-public-private-topology.ts:139:      private_pages_noindex: true,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:303:src/lib/hocker-public-private-topology.ts:140:      protected_pages_noindex: true,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:304:src/lib/hocker-provider-orchestrator.ts:152:      key: "pagespeed_insights",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:305:src/lib/hocker-diagnostics-provider-router.ts:5:  | "pagespeed_insights"
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:306:src/lib/hocker-diagnostics-provider-router.ts:53:      "pagespeed_insights",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:307:src/lib/hocker-diagnostics-provider-router.ts:93:      key: "pagespeed_insights",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:308:src/lib/hocker-diagnostics-provider-router.ts:156:  const psi = providers.find((provider) => provider.key === "pagespeed_insights");
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:309:docs/ops/post-guardrails-production-validation.md:29:- Public pages validated.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:310:docs/ops/post-guardrails-production-validation.md:30:- Private pages redirect as expected.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:311:docs/ops/production-smoke-test.md:9:- Public pages.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:312:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:4:src/app/owner/actions/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:313:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:5:src/app/owner/agis/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:314:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:6:src/app/owner/apps/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:315:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:7:src/app/owner/command-center/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:316:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:8:src/app/owner/ecosystem/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:317:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:9:src/app/owner/evidence/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:318:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:11:src/app/owner/nova/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:319:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:12:src/app/owner/page.tsx
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:320:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:123:src/app/commands/page.tsx:21:        <p className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 text-sm leading-relaxed text-slate-300">Las acciones sensibles deben quedar protegidas por aprobación, owner gate o ejecución bloqueada cuando corresponda.</p>
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:321:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:127:src/app/login/page.tsx:35:      const response = await fetch("/api/auth/password-login", {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:322:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:142:src/app/live/page.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:323:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:33:        "file": "src/app/launch/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:324:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:39:        "file": "src/app/security/rls/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:325:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:403:          "file": "HOCKER_FULL_SOURCE_CODE_AUDIT_20260524_213950/repos/hocker.one/src/app/launch/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:326:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:410:          "file": "HOCKER_FULL_SOURCE_CODE_AUDIT_20260524_213950/repos/hocker.one/src/app/security/rls/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:327:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:688:          "file": "HOCKER_13_ZERO_REAL_AUDIT_20260524_192900/source/hocker.one/src/app/launch/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:328:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:695:          "file": "HOCKER_13_ZERO_REAL_AUDIT_20260524_192900/source/hocker.one/src/app/security/rls/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:329:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:330:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:331:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:332:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:333:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:334:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:335:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:336:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:337:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:384:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:338:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:385:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:339:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:473:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:384:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:340:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:474:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:385:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:341:docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_AUDIT.json:5:    "owner_nova_page": "src/app/owner/nova/page.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:342:docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:49:## Owner NOVA page
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:343:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:236:## `src/app/login/page.tsx`
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:344:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:246:src/app/agis/page.tsx:15:    <div className="hko-page-flow space-y-5">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:345:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:247:src/app/commands/page.tsx:14:    <div className="hko-page-flow space-y-4">
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:346:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:248:src/app/globals.css:321:.hko-page-shell {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:347:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:249:src/app/globals.css:326:.hko-page-card {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:348:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:250:src/app/globals.css:334:.hko-page-head {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:349:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:251:src/app/globals.css:342:.hko-page-head.is-compact {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:350:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:252:src/app/globals.css:346:.hko-page-title-block {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:351:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:253:src/app/globals.css:350:.hko-page-eyebrow {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:352:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:254:src/app/globals.css:359:.hko-page-title-block h1 {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:353:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:255:src/app/globals.css:368:.hko-page-title-block > p {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:354:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:256:src/app/globals.css:376:.hko-page-chips,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:355:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:257:src/app/globals.css:377:.hko-page-actions {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:356:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:258:src/app/globals.css:383:.hko-page-chips {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:357:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:259:src/app/globals.css:387:.hko-page-chips span {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:358:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:260:src/app/globals.css:711:  .hko-page-card,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:359:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:261:src/app/globals.css:719:  .hko-page-head,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:360:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:262:src/app/globals.css:957:.hko-page-card,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:361:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:263:src/app/globals.css:964:.hko-page-card::before {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:362:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:264:src/app/globals.css:977:.hko-page-head,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:363:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:265:src/app/globals.css:978:.hko-page-body,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:364:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:266:src/app/globals.css:979:.hko-page-actions,
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:365:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:267:src/app/globals.css:980:.hko-page-title-block {
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:366:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:268:src/app/globals.css:1105:.hko-page-flow { padding-bottom: 9.5rem; }
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:367:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:269:src/app/globals.css:1106:@media (min-width: 768px) { .hko-page-flow { padding-bottom: 2rem; } }
```

### Señales sensibles / server-only / mutación

```text
```

### Contenido

```tsx
import type { Metadata } from "next";
import { EvidencePanel } from "@/components/hocker-2c";
import { OwnerShell } from "@/components/hocker-2c/owner";
import { OwnerEvidenceLivePanel } from "@/components/hocker-2c/owner/live";

export const metadata: Metadata = {
  title: "Evidencia | Hocker ONE",
  robots: { index: false, follow: false },
};

export default function OwnerEvidencePage() {
  return (
    <OwnerShell
      title="Evidencia"
      description="Pruebas, cambios y resultados explicados en humano. Esta vista sólo lee información disponible."
      rightPanel={
        <EvidencePanel
          items={[
            { label: "Regla", value: "Toda ejecución real debe generar evidencia" },
            { label: "Acción", value: "Sólo lectura" },
            { label: "Visibilidad", value: "Owner primero" },
          ]}
        />
      }
    >
      <OwnerEvidenceLivePanel />
    </OwnerShell>
  );
}
```

## `src/components/hocker-2c/EvidencePanel.tsx`

**Estado:** existe

- Líneas: `40`
- SHA256: `fdc9c4c5476896feeee11454ed069ca08cc9107b15a0160848b5d13703620108`

### Referencias

```text
src/app/owner/actions/page.tsx:2:import { EvidencePanel } from "@/components/hocker-2c";
src/app/owner/actions/page.tsx:17:        <EvidencePanel
src/app/owner/evidence/page.tsx:2:import { EvidencePanel } from "@/components/hocker-2c";
src/app/owner/evidence/page.tsx:17:        <EvidencePanel
src/app/owner/nova/page.tsx:2:import { EvidencePanel } from "@/components/hocker-2c";
src/app/owner/nova/page.tsx:17:        <EvidencePanel
src/components/hocker-2c/EvidencePanel.tsx:1:export type EvidencePanelItem = {
src/components/hocker-2c/EvidencePanel.tsx:6:export type EvidencePanelProps = {
src/components/hocker-2c/EvidencePanel.tsx:9:  items: EvidencePanelItem[];
src/components/hocker-2c/EvidencePanel.tsx:13:export function EvidencePanel({
src/components/hocker-2c/EvidencePanel.tsx:18:}: EvidencePanelProps) {
src/components/hocker-2c/index.ts:2:export * from "./EvidencePanel";
src/components/hocker-2c/owner/OwnerCommandCenter.tsx:2:import { ActionPreviewCard, EvidencePanel } from "@/components/hocker-2c";
src/components/hocker-2c/owner/OwnerCommandCenter.tsx:41:        <EvidencePanel
src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:4:import { EvidencePanel, PageState } from "@/components/hocker-2c";
src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:90:        <EvidencePanel
src/components/hocker-2c/owner/nova/OwnerNovaBridge.tsx:6:import { ActionPreviewCard, EvidencePanel, PageState } from "@/components/hocker-2c";
src/components/hocker-2c/owner/nova/OwnerNovaBridge.tsx:309:        <EvidencePanel
docs/audits/HOCKER_13_2C_B_VISUAL_HUMAN_COPY.md:12:  - `EvidencePanel`
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:52:import { EvidencePanel } from "@/components/hocker-2c";
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:67:        <EvidencePanel
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:882:import { EvidencePanel } from "@/components/hocker-2c";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:897:        <EvidencePanel
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:912:## `src/components/hocker-2c/EvidencePanel.tsx`
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:70:        "import { EvidencePanel } from \"@/components/hocker-2c\";",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:80:      "file": "src/components/hocker-2c/EvidencePanel.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:89:        "export type EvidencePanelItem = {",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:90:        "export type EvidencePanelProps = {",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:91:        "export function EvidencePanel({"
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:104:        "import { EvidencePanel, PageState } from \"@/components/hocker-2c\";",
```

### Señales sensibles / server-only / mutación

```text
```

### Contenido

```tsx
export type EvidencePanelItem = {
  label: string;
  value: string;
};

export type EvidencePanelProps = {
  title?: string;
  description?: string;
  items: EvidencePanelItem[];
  footer?: string;
};

export function EvidencePanel({
  title = "Evidencia",
  description = "Aquí queda guardado lo importante. Nada crítico desaparece.",
  items,
  footer,
}: EvidencePanelProps) {
  return (
    <aside className="hocker-card p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--hocker-text-soft)]">{description}</p>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--hocker-text-muted)]">{item.label}</p>
            <p className="mt-1 text-sm font-medium text-[var(--hocker-text-main)]">{item.value}</p>
          </div>
        ))}
      </div>

      {footer ? (
        <p className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.045] p-4 text-sm leading-6 text-cyan-50">
          {footer}
        </p>
      ) : null}
    </aside>
  );
}
```

## `src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx`

**Estado:** existe

- Líneas: `104`
- SHA256: `fc8ad637e9c6b960d6fe0882295db93d366d70921a69db4254bb9db27bb8b808`

### Referencias

```text
src/app/owner/evidence/page.tsx:4:import { OwnerEvidenceLivePanel } from "@/components/hocker-2c/owner/live";
src/app/owner/evidence/page.tsx:26:      <OwnerEvidenceLivePanel />
src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:44:export function OwnerEvidenceLivePanel() {
src/components/hocker-2c/owner/live/index.ts:2:export * from "./OwnerEvidenceLivePanel";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_AUDIT.json:52:        "file": "src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:32:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:40:  if (result === "rolled_back") return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:33:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:98:            { label: "Rollback", value: record.rollback },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:121:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:32:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:40:  if (result === "rolled_back") return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:122:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:33:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:98:            { label: "Rollback", value: record.rollback },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:210:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:121:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:32:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:40:  if (result === "rolled_back") return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:211:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:122:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:33:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:98:            { label: "Rollback", value: record.rollback },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:299:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:210:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:121:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:32:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:40:  if (result === "rolled_back") return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:300:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:211:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:122:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:33:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:98:            { label: "Rollback", value: record.rollback },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:388:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:299:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:210:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:121:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:32:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:40:  if (result === "rolled_back") return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:389:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:300:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:211:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:122:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:33:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:98:            { label: "Rollback", value: record.rollback },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:477:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:388:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:299:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:210:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:121:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:32:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:40:  if (result === "rolled_back") return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:478:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:389:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:300:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:211:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:122:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:33:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:98:            { label: "Rollback", value: record.rollback },
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:1077:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:11:    "/api/agi/runtime/actions?project_id=hocker-one&status=executed&limit=30",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:884:import { OwnerEvidenceLivePanel } from "@/components/hocker-2c/owner/live";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:906:      <OwnerEvidenceLivePanel />
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:936:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:4:import { EvidencePanel, PageState } from "@/components/hocker-2c";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:937:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:90:        <EvidencePanel
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:1004:## `src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx`
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:72:        "import { OwnerEvidenceLivePanel } from \"@/components/hocker-2c/owner/live\";"
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:95:      "file": "src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx",
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:108:        "export function OwnerEvidenceLivePanel() {"
```

### Señales sensibles / server-only / mutación

```text
18:      const response = await fetch(url, {
```

### Contenido

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { EvidencePanel, PageState } from "@/components/hocker-2c";
import { normalizeOwnerEvidence, type OwnerEvidenceRecord } from "./owner-live-normalizers";

type LoadState = "loading" | "ready" | "empty" | "error";

async function loadEvidence(): Promise<OwnerEvidenceRecord[]> {
  const urls = [
    "/api/agi/runtime/actions?project_id=hocker-one&status=executed&limit=30",
    "/api/agi/runtime/actions?status=executed&limit=30",
    "/api/agi/runtime/memory/publication-audit?limit=30",
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) continue;

      const evidence = normalizeOwnerEvidence(payload);
      if (evidence.length > 0) return evidence;
    } catch {
      // keep fallback chain
    }
  }

  return [];
}

function resultLabel(result: OwnerEvidenceRecord["result"]) {
  if (result === "success") return "Completada";
  if (result === "failed") return "Falló sin afectar el sistema";
  if (result === "rolled_back") return "Revertida";
  return "En revisión";
}

export function OwnerEvidenceLivePanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [records, setRecords] = useState<OwnerEvidenceRecord[]>([]);

  useEffect(() => {
    let alive = true;

    loadEvidence()
      .then((items) => {
        if (!alive) return;
        setRecords(items);
        setState(items.length ? "ready" : "empty");
      })
      .catch(() => {
        if (!alive) return;
        setState("error");
      });

    return () => {
      alive = false;
    };
  }, []);

  const visibleRecords = useMemo(() => records.slice(0, 8), [records]);

  if (state === "loading") {
    return <PageState status="loading" description="Estoy buscando evidencia real disponible." />;
  }

  if (state === "error") {
    return <PageState status="error" description="No pude cargar evidencia. La vista quedó segura y sin ejecutar nada." />;
  }

  if (state === "empty") {
    return (
      <PageState
        status="empty"
        title="Aún no hay evidencia visible"
        description="Cuando una acción real se ejecute, aparecerá aquí con resumen humano."
      />
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {visibleRecords.map((record) => (
        <EvidencePanel
          key={record.id}
          title={record.title}
          description={record.summary}
          items={[
            { label: "Resultado", value: resultLabel(record.result) },
            { label: "Destino", value: record.target },
            { label: "Fecha", value: record.createdAt },
            { label: "Rollback", value: record.rollback },
          ]}
        />
      ))}
    </section>
  );
}
```

## `src/app/api/auth/password-login/route.ts`

**Estado:** existe

- Líneas: `57`
- SHA256: `69f8c7a6660f99dad9b5f8da58b092c25caa356c85e16f4bdbd4a39ee8a6c3b1`

### Referencias

```text
src/app/admin/jurix/export/page.tsx:27:  const router = useRouter();
src/app/admin/jurix/export/page.tsx:94:          onClick={() => router.push("/admin/jurix")}
src/app/admin/jurix/page.tsx:47:  const router = useRouter();
src/app/admin/jurix/page.tsx:114:          onClick={() => router.push("/admin/jurix/export")}
src/app/api/commands/dispatch/route.ts:1:export { POST } from "../route";
src/app/api/nova/chat/route.ts:7:import { buildNovaCapabilitiesReply, buildNovaChatCapabilitiesContext, buildNovaUpstreamRuntimeContext, shouldAnswerCapabilitiesLocally } from "@/lib/hocker-tool-router";
src/app/api/nova/chat/stream/route.ts:4:import { buildNovaCapabilitiesReply, buildNovaChatCapabilitiesContext, buildNovaUpstreamRuntimeContext, shouldAnswerCapabilitiesLocally } from "@/lib/hocker-tool-router";
src/app/api/system/diagnostics/providers/route.ts:5:} from "@/lib/hocker-diagnostics-provider-router";
src/app/api/system/diagnostics/providers/route.ts:25:        no_nova_agi_router_duplication: true,
src/app/api/agi/runtime/capabilities/route.ts:4:import { routeHockerCapabilityRequest } from "@/lib/hocker-tool-router";
src/app/api/agi/runtime/capabilities/route.ts:36:      return json({ ok: false, error: "Payload inválido para router de capacidades.", issues: parsed.error.flatten() }, 400);
src/app/api/agi/runtime/capabilities/route.ts:47:      decision: routeHockerCapabilityRequest(parsed.data.message, contract),
src/app/globals.css:2464:.hko-neo-route {
src/app/globals.css:2473:.hko-neo-route::-webkit-scrollbar { display: none; }
src/app/globals.css:2474:.hko-neo-route span {
src/app/globals.css:2489:.hko-neo-route i {
src/app/globals.css:2495:.hko-neo-route i::after {
src/app/globals.css:2654:  .hko-neo-route { padding-bottom: 10px; }
src/app/globals.css:2655:  .hko-neo-route span { min-height: 42px; padding: 0 14px; font-size: 12px; }
src/app/globals.css:3409:.hko-final-route {
src/app/globals.css:3419:.hko-final-route::-webkit-scrollbar { display: none; }
src/app/globals.css:3421:.hko-final-route span {
src/app/globals.css:3437:.hko-final-route i {
src/app/globals.css:3686:  .hko-final-route span {
src/app/login/page.tsx:11:  const router = useRouter();
src/app/chido/ops/page.tsx:164:      route: "/chido/ops",
src/app/security/page.tsx:117:                    <p className="mt-2 text-xs text-slate-500">route_prefix: {portal.route_prefix}</p>
src/app/security/hardening/page.tsx:92:            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Owner-only routes</p>
src/app/security/hardening/page.tsx:94:              {hardening.owner_only_routes.map((route) => (
src/app/security/hardening/page.tsx:95:                <span key={route} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
src/app/security/hardening/page.tsx:96:                  {route}
src/app/security/hardening/page.tsx:105:              {hardening.owner_gated_apis.map((route) => (
src/app/security/hardening/page.tsx:106:                <span key={route} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
src/app/security/hardening/page.tsx:107:                  {route}
src/app/sitemap.ts:9:  return HOCKER_PUBLIC_SITEMAP_ROUTES.map((route) => ({
src/app/sitemap.ts:10:    url: `${SITE_URL}${route === "/" ? "" : route}`,
src/app/sitemap.ts:12:    changeFrequency: route === "/" ? "weekly" : "monthly",
src/app/sitemap.ts:13:    priority: route === "/" ? 1 : 0.75,
src/components/AuthBox.tsx:16:  const router = useRouter();
src/components/ShellFrame.tsx:16:    (route) => pathname === route || pathname.startsWith(`${route}/`),
src/components/map/EcosystemVfxNetwork.tsx:132:      <div className="hko-final-route" aria-label="Ruta del aprendizaje">
src/components/hocker-2c/owner/OwnerShell.tsx:5:import { HOCKER_OWNER_ROUTE_HARDENING_2C } from "@/lib/hocker-owner-routes-2c";
src/components/hocker-2c/owner/Owner2CRegistryPanel.tsx:13:} from "@/lib/hocker-owner-routes-2c";
src/components/hocker-2c/owner/Owner2CRegistryPanel.tsx:127:            {HOCKER_OWNER_ROUTES_2C.slice(0, 6).map((route) => (
src/components/hocker-2c/owner/Owner2CRegistryPanel.tsx:129:                key={route.href}
src/components/hocker-2c/owner/Owner2CRegistryPanel.tsx:130:                href={route.href}
src/components/hocker-2c/owner/Owner2CRegistryPanel.tsx:133:                <span className="font-medium">{route.label}</span>
src/components/hocker-2c/owner/Owner2CRegistryPanel.tsx:135:                  {route.technicalMode ? "Modo técnico owner" : "Vista owner simple"}
src/lib/agi-research-gate.ts:23:    id: "next-route-handlers",
src/lib/agi-research-gate.ts:26:    url: "https://nextjs.org/docs/app/getting-started/route-handlers",
src/lib/agi-research-gate.ts:149:    requiredSources: ["next-route-handlers", "vercel-env", "supabase-api-keys"],
src/lib/hocker-global-health.ts:427:        route: "/api/system/global-health",
src/lib/hocker-global-health.ts:443:        route: "/api/system/status",
src/lib/hocker-beta-readiness.ts:61:function routeExists(path: string): boolean {
src/lib/hocker-beta-readiness.ts:125:  const missingRoutes = requiredRoutes.filter((route) => !routeExists(route));
src/lib/hocker-beta-readiness.ts:150:      id: "required-routes",
src/lib/hocker-beta-readiness.ts:157:        required_routes: requiredRoutes,
src/lib/hocker-beta-readiness.ts:158:        missing_routes: missingRoutes,
src/lib/hocker-mobile-sanity.ts:138:      id: "mobile-routes",
src/lib/hocker-mobile-sanity.ts:145:        routes: MOBILE_ROUTE_MANIFEST,
src/lib/hocker-client-portals.ts:35:  route_prefix: string;
src/lib/hocker-client-portals.ts:56:    route_prefix: "/client/hocker-ads",
src/lib/hocker-client-portals.ts:75:    route_prefix: "/client/supply",
src/lib/hocker-client-portals.ts:94:    route_prefix: "/client/hub",
src/lib/hocker-client-portals.ts:113:    route_prefix: "/operator/chido",
src/lib/hocker-client-portals.ts:132:    route_prefix: "/client/trackhok",
src/lib/hocker-client-portals.ts:151:    route_prefix: "/client/nexpa",
src/lib/hocker-client-portals.ts:179:      route_prefix: portal.route_prefix,
src/lib/hocker-security-hardening.ts:62:      id: "owner-only-routes",
src/lib/hocker-security-hardening.ts:63:      label: "Owner-only routes",
src/lib/hocker-security-hardening.ts:128:    owner_only_routes: OWNER_ONLY_ROUTES,
src/lib/hocker-live-summary.ts:61:    private_routes_protected: true;
src/lib/hocker-live-summary.ts:292:      private_routes_protected: true,
src/lib/hocker-context-pack.ts:4:import { getHockerDiagnosticsProviderRouterPublicContext } from "@/lib/hocker-diagnostics-provider-router";
src/lib/hocker-context-pack.ts:30:      objective: "Sincronizar Hocker ONE con NOVA.AGI 12.7M-1 Always-On Cognitive Mesh sin duplicar router, sin exponer proveedor/modelo/fallback al usuario y sin tocar ejecución productiva.",
src/lib/hocker-context-pack.ts:41:        lighthouse_status: "diagnostics_router_active",
src/lib/hocker-context-pack.ts:42:        provider_router_version: "12.7L-2C-B",
src/lib/hocker-context-pack.ts:48:        routes: ["/app", "/app/nova", "/app/actividad", "/app/pendientes", "/app/ecosistema", "/app/ajustes"],
src/lib/hocker-context-pack.ts:49:        compatibility_routes: ["/dashboard", "/chat", "/live", "/commands", "/map", "/owner", "/integrations"],
src/lib/hocker-context-pack.ts:61:    diagnostics_provider_router: getHockerDiagnosticsProviderRouterPublicContext(),
src/lib/hocker-capabilities-contract.ts:119:    key: "automatic_model_router",
src/lib/hocker-capabilities-contract.ts:138:    key: "automatic_agi_router",
src/lib/hocker-tool-router.ts:49:  for (const route of ROUTES) {
src/lib/hocker-tool-router.ts:50:    if (route.patterns.some((pattern) => pattern.test(clean))) {
src/lib/hocker-tool-router.ts:51:      keys.add(route.key);
src/lib/hocker-tool-router.ts:58:export function routeHockerCapabilityRequest(message: string, contract = getHockerCapabilitiesContract()): HockerToolRouteDecision {
src/lib/hocker-tool-router.ts:61:  const matched = ROUTES.find((route) => route.patterns.some((pattern) => pattern.test(clean)));
src/lib/hocker-tool-router.ts:94:  const decision = routeHockerCapabilityRequest(message, contract);
src/lib/hocker-tool-router.ts:98:    "automatic_model_router",
src/lib/hocker-tool-router.ts:99:    "automatic_agi_router",
src/lib/hocker-tool-router.ts:202:    "automatic_model_router",
src/lib/hocker-tool-router.ts:203:    "automatic_agi_router",
src/lib/syntia-memory-review-gate.ts:53:      legacy_review_route_hardened: true,
src/lib/hocker-public-private-topology.ts:76:export function isExactOrChild(pathname: string, route: string): boolean {
src/lib/hocker-public-private-topology.ts:77:  return pathname === route || pathname.startsWith(`${route}/`);
src/lib/hocker-public-private-topology.ts:81:  return HOCKER_PUBLIC_ROUTES.some((route) => isExactOrChild(pathname, route));
src/lib/hocker-public-private-topology.ts:85:  return HOCKER_PUBLIC_INDEXABLE_ROUTES.some((route) => isExactOrChild(pathname, route));
src/lib/hocker-public-private-topology.ts:89:  return HOCKER_NOINDEX_ROUTES.some((route) => isExactOrChild(pathname, route));
src/lib/hocker-public-private-topology.ts:105:        routes: HOCKER_PUBLIC_SITEMAP_ROUTES,
src/lib/hocker-public-private-topology.ts:116:        routes: HOCKER_PUBLIC_ACCESS_ROUTES,
src/lib/hocker-public-private-topology.ts:120:        route_aliases: HOCKER_APP_ALIAS_ROUTES,
src/lib/hocker-public-private-topology.ts:122:        routes: HOCKER_PRIVATE_ROUTES,
src/lib/hocker-public-private-topology.ts:127:        routes: HOCKER_PROTECTED_ROUTES,
src/lib/hocker-public-private-topology.ts:132:        routes: HOCKER_TECHNICAL_NOINDEX_ROUTES,
src/lib/hocker-public-private-topology.ts:141:      api_routes_noindex: true,
src/lib/hocker-public-private-topology.ts:147:      no_private_routes_in_sitemap: true,
src/lib/hocker-public-private-topology.ts:152:    next_step: "12.7L-2C-B debe agregar router diagnóstico multi-proveedor sin duplicar el router LLM nativo de NOVA.AGI.",
src/lib/hocker-provider-orchestrator.ts:21:    mode: "provider_orchestrator_inventory_no_duplicate_llm_router",
src/lib/hocker-provider-orchestrator.ts:29:      cognitive_router: "nova.agi",
src/lib/hocker-provider-orchestrator.ts:34:      do_not_duplicate_nova_agi_llm_router: true,
src/lib/hocker-provider-orchestrator.ts:42:    next_step: "12.7L-2C-B delega diagnóstico a hocker-diagnostics-provider-router. NOVA.AGI Always-On Mesh sincronizado en Hocker ONE. Siguiente: 12.7Z-1 SQL normalization + idempotent GitHub worker.",
src/lib/hocker-provider-orchestrator.ts:190:      router: nova.ok ? nova.data?.provider_router ?? "unknown" : null,
src/lib/hocker-provider-orchestrator.ts:205:      nova_agi_thinks_and_routes_models: true,
src/lib/hocker-diagnostics-provider-router.ts:47:    mode: "diagnostics_provider_router_only",
src/lib/hocker-diagnostics-provider-router.ts:50:      "Elegir proveedor de diagnóstico para Lighthouse/PWA/PageSpeed sin tocar ni duplicar el router LLM nativo de NOVA.AGI.",
src/lib/hocker-diagnostics-provider-router.ts:60:      "No reemplazar NOVA.AGI provider router.",
src/lib/hocker-diagnostics-provider-router.ts:65:      hocker_one_routes_diagnostics_only: true,
src/lib/hocker-diagnostics-provider-router.ts:71:    public_trace: "12.7L-2C-B-diagnostics-provider-router",
src/lib/hocker-nova-always-on-awareness.ts:18:      nova_agi_keeps_native_provider_router: true,
src/lib/hocker-service-config.ts:81:    visibleModules: ["map", "assets", "alerts", "routes", "history", "reports"],
docs/AGI_RESEARCH_GATE.md:21:- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
docs/ops/production-smoke-test.md:10:- Private protected routes.
docs/ops/hocker-one-operational-phase-closure.md:10:- Private routes protected.
docs/audits/hocker-one-12.7l2c-provider-orchestrator-inventory.md:5:Hocker ONE no duplica el router LLM.
docs/audits/hocker-one-12.7l2c-provider-orchestrator-inventory.md:28:12.7L-2C-B debe agregar router diagnóstico multi-proveedor sin duplicar el router cognitivo de NOVA.AGI.
docs/audits/hocker-one-12.7l2ca1-clean-topology-headers.md:5:Se limpia topología pública/privada sin tocar el router cognitivo de NOVA.AGI.
docs/audits/hocker-one-12.7l2ca1-clean-topology-headers.md:24:- No toca el router LLM de NOVA.AGI.
docs/audits/hocker-one-12.7l2ca1-clean-topology-headers.md:28:12.7L-2C-B debe agregar router diagnóstico multi-proveedor:
docs/audits/hocker-one-12.7l2ca1c-context-trace-cleanup.md:18:- No toca router LLM de NOVA.AGI.
docs/audits/hocker-one-12.7l2ca1c-context-trace-cleanup.md:24:12.7L-2C-B — Diagnostics provider router.
docs/audits/HOCKER_127L2CB_DIAGNOSTICS_PROVIDER_ROUTER.md:5:Agregar router diagnóstico multi-proveedor sin duplicar el router LLM nativo de NOVA.AGI.
docs/audits/HOCKER_127L2CB_DIAGNOSTICS_PROVIDER_ROUTER.md:17:- NOVA.AGI conserva el router cognitivo/modelos.
docs/audits/HOCKER_127M2_NOVA_ALWAYS_ON_AWARENESS_SYNC.md:15:- No duplica el router LLM de NOVA.AGI.
docs/audits/HOCKER_127Z1C_WORKER_DRY_SMOKE.md:13:- `expected_sha`: validado en route gate y executor.
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:3:## Owner routes
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:25:src/app/api/commands/approve/route.ts:10:  requireProjectRole,
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:26:src/app/api/commands/approve/route.ts:54:    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:27:src/app/api/commands/reject/route.ts:8:  requireProjectRole,
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:28:src/app/api/commands/reject/route.ts:36:    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:29:src/app/api/commands/route.ts:15:  requireProjectRole,
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:30:src/app/api/commands/route.ts:89:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:31:src/app/api/commands/route.ts:133:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:32:src/app/api/events/manual/route.ts:10:  requireProjectRole,
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:33:src/app/api/events/manual/route.ts:49:    const ctx = await requireProjectRole(project_id, [
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:34:src/app/api/events/manual/route.ts:107:    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:35:src/app/api/governance/killswitch/route.ts:12:  requireProjectRole,
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:36:src/app/api/governance/killswitch/route.ts:65:    const ctx = await requireProjectRole(project_id, [
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:37:src/app/api/governance/killswitch/route.ts:103:    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:38:src/app/api/nova/chat/route.ts:4:import { requireProjectRole } from "@/app/api/_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:39:src/app/api/nova/chat/route.ts:129:    const ctx = await requireProjectRole(parsed.data.project_id, ["owner", "admin", "operator"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:40:src/app/api/supply/orders/[id]/route.ts:4:import { ApiError, getControls, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:41:src/app/api/supply/orders/[id]/route.ts:47:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:42:src/app/api/supply/orders/[id]/route.ts:102:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:43:src/app/api/supply/orders/route.ts:4:import { getControls, requireProjectRole, ApiError, toApiError, json } from "../../_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:44:src/app/api/supply/orders/route.ts:32:    const { data: { user }, error: authError } = await supabase.auth.getUser();
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:45:src/app/api/supply/orders/route.ts:37:    const ctx = await requireProjectRole(payload.project_id, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:46:src/app/api/supply/products/[id]/route.ts:2:import { ApiError, getControls, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:47:src/app/api/supply/products/[id]/route.ts:43:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:48:src/app/api/supply/products/[id]/route.ts:80:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:49:src/app/api/supply/products/route.ts:2:import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError, getControls } from "../../_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:50:src/app/api/supply/products/route.ts:39:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:51:src/app/api/supply/products/route.ts:67:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:52:src/app/api/system/security-readiness/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:53:src/app/api/system/security-readiness/route.ts:15:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:54:src/app/api/system/security-hardening/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:55:src/app/api/system/security-hardening/route.ts:20:    const ownerGateResponse = requireOwnerOrInternal(req);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:56:src/app/api/system/tenant-rls/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:57:src/app/api/system/tenant-rls/route.ts:20:    const ownerGateResponse = requireOwnerOrInternal(req);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:58:src/app/api/system/providers/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:59:src/app/api/system/providers/route.ts:14:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:60:src/app/api/system/diagnostics/providers/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:61:src/app/api/system/diagnostics/providers/route.ts:14:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:62:src/app/api/system/nova/always-on/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:63:src/app/api/system/nova/always-on/route.ts:11:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:64:src/app/api/chido/actions/dry-run/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:65:src/app/api/chido/actions/dry-run/route.ts:88:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:66:src/app/api/chido/actions/approval/request/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:67:src/app/api/chido/actions/approval/request/route.ts:51:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:68:src/app/api/chido/actions/approval/decision/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:69:src/app/api/chido/actions/approval/decision/route.ts:38:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:70:src/app/api/chido/actions/signature/check/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:71:src/app/api/chido/actions/signature/check/route.ts:68:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:72:src/app/api/chido/actions/execution/preflight/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:73:src/app/api/chido/actions/execution/preflight/route.ts:69:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:74:src/app/api/integrations/register/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:75:src/app/api/integrations/register/route.ts:32:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:76:src/app/api/integrations/health/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:77:src/app/api/integrations/health/route.ts:61:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:78:src/app/api/integrations/events/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:79:src/app/api/integrations/events/route.ts:39:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:80:src/app/api/access/check/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:81:src/app/api/access/check/route.ts:38:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:82:src/app/api/access/portal-grants/request/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:83:src/app/api/access/portal-grants/request/route.ts:39:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:84:src/app/api/owner/live-summary/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:85:src/app/api/owner/live-summary/route.ts:10:  const gate = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:86:src/app/api/agi/learning/submit/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:87:src/app/api/agi/learning/submit/route.ts:12:  const gate = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:88:src/app/api/agi/memory-mirror/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:89:src/app/api/agi/memory-mirror/route.ts:10:  const gate = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:90:src/app/api/agi/updates/feed/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:91:src/app/api/agi/updates/feed/route.ts:10:  const gate = requireOwnerOrInternal(req, traceId);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:92:src/app/api/agi/runtime/summary/route.ts:2:import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:93:src/app/api/agi/runtime/summary/route.ts:11:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:94:src/app/api/agi/runtime/actions/route.ts:4:import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:95:src/app/api/agi/runtime/actions/route.ts:40:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:96:src/app/api/agi/runtime/actions/route.ts:60:    const ctx = await requireProjectRole(parsed.project_id, ["owner", "admin", "operator"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:97:src/app/api/agi/runtime/actions/decision/route.ts:3:import { json, parseBody, requireProjectRole, toApiError } from "@/app/api/_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:98:src/app/api/agi/runtime/actions/decision/route.ts:18:    const ctx = await requireProjectRole(parsed.project_id, ["owner"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:99:src/app/api/agi/runtime/actions/execute/route.ts:3:import { json, parseBody, requireProjectRole, toApiError } from "@/app/api/_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:100:src/app/api/agi/runtime/actions/execute/route.ts:16:    const ctx = await requireProjectRole(parsed.project_id, ["owner"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:101:src/app/api/agi/runtime/tools/route.ts:2:import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:102:src/app/api/agi/runtime/tools/route.ts:14:    await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:103:src/app/api/agi/runtime/github/route.ts:2:import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:104:src/app/api/agi/runtime/github/route.ts:86:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:105:src/app/api/agi/runtime/github/route.ts:105:    const ctx = await requireProjectRole(parsed.project_id, ["owner", "admin", "operator"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:106:src/app/api/agi/runtime/context/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:107:src/app/api/agi/runtime/context/route.ts:11:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:108:src/app/api/agi/runtime/capabilities/route.ts:2:import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:109:src/app/api/agi/runtime/capabilities/route.ts:19:    await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
```

### Señales sensibles / server-only / mutación

```text
6:export async function POST(request: Request) {
11:    const password = String(body?.password ?? "");
13:    if (!email || !password) {
25:    const { data, error } = await supabase.auth.signInWithPassword({
27:      password,
```

### Contenido

```tsx
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        {
          ok: false,
          message: "Completa correo y contraseña.",
        },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Correo o contraseña incorrectos.",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      redirectTo: "/owner",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "No se pudo iniciar sesión. Intenta de nuevo.",
      },
      { status: 500 },
    );
  }
}
```

## `src/lib/require-private-session.ts`

**Estado:** existe

- Líneas: `24`
- SHA256: `b55b2a860ca9cc95050a3cf86078b9820e5299c8d1e9ae651928f4493a246f29`

### Referencias

```text
src/app/admin/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/agis/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/chat/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/commands/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/dashboard/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/governance/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/nodes/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/supply/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/memory/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/chido/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/integrations/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/status/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/access/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/launch/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/mobile/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/security/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/owner/layout.tsx:3:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/apps/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/servicios/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/live/page.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:20:src/app/admin/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:21:src/app/agis/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:122:src/app/chat/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:124:src/app/commands/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:125:src/app/dashboard/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:126:src/app/governance/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:128:src/app/nodes/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:130:src/app/supply/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:131:src/app/memory/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:132:src/app/chido/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:133:src/app/integrations/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:134:src/app/status/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:135:src/app/access/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:136:src/app/launch/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:137:src/app/mobile/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:138:src/app/security/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:139:src/app/owner/layout.tsx:3:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:140:src/app/apps/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:141:src/app/servicios/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:142:src/app/live/page.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:155:src/lib/require-private-session.ts:17:  const { data, error } = await supabase.auth.getUser();
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_AUDIT.json:6:    "require_private_session": "src/lib/require-private-session.ts",
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:25:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:85:## require-private-session
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:927:src/lib/require-private-session.ts:17:  const { data, error } = await supabase.auth.getUser();
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:322:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:142:src/app/live/page.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:420:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:322:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:142:src/app/live/page.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:727:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:142:src/app/live/page.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:825:docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:322:docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:142:src/app/live/page.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:1461:## `src/lib/require-private-session.ts`
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:129:      "file": "src/lib/require-private-session.ts",
```

### Señales sensibles / server-only / mutación

```text
8:export async function requirePrivateSession() {
```

### Contenido

```tsx
import "server-only";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

export const HOCKER_PRIVATE_SESSION_GUARD_VERSION = "hocker-private-session-guard-v0.1.0";

export async function requirePrivateSession() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !anon) {
    redirect("/login");
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  return data.user;
}
```

## `src/lib/supabase-server.ts`

**Estado:** existe

- Líneas: `32`
- SHA256: `e4097f74aede922bd589b86f0239cb3e7fa59265272b6b568d64ae3f25c62efc`

### Referencias

```text
src/app/api/_lib.ts:3:import { createServerSupabase } from "@/lib/supabase-server";
src/app/api/supply/orders/route.ts:3:import { createServerSupabase } from "@/lib/supabase-server";
src/app/api/auth/password-login/route.ts:2:import { createServerSupabase } from "@/lib/supabase-server";
src/app/auth/callback/route.ts:2:import { createServerSupabase } from "@/lib/supabase-server";
src/app/signout/route.ts:4:import { createServerSupabase } from "@/lib/supabase-server";
src/lib/hocker-dashboard-server.ts:1:import { createServerSupabase } from "@/lib/supabase-server";
src/lib/require-private-session.ts:4:import { createServerSupabase } from "@/lib/supabase-server";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:144:src/lib/supabase-server.ts:2:import { createServerClient } from "@supabase/ssr";
docs/audits/HOCKER_13_2C_G_ACCESS_SCAN.md:145:src/lib/supabase-server.ts:7:  return createServerClient(
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_AUDIT.json:7:    "supabase_server": "src/lib/supabase-server.ts",
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:90:import { createServerSupabase } from "@/lib/supabase-server";
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:153:import { createServerSupabase } from "@/lib/supabase-server";
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:906:src/lib/supabase-server.ts:2:import { createServerClient } from "@supabase/ssr";
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:907:src/lib/supabase-server.ts:5:  const cookieStore = await cookies();
docs/audits/HOCKER_13_2C_H_F_C_OWNER_API_AUTH_SCAN.md:908:src/lib/supabase-server.ts:7:  return createServerClient(
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:1403:import { createServerSupabase } from "@/lib/supabase-server";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:1536:import { createServerSupabase } from "@/lib/supabase-server";
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:1559:## `src/lib/supabase-server.ts`
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:121:        "import { createServerSupabase } from \"@/lib/supabase-server\";"
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:139:        "import { createServerSupabase } from \"@/lib/supabase-server\";"
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:147:      "file": "src/lib/supabase-server.ts",
```

### Señales sensibles / server-only / mutación

```text
```

### Contenido

```tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            // Blindaje contra excepciones de solo lectura en Next.js Server Components
            cookieStore.set(name, value, options);
          } catch (error) {
            // Se silencia intencionalmente. El Middleware asume la responsabilidad de la mutación.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, "", options);
          } catch (error) {
            // Se silencia intencionalmente.
          }
        },
      },
    },
  );
}```

## `package.json`

**Estado:** existe

- Líneas: `63`
- SHA256: `de6c01945abd9320fc0b92aaca674e7d9049e0b1b585a996822aab886e27b921`

### Referencias

```text
src/lib/agi-action-execution.ts:154:    "src/,app/,docs/,scripts/,supabase/migrations/,public/,package.json,next.config.js,tsconfig.json"
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.md:1634:## `package.json`
docs/audits/HOCKER_13_2C_I_C3A_AUTH_EXPORT_AUDIT.json:163:      "file": "package.json",
scripts/ops/hocker-forbidden-supabase-command-scan.sh:21:        *.sh|*.md|*package.json)
```

### Señales sensibles / server-only / mutación

```text
42:    "pdfkit": "^0.15.0",
53:    "@types/pdfkit": "^0.13.4",
```

### Contenido

```tsx
{
  "name": "hocker.one",
  "private": true,
  "version": "1.0.2",
  "type": "module",
  "engines": {
    "node": "22.x"
  },
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build --webpack",
    "start": "next start -p 3000",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "android:sync": "cap sync android",
    "android:open": "cap open android",
    "android:debug": "cap run android",
    "android:apk": "cd android && ./gradlew assembleDebug",
    "android:aab": "cd android && ./gradlew bundleRelease",
    "android:sync:web": "npm run build && cap sync android",
    "ops:supabase:guard": "bash scripts/ops/hocker-supabase-production-guard.sh",
    "ops:supabase:scan": "bash scripts/ops/hocker-forbidden-supabase-command-scan.sh",
    "ops:prod:smoke": "bash scripts/ops/hocker-production-smoke-test.sh",
    "ops:nova": "bash scripts/ops/hocker-nova-command-center.sh",
    "ops:validate": "bash scripts/ops/hocker-total-validation.sh",
    "ops:nova:watch": "bash scripts/ops/hocker-nova-watchtower.sh",
    "diagnostics:router": "node scripts/diagnostics/hocker-diagnostics-provider-router.mjs"
  },
  "dependencies": {
    "@capacitor/android": "8.3.1",
    "@capacitor/core": "8.3.1",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.49.1",
    "@trigger.dev/sdk": "3.3.17",
    "clsx": "^2.1.1",
    "fastify": "^5.0.0",
    "langfuse-node": "^3.38.6",
    "lucide-react": "^0.451.0",
    "next": "16.2.4",
    "node-cron": "^4.2.1",
    "pdfkit": "^0.15.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sonner": "^2.0.7",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@capacitor/cli": "8.3.1",
    "@next/eslint-plugin-next": "^16.2.1",
    "@types/node": "^22.13.1",
    "@types/node-cron": "^3.0.11",
    "@types/pdfkit": "^0.13.4",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.2.1",
    "postcss": "^8.5.1",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.4.5"
  }
}
```

## Decisión preliminar

### AuthBox

Pendiente de comparar con `/login/page.tsx`.

Posibles rutas:
- Si mejora UX sin duplicar lógica: fusionar estilo/estados.
- Si usa flujo viejo incompatible: dejar como legacy.
- Si expone manejo de password inseguro: no fusionar.

### export-audit

Pendiente de confirmar si es server-only.

Posibles rutas:
- Si usa `pdfkit`, `fs`, `Buffer` o streams: no importar en UI.
- Si es útil: crear endpoint server `/api/owner/evidence/export` en fase futura.
- No conectarlo a cliente directo.

### Evidence UI

Comparar contra:
- `OwnerEvidenceLivePanel`
- `EvidencePanel`
- `/owner/evidence`

Objetivo futuro:
- Botón “Exportar evidencia” sólo si existe endpoint server seguro.
- No generar PDF desde frontend.
