import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

const workers=[];
class FakeWorker {
 constructor(){workers.push(this);}
 postMessage(message){this.message=message;}
 terminate(){this.terminated=true;}
 send(data){this.onmessage?.({data});}
}
const source=(await readFile(new URL('../local/cutout.ts',import.meta.url),'utf8'))
 .replace('export class CutoutEngine','class CutoutEngine')
 .replaceAll('import.meta.env.BASE_URL',"'/food-sticker-diary/'")
 .replaceAll('import.meta.url',"'https://example.org/assets/app.js'");
const code=ts.transpile(source,{target:ts.ScriptTarget.ES2022});
const Engine=runInNewContext(code+'\nCutoutEngine',{Worker:FakeWorker,URL,DOMException,location:{origin:'https://example.org'}});
const engine=new Engine();const progress=()=>{};
let result=engine.run('photo',progress);workers[0].send({type:'done',blob:'first'});
assert.equal(await result,'first');
result=engine.run('photo2',progress);assert.equal(workers.length,1);
workers[0].send({type:'error',retryCpu:true});assert.equal(workers.length,2);
assert.equal(workers[0].terminated,true);assert.equal(workers[1].message.forceCpu,true);
workers[1].send({type:'done',blob:'fallback'});assert.equal(await result,'fallback');
result=engine.run('photo3',progress);assert.equal(workers.length,2);
const cancelled=assert.rejects(result,{name:'AbortError'});engine.dispose();await cancelled;
assert.equal(workers[1].terminated,true);
result=engine.run('photo4',progress);assert.equal(workers.length,3);
const failed=assert.rejects(result,/CPU failed/);workers[2].send({type:'error',retryCpu:false,message:'CPU failed'});await failed;
assert.equal(workers[2].terminated,true);
console.log('PASS: model reuse, fresh-worker CPU fallback, cancellation, restart, failure cleanup');
