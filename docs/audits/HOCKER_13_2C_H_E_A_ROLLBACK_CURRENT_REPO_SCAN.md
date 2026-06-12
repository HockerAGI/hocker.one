# HOCKER ONE · 13-2C-H-E-A Rollback Current Repo Scan

## Git state

6a93ed0 (HEAD -> nova/phase13-2c-h-e-a-rollback-audit, tag: stable-hocker-one-phase13-2c-h-d-inline-result-evidence-20260525_134327, origin/main, origin/HEAD, main) Merge pull request #54 from HockerAGI/nova/phase13-2c-h-d-inline-result-evidence
25377a5 (origin/nova/phase13-2c-h-d-inline-result-evidence, nova/phase13-2c-h-d-inline-result-evidence) feat: improve inline execution result evidence 13-2C-H-D
151e6be (tag: stable-hocker-one-phase13-2c-h-c-inline-execute-approved-20260525_123638) Merge pull request #53 from HockerAGI/nova/phase13-2c-h-c-inline-execute-approved
6b6bfc2 (origin/nova/phase13-2c-h-c-inline-execute-approved, nova/phase13-2c-h-c-inline-execute-approved) feat: add inline execution for approved actions 13-2C-H-C
da132c8 (tag: stable-hocker-one-phase13-2c-h-b-nova-inline-approval-20260525_053305) Merge pull request #52 from HockerAGI/nova/phase13-2c-h-b-nova-inline-approval
1d39f46 (origin/nova/phase13-2c-h-b-nova-inline-approval, nova/phase13-2c-h-b-nova-inline-approval) feat: add nova inline approval cards 13-2C-H-B
e69c2e8 (tag: stable-hocker-one-phase13-2c-h-a-owner-gate-schema-audit-20260525_045606) Merge pull request #51 from HockerAGI/nova/phase13-2c-h-a-owner-gate-schema-audit
e742f25 (origin/nova/phase13-2c-h-a-owner-gate-schema-audit, nova/phase13-2c-h-a-owner-gate-schema-audit) docs: audit owner gate schemas 13-2C-H-A
72dbd48 (tag: stable-hocker-one-phase13-2c-g-owner-route-hardening-20260525_041959) Merge pull request #50 from HockerAGI/nova/phase13-2c-g-owner-route-hardening
dfc235b (origin/nova/phase13-2c-g-owner-route-hardening, nova/phase13-2c-g-owner-route-hardening) feat: harden owner route policy 13-2C-G
4498069 (tag: stable-hocker-one-phase13-2c-f-owner-live-summary-20260525_023547) Merge pull request #49 from HockerAGI/nova/phase13-2c-f-owner-live-summary
b12c5aa (origin/nova/phase13-2c-f-owner-live-summary, nova/phase13-2c-f-owner-live-summary) feat: add owner command center live summary 13-2C-F
d4b9d0a (tag: stable-hocker-one-phase13-2c-e-owner-nova-bridge-20260525_020738) Merge pull request #48 from HockerAGI/nova/phase13-2c-e-owner-nova-bridge
2afc8fd (origin/nova/phase13-2c-e-owner-nova-bridge, nova/phase13-2c-e-owner-nova-bridge) feat: add owner nova bridge 13-2C-E
3971889 (tag: stable-hocker-one-phase13-2c-d-live-actions-evidence-20260525_013139) Merge pull request #47 from HockerAGI/nova/phase13-2c-d-live-actions-evidence
ced3632 (origin/nova/phase13-2c-d-live-actions-evidence, nova/phase13-2c-d-live-actions-evidence) feat: connect owner actions and evidence panels 13-2C-D

## Rollback / revert / restore references

