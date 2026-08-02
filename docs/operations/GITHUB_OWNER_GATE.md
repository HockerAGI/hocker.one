# GitHub Owner Gate

Hocker ONE es la única autoridad que materializa mutaciones GitHub preparadas por NOVA.

## Repositorios canónicos

La allowlist predeterminada cubre:

- `HockerAGI/hocker.one`
- `HockerAGI/nova.agi`
- `HockerAGI/hocker-node-agent`
- `HockerAGI/chido.casino`
- `HockerAGI/hocker.agi`

## Variable de producción

La variable siguiente es opcional y solo debe usarse para reducir o sustituir explícitamente el alcance:

```bash
HOCKER_GITHUB_ALLOWED_REPOS=HockerAGI/hocker.one,HockerAGI/nova.agi,HockerAGI/hocker-node-agent,HockerAGI/chido.casino,HockerAGI/hocker.agi
```

Si Vercel conserva una lista antigua de tres repositorios, debe actualizarse para no bloquear Chido Casino ni el sitio corporativo.

## Límites obligatorios

- No se permite escribir directamente a `main`, `master`, `production` o `prod`.
- No se permiten archivos `.env`, claves, certificados, keystores ni secretos.
- No se permite `merge_pull_request` ni `delete_file` desde NOVA.
- Cada cambio debe usar una rama no principal, quedar en cola y pasar por aprobación del Owner.
- El token GitHub de producción debe tener acceso al repositorio privado `HockerAGI/hocker.agi`; sin ese permiso, GitHub responderá como repositorio no encontrado aunque la allowlist sea correcta.
