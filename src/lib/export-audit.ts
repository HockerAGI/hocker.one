import PDFDocument from "pdfkit";

export type AuditPDFLog = {
  action?: string | null;
  role?: string | null;
  created_at?: string | null;
  entity_type?: string | null;
  [key: string]: unknown;
};

function safeText(value: unknown, fallback = "No registrado"): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function writeAuditPDF(doc: PDFKit.PDFDocument, logs: AuditPDFLog[]) {
  doc.fontSize(18).text("Reporte de Auditoría - HOCKER", { align: "center" });
  doc.moveDown();
  doc.fontSize(10).text(`Generado: ${new Date().toISOString()}`);
  doc.text("Fuente: Hocker ONE · Owner Evidence");
  doc.moveDown();

  if (logs.length === 0) {
    doc.fontSize(11).text("No hay evidencia ejecutada disponible para exportar.");
    return;
  }

  logs.forEach((log, index) => {
    doc.moveDown();
    doc.fontSize(12).text(`#${index + 1} · ${safeText(log.action, "Acción sin título")}`);
    doc.fontSize(10).text(`Rol: ${safeText(log.role)}`);
    doc.text(`Fecha: ${safeText(log.created_at)}`);
    doc.text(`Entidad: ${safeText(log.entity_type)}`);
  });
}

export function generateAuditPDF(logs: AuditPDFLog[]) {
  const doc = new PDFDocument({
    size: "LETTER",
    margin: 48,
    info: {
      Title: "Reporte de Auditoría - HOCKER",
      Author: "Hocker ONE",
      Subject: "Owner Evidence Export",
    },
  });

  writeAuditPDF(doc, logs);
  doc.end();

  return doc;
}

export function generateAuditPDFBuffer(logs: AuditPDFLog[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 48,
      info: {
        Title: "Reporte de Auditoría - HOCKER",
        Author: "Hocker ONE",
        Subject: "Owner Evidence Export",
      },
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", reject);

    writeAuditPDF(doc, logs);
    doc.end();
  });
}
