# Plan — NOVA inmersiva y AGIs limpias

Fecha: 2026-08-19

## Objetivo

NOVA debe ser la superficie principal de conversación y `/agis` una vista de estado/excepción. No cambiar contratos backend que ya funcionan.

## Archivos previstos NOVA

- `src/app/chat/page.tsx`
- `src/components/NovaRealtimeChat.tsx`
- `src/components/NovaRealtimeChatLazy.tsx` sólo si es necesario
- posible `src/components/nova/NovaWorkspace.tsx` nuevo y acotado
- `PrivateShell` únicamente para modo inmersivo
- tests chat/navegación/a11y

## Task 1 — RED NOVA

Exigir:

- `/chat` no usa `PageShell` ni tarjeta exterior adicional;
- chat ocupa el alto útil con `dvh`/flex y safe areas;
- metadata de provider/model/nodo/proyecto/versiones no aparece permanentemente;
- estado de conexión y aprobaciones sólo aparece si es accionable/relevante;
- historial/detalle son paneles bajo demanda;
- controles no disponibles no simulan capacidad;
- APIs `/api/nova/chat`, `/api/nova/chat/stream` y Owner Gate no cambian.

## Task 2 — GREEN NOVA

- render directo de workspace de chat;
- un solo encabezado visual;
- conversación central legible con ancho máximo razonable;
- composer fijo/pegado al fondo del área útil, multilinea y safe-area aware;
- `Detalle` opcional para diagnóstico;
- historial opcional preparado sobre datos reales existentes; si no existe backend de lista, no crear historial falso: sólo estructurar el affordance cuando haya fuente real;
- acciones materiales permanecen como tarjetas inline con aprobación.

## Archivos previstos AGIs

- `src/app/agis/page.tsx`
- `src/components/agi/AgiEvalBatchControl.tsx`
- `src/components/agi/AgiEvalControl.tsx` se conserva para diagnóstico, pero sale de la vista normal
- posible componente de lista/detalle
- tests de certificación + UI

## Task 3 — RED AGIs

Exigir:

- vista normal no renderiza `AgiEvalControl` por cada AGI;
- una sola acción contextual de certificación;
- no porcentaje cosmético como resumen principal;
- lista muestra nombre, función, estado y pendiente breve;
- IDs/versiones/worker/registry/runs sólo en detalle;
- snapshot parcial sigue fail-closed;
- AAL2 se integra en el flujo de una sola acción.

## Task 4 — GREEN AGIs

- resumen breve: total/listas/atención + acción;
- lista compacta 16 AGIs;
- detalle progresivo para evidencia técnica;
- estado compartido en vocabulario simple;
- control global decide CTA según sesión/evidencia; no CTA cuando todo está listo o ya está procesando;
- controles individuales sólo en diagnóstico avanzado.

## Task 5 — Regresión

- cert runner y endpoints sin cambios de seguridad;
- no DDL/RLS/provider/model;
- `allow_actions=false` intacto;
- no pérdida de evidencia ni historial.

## Verificación

Tests focales → full suite → typecheck/lint/build → Preview exact-head → revisión visual de NOVA y AGIs en móvil/tableta/escritorio.