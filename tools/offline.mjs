import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
const files = [];
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) await walk(child);
    else if (entry.name !== "sw.js") files.push(child);
  }
}
await walk("dist");
const hash = createHash("sha256");
for (const f of files.sort()) hash.update(await readFile(f));
const assets = files.map(
  (f) => "./" + relative("dist", f).replaceAll("\\", "/"),
);
await writeFile(
  "dist/sw.js",
  `const name='lfl-'+new URL(self.registration.scope).pathname+'-${hash.digest("hex").slice(0, 12)}';
self.addEventListener('install',e=>e.waitUntil(caches.open(name).then(c=>c.addAll(${JSON.stringify(assets)})).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('lfl-'+new URL(self.registration.scope).pathname+'-')&&k!==name)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&e.request.url.startsWith(self.registration.scope))e.respondWith(caches.open(name).then(async c=>(await c.match(e.request.mode==='navigate'?'./index.html':e.request,{ignoreVary:true}))||fetch(e.request)))});
`,
);
