"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function createJurixClient() {
  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase no está configurado para exportar auditoría.");
  }

  return createClient(supabaseUrl, supabaseKey);
}

function csvValue(value: unknown): string {
  if (value == null) return "";
  const raw = typeof value === "object" ? JSON.stringify(value) : String(value);
  return '"' + raw.replace(/"/g, '""') + '"';
}

export default function JurixExportDashboard() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"JSON" | "CSV">("JSON");

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus("Preparando exportación...");

    try {
      const supabase = createJurixClient();

      const { data, error } = await supabase
        .from("transactions_audit")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setExportStatus("Procesando registros...");

      let content = "";
      let mimeType = "application/json";
      let extension = "json";

      if (selectedFormat === "JSON") {
        content = JSON.stringify(data ?? [], null, 2);
      } else {
        extension = "csv";
        mimeType = "text/csv";

        if (data && data.length > 0) {
          const headers = Object.keys(data[0]);
          const rows = data.map((row) => headers.map((key) => csvValue(row[key])).join(","));
          content = [headers.join(","), ...rows].join("\n");
        }
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "hocker_audit_export_" + new Date().toISOString().slice(0, 10) + "." + extension;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus("Exportación completada.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setExportStatus("No se pudo exportar: " + message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 text-white sm:p-8">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-sky-400/20 bg-slate-950/80 p-6 shadow-[0_0_40px_rgba(14,165,233,0.10)]">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-sky-300">JURIX</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight">Exportar auditoría</h1>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin/jurix")}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:border-sky-400/30 hover:text-white"
          >
            Volver
          </button>
        </div>

        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-slate-400">
            Descarga registros de auditoría para revisión interna. Usa JSON para sistemas y CSV para lectura rápida.
          </p>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.28em] text-sky-300">Formato</span>
            <select
              value={selectedFormat}
              onChange={(event) => setSelectedFormat(event.target.value as "JSON" | "CSV")}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-sky-400/50"
            >
              <option value="JSON">JSON</option>
              <option value="CSV">CSV</option>
            </select>
          </label>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full rounded-2xl bg-sky-400 px-5 py-4 text-sm font-black uppercase tracking-[0.28em] text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {isExporting ? "Exportando..." : "Descargar"}
          </button>

          {exportStatus ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
              {exportStatus}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

