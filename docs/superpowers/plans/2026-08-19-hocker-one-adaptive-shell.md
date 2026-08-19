# Plan — Estructura adaptativa y navegación limpia

Fecha: 2026-08-19

## Objetivo

Reducir ruido global sin borrar rutas ni capacidades. Desktop muestra seis destinos cortos; móvil prioriza los destinos de uso frecuente y agrupa el resto en `Más`.

## Archivos previstos

- `src/lib/hocker-navigation.ts`
- `src/components/PrivateShell.tsx`
- `src/components/Sidebar.tsx`
- `src/components/Topbar.tsx`
- `src/components/BottomDock.tsx`
- `src/components/CommandPalette.tsx`
- estilos focales en `src/app/globals.css` o módulo CSS nuevo si reduce riesgo
- tests de navegación/shell/responsive existentes + nuevos contratos focales

## Task 1 — RED: jerarquía visible

Tests deben exigir:

- escritorio: `Inicio`, `NOVA`, `Trabajo`, `Ecosistema`, `Operación`, `Más`;
- rutas existentes siguen encontrables por búsqueda/deep link;
- móvil no fuerza seis tabs: `Inicio`, `NOVA`, `Trabajo`, `Ecosistema`, `Más`; `Operación` vive en Más en compacto;
- no se elimina ninguna ruta funcional por simplificar navegación.

## Task 2 — RED: eliminar duplicados

Tests deben fallar mientras:

- `PrivateShell` inserte `WorkspaceBar` permanentemente;
- desktop duplique logo en Sidebar y Topbar;
- exista segundo nivel completo permanentemente visible;
- shell siga añadiendo capas decorativas que compitan con contenido donde puedan retirarse sin semántica.

## Task 3 — GREEN: navegación

Implementar un registro único con:

- seis destinos principales;
- destinos secundarios agrupados y buscables;
- labels cortos en español;
- mapping de rutas legado → sección activa;
- Command Palette como acceso experto.

No cambiar URLs existentes salvo aliases/redirects compatibles.

## Task 4 — GREEN: shell

- quitar WorkspaceBar global; mover controles a Ajustes si aún no existe ubicación equivalente;
- Sidebar plegable/compactable en desktop sin perder teclado/foco;
- Topbar minimal: título, búsqueda cuando aplica, alerta real, NOVA cuando no estamos en NOVA;
- estado general compacto; expandir sólo en problema;
- BottomDock safe-area aware;
- una sola reserva de espacio móvil para evitar contenido detrás del dock.

## Task 5 — Responsive y a11y

Contratos mínimos:

- reflow equivalente a 320 CSS px;
- no scroll horizontal global;
- touch targets >=44px;
- `aria-current`, `aria-expanded`, labels de icon buttons;
- `focus-visible` no oculto por barras fijas;
- `prefers-reduced-motion` conserva funcionalidad;
- safe-area top/bottom.

## Verificación

Tests focales → full suite → typecheck/lint/build → Preview exact-head → inspección de 320/390/768/1024/1440/1920+ y orientación/altura corta.