"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

type AuditRow = {
  id: string;
  seq: number;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  actor_type: string;
  role: string;
  action: string;
  severity: string;
  row_hash: string;
  prev_hash: string;
  signature: string;
  created_at: string;
};

type VerifyResult = {
  ok: boolean;
  total: number;
  invalid: Array<{ seq: number; reason: string }>;
};

type FingerprintResult = {
  ok: boolean;
  total: number;
  invalid: Array<{ seq: number; reason: string }>;
  fingerprint: string;
};

export default function JurixAuditPage() {
  const [chain, setChain] = useState<AuditRow[]>([]);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [fingerprint, setFingerprint] = useState<FingerprintResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const [chainRes, verifyRes, fpRes] = await Promise.all([
        fetch("/api/jurix/audit/chain?project_id=hocker-one").then((r) => r.json()),
        fetch("/api/jurix/audit/verify?project_id=hocker-one").then((r) => r.json()),
        fetch("/api/jurix/audit/fingerprint?project_id=hocker-one").then((r) => r.json())
      ]);

      setChain(chainRes.chain ?? []);
      setVerify(verifyRes.result ?? null);
      setFingerprint(fpRes.result ?? null);
    } catch {
      toast.error("No se pudo cargar el ledger.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Jurix — Auditoría & Cumplimiento</h1>
          <p className="mt-2 text-sm text-slate-300">
            Ledger inmutable, verificación por hash chain y trazabilidad anti-manipulación.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent>
              <CardDescription>Estado de verificación</CardDescription>
              <CardTitle className="mt-2 text-3xl">{verify?.ok ? "OK" : "ALERTA"}</CardTitle>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <CardDescription>Eventos auditados</CardDescription>
              <CardTitle className="mt-2 text-3xl">{verify?.total ?? 0}</CardTitle>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <CardDescription>Fingerprint</CardDescription>
              <CardTitle className="mt-2 break-all text-base">{fingerprint?.fingerprint ?? "—"}</CardTitle>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Ledger criptográfico</CardTitle>
                <CardDescription className="mt-1">
                  Cadena secuencial firmada. Si algo se toca, se rompe.
                </CardDescription>
              </div>
              <Button variant="secondary" onClick={() => void load()} disabled={busy}>
                Recargar
              </Button>
            </div>

            {verify && !verify.ok ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                La cadena tiene inconsistencias. Revisa los índices: {verify.invalid.map((x) => `#${x.seq} ${x.reason}`).join(" | ")}
              </div>
            ) : null}

            <div className="space-y-2">
              {chain.map((row) => (
                <div key={row.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">#{row.seq} · {row.action}</div>
                      <div className="text-xs text-slate-400">
                        {row.event_type} · {row.entity_type} {row.entity_id ? `· ${row.entity_id}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={row.severity === "critical" || row.severity === "error" ? "danger" : row.severity === "warn" ? "warning" : "default"}>
                        {row.severity}
                      </Badge>
                      <Badge variant="default">{row.role}</Badge>
                      <Badge variant="default">{row.actor_type}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-2">
                    <div><span className="text-slate-200">row_hash:</span> {row.row_hash}</div>
                    <div><span className="text-slate-200">prev_hash:</span> {row.prev_hash || "GENESIS"}</div>
                    <div><span className="text-slate-200">signature:</span> {row.signature}</div>
                    <div><span className="text-slate-200">created_at:</span> {formatDateTime(row.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}