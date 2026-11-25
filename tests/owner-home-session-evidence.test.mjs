import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = p => readFile(new URL("../"+p,import.meta.url),"utf8");
test("home reads available session data; protected reads require production and Owner AAL2", async()=>{
 const [data,page,runtime,mirror,approvals]=await Promise.all(["src/lib/owner-home-evidence.ts","src/app/owner/page.tsx","src/lib/verified-agi-runtime.ts","src/components/owner/OwnerProviderMirror.tsx","src/components/owner/OwnerUnifiedApprovals.tsx"].map(read));
 assert.match(data,/await requirePrivateSession\(projectId\)/);
 assert.match(data,/await createServerSupabase\(\)/);
 assert.match(data,/environment === "production" && ownerRole && ownerMfa === true/);
 assert.match(data,/if \(protectedReads\) \{[\s\S]*const admin = createAdminSupabase\(\)/);
 assert.match(data,/\.eq\("project_id", projectId\)/);
 assert.match(data,/pendingCount: null, agiCount: null/);
 assert.match(page,/allowProtectedReads: evidence.protectedReads/);
 assert.match(runtime,/if \(!allowProtectedReads\)/);
 assert.match(mirror,/if \(preview\) return/);
 assert.match(approvals,/if \(!enabled\) return/);
 assert.match(approvals,/https:\/\/hockerone\.vercel\.app\/owner\/actions/);
});
test("home uses compact rows and separates dedicated runtime and assistant",async()=>{
 const [page,css,side,tools]=await Promise.all(["src/app/owner/page.tsx","src/styles/owner-unified.css","src/components/Sidebar.tsx","src/components/owner/OwnerUnifiedTools.tsx"].map(read));
 assert.match(page,/hko-home-work/);assert.match(page,/<OwnerHomeActivity/);
 assert.match(page,/Motor dedicado/);assert.doesNotMatch(page,/hocker-one-logo\.png/);
 assert.match(css,/hko-home-compact \.hko-uni-chat \{ min-height: 0; max-height: none/);
 assert.match(css,/repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(side,/activeSection.id !== "inicio"/);
 assert.match(tools,/No representa el inventario de conexiones de Producción/);
});
