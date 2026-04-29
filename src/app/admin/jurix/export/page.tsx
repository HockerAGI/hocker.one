"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Download } from "lucide-react";
import PageShell from "@/components/PageShell";

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
    <PageShell
      eyebrow="JURIX"
      title="Exportar auditoría"
      description="Descarga registros para revisión interna. JSON para sistemas, CSV para lectura rápida."
      actions={
        <button
          type="button"
          onClick={() => router.push("/admin/jurix")}
          className="hocker-button-ghost"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
      }
    >
      <section className="mx-auto w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#07101f] p-5">
        <div className="space-y-5">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-300">
              Formato
            </span>

            <select
              value={selectedFormat}
              onChange={(event) => setSelectedFormat(event.target.value as "JSON" | "CSV")}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0b1526] px-4 py-3 text-sm text-white outline-none focus:border-sky-400/50"
            >
              <option value="JSON">JSON</option>
              <option value="CSV">CSV</option>
            </select>
          </label>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="hocker-button-brand min-h-[54px] w-full"
          >
            <Download size={17} />
            {isExporting ? "Exportando..." : "Descargar"}
          </button>

          {exportStatus ? (
            <div className="rounded-[22px] border border-white/10 bg-[#0b1526] p-4 text-sm text-slate-300">
              {exportStatus}
            </div>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
