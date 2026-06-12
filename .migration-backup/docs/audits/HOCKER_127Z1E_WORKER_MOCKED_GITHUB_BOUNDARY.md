# HOCKER ONE · 12.7Z-1E Worker Mocked GitHub Boundary

## Objetivo

Agregar frontera mock para ejecutar el flujo del worker sin hacer escrituras reales contra GitHub.

## Modo

`HOCKER_GITHUB_EXECUTION_MODE=mock`

## Garantías

- `github.create_branch` puede devolver resultado mock sin request real.
- `github.upsert_file` puede devolver resultado mock sin PUT real.
- `github.create_pr` puede devolver resultado mock sin POST real.
- Producción permanece en modo real si no se define `HOCKER_GITHUB_EXECUTION_MODE=mock`.
- La frontera mock se usará sólo para smoke controlado.

## Seguridad

- No se ejecuta GitHub write por defecto.
- No se altera Owner Gate.
- No se altera Supabase schema.
- No se elimina el guard de `expected_sha`.
- No se elimina el bloqueo de `main/master/production/prod`.
