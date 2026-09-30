import {removeBackground} from '@imgly/background-removal';
Object.defineProperty(navigator,'hardwareConcurrency',{value:self.crossOriginIsolated?Math.min(navigator.hardwareConcurrency||2,4):1});
self.onmessage=async(e:MessageEvent<{blob:Blob;publicPath:string}>)=>{
 try{
 const blob=await removeBackground(e.data.blob,{publicPath:e.data.publicPath,model:'isnet_fp16',device:'cpu',proxyToWorker:false,output:{format:'image/png'},progress:(key,current,total)=>self.postMessage({type:'progress',key,current,total})});
 self.postMessage({type:'done',blob});
 }catch(e){self.postMessage({type:'error',message:e instanceof Error?e.message:String(e)});}
};



