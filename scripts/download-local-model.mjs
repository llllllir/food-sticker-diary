import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../.local-models/',import.meta.url);
const base='https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/';
await fs.mkdir(root,{recursive:true});
const response=await fetch(base+'resources.json');if(!response.ok)throw Error('Model manifest unavailable: '+response.status);
const manifest=await response.json();
const selected=Object.entries(manifest).filter(([key])=>key.includes('isnet_fp16')||(key.includes('ort-wasm-simd-threaded.')&&!key.includes('.jsep.')));
if(selected.length!==3)throw Error('Unexpected model manifest');
const chunks=[...new Map(selected.flatMap(([,v])=>v.chunks).map(c=>[c.name,c])).values()];
let next=0;
async function download(){while(next<chunks.length){const chunk=chunks[next++];if(!/^[a-f0-9]{64}$/.test(chunk.name))throw Error('Invalid model asset name');const target=new URL(chunk.name,root);try{const old=await fs.readFile(target);if(createHash('sha256').update(old).digest('hex')===chunk.hash)continue;}catch{}const r=await fetch(base+chunk.name);if(!r.ok)throw Error('Model download failed: '+r.status);const data=Buffer.from(await r.arrayBuffer());if(data.length!==chunk.offsets[1]-chunk.offsets[0]||createHash('sha256').update(data).digest('hex')!==chunk.hash)throw Error('Model checksum mismatch');await fs.writeFile(target,data);console.log('Verified model chunk',chunk.name.slice(0,8));}}
await Promise.all(Array.from({length:4},download));await fs.writeFile(new URL('resources.json',root),JSON.stringify(manifest));console.log('Local image model is ready.');
