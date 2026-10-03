/** Keep the model session alive between photos; destroy it on cancellation. */
export class CutoutEngine {
 private worker:Worker|null=null;
 private reject:((reason:Error)=>void)|null=null;
 private forceCpu=false;

 run(blob:Blob,onProgress:(text:string)=>void):Promise<Blob>{
  if(this.reject)return Promise.reject(new Error('已有照片正在处理'));
  return new Promise((resolve,reject)=>{
   this.reject=reject;
   const start=()=>{
    const w=this.worker??new Worker(new URL('./cutout.worker.ts',import.meta.url),{type:'module'});
    this.worker=w;
    w.onmessage=({data:m})=>{
     if(w!==this.worker)return;
     if(m.type==='done'){this.reject=null;w.onmessage=null;w.onerror=null;resolve(m.blob);}
     if(m.type==='error'){
      if(m.retryCpu&&!this.forceCpu){
       w.terminate();this.worker=null;this.forceCpu=true;
       onProgress('正在切换兼容模式…');start();
      }else this.dispose(new Error(m.message));
     }
     if(m.type==='progress'){
      if(m.key?.startsWith('fetch:'))onProgress(m.current===m.total?'正在启动抠图引擎…':`首次加载抠图资源 ${Math.round(m.current/m.total*100)}%`);
      else if(m.key==='compute:inference')onProgress('正在识别食物轮廓…');
      else if(m.key==='compute:mask'||m.key==='compute:encode')onProgress('正在整理贴纸边缘…');
     }
    };
    w.onerror=()=>this.dispose(new Error('抠图引擎未能启动'));
    w.postMessage({blob,publicPath:new URL(import.meta.env.BASE_URL+'models/',location.origin).href,forceCpu:this.forceCpu});
   };
   try{start();}catch(error){this.dispose(error instanceof Error?error:new Error(String(error)));}
  });
 }

 dispose(reason:Error=new DOMException('已取消抠图','AbortError')){
  this.worker?.terminate();this.worker=null;
  const reject=this.reject;this.reject=null;reject?.(reason);
 }
}
