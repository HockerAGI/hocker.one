import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read = p => readFile(new URL("../"+p,import.meta.url),"utf8");
test("failed admin queries do not become visible zero metrics or uncreated agents",async()=>{
 const [runtime,op,home,status,dash,map]=await Promise.all(["src/lib/verified-agi-runtime.ts","src/lib/hocker-operational-state.ts","src/app/owner/page.tsx","src/app/status/page.tsx","src/lib/hocker-dashboard-server.ts","src/components/map/EcosystemVfxNetwork.tsx"].map(read));
 assert.match(runtime,/databaseOnline \? "online" : "unknown"/);
 assert.match(runtime,/count_verified:/);
 assert.match(op,/databaseOk \? "not_created" : "unknown"/);
 assert.match(home,/pendingCount === null \? "Pendientes sin verificar"/);
 for(const source of [status,dash,map]) assert.match(source,/source === "supabase\+health" \?/);
});
test("connections require recent evidence and integration monitoring is read only",async()=>{
 const [registry,page,mirror]=await Promise.all(["src/lib/mcp/mcp-registry.ts","src/app/integrations/page.tsx","src/components/owner/OwnerProviderMirror.tsx"].map(read));
 assert.match(registry,/await this\.ping\(\)/);
 assert.match(registry,/fetch\(\`\$\{this.baseUrl\}\/v1\/apps\`/);
 assert.match(registry,/Date\.now\(\) - Date\.parse\(state.lastPingAt\) <= 10 \* 60 \* 1000/);
 assert.match(page,/endpoint.searchParams.delete\("emit_event"\)/);
 assert.match(page,/await createServerSupabase\(\)/);
 assert.match(page,/eventsResult.ok/);
 assert.match(mirror,/router.refresh\(\); void verify\(\)/);
});
