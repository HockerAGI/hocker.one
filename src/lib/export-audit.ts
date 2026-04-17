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
}