"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/cn";

type PendingItem = {
  id: string;
  user_id: string;
  status: string;
  amount?: number | string;
  currency?: string;
  created_at?: string;
  submitted_at?: string;
  username?: string;
  email?: string;
  review_note?: string;
};

type AdminPanelProps = {
  kycPending: PendingItem[];
  depositPending: PendingItem[];
  withdrawPending: PendingItem[];
  gamesPaused: boolean;
  casinoSettings: Record<string, unknown>;
};

type ActionResult = {
  ok: boolean;
  message?: string;
  error?: string;
  trace_id?: string;
};

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function redactId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

export default function AdminPanel({
  kycPending,
  depositPending,
  withdrawPending,
  gamesPaused: initialPaused,
  casinoSettings,
}: AdminPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [gamesPaused, setGamesPaused] = useState(initialPaused);
  const [reason, setReason] = useState("");
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const executeAction = useCallback(
    async (action: string, targetId?: string, extra?: Record<string, unknown>) => {
      const key = `${action}:${targetId ?? "global"}`;
      setLoading(key);
      setResult(null);

      try {
        const ownerKey =
          typeof window !== "undefined"
            ? (window as unknown as Record<string, string>).__HOCKER_OWNER_KEY ?? ""
            : "";

        const res = await fetch("/api/chido/admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(ownerKey ? { "x-hocker-owner-key": ownerKey } : {}),
          },
          body: JSON.stringify({ action, target_id: targetId, reason, ...extra }),
        });

        const data = (await res.json()) as ActionResult;
        setResult(data);

        if (data.ok && targetId) {
          setRemovedIds((prev) => new Set([...prev, targetId]));
        }

        if (action === "games_pause") setGamesPaused(true);
        if (action === "games_resume") setGamesPaused(false);
      } catch (err) {
        setResult({
          ok: false,
          error: err instanceof Error ? err.message : "Network error",
        });
      } finally {
        setLoading(null);
      }
    },
    [reason],
  );

  const isRemoved = (id: string) => removedIds.has(id);

  return (
    <div className="flex flex-col gap-6">
      {/* Result toast */}
      {result && (
        <div
          className={cn(
            "rounded-xl border p-4 text-sm",
            result.ok
              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
              : "border-rose-400/20 bg-rose-500/10 text-rose-200",
          )}
        >
          <p className="font-black uppercase tracking-widest text-[10px]">
            {result.ok ? "Operación completada" : "Error"}
          </p>
          <p className="mt-1">{result.ok ? result.message : result.error}</p>
          {result.trace_id ? (
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Trace: {result.trace_id.slice(0, 8)}
            </p>
          ) : null}
        </div>
      )}

      {/* Reason input (shared) */}
      <div className="hocker-panel-pro p-4">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
          Razón / Nota de auditoría (aplica a todas las acciones)
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Verificación completa, documento válido"
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
        />
      </div>

      {/* Game Kill-Switch */}
      <section className="hocker-panel-pro overflow-hidden">
        <div className="border-b border-white/5 p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Control de juegos
          </p>
          <h2 className="mt-1 text-lg font-black text-white">Pausa / Reanuda todos los juegos</h2>
          <p className="mt-1 text-xs text-slate-400">
            El kill-switch detiene inmediatamente todos los juegos del casino. Usa esto para
            mantenimiento o emergencias.
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                gamesPaused
                  ? "border-rose-400/20 bg-rose-500/10 text-rose-300"
                  : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
              )}
            >
              {gamesPaused ? "Juegos pausados" : "Juegos activos"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => executeAction("games_pause")}
              disabled={loading === "games_pause:global" || gamesPaused}
              className={cn(
                "rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-widest transition",
                gamesPaused
                  ? "cursor-not-allowed border-white/5 bg-white/5 text-slate-600"
                  : "border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
              )}
            >
              {loading === "games_pause:global" ? "Pausando…" : "Pausar juegos"}
            </button>
            <button
              onClick={() => executeAction("games_resume")}
              disabled={loading === "games_resume:global" || !gamesPaused}
              className={cn(
                "rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-widest transition",
                !gamesPaused
                  ? "cursor-not-allowed border-white/5 bg-white/5 text-slate-600"
                  : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
              )}
            >
              {loading === "games_resume:global" ? "Reanudando…" : "Reanudar juegos"}
            </button>
          </div>
        </div>
      </section>

      {/* KYC Management */}
      <section className="hocker-panel-pro overflow-hidden">
        <div className="border-b border-white/5 p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            KYC · Guardian: JURIX
          </p>
          <h2 className="mt-1 text-lg font-black text-white">
            Solicitudes KYC pendientes ({kycPending.filter((i) => !isRemoved(i.id)).length})
          </h2>
        </div>
        <div className="divide-y divide-white/5">
          {kycPending.filter((i) => !isRemoved(i.id)).map((item) => (
            <div key={item.id} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-5 md:items-center">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Usuario</p>
                <p className="mt-1 text-xs font-bold text-white">
                  {item.username ?? redactId(item.user_id)}
                </p>
                {item.email ? (
                  <p className="text-[10px] text-slate-500">{item.email}</p>
                ) : null}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">ID</p>
                <p className="mt-1 text-xs font-bold text-white">{redactId(item.id)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estado</p>
                <p className="mt-1 inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-300">
                  {item.status}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Enviado</p>
                <p className="mt-1 text-xs font-bold text-white">{formatDate(item.submitted_at ?? item.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => executeAction("kyc_approve", item.id)}
                  disabled={loading === `kyc_approve:${item.id}`}
                  className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {loading === `kyc_approve:${item.id}` ? "…" : "Aprobar"}
                </button>
                <button
                  onClick={() => executeAction("kyc_reject", item.id)}
                  disabled={loading === `kyc_reject:${item.id}`}
                  className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                >
                  {loading === `kyc_reject:${item.id}` ? "…" : "Rechazar"}
                </button>
              </div>
            </div>
          ))}
          {kycPending.filter((i) => !isRemoved(i.id)).length === 0 ? (
            <div className="p-5 text-sm text-slate-400">No hay solicitudes KYC pendientes.</div>
          ) : null}
        </div>
      </section>

      {/* Deposit Management */}
      <section className="hocker-panel-pro overflow-hidden">
        <div className="border-b border-white/5 p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Depósitos · Guardian: NUMIA
          </p>
          <h2 className="mt-1 text-lg font-black text-white">
            Depósitos manuales pendientes ({depositPending.filter((i) => !isRemoved(i.id)).length})
          </h2>
        </div>
        <div className="divide-y divide-white/5">
          {depositPending.filter((i) => !isRemoved(i.id)).map((item) => (
            <div key={item.id} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-5 md:items-center">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Usuario</p>
                <p className="mt-1 text-xs font-bold text-white">{redactId(item.user_id)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Monto</p>
                <p className="mt-1 text-xs font-bold text-white">
                  {item.amount ?? "—"} {item.currency ?? ""}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">ID</p>
                <p className="mt-1 text-xs font-bold text-white">{redactId(item.id)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fecha</p>
                <p className="mt-1 text-xs font-bold text-white">{formatDate(item.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => executeAction("deposit_confirm", item.id)}
                  disabled={loading === `deposit_confirm:${item.id}`}
                  className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {loading === `deposit_confirm:${item.id}` ? "…" : "Confirmar"}
                </button>
                <button
                  onClick={() => executeAction("deposit_reject", item.id)}
                  disabled={loading === `deposit_reject:${item.id}`}
                  className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                >
                  {loading === `deposit_reject:${item.id}` ? "…" : "Rechazar"}
                </button>
              </div>
            </div>
          ))}
          {depositPending.filter((i) => !isRemoved(i.id)).length === 0 ? (
            <div className="p-5 text-sm text-slate-400">No hay depósitos manuales pendientes.</div>
          ) : null}
        </div>
      </section>

      {/* Withdrawal Management */}
      <section className="hocker-panel-pro overflow-hidden">
        <div className="border-b border-white/5 p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Retiros · Guardian: NUMIA + VERTX
          </p>
          <h2 className="mt-1 text-lg font-black text-white">
            Retiros pendientes ({withdrawPending.filter((i) => !isRemoved(i.id)).length})
          </h2>
        </div>
        <div className="divide-y divide-white/5">
          {withdrawPending.filter((i) => !isRemoved(i.id)).map((item) => (
            <div key={item.id} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-5 md:items-center">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Usuario</p>
                <p className="mt-1 text-xs font-bold text-white">{redactId(item.user_id)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Monto</p>
                <p className="mt-1 text-xs font-bold text-white">
                  {item.amount ?? "—"} {item.currency ?? ""}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">ID</p>
                <p className="mt-1 text-xs font-bold text-white">{redactId(item.id)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fecha</p>
                <p className="mt-1 text-xs font-bold text-white">{formatDate(item.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => executeAction("withdraw_approve", item.id)}
                  disabled={loading === `withdraw_approve:${item.id}`}
                  className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {loading === `withdraw_approve:${item.id}` ? "…" : "Aprobar"}
                </button>
                <button
                  onClick={() => executeAction("withdraw_reject", item.id)}
                  disabled={loading === `withdraw_reject:${item.id}`}
                  className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                >
                  {loading === `withdraw_reject:${item.id}` ? "…" : "Rechazar"}
                </button>
              </div>
            </div>
          ))}
          {withdrawPending.filter((i) => !isRemoved(i.id)).length === 0 ? (
            <div className="p-5 text-sm text-slate-400">No hay retiros pendientes.</div>
          ) : null}
        </div>
      </section>

      {/* Casino Settings */}
      <CasinoSettingsSection
        settings={casinoSettings}
        loading={loading}
        onExecute={executeAction}
      />
    </div>
  );
}

function CasinoSettingsSection({
  settings,
  loading,
  onExecute,
}: {
  settings: Record<string, unknown>;
  loading: string | null;
  onExecute: (action: string, targetId?: string, extra?: Record<string, unknown>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({
    cashback_daily_cap: String(settings.cashback_daily_cap ?? ""),
    cashback_weekly_cap: String(settings.cashback_weekly_cap ?? ""),
    cashback_lookback_days: String(settings.cashback_lookback_days ?? ""),
    cashback_wager_multiplier: String(settings.cashback_wager_multiplier ?? ""),
    free_rounds_wager_multiplier: String(settings.free_rounds_wager_multiplier ?? ""),
    promo_bonus_wager_multiplier: String(settings.promo_bonus_wager_multiplier ?? ""),
  });

  const settingsFields = [
    { key: "cashback_daily_cap", label: "Tope cashback diario", type: "number" },
    { key: "cashback_weekly_cap", label: "Tope cashback semanal", type: "number" },
    { key: "cashback_lookback_days", label: "Días de lookback cashback", type: "number" },
    { key: "cashback_wager_multiplier", label: "Multiplicador wager cashback", type: "number" },
    { key: "free_rounds_wager_multiplier", label: "Multiplicador wager free rounds", type: "number" },
    { key: "promo_bonus_wager_multiplier", label: "Multiplicador wager promo bonus", type: "number" },
  ];

  function handleSave() {
    const updateData: Record<string, unknown> = {};
    for (const field of settingsFields) {
      const val = values[field.key];
      if (val !== "" && val !== String(settings[field.key] ?? "")) {
        updateData[field.key] = Number(val);
      }
    }
    if (Object.keys(updateData).length === 0) return;
    onExecute("settings_update", undefined, { settings: updateData });
  }

  return (
    <section className="hocker-panel-pro overflow-hidden">
      <div className="border-b border-white/5 p-5">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
          Configuración · Guardian: CHIDO_GERENTE
        </p>
        <h2 className="mt-1 text-lg font-black text-white">Parámetros del casino</h2>
        <p className="mt-1 text-xs text-slate-400">
          Ajusta los topes de cashback y multiplicadores de wager. Los cambios afectan
          inmediatamente a todos los jugadores.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
        {settingsFields.map((field) => (
          <div key={field.key}>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              {field.label}
            </label>
            <input
              type={field.type}
              value={values[field.key]}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            />
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 p-5">
        <button
          onClick={handleSave}
          disabled={loading === "settings_update:global"}
          className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {loading === "settings_update:global" ? "Guardando…" : "Guardar configuración"}
        </button>
      </div>
    </section>
  );
}
