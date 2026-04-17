"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type ExportRow = {
  id: string;
  export_type: string;
  file_name: string;
  content_hash: string;
  chain_fingerprint: string;
  seal_token: string;
  seal_signature: string;
  sealed_at: string;
};

export default function JurixExportPage() {
  const [exportType, setExportType] = useState<"pdf" | "csv" | "json">("pdf");
  const [limit, setLimit] = useState(250);
  const [lastExport, setLastExport] = useState<ExportRow | null>(null);
  const [verifyData, setVerifyData] = useState<any>(null);

  async function createExport() {
    try {
      const res = await fetch("/api/jurix/audit/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: "hocker-one",
          export_type: exportType,
          limit
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo exportar");

      setLastExport(data.export);
      toast.success("Exportación creada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  async function verifyExport() {
    if (!lastExport) {
      toast.error("Primero crea una exportación.");
      return;
    }

    try {
      const res = await fetch(`/api/jurix/audit/export/${lastExport.id}/verify?project_id=hocker-one`, {
        method: "GET"
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo verificar");
      setVerifyData(data.verification);
      toast.success("Verificación registrada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Jurix — Exportación certificada</h1>
          <p className="mt-2 text-sm text-slate-300">
            PDF/CSV firmado, hash del contenido, fingerprint de cadena y verificación externa.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <CardTitle>Generar exportación</CardTitle>
            <CardDescription>
              Esto produce evidencia portable para auditoría, legal, compliance y defensa operativa.
            </CardDescription>

            <div className="grid gap-3 md:grid-cols-3">
              <Input value={exportType} onChange={(e) => setExportType(e.target.value as any)} placeholder="pdf / csv / json" />
              <Input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} placeholder="Limit" />
              <Button onClick={createExport}>Crear exportación</Button>
            </div>

            {lastExport ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <div className="font-medium text-white">Última exportación</div>
                <div className="mt-2 break-all">ID: {lastExport.id}</div>
                <div className="break-all">Archivo: {lastExport.file_name}</div>
                <div className="break-all">Hash: {lastExport.content_hash}</div>
                <div className="break-all">Fingerprint: {lastExport.chain_fingerprint}</div>
                <div className="break-all">Seal: {lastExport.seal_signature}</div>
                <Badge className="mt-3">{lastExport.export_type}</Badge>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <CardTitle>Verificación externa</CardTitle>
            <CardDescription>
              Genera un comprobante de integridad sobre el export firmado.
            </CardDescription>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={verifyExport} disabled={!lastExport}>Verificar exportación</Button>
            </div>

            {verifyData ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <div className="font-medium text-white">Verificación registrada</div>
                <div className="mt-2 break-all">Verification token: {verifyData.verification_token}</div>
                <div className="break-all">Signature: {verifyData.verification_signature}</div>
                <div>Status: {String(verifyData.is_valid)}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}