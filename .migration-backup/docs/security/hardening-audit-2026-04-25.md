# Hocker One · Hardening Audit · 2026-04-25

## Estado

Hardening aplicado de forma controlada sin usar `npm audit fix --force`.

## Corregido

- `protobufjs` quedó actualizado a `7.5.5`.
- `follow-redirects` quedó actualizado a `1.16.0`.
- `axios` quedó actualizado vía lockfile.
- `next` quedó resuelto a `16.2.4`.
- `autoprefixer` quedó actualizado a `10.5.0`.
- Build productivo validado con `npm run build`.

## Residuales controlados

### `postcss` dentro de `next`

`npm audit` reporta `postcss <8.5.10` dentro de `next/node_modules/postcss`.

No se fuerza con `npm audit fix --force` porque npm intenta instalar una versión antigua de Next, lo cual rompería el proyecto.

Estado: residual de framework.

### `uuid` dentro de `@trigger.dev/sdk`

`@trigger.dev/sdk@3.3.17` depende de `uuid@9.0.1`.

Se probó `@trigger.dev/sdk@4.4.4`, pero elevó el audit a vulnerabilidades altas por dependencias transitivas nuevas como `socket.io`, `engine.io`, `cookie`, `systeminformation` y `@opentelemetry/host-metrics`.

Por estabilidad y seguridad práctica, se mantiene `@trigger.dev/sdk@3.3.17` hasta que exista una versión upstream más limpia.

Estado: residual upstream controlado.

## Decisión

No se fuerza actualización destructiva.

El proyecto queda estable, con build limpio y sin vulnerabilidades críticas después del fix seguro.
