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
  const evidenceExportHref = "/api/owner/evidence/export?project_id=hocker-one&status=executed&limit=50";
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
    <section className="space-y-4">
      <div className="hocker-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--hocker-cyan)]">Export server-only</p>
          <p className="mt-1 text-sm leading-6 text-[var(--hocker-text-soft)]">
            Descarga un PDF generado en API server. No se importa PDFKit en el frontend.
          </p>
        </div>

        <a
          href={evidenceExportHref}
          target="_blank"
          rel="noreferrer"
          className="hocker-focus-ring inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/15"
        >
          Exportar evidencia PDF
        </a>
      </div>

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
    </section>
  );
}
