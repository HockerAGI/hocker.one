import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=(p)=>readFile(new URL("../"+p,import.meta.url),"utf8");
test("New type system and brand logo are consistent without altering auth",async()=>{
 const [layout,css,login,auth,shell]=await Promise.all(["src/app/layout.tsx","src/styles/hocker-refinement.css","src/components/hocker-2c/auth/HockerOwnerLoginSurface.tsx","src/components/AuthBox.tsx","src/components/PrivateShell.tsx"].map(read));
 assert.match(layout,/Outfit/);
 assert.match(layout,/--font-hocker-ui/);
 assert.match(css,/--font-inter: var\(--font-hocker-ui\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(login,/\/brand\/hocker-one-logo\.png/);
 assert.match(login,/Bienvenido/);
 assert.match(login,/<AuthBox/);
 assert.match(auth,/fetch\("\/api\/auth\/password-login"/);
 assert.match(auth,/const cleanPassword = password;/);
 assert.match(shell,/hko-refined-shell/);
 assert.match(shell,/immersive \? <HockerVfxLayer \/> : null/);
});
