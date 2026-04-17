"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function JurixExportDashboard() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"JSON" | "CSV">("JSON");

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus("Iniciando extracción de la matriz de auditoría...");

    try {
      // Obtenemos los logs transaccionales y de auditoría
      const { data, error } = await supabase
        .from("transactions_audit")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setExportStatus(`Procesando ${data?.length || 0} registros...`);

      let content = "";
      let mimeType = "";
      let extension = "";

      if (selectedFormat === "JSON") {
        content = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        extension = "json";
      } else {
        // Conversión a CSV básica
        if (data && data.length > 0) {
          const headers = Object.keys(data[0]).join(",");
          const rows = data.map(row => 
            Object.values(row).map(val => 
              typeof val === 'object' ? `"${JSON.stringify(val).replace(/"/g, '""')}"` : `"${val}"`
            ).join(",")
          );
          content = [headers, ...rows].join("\n");
        }
        mimeType = "text/csv";
        extension = "csv";
      }

      // Descarga en el navegador
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hkr_supply_audit_export_${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus("Exportación completada. Protocolo de seguridad ejecutado.");
    } catch (err: any) {
      console.error(err);
      setExportStatus(`Falla crítica en la exportación: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#00bfff]/30 p-8 rounded-md shadow-[0_0_20px_rgba(0,191,255,0.05)]">
        
        <div className="flex items-center justify-between mb-8 border-b border-[#00bfff]/30 pb-4">
          <h1 className="text-2xl font-bold text-[#00bfff] tracking-widest">EXPORTACIÓN JURIX</h1>
          <button 
            onClick={() => router.push("/admin/jurix")}
            className="text-sm opacity-60 hover:opacity-100 hover:text-[#00bfff] transition-colors"
          >
            [ VOLVER AL PANEL ]
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-sm opacity-80 leading-relaxed">
            Este módulo permite la extracción de la cadena de auditoría de HKR Supply y nodos asociados. 
            Toda la información exportada lleva un sello criptográfico implícito. Úselo con responsabilidad.
          </p>

          <div className="flex flex-col space-y-2">
            <label className="text-[#00bfff] text-sm tracking-widest">FORMATO DE EXTRACCIÓN</label>
            <select 
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as "JSON" | "CSV")}
              className="bg-transparent border border-[#00bfff]/50 text-white p-3 rounded outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff]"
            >
              <option value="JSON" className="bg-[#050505]">JSON (Recomendado para Máquinas)</option>
              <option value="CSV" className="bg-[#050505]">CSV (Lectura Humana/Excel)</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`w-full py-4 mt-4 font-bold tracking-widest transition-all rounded shadow-md ${
              isExporting 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700" 
                : "bg-[#00bfff] text-black hover:bg-white border border-[#00bfff] hover:shadow-[0_0_15px_rgba(0,191,255,0.8)]"
            }`}
          >
            {isExporting ? "PROCESANDO EXTRACCIÓN..." : "INICIAR DESCARGA SEGURA"}
          </button>

          {exportStatus && (
            <div className={`p-4 mt-4 text-sm rounded ${exportStatus.includes('Falla') ? 'bg-red-900/20 border border-red-500 text-red-400' : 'bg-[#00bfff]/10 border border-[#00bfff]/30 text-[#00bfff]'}`}>
              {"> "} {exportStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
