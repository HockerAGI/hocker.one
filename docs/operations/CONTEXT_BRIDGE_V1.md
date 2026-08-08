# HOCKER Context Bridge v1

## Resultado buscado

Context Bridge permite que Hocker One conserve continuidad verificable entre ChatGPT, Codex, GitHub, Google Drive, Supabase y Vercel sin depender de copiar y pegar conversaciones completas.

No reemplaza a Memory Mirror. Son capas distintas:

- Context Bridge conserva el estado operativo: fuentes consultadas, revisión exacta, decisiones, pendientes, cobertura, capacidades disponibles y evidencia.
- Memory Mirror conserva conocimiento reutilizable por las AGIs después de Syntia, NOVA y los controles de seguridad/aprobación existentes.
- GitHub mantiene contratos, código y migraciones versionadas.
- Supabase mantiene el registro operativo y los checkpoints.
- Vercel ejecuta APIs stateless; no se convierte en memoria primaria.

## Orden de verdad

Cuando dos fuentes se contradicen, se usa este orden:

1. Estado real de producción y configuración verificada.
2. Código y migraciones Git del SHA candidato.
3. Contratos y pruebas verificadas.
4. Canon documental aprobado.
5. Conocimiento externo con procedencia.
6. Conversaciones de ChatGPT o Codex.

Una conversación puede explicar una decisión, pero no demuestra que un cambio esté desplegado.

## Adaptadores

| Adaptador | Lectura normalizada | Escritura externa | Evidencia mínima |
| --- | --- | --- | --- |
| ChatGPT | Resumen, decisiones, pendientes y referencias del proyecto | No directa | proyecto/conversación, revisión y fecha |
| Codex | Workspace, rama, SHA, pruebas, decisiones y pendientes | Solo por Owner Gate | repo, rama, SHA, comandos de verificación |
| GitHub | Repos, PR, checks, commits y security state | Rama/PR únicamente por Owner Gate | URL, SHA y run/check |
| Google Drive | Índice y documentos permitidos | Desactivada inicialmente | file ID, revisión y clasificación |
| Supabase | Esquema, migrations, RLS y estado permitido | SQL/DDL únicamente por Owner Gate | project ref, migration y evidencia |
| Vercel | Proyecto, deployment, logs y dominio | Deploy/config únicamente por Owner Gate | project, deployment y commit SHA |

Un adaptador no se considera conectado por existir como plugin. Debe publicar un checkpoint válido con evidencia y una revisión concreta.

## Contrato de checkpoint

Cada cliente publica únicamente información normalizada:

- `project_id`, `source_id`, proveedor y tipo de fuente;
- referencia externa y revisión exacta;
- resumen corto;
- decisiones tomadas;
- pendientes;
- referencias canónicas;
- cursor de lectura no secreto;
- capacidades observadas y su evidencia.

El servidor calcula el `content_hash`. No se aceptan conversaciones crudas, historiales de mensajes, cookies, tokens, claves, contraseñas ni variables secretas. Los secretos siguen en el secret manager/llavero correspondiente y jamás se copian a Context Bridge, Memory Mirror, RAG o memoria AGI.

La ruta inicial es `POST /api/context-bridge/checkpoints`. Requiere el Owner/Internal Gate ya existente. Escribe solo estado interno; no ejecuta herramientas MCP ni modifica plataformas externas.

## Manifiestos y cobertura

Un manifiesto reúne checkpoints concretos para un alcance (`global`, `repository`, `project`, `conversation` o `release`). Incluye snapshots de capacidades y cobertura. Empieza como `draft`.

Solo el flujo Owner Gate puede activar un manifiesto. Al activar uno:

1. se rechaza si contiene secretos o fue invalidado;
2. el manifiesto activo anterior pasa a `superseded`;
3. se registra quién aprobó y cuándo;
4. las AGIs pueden recibir el manifiesto activo como contexto operativo filtrado.

La cobertura usa estados `complete`, `partial`, `missing`, `stale` o `blocked`. “Leído” no significa “completo” si falta una fuente, una revisión o evidencia.

## Automatización segura

El flujo objetivo es:

```text
ChatGPT/Codex/adaptador de plataforma
  -> resumen normalizado + revisión + evidencia
  -> Context Bridge checkpoint
  -> manifest draft + coverage
  -> Owner Gate para activación o cualquier escritura externa
  -> NOVA/Syntia filtran conocimiento reusable
  -> Memory Mirror
  -> feed especializado por AGI
```

Las lecturas programadas pueden crear checkpoints mediante identidad interna. Una acción que cambie GitHub, Drive, Supabase, Vercel o cualquier otro proveedor se materializa en `agi_action_queue`, requiere aprobación, lock, ejecución limitada y evidencia.

## Vercel MCP y el archivo de túnel

El endpoint oficial aprobado es `https://mcp.vercel.com`, con OAuth, consentimiento del usuario y Streamable HTTP. Context Bridge registra su capacidad y evidencia; no incrusta credenciales de Vercel en el contexto.

`mcp_tunnel_client_proxy.py` es un helper de pruebas para iniciar un binario externo `tunnel-client`, leer una URL temporal y vigilar salud local. No contiene el binario, un protocolo de identidad HOCKER, autorización Owner Gate, allowlist de herramientas, auditoría ni pin criptográfico de distribución. Por esas razones no se integra al runtime productivo. Podrá reutilizarse únicamente en pruebas aisladas cuando el binario y el control plane estén identificados, fijados, autenticados y cubiertos por threat model.

## Estado de esta primera capa

Incluido en el Release Candidate, pero todavía sin aplicar a Supabase ni desplegar:

- contrato TypeScript y detección de secretos;
- endpoint interno de checkpoints normalizados;
- migración versionada con sources, checkpoints, manifests, coverage y capabilities;
- RLS habilitado, cero políticas públicas y grants exclusivos de `service_role`;
- activación de manifiesto restringida a función service-only que debe invocarse detrás de Owner Gate;
- pruebas de arquitectura y seguridad.

Siguiente capa: generador de manifest/coverage, endpoint de lectura del manifiesto activo y adaptadores concretos que publiquen checkpoints sin importar conversaciones completas.
