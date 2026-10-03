import {removeBackground} from '@imgly/background-removal';
Object.defineProperty(navigator,'hardwareConcurrency',{value:self.crossOriginIsolated?Math.min(navigator.hardwareConcurrency||2,4):1});
let device:'cpu'|'gpu'|undefined;
self.onmessage=async(e:MessageEvent<{blob:Blob;publicPath:string;forceCpu?:boolean}>)=>{
 try{
 if(!device){
 device='cpu';
 if(!e.data.forceCpu){try{
 const gpu=(navigator as Navigator & {gpu?:{requestAdapter:()=>Promise<{features:{has:(name:string)=>boolean}}|null>}}).gpu;
 const adapter=await gpu?.requestAdapter();
 if(adapter?.features.has('shader-f16'))device='gpu';
 }catch{/* CPU remains available when browser GPU access is blocked. */}}
 }
 const blob=await removeBackground(e.data.blob,{publicPath:e.data.publicPath,model:'isnet_fp16',device,proxyToWorker:false,fetchArgs:{cache:'force-cache'},output:{format:'image/png'},progress:(key,current,total)=>self.postMessage({type:'progress',key,current,total})});
 self.postMessage({type:'done',blob,device});
 }catch(e){self.postMessage({type:'error',retryCpu:device==='gpu',message:e instanceof Error?e.message:String(e)});}
};



