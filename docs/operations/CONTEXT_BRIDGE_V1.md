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

La ruta `POST /api/context-bridge/checkpoints` requiere el Owner/Internal Gate. Escribe solo estado interno; no ejecuta herramientas MCP ni modifica plataformas externas.

## Manifiestos y cobertura

Un manifiesto reúne checkpoints concretos para un alcance (`global`, `repository`, `project`, `conversation` o `release`). Incluye snapshots de capacidades y cobertura. Empieza como `draft`.

La creación de drafts y la activación productiva tienen fronteras distintas:

- `POST /api/context-bridge/manifests` conserva el Owner/Internal Gate para crear drafts internos. Si recibe `activate=true`, falla cerrado y exige una sesión Owner con MFA AAL2.
- `POST /api/context-bridge/manifests/activate` es la única ruta web de activación. Requiere usuario autenticado, membership exacta `project_members.role = owner` y `auth.mfa.getAuthenticatorAssuranceLevel().currentLevel = aal2` antes de registrar evidencia o activar.
- `/owner/context-bridge` aplica el mismo gate Owner+AAL2 antes de leer el manifiesto activo o mostrar el control humano de activación.

Antes de activar un manifiesto:

1. la sesión debe pertenecer a un usuario Owner y estar en AAL2;
2. se rechaza si la cobertura del manifiesto no está completa;
3. `record_owner_gate_approval(jsonb)` registra acción, recurso, candidato, ambiente, trace/nonce, hash del request, `owner_user_id`, `current_aal` y modo de autenticación `supabase-session-aal2`;
4. `activate_context_bridge_manifest_v2(manifest_id, approval_id)` valida acción, recurso, proyecto, expiración y consumo de un solo uso;
5. se rechaza si la aprobación no existe, expiró, ya fue consumida o no corresponde al actor owner esperado;
6. se rechaza si el manifiesto contiene secretos, fue invalidado o su cobertura no está completa;
7. el manifiesto activo anterior pasa a `superseded`;
8. se registra la referencia de aprobación y esta se consume una sola vez;
9. las AGIs pueden recibir el manifiesto activo como contexto operativo filtrado.

La evidencia de aprobación expira a los 15 minutos y es one-time. La activación no recomputa ni valida de forma criptográfica independiente todos los campos de evidencia registrados. La ruta legacy de activación libre fue retirada y la ruta key-based actual es draft-only; ninguna de las dos debe reintroducirse como fallback de activación.

La cobertura usa estados `complete`, `partial`, `missing`, `stale` o `blocked`. “Leído” no significa “completo” si falta una fuente, una revisión o evidencia.

## Automatización segura

El flujo vigente es:

```text
ChatGPT/Codex/adaptador de plataforma
  -> resumen normalizado + revisión + evidencia
  -> Context Bridge checkpoint
  -> manifest draft + coverage
  -> sesión humana Owner + MFA AAL2
  -> aprobación estructurada Owner Gate evidence-bound
  -> activación de un solo uso
  -> NOVA/Syntia filtran conocimiento reutilizable
  -> Memory Mirror
  -> feed especializado por AGI
```

Las lecturas programadas pueden crear checkpoints y drafts mediante identidad interna. Una identidad interna o una llave compartida no puede activar un manifiesto. Una acción que cambie GitHub, Drive, Supabase, Vercel o cualquier otro proveedor se materializa en `agi_action_queue`, requiere aprobación, lock, ejecución limitada y evidencia.

## Vercel MCP y el archivo de túnel

El endpoint oficial aprobado es `https://mcp.vercel.com`, con OAuth, consentimiento del usuario y Streamable HTTP. Context Bridge registra su capacidad y evidencia; no incrusta credenciales de Vercel en el contexto.

`mcp_tunnel_client_proxy.py` es un helper de pruebas para iniciar un binario externo `tunnel-client`, leer una URL temporal y vigilar salud local. No contiene el binario, un protocolo de identidad HOCKER, autorización Owner Gate, allowlist de herramientas, auditoría ni pin criptográfico de distribución. Por esas razones no se integra al runtime productivo. Podrá reutilizarse únicamente en pruebas aisladas cuando el binario y el control plane estén identificados, fijados, autenticados y cubiertos por threat model.

## Estado desplegado

La capa operativa de Context Bridge está aplicada y desplegada. El estado verificado incluye:

- contrato TypeScript y detección de secretos;
- endpoint interno de checkpoints normalizados;
- migraciones versionadas con sources, checkpoints, manifests, coverage y capabilities;
- RLS habilitado y acceso de tablas internas restringido según su función service-only;
- `owner_gate_approvals` para evidencia estructurada de aprobación;
- `record_owner_gate_approval(jsonb)` y `activate_context_bridge_manifest_v2(uuid, uuid)` restringidos a ejecución interna/service-role;
- retiro de la función legacy de activación libre;
- ruta key-based de manifiestos reducida a draft-only;
- nueva ruta `/api/context-bridge/manifests/activate` y superficie `/owner/context-bridge` protegidas por Owner+AAL2;
- migración `context_bridge_owner_aal2_evidence`, aplicada en producción, que admite `supabase-session-aal2` como modo de evidencia del gate;
- pruebas de arquitectura, expiración, consumo único, no-bypass y MFA;
- PR #170 fusionado en `e66bfa8428d10dfc5a423523f3c2180555aab38c`;
- Vercel production `dpl_91oJDuwSppjdLdNScuv81uMQZp98`, `READY`, región `sfo1`, con el mismo commit verificado;
- smoke anónimo de `/owner/context-bridge` fail-closed hacia `/login` y sin logs `error`/`fatal` en la ventana post-deploy observada.

Este estado es **AAL2-enforced en código y deployment para la activación humana**, **audit-strengthened** y **evidence-bound** por usuario Owner, actor, acción, recurso, proyecto, expiración y consumo único. `owner_gate_approvals` conserva candidato, ambiente, trace/nonce, `request_hash` y `approval_hash`, proporcionando una traza tamper-evident para auditoría y comparación de evidencia.

Límites de evidencia:

- no existe todavía evidencia conectada de que una persona Owner concreta haya completado el enrollment TOTP en producción ni de una activación real realizada con esa sesión humana; no debe afirmarse esa ceremonia como verificada hasta observarla;
- `service_role` conserva capacidad administrativa sobre la base y no existe una attestation criptográfica externa independiente;
- la activación no revalida criptográficamente todos los campos de evidencia contra un sistema externo.

## Siguiente capa

Las siguientes extensiones deben conservar deny-by-default y trazabilidad:

- adaptadores concretos que publiquen checkpoints sin importar conversaciones completas;
- clasificación continua de cobertura, staleness y evidencia sin trasladar secretos al contexto;
- evidencia conectada de enrollment/challenge TOTP y de una activación humana AAL2 cuando el Owner realice esa ceremonia;
- mecanismo independiente de integridad/attestation si se requiere elevar la garantía frente a identidades privilegiadas.
