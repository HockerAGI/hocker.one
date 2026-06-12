# NOVA Watchtower Supervision Layer - Hocker ONE

## Status

First real read-only supervision layer.

## Internal command

    npm run ops:nova:watch

## Visual name

Centinela NOVA

## Validates

- Pulso de Produccion.
- Escaneo de Seguridad Supabase.
- Candado de Base de Datos.

## Safety

Read-only supervision.

No Supabase mutation.

No payment mutation.

No betting balance mutation.

## Output

Local reports are generated under:

    runtime/ops/

These reports are intentionally ignored by git.

## Next step

Connect this watcher to a safe scheduler after manual validation passes.
