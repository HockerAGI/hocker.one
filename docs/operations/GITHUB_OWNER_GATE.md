# GitHub Owner Gate

Hocker ONE es la única autoridad que materializa mutaciones GitHub preparadas por NOVA.

## Repositorios canónicos

La allowlist predeterminada cubre:

- `HockerAGI/hocker.one`
- `HockerAGI/nova.agi`
- `HockerAGI/hocker-node-agent`
- `HockerAGI/chido.casino`
- `HockerAGI/hocker.agi`
- `HockerAGI/hocker.ads`

## Variable de producción

La variable siguiente es opcional y solo debe usarse para reducir o sustituir explícitamente el alcance:

```bash
HOCKER_GITHUB_ALLOWED_REPOS=HockerAGI/hocker.one,HockerAGI/nova.agi,HockerAGI/hocker-node-agent,HockerAGI/chido.casino,HockerAGI/hocker.agi,HockerAGI/hocker.ads
```

Si el entorno productivo conserva una allowlist explícita anterior, debe reconciliarse para no bloquear ningún repositorio autorizado. La actualización del entorno es una operación separada de este cambio de código y no debe exponer secretos.

## Repositorios privados

El token/app GitHub de producción debe tener acceso explícito a los repositorios privados incluidos en la allowlist. Actualmente esto aplica al menos a `HockerAGI/hocker.ads`; si el token no tiene acceso, GitHub puede responder como repositorio no encontrado aunque la allowlist de Hocker ONE sea correcta.

## Límites obligatorios

- No se permite escribir directamente a `main`, `master`, `production` o `prod`.
- No se permiten archivos `.env`, claves, certificados, keystores ni secretos.
- No se permite `merge_pull_request` ni `delete_file` desde NOVA.
- Cada cambio debe usar una rama no principal, quedar en cola y pasar por aprobación del Owner.
- Agregar un repositorio a la allowlist no habilita deployment, migraciones, pagos, Ads, sesiones cliente ni acciones externas por sí mismo.
