import fs from 'node:fs/promises';
const source=new URL('../.local-models/',import.meta.url),dest=new URL('../pages-dist/models/',import.meta.url);
await fs.mkdir(dest,{recursive:true});
const manifest=JSON.parse(await fs.readFile(new URL('resources.json',source),'utf8'));
const selected=Object.fromEntries(Object.entries(manifest).filter(([key])=>key.includes('isnet_fp16')||(key.includes('ort-wasm-simd-threaded.')&&!key.includes('.jsep.'))));
for(const name of new Set(Object.values(selected).flatMap(v=>v.chunks.map(c=>c.name))))await fs.copyFile(new URL(name,source),new URL(name,dest));
await fs.writeFile(new URL('resources.json',dest),JSON.stringify(selected));
await fs.writeFile(new URL('../pages-dist/.nojekyll',import.meta.url),'');
console.log('Pages output ready, including the local AI model.');