src/app/api/agi/runtime/memory/publication-audit/route.ts:8:  rollbackSyntiaPublishedMemory,
src/app/api/agi/runtime/memory/publication-audit/route.ts:53:    if (action === "rollback") {
src/app/api/agi/runtime/memory/publication-audit/route.ts:54:      const result = await rollbackSyntiaPublishedMemory(
src/app/api/agi/runtime/memory/publication-audit/route.ts:68:        allowed_actions: ["list", "diff", "preview", "rollback"],
src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
src/components/owner/OwnerApprovalCenter.tsx:120:            <p>Cuando NOVA proponga cambios reales, aparecerán aquí con plan, riesgo y rollback.</p>
src/components/vfx/HockerVfxLayer.tsx:133:        ctx.restore();
src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:40:  if (result === "rolled_back") return "Revertida";
src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:98:            { label: "Rollback", value: record.rollback },
src/components/hocker-2c/owner/live/owner-live-normalizers.ts:17:  result: "success" | "failed" | "rolled_back" | "unknown";
src/components/hocker-2c/owner/live/owner-live-normalizers.ts:21:  rollback: string;
src/components/hocker-2c/owner/live/owner-live-normalizers.ts:77:  if (["rolled_back", "rollback"].includes(clean)) return "Revertida";
src/components/hocker-2c/owner/live/owner-live-normalizers.ts:135:        status.includes("rollback") ? "rolled_back" :
src/components/hocker-2c/owner/live/owner-live-normalizers.ts:157:      const rollback = item.rollback_plan ? "Disponible" : "No registrado";
src/components/hocker-2c/owner/live/owner-live-normalizers.ts:166:        rollback,
src/components/hocker-2c/owner/nova/OwnerNovaInlineApprovals.tsx:46:    clean.includes("revertida") ||
src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:23:  rollbackAvailable: boolean;
src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:132:  const rollbackAvailable = deepHasTruthyKey(payload, ["rollback_plan"]);
src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:143:    { label: "Rollback", value: rollbackAvailable ? "Disponible" : "No registrado" },
src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:152:    rollbackAvailable,
src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:227:    clean.includes("revertida") ||
src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:257:      {result.rollbackAvailable ? (
src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:259:          Rollback disponible. Revisa la evidencia antes de revertir cualquier cambio.
src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:277:          No encontré evidencia reciente visible todavía. Puede tardar unos segundos en aparecer.
src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:341:        rollbackAvailable: false,
src/lib/github-runtime-executor.ts:368:      strategy: "restore_previous_blob_or_revert_commit",
src/lib/github-runtime-executor.ts:379:    strategy: "close_pr_or_revert_branch",
src/lib/github-runtime-executor.ts:436:            "Adjuntar resumen, rollback y evidencia de validación.",
src/lib/github-runtime-executor.ts:462:    rollback_plan: buildRollbackPlan(operation, path),
src/lib/agi-action-execution.ts:27:  rollback_plan?: JsonRecord | null;
src/lib/agi-action-execution.ts:196:      note: result.created ? "Rollback puede eliminar la rama creada si no hay PR activo." : "La rama ya existía; rollback automático no aplica.",
src/lib/agi-action-execution.ts:202:      type: "github.restore_previous_file_sha",
src/lib/agi-action-execution.ts:209:      note: result.previous_sha ? "Rollback requiere restaurar contenido previo usando previous_sha." : "Archivo nuevo; rollback requiere eliminar archivo creado.",
src/lib/agi-action-execution.ts:220:      note: result.already_exists ? "PR ya existía; rollback automático no aplica." : "Rollback puede cerrar el PR draft creado.",
src/lib/agi-action-execution.ts:697:    const rollbackPlan = buildRollbackPlan(item, result as JsonRecord);
src/lib/agi-action-execution.ts:707:      rollback_plan: rollbackPlan,
src/lib/hocker-context-pack.ts:110:    handoff_prompt_for_nova: "Antes de responder o preparar acciones, lee el Context Pack, revisa agi_action_queue, respeta Queue Lock, consulta capabilities_contract y usa syntia_operational_memory como continuidad real. NOVA debe hablar natural, elegir AGI/modelo automáticamente, no fingir integraciones y no iniciar tareas nuevas si hay cola pendiente. Toda acción sensible requiere Owner Gate, pruebas, auditoría y rollback.",
src/lib/hocker-context-pack.ts:144:        evidence_and_rollback_visible_on_demand: true,
src/lib/hocker-tool-router.ts:27:  { key: "deep_research", reason: "La solicitud pide investigación, comparación o análisis profundo.", patterns: [/investiga|investigaci[oó]n|compara|benchmark|fuentes|citas|topolog[ií]a|auditor[ií]a/i] },
src/lib/hocker-tool-router.ts:221:    "No voy a prometer integraciones falsas ni ejecutar acciones productivas desde nova.agi. Lo pendiente se prepara como plan seguro; lo sensible pasa por Queue Lock, Owner Gate, auditoría y rollback.",
src/lib/syntia-memory-review-gate.ts:58:      rollback_target_next: true,
src/lib/syntia-memory-review-gate.ts:73:      "12.7I debe agregar rollback de memoria publicada, diff de publicación y auditoría restaurable.",
src/lib/syntia-memory-publication-audit.ts:50:    mode: "rollback_preview_and_owner_restore_audit",
src/lib/syntia-memory-publication-audit.ts:56:      rollback_requires_owner_actor: true,
src/lib/syntia-memory-publication-audit.ts:57:      rollback_deactivates_memory: true,
src/lib/syntia-memory-publication-audit.ts:58:      rollback_marks_update_feed_blocked: true,
src/lib/syntia-memory-publication-audit.ts:63:      restore_snapshot_required: true,
src/lib/syntia-memory-publication-audit.ts:243:      can_rollback: false,
src/lib/syntia-memory-publication-audit.ts:256:    can_rollback: isActive,
src/lib/syntia-memory-publication-audit.ts:257:    reason: isActive ? "ready_for_owner_rollback" : "memory_already_inactive",
src/lib/syntia-memory-publication-audit.ts:258:    rollback_plan: {
src/lib/syntia-memory-publication-audit.ts:265:      restore_snapshot_required: true,
src/lib/syntia-memory-publication-audit.ts:273:export async function rollbackSyntiaPublishedMemory(
src/lib/syntia-memory-publication-audit.ts:287:      reason: "rollback_requires_owner_actor",
src/lib/syntia-memory-publication-audit.ts:289:      rolled_back: false,
src/lib/syntia-memory-publication-audit.ts:296:  if (!preview.ok || !preview.can_rollback) {
src/lib/syntia-memory-publication-audit.ts:302:      reason: preview.reason || "memory_not_ready_for_rollback",
src/lib/syntia-memory-publication-audit.ts:303:      rolled_back: false,
src/lib/syntia-memory-publication-audit.ts:317:    requester_notes: safeJson(input.rollback_notes),
src/lib/syntia-memory-publication-audit.ts:323:    type: "memory_publication_audit.rollback_started",
src/lib/syntia-memory-publication-audit.ts:324:    message: "Inicio de rollback owner para memoria publicada.",
src/lib/syntia-memory-publication-audit.ts:344:        rollback: {
src/lib/syntia-memory-publication-audit.ts:349:          rolled_back_at: now,
src/lib/syntia-memory-publication-audit.ts:361:      type: "memory_publication_audit.rollback_failed",
src/lib/syntia-memory-publication-audit.ts:362:      message: "Falló rollback de memoria publicada.",
src/lib/syntia-memory-publication-audit.ts:379:      rolled_back: false,
src/lib/syntia-memory-publication-audit.ts:404:    type: "memory_publication_audit.rollback_completed",
src/lib/syntia-memory-publication-audit.ts:417:      restore_snapshot: beforeSnapshot,
src/lib/syntia-memory-publication-audit.ts:428:    rolled_back: true,
src/lib/syntia-memory-publication-audit.ts:436:    restore_snapshot_recorded: true,
src/lib/nova-chat-action-drafts.ts:222:        "Guardar evidencia, resultado y rollback.",
src/lib/nova-github-action-materializer.ts:82:    "8. Resultado, error o rollback queda registrado.",
src/lib/nova-github-action-materializer.ts:114:      rollback_required: true,
src/lib/hocker-human-copy.ts:14:  action_rolled_back: "La acción fue revertida y la evidencia quedó guardada.",
src/lib/hocker-permissions.ts:22:  rollback: ["owner"],
docs/security/HOCKER_ONE_TENANT_RLS_POLICY.md:62:6. Probar rollback.
docs/ops/supabase-baseline-decision-record.md:74:4. Prepare rollback notes.
docs/audits/hocker-one-12.7l2c-provider-orchestrator-inventory.md:11:- Hocker ONE mantiene Owner Gate, Queue Lock, evidencia y rollback.
docs/audits/HOCKER_127Z1A_SQL_IDEMPOTENT_GITHUB_WORKER.md:18:- `rollback_plan` mínimo por operación.
docs/audits/HOCKER_127Z1B_SUPABASE_SCHEMA_VERIFIED.md:24:- agi_action_queue.rollback_plan: presente
docs/audits/HOCKER_127Z1C_WORKER_DRY_SMOKE.md:18:- rollback_plan: validado.
docs/audits/HOCKER_127Z1D_QUEUE_INTEGRATION_DRY_SMOKE.md:12:- Segundo claim bloqueado por lock/status: OK
docs/audits/HOCKER_127Z1EB_WORKER_MOCK_EXECUTION.md:17:- rollback_plan generado: OK
docs/audits/HOCKER_127Z1F_REAL_GITHUB_WRITE_SANDBOX.md:31:12.7Z-1G — Real write hardening closeout, merge/no-merge decision and rollback drill.
docs/audits/HOCKER_127Z1G_REAL_WRITE_ROLLBACK_DRILL.md:24:12.7Z-1F demostro escritura real controlada. 12.7Z-1G demostro contencion/rollback sin merge.
docs/audits/HOCKER_13_2C_H_D_INLINE_RESULT_EVIDENCE.md:14:- Rollback visible sólo si existe `rollback_plan`.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:5:6a93ed0 (HEAD -> nova/phase13-2c-h-e-a-rollback-audit, tag: stable-hocker-one-phase13-2c-h-d-inline-result-evidence-20260525_134327, origin/main, origin/HEAD, main) Merge pull request #54 from HockerAGI/nova/phase13-2c-h-d-inline-result-evidence
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:22:## Rollback / revert / restore references
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:24:src/app/api/agi/runtime/memory/publication-audit/route.ts:8:  rollbackSyntiaPublishedMemory,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:25:src/app/api/agi/runtime/memory/publication-audit/route.ts:53:    if (action === "rollback") {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:26:src/app/api/agi/runtime/memory/publication-audit/route.ts:54:      const result = await rollbackSyntiaPublishedMemory(
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:27:src/app/api/agi/runtime/memory/publication-audit/route.ts:68:        allowed_actions: ["list", "diff", "preview", "rollback"],
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:30:src/components/owner/OwnerApprovalCenter.tsx:120:            <p>Cuando NOVA proponga cambios reales, aparecerán aquí con plan, riesgo y rollback.</p>
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:31:src/components/vfx/HockerVfxLayer.tsx:133:        ctx.restore();
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:32:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:40:  if (result === "rolled_back") return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:33:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:98:            { label: "Rollback", value: record.rollback },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:34:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:17:  result: "success" | "failed" | "rolled_back" | "unknown";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:35:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:21:  rollback: string;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:36:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:77:  if (["rolled_back", "rollback"].includes(clean)) return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:37:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:135:        status.includes("rollback") ? "rolled_back" :
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:38:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:157:      const rollback = item.rollback_plan ? "Disponible" : "No registrado";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:39:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:166:        rollback,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:40:src/components/hocker-2c/owner/nova/OwnerNovaInlineApprovals.tsx:46:    clean.includes("revertida") ||
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:41:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:23:  rollbackAvailable: boolean;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:42:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:132:  const rollbackAvailable = deepHasTruthyKey(payload, ["rollback_plan"]);
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:43:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:143:    { label: "Rollback", value: rollbackAvailable ? "Disponible" : "No registrado" },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:44:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:152:    rollbackAvailable,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:45:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:227:    clean.includes("revertida") ||
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:46:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:257:      {result.rollbackAvailable ? (
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:47:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:259:          Rollback disponible. Revisa la evidencia antes de revertir cualquier cambio.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:48:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:277:          No encontré evidencia reciente visible todavía. Puede tardar unos segundos en aparecer.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:49:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:341:        rollbackAvailable: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:50:src/lib/github-runtime-executor.ts:368:      strategy: "restore_previous_blob_or_revert_commit",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:51:src/lib/github-runtime-executor.ts:379:    strategy: "close_pr_or_revert_branch",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:52:src/lib/github-runtime-executor.ts:436:            "Adjuntar resumen, rollback y evidencia de validación.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:53:src/lib/github-runtime-executor.ts:462:    rollback_plan: buildRollbackPlan(operation, path),
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:54:src/lib/agi-action-execution.ts:27:  rollback_plan?: JsonRecord | null;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:55:src/lib/agi-action-execution.ts:196:      note: result.created ? "Rollback puede eliminar la rama creada si no hay PR activo." : "La rama ya existía; rollback automático no aplica.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:56:src/lib/agi-action-execution.ts:202:      type: "github.restore_previous_file_sha",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:57:src/lib/agi-action-execution.ts:209:      note: result.previous_sha ? "Rollback requiere restaurar contenido previo usando previous_sha." : "Archivo nuevo; rollback requiere eliminar archivo creado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:58:src/lib/agi-action-execution.ts:220:      note: result.already_exists ? "PR ya existía; rollback automático no aplica." : "Rollback puede cerrar el PR draft creado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:59:src/lib/agi-action-execution.ts:697:    const rollbackPlan = buildRollbackPlan(item, result as JsonRecord);
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:60:src/lib/agi-action-execution.ts:707:      rollback_plan: rollbackPlan,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:61:src/lib/hocker-context-pack.ts:110:    handoff_prompt_for_nova: "Antes de responder o preparar acciones, lee el Context Pack, revisa agi_action_queue, respeta Queue Lock, consulta capabilities_contract y usa syntia_operational_memory como continuidad real. NOVA debe hablar natural, elegir AGI/modelo automáticamente, no fingir integraciones y no iniciar tareas nuevas si hay cola pendiente. Toda acción sensible requiere Owner Gate, pruebas, auditoría y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:62:src/lib/hocker-context-pack.ts:144:        evidence_and_rollback_visible_on_demand: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:63:src/lib/hocker-tool-router.ts:27:  { key: "deep_research", reason: "La solicitud pide investigación, comparación o análisis profundo.", patterns: [/investiga|investigaci[oó]n|compara|benchmark|fuentes|citas|topolog[ií]a|auditor[ií]a/i] },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:64:src/lib/hocker-tool-router.ts:221:    "No voy a prometer integraciones falsas ni ejecutar acciones productivas desde nova.agi. Lo pendiente se prepara como plan seguro; lo sensible pasa por Queue Lock, Owner Gate, auditoría y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:65:src/lib/syntia-memory-review-gate.ts:58:      rollback_target_next: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:66:src/lib/syntia-memory-review-gate.ts:73:      "12.7I debe agregar rollback de memoria publicada, diff de publicación y auditoría restaurable.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:67:src/lib/syntia-memory-publication-audit.ts:50:    mode: "rollback_preview_and_owner_restore_audit",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:68:src/lib/syntia-memory-publication-audit.ts:56:      rollback_requires_owner_actor: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:69:src/lib/syntia-memory-publication-audit.ts:57:      rollback_deactivates_memory: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:70:src/lib/syntia-memory-publication-audit.ts:58:      rollback_marks_update_feed_blocked: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:71:src/lib/syntia-memory-publication-audit.ts:63:      restore_snapshot_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:72:src/lib/syntia-memory-publication-audit.ts:243:      can_rollback: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:73:src/lib/syntia-memory-publication-audit.ts:256:    can_rollback: isActive,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:74:src/lib/syntia-memory-publication-audit.ts:257:    reason: isActive ? "ready_for_owner_rollback" : "memory_already_inactive",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:75:src/lib/syntia-memory-publication-audit.ts:258:    rollback_plan: {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:76:src/lib/syntia-memory-publication-audit.ts:265:      restore_snapshot_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:77:src/lib/syntia-memory-publication-audit.ts:273:export async function rollbackSyntiaPublishedMemory(
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:78:src/lib/syntia-memory-publication-audit.ts:287:      reason: "rollback_requires_owner_actor",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:79:src/lib/syntia-memory-publication-audit.ts:289:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:80:src/lib/syntia-memory-publication-audit.ts:296:  if (!preview.ok || !preview.can_rollback) {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:81:src/lib/syntia-memory-publication-audit.ts:302:      reason: preview.reason || "memory_not_ready_for_rollback",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:82:src/lib/syntia-memory-publication-audit.ts:303:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:83:src/lib/syntia-memory-publication-audit.ts:317:    requester_notes: safeJson(input.rollback_notes),
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:84:src/lib/syntia-memory-publication-audit.ts:323:    type: "memory_publication_audit.rollback_started",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:85:src/lib/syntia-memory-publication-audit.ts:324:    message: "Inicio de rollback owner para memoria publicada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:86:src/lib/syntia-memory-publication-audit.ts:344:        rollback: {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:87:src/lib/syntia-memory-publication-audit.ts:349:          rolled_back_at: now,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:88:src/lib/syntia-memory-publication-audit.ts:361:      type: "memory_publication_audit.rollback_failed",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:89:src/lib/syntia-memory-publication-audit.ts:362:      message: "Falló rollback de memoria publicada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:90:src/lib/syntia-memory-publication-audit.ts:379:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:91:src/lib/syntia-memory-publication-audit.ts:404:    type: "memory_publication_audit.rollback_completed",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:92:src/lib/syntia-memory-publication-audit.ts:417:      restore_snapshot: beforeSnapshot,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:93:src/lib/syntia-memory-publication-audit.ts:428:    rolled_back: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:94:src/lib/syntia-memory-publication-audit.ts:436:    restore_snapshot_recorded: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:95:src/lib/nova-chat-action-drafts.ts:222:        "Guardar evidencia, resultado y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:96:src/lib/nova-github-action-materializer.ts:82:    "8. Resultado, error o rollback queda registrado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:97:src/lib/nova-github-action-materializer.ts:114:      rollback_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:98:src/lib/hocker-human-copy.ts:14:  action_rolled_back: "La acción fue revertida y la evidencia quedó guardada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:99:src/lib/hocker-permissions.ts:22:  rollback: ["owner"],
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:100:docs/security/HOCKER_ONE_TENANT_RLS_POLICY.md:62:6. Probar rollback.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:101:docs/ops/supabase-baseline-decision-record.md:74:4. Prepare rollback notes.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:102:docs/audits/hocker-one-12.7l2c-provider-orchestrator-inventory.md:11:- Hocker ONE mantiene Owner Gate, Queue Lock, evidencia y rollback.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:103:docs/audits/HOCKER_127Z1A_SQL_IDEMPOTENT_GITHUB_WORKER.md:18:- `rollback_plan` mínimo por operación.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:104:docs/audits/HOCKER_127Z1B_SUPABASE_SCHEMA_VERIFIED.md:24:- agi_action_queue.rollback_plan: presente
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:105:docs/audits/HOCKER_127Z1C_WORKER_DRY_SMOKE.md:18:- rollback_plan: validado.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:106:docs/audits/HOCKER_127Z1D_QUEUE_INTEGRATION_DRY_SMOKE.md:12:- Segundo claim bloqueado por lock/status: OK
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:107:docs/audits/HOCKER_127Z1EB_WORKER_MOCK_EXECUTION.md:17:- rollback_plan generado: OK
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:108:docs/audits/HOCKER_127Z1F_REAL_GITHUB_WRITE_SANDBOX.md:31:12.7Z-1G — Real write hardening closeout, merge/no-merge decision and rollback drill.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:109:docs/audits/HOCKER_127Z1G_REAL_WRITE_ROLLBACK_DRILL.md:24:12.7Z-1F demostro escritura real controlada. 12.7Z-1G demostro contencion/rollback sin merge.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:110:docs/audits/HOCKER_13_2C_H_D_INLINE_RESULT_EVIDENCE.md:14:- Rollback visible sólo si existe `rollback_plan`.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:111:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:5:6a93ed0 (HEAD -> nova/phase13-2c-h-e-a-rollback-audit, tag: stable-hocker-one-phase13-2c-h-d-inline-result-evidence-20260525_134327, origin/main, origin/HEAD, main) Merge pull request #54 from HockerAGI/nova/phase13-2c-h-d-inline-result-evidence
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:112:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:22:## Rollback / revert / restore references
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:113:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:24:src/app/api/agi/runtime/memory/publication-audit/route.ts:8:  rollbackSyntiaPublishedMemory,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:114:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:25:src/app/api/agi/runtime/memory/publication-audit/route.ts:53:    if (action === "rollback") {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:115:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:26:src/app/api/agi/runtime/memory/publication-audit/route.ts:54:      const result = await rollbackSyntiaPublishedMemory(
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:116:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:27:src/app/api/agi/runtime/memory/publication-audit/route.ts:68:        allowed_actions: ["list", "diff", "preview", "rollback"],
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:119:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:30:src/components/owner/OwnerApprovalCenter.tsx:120:            <p>Cuando NOVA proponga cambios reales, aparecerán aquí con plan, riesgo y rollback.</p>
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:120:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:31:src/components/vfx/HockerVfxLayer.tsx:133:        ctx.restore();
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:121:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:32:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:40:  if (result === "rolled_back") return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:122:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:33:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:98:            { label: "Rollback", value: record.rollback },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:123:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:34:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:17:  result: "success" | "failed" | "rolled_back" | "unknown";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:124:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:35:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:21:  rollback: string;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:125:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:36:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:77:  if (["rolled_back", "rollback"].includes(clean)) return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:126:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:37:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:135:        status.includes("rollback") ? "rolled_back" :
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:127:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:38:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:157:      const rollback = item.rollback_plan ? "Disponible" : "No registrado";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:128:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:39:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:166:        rollback,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:129:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:40:src/components/hocker-2c/owner/nova/OwnerNovaInlineApprovals.tsx:46:    clean.includes("revertida") ||
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:130:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:41:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:23:  rollbackAvailable: boolean;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:131:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:42:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:132:  const rollbackAvailable = deepHasTruthyKey(payload, ["rollback_plan"]);
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:132:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:43:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:143:    { label: "Rollback", value: rollbackAvailable ? "Disponible" : "No registrado" },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:133:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:44:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:152:    rollbackAvailable,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:134:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:45:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:227:    clean.includes("revertida") ||
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:135:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:46:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:257:      {result.rollbackAvailable ? (
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:136:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:47:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:259:          Rollback disponible. Revisa la evidencia antes de revertir cualquier cambio.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:137:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:48:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:277:          No encontré evidencia reciente visible todavía. Puede tardar unos segundos en aparecer.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:138:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:49:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:341:        rollbackAvailable: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:139:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:50:src/lib/github-runtime-executor.ts:368:      strategy: "restore_previous_blob_or_revert_commit",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:140:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:51:src/lib/github-runtime-executor.ts:379:    strategy: "close_pr_or_revert_branch",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:141:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:52:src/lib/github-runtime-executor.ts:436:            "Adjuntar resumen, rollback y evidencia de validación.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:142:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:53:src/lib/github-runtime-executor.ts:462:    rollback_plan: buildRollbackPlan(operation, path),
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:143:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:54:src/lib/agi-action-execution.ts:27:  rollback_plan?: JsonRecord | null;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:144:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:55:src/lib/agi-action-execution.ts:196:      note: result.created ? "Rollback puede eliminar la rama creada si no hay PR activo." : "La rama ya existía; rollback automático no aplica.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:145:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:56:src/lib/agi-action-execution.ts:202:      type: "github.restore_previous_file_sha",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:146:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:57:src/lib/agi-action-execution.ts:209:      note: result.previous_sha ? "Rollback requiere restaurar contenido previo usando previous_sha." : "Archivo nuevo; rollback requiere eliminar archivo creado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:147:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:58:src/lib/agi-action-execution.ts:220:      note: result.already_exists ? "PR ya existía; rollback automático no aplica." : "Rollback puede cerrar el PR draft creado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:148:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:59:src/lib/agi-action-execution.ts:697:    const rollbackPlan = buildRollbackPlan(item, result as JsonRecord);
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:149:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:60:src/lib/agi-action-execution.ts:707:      rollback_plan: rollbackPlan,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:150:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:61:src/lib/hocker-context-pack.ts:110:    handoff_prompt_for_nova: "Antes de responder o preparar acciones, lee el Context Pack, revisa agi_action_queue, respeta Queue Lock, consulta capabilities_contract y usa syntia_operational_memory como continuidad real. NOVA debe hablar natural, elegir AGI/modelo automáticamente, no fingir integraciones y no iniciar tareas nuevas si hay cola pendiente. Toda acción sensible requiere Owner Gate, pruebas, auditoría y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:151:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:62:src/lib/hocker-context-pack.ts:144:        evidence_and_rollback_visible_on_demand: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:152:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:63:src/lib/hocker-tool-router.ts:27:  { key: "deep_research", reason: "La solicitud pide investigación, comparación o análisis profundo.", patterns: [/investiga|investigaci[oó]n|compara|benchmark|fuentes|citas|topolog[ií]a|auditor[ií]a/i] },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:153:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:64:src/lib/hocker-tool-router.ts:221:    "No voy a prometer integraciones falsas ni ejecutar acciones productivas desde nova.agi. Lo pendiente se prepara como plan seguro; lo sensible pasa por Queue Lock, Owner Gate, auditoría y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:154:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:65:src/lib/syntia-memory-review-gate.ts:58:      rollback_target_next: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:155:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:66:src/lib/syntia-memory-review-gate.ts:73:      "12.7I debe agregar rollback de memoria publicada, diff de publicación y auditoría restaurable.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:156:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:67:src/lib/syntia-memory-publication-audit.ts:50:    mode: "rollback_preview_and_owner_restore_audit",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:157:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:68:src/lib/syntia-memory-publication-audit.ts:56:      rollback_requires_owner_actor: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:158:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:69:src/lib/syntia-memory-publication-audit.ts:57:      rollback_deactivates_memory: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:159:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:70:src/lib/syntia-memory-publication-audit.ts:58:      rollback_marks_update_feed_blocked: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:160:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:71:src/lib/syntia-memory-publication-audit.ts:63:      restore_snapshot_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:161:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:72:src/lib/syntia-memory-publication-audit.ts:243:      can_rollback: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:162:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:73:src/lib/syntia-memory-publication-audit.ts:256:    can_rollback: isActive,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:163:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:74:src/lib/syntia-memory-publication-audit.ts:257:    reason: isActive ? "ready_for_owner_rollback" : "memory_already_inactive",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:164:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:75:src/lib/syntia-memory-publication-audit.ts:258:    rollback_plan: {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:165:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:76:src/lib/syntia-memory-publication-audit.ts:265:      restore_snapshot_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:166:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:77:src/lib/syntia-memory-publication-audit.ts:273:export async function rollbackSyntiaPublishedMemory(
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:167:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:78:src/lib/syntia-memory-publication-audit.ts:287:      reason: "rollback_requires_owner_actor",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:168:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:79:src/lib/syntia-memory-publication-audit.ts:289:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:169:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:80:src/lib/syntia-memory-publication-audit.ts:296:  if (!preview.ok || !preview.can_rollback) {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:170:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:81:src/lib/syntia-memory-publication-audit.ts:302:      reason: preview.reason || "memory_not_ready_for_rollback",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:171:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:82:src/lib/syntia-memory-publication-audit.ts:303:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:172:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:83:src/lib/syntia-memory-publication-audit.ts:317:    requester_notes: safeJson(input.rollback_notes),
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:173:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:84:src/lib/syntia-memory-publication-audit.ts:323:    type: "memory_publication_audit.rollback_started",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:174:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:85:src/lib/syntia-memory-publication-audit.ts:324:    message: "Inicio de rollback owner para memoria publicada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:175:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:86:src/lib/syntia-memory-publication-audit.ts:344:        rollback: {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:176:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:87:src/lib/syntia-memory-publication-audit.ts:349:          rolled_back_at: now,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:177:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:88:src/lib/syntia-memory-publication-audit.ts:361:      type: "memory_publication_audit.rollback_failed",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:178:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:89:src/lib/syntia-memory-publication-audit.ts:362:      message: "Falló rollback de memoria publicada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:179:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:90:src/lib/syntia-memory-publication-audit.ts:379:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:180:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:91:src/lib/syntia-memory-publication-audit.ts:404:    type: "memory_publication_audit.rollback_completed",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:181:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:92:src/lib/syntia-memory-publication-audit.ts:417:      restore_snapshot: beforeSnapshot,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:182:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:93:src/lib/syntia-memory-publication-audit.ts:428:    rolled_back: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:183:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:94:src/lib/syntia-memory-publication-audit.ts:436:    restore_snapshot_recorded: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:184:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:95:src/lib/nova-chat-action-drafts.ts:222:        "Guardar evidencia, resultado y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:185:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:96:src/lib/nova-github-action-materializer.ts:82:    "8. Resultado, error o rollback queda registrado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:186:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:97:src/lib/nova-github-action-materializer.ts:114:      rollback_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:187:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:98:src/lib/hocker-human-copy.ts:14:  action_rolled_back: "La acción fue revertida y la evidencia quedó guardada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:188:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:99:src/lib/hocker-permissions.ts:22:  rollback: ["owner"],
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:189:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:100:docs/security/HOCKER_ONE_TENANT_RLS_POLICY.md:62:6. Probar rollback.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:190:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:101:docs/ops/supabase-baseline-decision-record.md:74:4. Prepare rollback notes.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:191:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:102:docs/audits/hocker-one-12.7l2c-provider-orchestrator-inventory.md:11:- Hocker ONE mantiene Owner Gate, Queue Lock, evidencia y rollback.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:192:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:103:docs/audits/HOCKER_127Z1A_SQL_IDEMPOTENT_GITHUB_WORKER.md:18:- `rollback_plan` mínimo por operación.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:193:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:104:docs/audits/HOCKER_127Z1B_SUPABASE_SCHEMA_VERIFIED.md:24:- agi_action_queue.rollback_plan: presente
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:194:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:105:docs/audits/HOCKER_127Z1C_WORKER_DRY_SMOKE.md:18:- rollback_plan: validado.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:195:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:106:docs/audits/HOCKER_127Z1D_QUEUE_INTEGRATION_DRY_SMOKE.md:12:- Segundo claim bloqueado por lock/status: OK
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:196:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:107:docs/audits/HOCKER_127Z1EB_WORKER_MOCK_EXECUTION.md:17:- rollback_plan generado: OK
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:197:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:108:docs/audits/HOCKER_127Z1F_REAL_GITHUB_WRITE_SANDBOX.md:31:12.7Z-1G — Real write hardening closeout, merge/no-merge decision and rollback drill.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:198:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:109:docs/audits/HOCKER_127Z1G_REAL_WRITE_ROLLBACK_DRILL.md:24:12.7Z-1F demostro escritura real controlada. 12.7Z-1G demostro contencion/rollback sin merge.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:199:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:110:docs/audits/HOCKER_13_2C_H_D_INLINE_RESULT_EVIDENCE.md:14:- Rollback visible sólo si existe `rollback_plan`.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:200:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:111:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:5:6a93ed0 (HEAD -> nova/phase13-2c-h-e-a-rollback-audit, tag: stable-hocker-one-phase13-2c-h-d-inline-result-evidence-20260525_134327, origin/main, origin/HEAD, main) Merge pull request #54 from HockerAGI/nova/phase13-2c-h-d-inline-result-evidence
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:201:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:112:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:22:## Rollback / revert / restore references
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:202:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:113:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:24:src/app/api/agi/runtime/memory/publication-audit/route.ts:8:  rollbackSyntiaPublishedMemory,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:203:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:114:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:25:src/app/api/agi/runtime/memory/publication-audit/route.ts:53:    if (action === "rollback") {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:204:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:115:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:26:src/app/api/agi/runtime/memory/publication-audit/route.ts:54:      const result = await rollbackSyntiaPublishedMemory(
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:205:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:116:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:27:src/app/api/agi/runtime/memory/publication-audit/route.ts:68:        allowed_actions: ["list", "diff", "preview", "rollback"],
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:208:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:119:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:30:src/components/owner/OwnerApprovalCenter.tsx:120:            <p>Cuando NOVA proponga cambios reales, aparecerán aquí con plan, riesgo y rollback.</p>
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:209:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:120:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:31:src/components/vfx/HockerVfxLayer.tsx:133:        ctx.restore();
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:210:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:121:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:32:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:40:  if (result === "rolled_back") return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:211:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:122:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:33:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:98:            { label: "Rollback", value: record.rollback },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:212:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:123:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:34:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:17:  result: "success" | "failed" | "rolled_back" | "unknown";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:213:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:124:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:35:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:21:  rollback: string;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:214:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:125:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:36:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:77:  if (["rolled_back", "rollback"].includes(clean)) return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:215:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:126:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:37:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:135:        status.includes("rollback") ? "rolled_back" :
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:216:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:127:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:38:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:157:      const rollback = item.rollback_plan ? "Disponible" : "No registrado";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:217:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:128:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:39:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:166:        rollback,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:218:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:129:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:40:src/components/hocker-2c/owner/nova/OwnerNovaInlineApprovals.tsx:46:    clean.includes("revertida") ||
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:219:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:130:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:41:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:23:  rollbackAvailable: boolean;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:220:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:131:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:42:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:132:  const rollbackAvailable = deepHasTruthyKey(payload, ["rollback_plan"]);
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:221:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:132:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:43:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:143:    { label: "Rollback", value: rollbackAvailable ? "Disponible" : "No registrado" },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:222:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:133:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:44:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:152:    rollbackAvailable,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:223:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:134:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:45:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:227:    clean.includes("revertida") ||
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:224:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:135:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:46:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:257:      {result.rollbackAvailable ? (
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:225:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:136:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:47:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:259:          Rollback disponible. Revisa la evidencia antes de revertir cualquier cambio.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:226:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:137:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:48:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:277:          No encontré evidencia reciente visible todavía. Puede tardar unos segundos en aparecer.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:227:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:138:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:49:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:341:        rollbackAvailable: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:228:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:139:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:50:src/lib/github-runtime-executor.ts:368:      strategy: "restore_previous_blob_or_revert_commit",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:229:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:140:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:51:src/lib/github-runtime-executor.ts:379:    strategy: "close_pr_or_revert_branch",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:230:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:141:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:52:src/lib/github-runtime-executor.ts:436:            "Adjuntar resumen, rollback y evidencia de validación.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:231:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:142:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:53:src/lib/github-runtime-executor.ts:462:    rollback_plan: buildRollbackPlan(operation, path),
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:232:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:143:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:54:src/lib/agi-action-execution.ts:27:  rollback_plan?: JsonRecord | null;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:233:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:144:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:55:src/lib/agi-action-execution.ts:196:      note: result.created ? "Rollback puede eliminar la rama creada si no hay PR activo." : "La rama ya existía; rollback automático no aplica.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:234:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:145:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:56:src/lib/agi-action-execution.ts:202:      type: "github.restore_previous_file_sha",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:235:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:146:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:57:src/lib/agi-action-execution.ts:209:      note: result.previous_sha ? "Rollback requiere restaurar contenido previo usando previous_sha." : "Archivo nuevo; rollback requiere eliminar archivo creado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:236:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:147:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:58:src/lib/agi-action-execution.ts:220:      note: result.already_exists ? "PR ya existía; rollback automático no aplica." : "Rollback puede cerrar el PR draft creado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:237:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:148:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:59:src/lib/agi-action-execution.ts:697:    const rollbackPlan = buildRollbackPlan(item, result as JsonRecord);
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:238:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:149:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:60:src/lib/agi-action-execution.ts:707:      rollback_plan: rollbackPlan,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:239:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:150:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:61:src/lib/hocker-context-pack.ts:110:    handoff_prompt_for_nova: "Antes de responder o preparar acciones, lee el Context Pack, revisa agi_action_queue, respeta Queue Lock, consulta capabilities_contract y usa syntia_operational_memory como continuidad real. NOVA debe hablar natural, elegir AGI/modelo automáticamente, no fingir integraciones y no iniciar tareas nuevas si hay cola pendiente. Toda acción sensible requiere Owner Gate, pruebas, auditoría y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:240:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:151:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:62:src/lib/hocker-context-pack.ts:144:        evidence_and_rollback_visible_on_demand: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:241:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:152:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:63:src/lib/hocker-tool-router.ts:27:  { key: "deep_research", reason: "La solicitud pide investigación, comparación o análisis profundo.", patterns: [/investiga|investigaci[oó]n|compara|benchmark|fuentes|citas|topolog[ií]a|auditor[ií]a/i] },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:242:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:153:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:64:src/lib/hocker-tool-router.ts:221:    "No voy a prometer integraciones falsas ni ejecutar acciones productivas desde nova.agi. Lo pendiente se prepara como plan seguro; lo sensible pasa por Queue Lock, Owner Gate, auditoría y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:243:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:154:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:65:src/lib/syntia-memory-review-gate.ts:58:      rollback_target_next: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:244:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:155:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:66:src/lib/syntia-memory-review-gate.ts:73:      "12.7I debe agregar rollback de memoria publicada, diff de publicación y auditoría restaurable.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:245:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:156:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:67:src/lib/syntia-memory-publication-audit.ts:50:    mode: "rollback_preview_and_owner_restore_audit",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:246:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:157:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:68:src/lib/syntia-memory-publication-audit.ts:56:      rollback_requires_owner_actor: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:247:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:158:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:69:src/lib/syntia-memory-publication-audit.ts:57:      rollback_deactivates_memory: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:248:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:159:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:70:src/lib/syntia-memory-publication-audit.ts:58:      rollback_marks_update_feed_blocked: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:249:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:160:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:71:src/lib/syntia-memory-publication-audit.ts:63:      restore_snapshot_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:250:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:161:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:72:src/lib/syntia-memory-publication-audit.ts:243:      can_rollback: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:251:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:162:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:73:src/lib/syntia-memory-publication-audit.ts:256:    can_rollback: isActive,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:252:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:163:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:74:src/lib/syntia-memory-publication-audit.ts:257:    reason: isActive ? "ready_for_owner_rollback" : "memory_already_inactive",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:253:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:164:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:75:src/lib/syntia-memory-publication-audit.ts:258:    rollback_plan: {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:254:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:165:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:76:src/lib/syntia-memory-publication-audit.ts:265:      restore_snapshot_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:255:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:166:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:77:src/lib/syntia-memory-publication-audit.ts:273:export async function rollbackSyntiaPublishedMemory(
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:256:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:167:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:78:src/lib/syntia-memory-publication-audit.ts:287:      reason: "rollback_requires_owner_actor",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:257:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:168:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:79:src/lib/syntia-memory-publication-audit.ts:289:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:258:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:169:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:80:src/lib/syntia-memory-publication-audit.ts:296:  if (!preview.ok || !preview.can_rollback) {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:259:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:170:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:81:src/lib/syntia-memory-publication-audit.ts:302:      reason: preview.reason || "memory_not_ready_for_rollback",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:260:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:171:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:82:src/lib/syntia-memory-publication-audit.ts:303:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:261:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:172:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:83:src/lib/syntia-memory-publication-audit.ts:317:    requester_notes: safeJson(input.rollback_notes),
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:262:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:173:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:84:src/lib/syntia-memory-publication-audit.ts:323:    type: "memory_publication_audit.rollback_started",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:263:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:174:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:85:src/lib/syntia-memory-publication-audit.ts:324:    message: "Inicio de rollback owner para memoria publicada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:264:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:175:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:86:src/lib/syntia-memory-publication-audit.ts:344:        rollback: {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:265:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:176:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:87:src/lib/syntia-memory-publication-audit.ts:349:          rolled_back_at: now,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:266:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:177:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:88:src/lib/syntia-memory-publication-audit.ts:361:      type: "memory_publication_audit.rollback_failed",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:267:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:178:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:89:src/lib/syntia-memory-publication-audit.ts:362:      message: "Falló rollback de memoria publicada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:268:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:179:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:90:src/lib/syntia-memory-publication-audit.ts:379:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:269:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:180:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:91:src/lib/syntia-memory-publication-audit.ts:404:    type: "memory_publication_audit.rollback_completed",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:270:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:181:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:92:src/lib/syntia-memory-publication-audit.ts:417:      restore_snapshot: beforeSnapshot,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:271:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:182:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:93:src/lib/syntia-memory-publication-audit.ts:428:    rolled_back: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:272:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:183:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:94:src/lib/syntia-memory-publication-audit.ts:436:    restore_snapshot_recorded: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:273:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:184:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:95:src/lib/nova-chat-action-drafts.ts:222:        "Guardar evidencia, resultado y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:274:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:185:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:96:src/lib/nova-github-action-materializer.ts:82:    "8. Resultado, error o rollback queda registrado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:275:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:186:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:97:src/lib/nova-github-action-materializer.ts:114:      rollback_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:276:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:187:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:98:src/lib/hocker-human-copy.ts:14:  action_rolled_back: "La acción fue revertida y la evidencia quedó guardada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:277:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:188:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:99:src/lib/hocker-permissions.ts:22:  rollback: ["owner"],
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:278:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:189:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:100:docs/security/HOCKER_ONE_TENANT_RLS_POLICY.md:62:6. Probar rollback.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:279:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:190:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:101:docs/ops/supabase-baseline-decision-record.md:74:4. Prepare rollback notes.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:280:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:191:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:102:docs/audits/hocker-one-12.7l2c-provider-orchestrator-inventory.md:11:- Hocker ONE mantiene Owner Gate, Queue Lock, evidencia y rollback.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:281:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:192:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:103:docs/audits/HOCKER_127Z1A_SQL_IDEMPOTENT_GITHUB_WORKER.md:18:- `rollback_plan` mínimo por operación.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:282:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:193:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:104:docs/audits/HOCKER_127Z1B_SUPABASE_SCHEMA_VERIFIED.md:24:- agi_action_queue.rollback_plan: presente
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:283:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:194:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:105:docs/audits/HOCKER_127Z1C_WORKER_DRY_SMOKE.md:18:- rollback_plan: validado.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:284:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:195:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:106:docs/audits/HOCKER_127Z1D_QUEUE_INTEGRATION_DRY_SMOKE.md:12:- Segundo claim bloqueado por lock/status: OK
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:285:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:196:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:107:docs/audits/HOCKER_127Z1EB_WORKER_MOCK_EXECUTION.md:17:- rollback_plan generado: OK
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:286:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:197:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:108:docs/audits/HOCKER_127Z1F_REAL_GITHUB_WRITE_SANDBOX.md:31:12.7Z-1G — Real write hardening closeout, merge/no-merge decision and rollback drill.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:287:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:198:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:109:docs/audits/HOCKER_127Z1G_REAL_WRITE_ROLLBACK_DRILL.md:24:12.7Z-1F demostro escritura real controlada. 12.7Z-1G demostro contencion/rollback sin merge.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:288:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:199:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:110:docs/audits/HOCKER_13_2C_H_D_INLINE_RESULT_EVIDENCE.md:14:- Rollback visible sólo si existe `rollback_plan`.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:289:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:200:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:111:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:5:6a93ed0 (HEAD -> nova/phase13-2c-h-e-a-rollback-audit, tag: stable-hocker-one-phase13-2c-h-d-inline-result-evidence-20260525_134327, origin/main, origin/HEAD, main) Merge pull request #54 from HockerAGI/nova/phase13-2c-h-d-inline-result-evidence
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:290:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:201:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:112:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:22:## Rollback / revert / restore references
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:291:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:202:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:113:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:24:src/app/api/agi/runtime/memory/publication-audit/route.ts:8:  rollbackSyntiaPublishedMemory,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:292:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:203:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:114:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:25:src/app/api/agi/runtime/memory/publication-audit/route.ts:53:    if (action === "rollback") {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:293:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:204:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:115:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:26:src/app/api/agi/runtime/memory/publication-audit/route.ts:54:      const result = await rollbackSyntiaPublishedMemory(
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:294:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:205:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:116:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:27:src/app/api/agi/runtime/memory/publication-audit/route.ts:68:        allowed_actions: ["list", "diff", "preview", "rollback"],
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:297:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:208:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:119:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:30:src/components/owner/OwnerApprovalCenter.tsx:120:            <p>Cuando NOVA proponga cambios reales, aparecerán aquí con plan, riesgo y rollback.</p>
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:298:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:209:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:120:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:31:src/components/vfx/HockerVfxLayer.tsx:133:        ctx.restore();
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:299:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:210:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:121:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:32:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:40:  if (result === "rolled_back") return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:300:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:211:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:122:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:33:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:98:            { label: "Rollback", value: record.rollback },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:301:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:212:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:123:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:34:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:17:  result: "success" | "failed" | "rolled_back" | "unknown";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:302:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:213:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:124:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:35:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:21:  rollback: string;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:303:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:214:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:125:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:36:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:77:  if (["rolled_back", "rollback"].includes(clean)) return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:304:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:215:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:126:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:37:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:135:        status.includes("rollback") ? "rolled_back" :
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:305:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:216:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:127:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:38:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:157:      const rollback = item.rollback_plan ? "Disponible" : "No registrado";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:306:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:217:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:128:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:39:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:166:        rollback,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:307:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:218:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:129:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:40:src/components/hocker-2c/owner/nova/OwnerNovaInlineApprovals.tsx:46:    clean.includes("revertida") ||
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:308:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:219:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:130:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:41:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:23:  rollbackAvailable: boolean;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:309:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:220:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:131:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:42:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:132:  const rollbackAvailable = deepHasTruthyKey(payload, ["rollback_plan"]);
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:310:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:221:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:132:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:43:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:143:    { label: "Rollback", value: rollbackAvailable ? "Disponible" : "No registrado" },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:311:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:222:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:133:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:44:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:152:    rollbackAvailable,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:312:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:223:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:134:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:45:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:227:    clean.includes("revertida") ||
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:313:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:224:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:135:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:46:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:257:      {result.rollbackAvailable ? (
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:314:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:225:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:136:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:47:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:259:          Rollback disponible. Revisa la evidencia antes de revertir cualquier cambio.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:315:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:226:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:137:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:48:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:277:          No encontré evidencia reciente visible todavía. Puede tardar unos segundos en aparecer.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:316:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:227:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:138:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:49:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:341:        rollbackAvailable: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:317:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:228:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:139:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:50:src/lib/github-runtime-executor.ts:368:      strategy: "restore_previous_blob_or_revert_commit",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:318:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:229:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:140:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:51:src/lib/github-runtime-executor.ts:379:    strategy: "close_pr_or_revert_branch",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:319:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:230:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:141:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:52:src/lib/github-runtime-executor.ts:436:            "Adjuntar resumen, rollback y evidencia de validación.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:320:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:231:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:142:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:53:src/lib/github-runtime-executor.ts:462:    rollback_plan: buildRollbackPlan(operation, path),
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:321:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:232:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:143:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:54:src/lib/agi-action-execution.ts:27:  rollback_plan?: JsonRecord | null;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:322:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:233:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:144:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:55:src/lib/agi-action-execution.ts:196:      note: result.created ? "Rollback puede eliminar la rama creada si no hay PR activo." : "La rama ya existía; rollback automático no aplica.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:323:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:234:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:145:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:56:src/lib/agi-action-execution.ts:202:      type: "github.restore_previous_file_sha",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:324:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:235:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:146:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:57:src/lib/agi-action-execution.ts:209:      note: result.previous_sha ? "Rollback requiere restaurar contenido previo usando previous_sha." : "Archivo nuevo; rollback requiere eliminar archivo creado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:325:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:236:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:147:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:58:src/lib/agi-action-execution.ts:220:      note: result.already_exists ? "PR ya existía; rollback automático no aplica." : "Rollback puede cerrar el PR draft creado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:326:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:237:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:148:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:59:src/lib/agi-action-execution.ts:697:    const rollbackPlan = buildRollbackPlan(item, result as JsonRecord);
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:327:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:238:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:149:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:60:src/lib/agi-action-execution.ts:707:      rollback_plan: rollbackPlan,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:328:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:239:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:150:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:61:src/lib/hocker-context-pack.ts:110:    handoff_prompt_for_nova: "Antes de responder o preparar acciones, lee el Context Pack, revisa agi_action_queue, respeta Queue Lock, consulta capabilities_contract y usa syntia_operational_memory como continuidad real. NOVA debe hablar natural, elegir AGI/modelo automáticamente, no fingir integraciones y no iniciar tareas nuevas si hay cola pendiente. Toda acción sensible requiere Owner Gate, pruebas, auditoría y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:329:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:240:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:151:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:62:src/lib/hocker-context-pack.ts:144:        evidence_and_rollback_visible_on_demand: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:330:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:241:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:152:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:63:src/lib/hocker-tool-router.ts:27:  { key: "deep_research", reason: "La solicitud pide investigación, comparación o análisis profundo.", patterns: [/investiga|investigaci[oó]n|compara|benchmark|fuentes|citas|topolog[ií]a|auditor[ií]a/i] },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:331:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:242:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:153:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:64:src/lib/hocker-tool-router.ts:221:    "No voy a prometer integraciones falsas ni ejecutar acciones productivas desde nova.agi. Lo pendiente se prepara como plan seguro; lo sensible pasa por Queue Lock, Owner Gate, auditoría y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:332:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:243:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:154:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:65:src/lib/syntia-memory-review-gate.ts:58:      rollback_target_next: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:333:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:244:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:155:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:66:src/lib/syntia-memory-review-gate.ts:73:      "12.7I debe agregar rollback de memoria publicada, diff de publicación y auditoría restaurable.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:334:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:245:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:156:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:67:src/lib/syntia-memory-publication-audit.ts:50:    mode: "rollback_preview_and_owner_restore_audit",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:335:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:246:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:157:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:68:src/lib/syntia-memory-publication-audit.ts:56:      rollback_requires_owner_actor: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:336:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:247:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:158:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:69:src/lib/syntia-memory-publication-audit.ts:57:      rollback_deactivates_memory: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:337:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:248:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:159:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:70:src/lib/syntia-memory-publication-audit.ts:58:      rollback_marks_update_feed_blocked: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:338:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:249:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:160:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:71:src/lib/syntia-memory-publication-audit.ts:63:      restore_snapshot_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:339:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:250:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:161:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:72:src/lib/syntia-memory-publication-audit.ts:243:      can_rollback: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:340:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:251:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:162:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:73:src/lib/syntia-memory-publication-audit.ts:256:    can_rollback: isActive,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:341:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:252:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:163:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:74:src/lib/syntia-memory-publication-audit.ts:257:    reason: isActive ? "ready_for_owner_rollback" : "memory_already_inactive",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:342:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:253:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:164:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:75:src/lib/syntia-memory-publication-audit.ts:258:    rollback_plan: {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:343:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:254:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:165:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:76:src/lib/syntia-memory-publication-audit.ts:265:      restore_snapshot_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:344:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:255:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:166:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:77:src/lib/syntia-memory-publication-audit.ts:273:export async function rollbackSyntiaPublishedMemory(
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:345:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:256:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:167:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:78:src/lib/syntia-memory-publication-audit.ts:287:      reason: "rollback_requires_owner_actor",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:346:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:257:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:168:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:79:src/lib/syntia-memory-publication-audit.ts:289:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:347:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:258:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:169:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:80:src/lib/syntia-memory-publication-audit.ts:296:  if (!preview.ok || !preview.can_rollback) {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:348:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:259:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:170:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:81:src/lib/syntia-memory-publication-audit.ts:302:      reason: preview.reason || "memory_not_ready_for_rollback",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:349:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:260:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:171:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:82:src/lib/syntia-memory-publication-audit.ts:303:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:350:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:261:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:172:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:83:src/lib/syntia-memory-publication-audit.ts:317:    requester_notes: safeJson(input.rollback_notes),
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:351:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:262:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:173:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:84:src/lib/syntia-memory-publication-audit.ts:323:    type: "memory_publication_audit.rollback_started",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:352:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:263:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:174:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:85:src/lib/syntia-memory-publication-audit.ts:324:    message: "Inicio de rollback owner para memoria publicada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:353:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:264:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:175:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:86:src/lib/syntia-memory-publication-audit.ts:344:        rollback: {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:354:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:265:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:176:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:87:src/lib/syntia-memory-publication-audit.ts:349:          rolled_back_at: now,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:355:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:266:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:177:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:88:src/lib/syntia-memory-publication-audit.ts:361:      type: "memory_publication_audit.rollback_failed",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:356:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:267:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:178:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:89:src/lib/syntia-memory-publication-audit.ts:362:      message: "Falló rollback de memoria publicada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:357:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:268:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:179:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:90:src/lib/syntia-memory-publication-audit.ts:379:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:358:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:269:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:180:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:91:src/lib/syntia-memory-publication-audit.ts:404:    type: "memory_publication_audit.rollback_completed",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:359:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:270:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:181:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:92:src/lib/syntia-memory-publication-audit.ts:417:      restore_snapshot: beforeSnapshot,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:360:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:271:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:182:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:93:src/lib/syntia-memory-publication-audit.ts:428:    rolled_back: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:361:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:272:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:183:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:94:src/lib/syntia-memory-publication-audit.ts:436:    restore_snapshot_recorded: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:362:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:273:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:184:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:95:src/lib/nova-chat-action-drafts.ts:222:        "Guardar evidencia, resultado y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:363:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:274:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:185:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:96:src/lib/nova-github-action-materializer.ts:82:    "8. Resultado, error o rollback queda registrado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:364:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:275:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:186:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:97:src/lib/nova-github-action-materializer.ts:114:      rollback_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:365:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:276:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:187:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:98:src/lib/hocker-human-copy.ts:14:  action_rolled_back: "La acción fue revertida y la evidencia quedó guardada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:366:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:277:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:188:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:99:src/lib/hocker-permissions.ts:22:  rollback: ["owner"],
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:367:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:278:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:189:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:100:docs/security/HOCKER_ONE_TENANT_RLS_POLICY.md:62:6. Probar rollback.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:368:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:279:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:190:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:101:docs/ops/supabase-baseline-decision-record.md:74:4. Prepare rollback notes.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:369:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:280:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:191:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:102:docs/audits/hocker-one-12.7l2c-provider-orchestrator-inventory.md:11:- Hocker ONE mantiene Owner Gate, Queue Lock, evidencia y rollback.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:370:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:281:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:192:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:103:docs/audits/HOCKER_127Z1A_SQL_IDEMPOTENT_GITHUB_WORKER.md:18:- `rollback_plan` mínimo por operación.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:371:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:282:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:193:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:104:docs/audits/HOCKER_127Z1B_SUPABASE_SCHEMA_VERIFIED.md:24:- agi_action_queue.rollback_plan: presente
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:372:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:283:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:194:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:105:docs/audits/HOCKER_127Z1C_WORKER_DRY_SMOKE.md:18:- rollback_plan: validado.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:373:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:284:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:195:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:106:docs/audits/HOCKER_127Z1D_QUEUE_INTEGRATION_DRY_SMOKE.md:12:- Segundo claim bloqueado por lock/status: OK
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:374:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:285:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:196:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:107:docs/audits/HOCKER_127Z1EB_WORKER_MOCK_EXECUTION.md:17:- rollback_plan generado: OK
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:375:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:286:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:197:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:108:docs/audits/HOCKER_127Z1F_REAL_GITHUB_WRITE_SANDBOX.md:31:12.7Z-1G — Real write hardening closeout, merge/no-merge decision and rollback drill.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:376:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:287:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:198:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:109:docs/audits/HOCKER_127Z1G_REAL_WRITE_ROLLBACK_DRILL.md:24:12.7Z-1F demostro escritura real controlada. 12.7Z-1G demostro contencion/rollback sin merge.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:377:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:288:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:199:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:110:docs/audits/HOCKER_13_2C_H_D_INLINE_RESULT_EVIDENCE.md:14:- Rollback visible sólo si existe `rollback_plan`.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:378:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:289:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:200:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:111:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:5:6a93ed0 (HEAD -> nova/phase13-2c-h-e-a-rollback-audit, tag: stable-hocker-one-phase13-2c-h-d-inline-result-evidence-20260525_134327, origin/main, origin/HEAD, main) Merge pull request #54 from HockerAGI/nova/phase13-2c-h-d-inline-result-evidence
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:379:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:290:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:201:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:112:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:22:## Rollback / revert / restore references
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:380:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:291:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:202:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:113:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:24:src/app/api/agi/runtime/memory/publication-audit/route.ts:8:  rollbackSyntiaPublishedMemory,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:381:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:292:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:203:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:114:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:25:src/app/api/agi/runtime/memory/publication-audit/route.ts:53:    if (action === "rollback") {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:382:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:293:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:204:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:115:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:26:src/app/api/agi/runtime/memory/publication-audit/route.ts:54:      const result = await rollbackSyntiaPublishedMemory(
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:383:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:294:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:205:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:116:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:27:src/app/api/agi/runtime/memory/publication-audit/route.ts:68:        allowed_actions: ["list", "diff", "preview", "rollback"],
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:384:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:295:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:206:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:117:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:28:src/app/launch/page.tsx:117:            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:385:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:296:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:207:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:118:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:29:src/app/security/rls/page.tsx:149:            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:386:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:297:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:208:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:119:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:30:src/components/owner/OwnerApprovalCenter.tsx:120:            <p>Cuando NOVA proponga cambios reales, aparecerán aquí con plan, riesgo y rollback.</p>
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:387:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:298:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:209:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:120:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:31:src/components/vfx/HockerVfxLayer.tsx:133:        ctx.restore();
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:388:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:299:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:210:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:121:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:32:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:40:  if (result === "rolled_back") return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:389:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:300:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:211:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:122:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:33:src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:98:            { label: "Rollback", value: record.rollback },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:390:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:301:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:212:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:123:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:34:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:17:  result: "success" | "failed" | "rolled_back" | "unknown";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:391:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:302:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:213:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:124:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:35:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:21:  rollback: string;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:392:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:303:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:214:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:125:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:36:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:77:  if (["rolled_back", "rollback"].includes(clean)) return "Revertida";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:393:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:304:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:215:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:126:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:37:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:135:        status.includes("rollback") ? "rolled_back" :
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:394:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:305:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:216:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:127:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:38:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:157:      const rollback = item.rollback_plan ? "Disponible" : "No registrado";
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:395:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:306:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:217:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:128:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:39:src/components/hocker-2c/owner/live/owner-live-normalizers.ts:166:        rollback,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:396:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:307:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:218:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:129:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:40:src/components/hocker-2c/owner/nova/OwnerNovaInlineApprovals.tsx:46:    clean.includes("revertida") ||
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:397:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:308:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:219:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:130:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:41:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:23:  rollbackAvailable: boolean;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:398:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:309:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:220:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:131:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:42:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:132:  const rollbackAvailable = deepHasTruthyKey(payload, ["rollback_plan"]);
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:399:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:310:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:221:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:132:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:43:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:143:    { label: "Rollback", value: rollbackAvailable ? "Disponible" : "No registrado" },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:400:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:311:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:222:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:133:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:44:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:152:    rollbackAvailable,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:401:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:312:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:223:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:134:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:45:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:227:    clean.includes("revertida") ||
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:402:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:313:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:224:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:135:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:46:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:257:      {result.rollbackAvailable ? (
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:403:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:314:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:225:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:136:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:47:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:259:          Rollback disponible. Revisa la evidencia antes de revertir cualquier cambio.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:404:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:315:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:226:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:137:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:48:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:277:          No encontré evidencia reciente visible todavía. Puede tardar unos segundos en aparecer.
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:405:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:316:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:227:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:138:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:49:src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:341:        rollbackAvailable: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:406:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:317:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:228:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:139:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:50:src/lib/github-runtime-executor.ts:368:      strategy: "restore_previous_blob_or_revert_commit",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:407:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:318:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:229:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:140:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:51:src/lib/github-runtime-executor.ts:379:    strategy: "close_pr_or_revert_branch",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:408:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:319:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:230:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:141:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:52:src/lib/github-runtime-executor.ts:436:            "Adjuntar resumen, rollback y evidencia de validación.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:409:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:320:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:231:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:142:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:53:src/lib/github-runtime-executor.ts:462:    rollback_plan: buildRollbackPlan(operation, path),
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:410:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:321:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:232:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:143:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:54:src/lib/agi-action-execution.ts:27:  rollback_plan?: JsonRecord | null;
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:411:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:322:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:233:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:144:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:55:src/lib/agi-action-execution.ts:196:      note: result.created ? "Rollback puede eliminar la rama creada si no hay PR activo." : "La rama ya existía; rollback automático no aplica.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:412:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:323:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:234:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:145:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:56:src/lib/agi-action-execution.ts:202:      type: "github.restore_previous_file_sha",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:413:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:324:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:235:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:146:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:57:src/lib/agi-action-execution.ts:209:      note: result.previous_sha ? "Rollback requiere restaurar contenido previo usando previous_sha." : "Archivo nuevo; rollback requiere eliminar archivo creado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:414:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:325:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:236:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:147:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:58:src/lib/agi-action-execution.ts:220:      note: result.already_exists ? "PR ya existía; rollback automático no aplica." : "Rollback puede cerrar el PR draft creado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:415:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:326:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:237:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:148:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:59:src/lib/agi-action-execution.ts:697:    const rollbackPlan = buildRollbackPlan(item, result as JsonRecord);
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:416:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:327:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:238:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:149:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:60:src/lib/agi-action-execution.ts:707:      rollback_plan: rollbackPlan,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:417:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:328:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:239:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:150:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:61:src/lib/hocker-context-pack.ts:110:    handoff_prompt_for_nova: "Antes de responder o preparar acciones, lee el Context Pack, revisa agi_action_queue, respeta Queue Lock, consulta capabilities_contract y usa syntia_operational_memory como continuidad real. NOVA debe hablar natural, elegir AGI/modelo automáticamente, no fingir integraciones y no iniciar tareas nuevas si hay cola pendiente. Toda acción sensible requiere Owner Gate, pruebas, auditoría y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:418:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:329:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:240:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:151:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:62:src/lib/hocker-context-pack.ts:144:        evidence_and_rollback_visible_on_demand: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:419:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:330:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:241:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:152:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:63:src/lib/hocker-tool-router.ts:27:  { key: "deep_research", reason: "La solicitud pide investigación, comparación o análisis profundo.", patterns: [/investiga|investigaci[oó]n|compara|benchmark|fuentes|citas|topolog[ií]a|auditor[ií]a/i] },
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:420:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:331:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:242:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:153:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:64:src/lib/hocker-tool-router.ts:221:    "No voy a prometer integraciones falsas ni ejecutar acciones productivas desde nova.agi. Lo pendiente se prepara como plan seguro; lo sensible pasa por Queue Lock, Owner Gate, auditoría y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:421:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:332:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:243:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:154:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:65:src/lib/syntia-memory-review-gate.ts:58:      rollback_target_next: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:422:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:333:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:244:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:155:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:66:src/lib/syntia-memory-review-gate.ts:73:      "12.7I debe agregar rollback de memoria publicada, diff de publicación y auditoría restaurable.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:423:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:334:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:245:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:156:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:67:src/lib/syntia-memory-publication-audit.ts:50:    mode: "rollback_preview_and_owner_restore_audit",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:424:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:335:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:246:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:157:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:68:src/lib/syntia-memory-publication-audit.ts:56:      rollback_requires_owner_actor: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:425:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:336:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:247:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:158:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:69:src/lib/syntia-memory-publication-audit.ts:57:      rollback_deactivates_memory: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:426:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:337:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:248:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:159:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:70:src/lib/syntia-memory-publication-audit.ts:58:      rollback_marks_update_feed_blocked: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:427:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:338:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:249:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:160:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:71:src/lib/syntia-memory-publication-audit.ts:63:      restore_snapshot_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:428:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:339:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:250:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:161:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:72:src/lib/syntia-memory-publication-audit.ts:243:      can_rollback: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:429:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:340:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:251:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:162:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:73:src/lib/syntia-memory-publication-audit.ts:256:    can_rollback: isActive,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:430:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:341:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:252:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:163:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:74:src/lib/syntia-memory-publication-audit.ts:257:    reason: isActive ? "ready_for_owner_rollback" : "memory_already_inactive",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:431:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:342:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:253:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:164:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:75:src/lib/syntia-memory-publication-audit.ts:258:    rollback_plan: {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:432:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:343:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:254:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:165:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:76:src/lib/syntia-memory-publication-audit.ts:265:      restore_snapshot_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:433:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:344:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:255:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:166:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:77:src/lib/syntia-memory-publication-audit.ts:273:export async function rollbackSyntiaPublishedMemory(
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:434:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:345:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:256:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:167:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:78:src/lib/syntia-memory-publication-audit.ts:287:      reason: "rollback_requires_owner_actor",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:435:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:346:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:257:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:168:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:79:src/lib/syntia-memory-publication-audit.ts:289:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:436:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:347:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:258:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:169:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:80:src/lib/syntia-memory-publication-audit.ts:296:  if (!preview.ok || !preview.can_rollback) {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:437:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:348:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:259:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:170:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:81:src/lib/syntia-memory-publication-audit.ts:302:      reason: preview.reason || "memory_not_ready_for_rollback",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:438:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:349:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:260:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:171:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:82:src/lib/syntia-memory-publication-audit.ts:303:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:439:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:350:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:261:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:172:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:83:src/lib/syntia-memory-publication-audit.ts:317:    requester_notes: safeJson(input.rollback_notes),
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:440:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:351:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:262:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:173:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:84:src/lib/syntia-memory-publication-audit.ts:323:    type: "memory_publication_audit.rollback_started",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:441:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:352:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:263:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:174:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:85:src/lib/syntia-memory-publication-audit.ts:324:    message: "Inicio de rollback owner para memoria publicada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:442:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:353:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:264:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:175:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:86:src/lib/syntia-memory-publication-audit.ts:344:        rollback: {
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:443:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:354:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:265:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:176:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:87:src/lib/syntia-memory-publication-audit.ts:349:          rolled_back_at: now,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:444:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:355:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:266:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:177:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:88:src/lib/syntia-memory-publication-audit.ts:361:      type: "memory_publication_audit.rollback_failed",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:445:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:356:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:267:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:178:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:89:src/lib/syntia-memory-publication-audit.ts:362:      message: "Falló rollback de memoria publicada.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:446:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:357:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:268:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:179:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:90:src/lib/syntia-memory-publication-audit.ts:379:      rolled_back: false,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:447:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:358:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:269:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:180:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:91:src/lib/syntia-memory-publication-audit.ts:404:    type: "memory_publication_audit.rollback_completed",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:448:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:359:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:270:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:181:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:92:src/lib/syntia-memory-publication-audit.ts:417:      restore_snapshot: beforeSnapshot,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:449:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:360:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:271:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:182:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:93:src/lib/syntia-memory-publication-audit.ts:428:    rolled_back: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:450:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:361:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:272:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:183:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:94:src/lib/syntia-memory-publication-audit.ts:436:    restore_snapshot_recorded: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:451:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:362:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:273:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:184:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:95:src/lib/nova-chat-action-drafts.ts:222:        "Guardar evidencia, resultado y rollback.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:452:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:363:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:274:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:185:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:96:src/lib/nova-github-action-materializer.ts:82:    "8. Resultado, error o rollback queda registrado.",
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:453:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:364:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:275:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:186:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:97:src/lib/nova-github-action-materializer.ts:114:      rollback_required: true,
docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:454:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:365:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:276:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:187:docs/audits/HOCKER_13_2C_H_E_A_ROLLBACK_CURRENT_REPO_SCAN.md:98:src/lib/hocker-human-copy.ts:14:  action_rolled_back: "La acción fue revertida y la evidencia quedó guardada.",

## API route candidates


### src/app/api/agi/runtime/memory/publication-audit/route.ts
```ts
import { randomUUID } from "crypto";
import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import {
  buildSyntiaPublicationDiff,
  getSyntiaMemoryPublicationAuditPublicContext,
  listSyntiaMemoryPublicationAudit,
  previewSyntiaPublishedMemoryRollback,
  rollbackSyntiaPublishedMemory,
} from "@/lib/syntia-memory-publication-audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const query = parseQuery(req);
    const projectId = query.get("project_id") || "hocker-one";
    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
    const snapshot = await listSyntiaMemoryPublicationAudit(ctx.project_id, Number(query.get("limit") || 50));

    return json({
      ...snapshot,
      role: ctx.role,
      message: "Memory Publication Audit 12.7I leído con seguridad. GET no modifica memoria.",
    });
  } catch (e) {
    const err = toApiError(e);
    return json(err.body, err.status);
  }
}

export async function POST(req: Request) {
  const traceId = randomUUID();

  try {
    const input = await parseBody(req);
    const projectId = String(input.project_id || "hocker-one");
    const ctx = await requireProjectRole(projectId, ["owner"]);

    const action = String(input.action || "preview").trim().toLowerCase();

    if (action === "list") {
      return json(await listSyntiaMemoryPublicationAudit(ctx.project_id));
    }

    if (action === "diff") {
      return json(await buildSyntiaPublicationDiff({ ...input, project_id: ctx.project_id }));
    }

    if (action === "preview") {
      return json(await previewSyntiaPublishedMemoryRollback({ ...input, project_id: ctx.project_id }));
    }

    if (action === "rollback") {
      const result = await rollbackSyntiaPublishedMemory(
        { ...input, project_id: ctx.project_id },
        "session_owner",
        traceId,
      );

      return json(result, Number(result.http_status || 200));
    }

    return json(
      {
        ok: false,
        trace_id: traceId,
        reason: "unsupported_memory_publication_audit_action",
        allowed_actions: ["list", "diff", "preview", "rollback"],
        public_context: getSyntiaMemoryPublicationAuditPublicContext(),
      },
      400,
    );
  } catch (e) {
    const err = toApiError(e);
    return json({ ...err.body, trace_id: traceId }, err.status);
  }
}
```

## Migration candidates

### supabase/migrations/20260519_023616_agi_runtime_action_queue.sql
```sql
-- HOCKER ONE — AGI Runtime Queue Schema
-- Phase: 12.7B-2 DB Fix
-- Purpose: enable GitHub Write-Gate plans to be queued safely.
-- Safe: create-if-not-exists, no destructive changes.

create extension if not exists pgcrypto;

create table if not exists public.agi_agents (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text not null,
  name text not null,
  role text,
  status text not null default 'registered',
  autonomy_level text not null default 'manual',
  allow_actions boolean not null default false,
  capabilities jsonb not null default '[]'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, agi_id)
);

create table if not exists public.agi_tools (
  id uuid primary key default gen_random_uuid(),
  tool_key text not null unique,
  name text not null,
  provider text,
  category text,
  status text not null default 'missing_key',
  requires_secret_keys jsonb not null default '[]'::jsonb,
  supports_read boolean not null default false,
  supports_write boolean not null default false,
  supports_realtime boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_agent_tools (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text not null,
  tool_key text not null,
  permission_level text not null default 'read_guarded',
  enabled boolean not null default false,
  policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, agi_id, tool_key)
);

create table if not exists public.agi_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text,
  title text not null,
  details text,
  status text not null default 'review',
  priority text not null default 'normal',
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  assigned_to text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_runs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text,
  tool_key text,
  task_id uuid,
  action_id uuid,
  status text not null default 'created',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.agi_action_queue (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text not null,
  tool_key text,
  action_type text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  risk_level text not null default 'medium',
  dry_run boolean not null default true,
  requires_approval boolean not null default true,
  status text not null default 'needs_approval',
  created_by uuid,
  approved_by uuid,
  rejected_by uuid,
  executed_by uuid,
  approval_note text,
  rejection_note text,
  execution_result jsonb not null default '{}'::jsonb,
  execution_error text,
  rollback_plan jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  rejected_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text,
  action_id uuid,
  run_id uuid,
  feedback_type text not null default 'note',
  rating int,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.agi_chat_threads (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text not null default 'nova',
  title text,
  status text not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agi_action_queue_project_status_idx
  on public.agi_action_queue(project_id, status, created_at desc);

create index if not exists agi_action_queue_tool_idx
  on public.agi_action_queue(tool_key, action_type, created_at desc);

create index if not exists agi_runs_project_idx
  on public.agi_runs(project_id, agi_id, created_at desc);

create index if not exists agi_tasks_project_idx
  on public.agi_tasks(project_id, status, created_at desc);

alter table public.agi_agents enable row level security;
alter table public.agi_tools enable row level security;
alter table public.agi_agent_tools enable row level security;
alter table public.agi_tasks enable row level security;
alter table public.agi_runs enable row level security;
alter table public.agi_action_queue enable row level security;
alter table public.agi_feedback enable row level security;
alter table public.agi_chat_threads enable row level security;

-- No public policies are added here.
-- Server-side access should use SUPABASE_SERVICE_ROLE_KEY.
```

### supabase/migrations/20260524_091700_agi_action_queue_lock_idempotency.sql
```sql
-- HOCKER ONE · 12.7Z-1A
-- Canonical lock/idempotency hardening for agi_action_queue.
-- Safe additive migration: no destructive changes.

begin;

alter table public.agi_action_queue
  add column if not exists rejected_by uuid,
  add column if not exists executed_by uuid,
  add column if not exists approval_note text,
  add column if not exists rejection_note text,
  add column if not exists execution_result jsonb,
  add column if not exists execution_error text,
  add column if not exists rollback_plan jsonb,
  add column if not exists rejected_at timestamptz,
  add column if not exists executed_at timestamptz,
  add column if not exists idempotency_key text,
  add column if not exists locked_at timestamptz,
  add column if not exists lock_owner text,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists last_error text;

create unique index if not exists agi_action_queue_project_idempotency_key_uidx
  on public.agi_action_queue(project_id, idempotency_key)
  where idempotency_key is not null and btrim(idempotency_key) <> '';

create index if not exists agi_action_queue_lock_idx
  on public.agi_action_queue(project_id, status, locked_at, created_at desc);

create index if not exists agi_action_queue_github_chain_idx
  on public.agi_action_queue(project_id, tool_key, action_type, created_at desc);

alter table public.agi_action_queue enable row level security;

commit;
```

### supabase/remote-state/2026-04-22/auth_storage_schema.sql
```sql
--
-- PostgreSQL database dump
--

\restrict mEqH83lyPaDYxdfz2SjoPIhqyGzSffuv9WcPuU49XmGfPRNLJig3ifDM0IzqgXF

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9 (Ubuntu 17.9-0ubuntu0.25.10.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
```

### supabase/remote-state/2026-04-22/schema.sql
```sql
--
-- PostgreSQL database dump
--

\restrict dZVWlMcFuFoopxM7bfAK0cxDfqKK9NrjvHncdbI60GyRWf60bXrCpjK8cKJZRfH

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9 (Ubuntu 17.9-0ubuntu0.25.10.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: audit; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA audit;


--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: pg_cron; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION pg_cron; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: helpers; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA helpers;


--
-- Name: ledger; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA ledger;


--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_net IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: pgmq; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgmq;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: rng; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA rng;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgmq; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgmq WITH SCHEMA pgmq;


--
-- Name: EXTENSION pgmq; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgmq IS 'A lightweight message queue. Like AWS SQS and RSMQ but on Postgres.';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: wrappers; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;


--
-- Name: EXTENSION wrappers; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION wrappers IS 'Foreign data wrappers developed by Supabase';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
```
