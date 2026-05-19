# HOCKER ONE — 12.7B-1 GitHub Executor Real

Objetivo:
Convertir GitHub en la primera herramienta real ejecutable por NOVA dentro del AGI Runtime.

Incluye lectura real:
- github.get_repo
- github.list_tree
- github.read_file
- github.compare_refs
- github.audit_paths

Incluye escritura protegida:
- github.create_branch
- github.upsert_file
- github.create_pr

Regla de seguridad:
Las operaciones de escritura NO se ejecutan todavía contra GitHub. Se crean como acciones en agi_action_queue con dry-run y requires_approval. La ejecución real queda para una fase posterior con Owner Gate explícito.

Credenciales aceptadas:
- HOCKER_GITHUB_TOKEN
- GITHUB_TOKEN
- GH_TOKEN

Repositorio por defecto:
- HOCKER_GITHUB_REPO
- GITHUB_REPOSITORY
- fallback: HockerAGI/hocker.one
