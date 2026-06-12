# HOCKER ONE · 13-2C-I-C3-C Evidence Export Server-Only

## Objetivo

Crear exportación PDF de evidencia owner usando `export-audit.ts` sólo desde API server.

## Cambios

- `export-audit.ts` conserva `generateAuditPDF`.
- Se agrega `generateAuditPDFBuffer`.
- Nuevo endpoint: `/api/owner/evidence/export`.
- `OwnerEvidenceLivePanel` muestra link de descarga.
- El frontend no importa `pdfkit`.

## Seguridad

- Endpoint sólo usa método GET.
- Requiere `requireProjectRole(project_id, ["owner", "admin"])`.
- No modifica acciones.
- No ejecuta acciones.
- No aprueba acciones.
- No usa service role.
- No toca middleware/proxy.
- No importa `pdfkit` en componentes cliente.
- `runtime = "nodejs"` para PDFKit.

## Uso

`/api/owner/evidence/export?project_id=hocker-one&status=executed&limit=50`
