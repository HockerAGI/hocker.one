import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=p=>readFile(new URL("../"+p,import.meta.url),"utf8");
test("preview never starts protected NOVA persistence or inference",async()=>{
 const [env,chat,stream,history,page]=await Promise.all(["src/lib/nova-environment.ts","src/app/api/nova/chat/route.ts","src/app/api/nova/chat/stream/route.ts","src/app/api/nova/history/route.ts","src/app/chat/page.tsx"].map(read));
 assert.match(env,/VERCEL_ENV === "preview"/);
 for(const route of [chat,stream,history]) {assert.match(route,/requireProjectRole/);assert.match(route,/!novaProtectedAvailability\(\).available/);}
 for(const route of [chat,stream]) assert.ok(route.indexOf("if (!novaProtectedAvailability().available)")<route.indexOf("const queueLock = await getAgiQueueLock"));
 assert.match(page,/protectedAvailable=\{availability.available\}/);
});
test("chat status and errors remain distinct; preview has no protected polling",async()=>{
 const [chat,lazy,render]=await Promise.all(["src/components/NovaRealtimeChat.tsx","src/components/NovaRealtimeChatLazy.tsx","src/components/NovaMessageContent.tsx"].map(read));
 assert.match(chat,/setRuntimeError\(nextError\)/);
 assert.match(chat,/if \(!protectedAvailable\) \{/);
 assert.match(chat,/protectedAvailable \? window.setInterval/);
 assert.match(chat,/\!protectedAvailable \|\| abortRef.current/);
 assert.match(chat,/allow_actions: false/);
 assert.match(chat,/Se detuvo la recepción/);
 assert.match(lazy,/toolbar=\{protectedAvailable \?/);
 assert.doesNotMatch(render,/dangerouslySetInnerHTML|eval\(/);
});
