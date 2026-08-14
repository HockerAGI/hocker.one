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
- `HockerAGI/chido.lab`
- `HockerAGI/chido.games`

## Variable de producción

La variable siguiente es opcional y solo debe usarse para reducir o sustituir explícitamente el alcance:

```bash
HOCKER_GITHUB_ALLOWED_REPOS=HockerAGI/hocker.one,HockerAGI/nova.agi,HockerAGI/hocker-node-agent,HockerAGI/chido.casino,HockerAGI/hocker.agi,HockerAGI/hocker.ads,HockerAGI/chido.lab,HockerAGI/chido.games
```

Si el entorno productivo conserva una allowlist explícita anterior, debe reconciliarse para no bloquear ningún repositorio autorizado. La actualización del entorno es una operación separada de este cambio de código y no debe exponer secretos.

## Repositorios privados

El token/app GitHub de producción debe tener acceso explícito a cada repositorio privado incluido en la allowlist. Actualmente esto aplica a `HockerAGI/hocker.ads`, `HockerAGI/chido.lab` y `HockerAGI/chido.games`; si la identidad productiva no tiene acceso, GitHub puede responder como repositorio no encontrado aunque la allowlist de Hocker ONE sea correcta.

Agregar un repositorio privado a la allowlist **no demuestra** por sí solo que la identidad GitHub de producción pueda leerlo o modificarlo. La preparación operativa debe conservar evidencia separada de acceso real antes de depender de mutaciones gobernadas.

## Límites obligatorios

- No se permite escribir directamente a `main`, `master`, `production` o `prod`.
- No se permiten archivos `.env`, claves, certificados, keystores ni secretos.
- No se permite `merge_pull_request` ni `delete_file` desde NOVA.
- Cada cambio debe usar una rama no principal, quedar en cola y pasar por aprobación del Owner.
- Agregar un repositorio a la allowlist no habilita deployment, migraciones, pagos, Ads, sesiones cliente ni acciones externas por sí mismo.
