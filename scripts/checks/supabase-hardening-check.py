import os
import json
import urllib.parse
import urllib.request
import urllib.error

# Load env from .env.local (or fall back to system env vars)
import pathlib

_env_files = [".env.local", ".env.vercel.production", ".env"]
_env_loaded = False

for _ef in _env_files:
    _ep = pathlib.Path(_ef)
    if _ep.exists():
        for raw in open(_ep, "r", encoding="utf-8"):
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v
        _env_loaded = True
        break

supabase_url = (os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""

if not supabase_url or not service_key:
    raise SystemExit("Faltan variables Supabase.")

def get(table, query):
    qs = urllib.parse.urlencode(query)
    req = urllib.request.Request(
        f"{supabase_url}/rest/v1/{table}?{qs}",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
        },
    )

    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read().decode())

checks = {}

def check_table(table, select="id", limit=1):
    try:
        rows = get(table, {"select": select, "limit": str(limit)})
        checks[table] = {"ok": True, "sample_rows": len(rows)}
    except urllib.error.HTTPError as e:
        checks[table] = {"ok": False, "error": e.read().decode("utf-8", errors="replace")}

check_table("events", "id,project_id,type,message,data,created_at")
check_table("nodes", "id,project_id,status,meta,last_seen_at")
check_table("commands", "id,project_id,node_id,command,status,needs_approval,signature")
check_table("nova_messages", "id,thread_id,role,content,meta,created_at")
check_table("agis", "id,name,meta")
check_table("profiles", "id,email,role,meta")
check_table("audit_logs", "id,project_id,action,data,created_at")

memory_rows = get("events", {
    "project_id": "eq.hocker-one",
    "type": "like.memory.%",
    "select": "id,type,message,created_at",
    "order": "created_at.desc",
    "limit": "10",
})

print(json.dumps({
    "ok": all(item.get("ok") for item in checks.values()),
    "checks": checks,
    "memory_events_sample": len(memory_rows),
}, indent=2, ensure_ascii=False))
