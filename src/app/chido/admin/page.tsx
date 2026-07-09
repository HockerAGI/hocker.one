import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Chido · Hocker ONE",
  description: "Controles administrativos de Chido Casino: KYC, depósitos, retiros, juegos y configuración.",
};

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

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

async function loadAdminData() {
  const sb = createAdminSupabase();

  const [kycRes, depositRes, withdrawRes, ctrlRes, settingsRes] = await Promise.all([
    sb
      .from("kyc_requests")
      .select("id, user_id, status, submitted_at, created_at")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true })
      .limit(20),
    sb
      .from("manual_deposit_requests")
      .select("id, user_id, status, amount, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20),
    sb
      .from("withdraw_requests")
      .select("id, user_id, status, amount, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20),
    sb
      .from("system_controls")
      .select("id, kill_switch, allow_write, meta, updated_at")
      .eq("id", "chido-casino-games")
      .maybeSingle(),
    sb
      .from("casino_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  // Enrich KYC with profile data (username, email)
  const kycPending: PendingItem[] = ((kycRes.data ?? []) as JsonObject[]).map((row) => ({
    id: asText(row.id),
    user_id: asText(row.user_id),
    status: asText(row.status),
    submitted_at: asText(row.submitted_at),
    created_at: asText(row.created_at),
  }));

  // Best-effort: load profile info for KYC items
  if (kycPending.length > 0) {
    const userIds = kycPending.map((k) => k.user_id).filter(Boolean);
    if (userIds.length > 0) {
      const { data: profiles } = await sb
        .from("profiles")
        .select("user_id, username, email")
        .in("user_id", userIds);

      const profileMap = new Map<string, { username?: string; email?: string }>();
      for (const p of (profiles ?? []) as JsonObject[]) {
        profileMap.set(asText(p.user_id), {
          username: asText(p.username, undefined) || undefined,
          email: asText(p.email, undefined) || undefined,
        });
      }

      for (const item of kycPending) {
        const prof = profileMap.get(item.user_id);
        if (prof) {
          item.username = prof.username;
          item.email = prof.email;
        }
      }
    }
  }

  const depositPending: PendingItem[] = ((depositRes.data ?? []) as JsonObject[]).map((row) => ({
    id: asText(row.id),
    user_id: asText(row.user_id),
    status: asText(row.status),
    amount: asText(row.amount, undefined) as string | undefined,
    created_at: asText(row.created_at),
  }));

  const withdrawPending: PendingItem[] = ((withdrawRes.data ?? []) as JsonObject[]).map((row) => ({
    id: asText(row.id),
    user_id: asText(row.user_id),
    status: asText(row.status),
    amount: asText(row.amount, undefined) as string | undefined,
    created_at: asText(row.created_at),
  }));

  const ctrlRow = asRecord(ctrlRes.data);
  const gamesPaused = Boolean(ctrlRow.kill_switch);

  const casinoSettings = asRecord(settingsRes.data);

  return {
    kycPending,
    depositPending,
    withdrawPending,
    gamesPaused,
    casinoSettings,
  };
}

export default async function ChidoAdminPage() {
  const data = await loadAdminData();

  return (
    <PageShell
      title="Admin Chido"
      subtitle="Controles administrativos reales: KYC, depósitos, retiros, pausa de juegos y configuración del casino."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/chido" className="hocker-button-secondary">
            Chido
          </Link>
          <Link href="/chido/dashboard" className="hocker-button-secondary">
            Dashboard
          </Link>
          <Link href="/chido/ops" className="hocker-button-secondary">
            Operación
          </Link>
          <Link href="/chido/actions" className="hocker-button-secondary">
            Acciones
          </Link>
          <Link href="/dashboard" className="hocker-button-primary">
            Panel
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Controles administrativos reales">
          Esta página ejecuta operaciones reales sobre la base de datos compartida de Chido
          Casino usando la service role key de Supabase. Todas las acciones quedan registradas
          en la bitácora de eventos con trace ID, razón y actor. Requiere la llave del owner
          (HOCKER_OWNER_ACTION_KEY) o un token interno válido.
        </Hint>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              KYC pendientes
            </p>
            <p className="mt-1 text-2xl font-black text-white">{data.kycPending.length}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Depósitos pendientes
            </p>
            <p className="mt-1 text-2xl font-black text-white">{data.depositPending.length}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Retiros pendientes
            </p>
            <p className="mt-1 text-2xl font-black text-white">{data.withdrawPending.length}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Estado de juegos
            </p>
            <p
              className={`mt-1 text-sm font-black ${
                data.gamesPaused ? "text-rose-300" : "text-emerald-300"
              }`}
            >
              {data.gamesPaused ? "Pausados" : "Activos"}
            </p>
          </div>
        </div>

        <AdminPanel
          kycPending={data.kycPending}
          depositPending={data.depositPending}
          withdrawPending={data.withdrawPending}
          gamesPaused={data.gamesPaused}
          casinoSettings={data.casinoSettings}
        />
      </div>
    </PageShell>
  );
}
