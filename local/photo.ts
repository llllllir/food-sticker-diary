export async function preparePhoto(file:Blob):Promise<Blob>{
 const img=await createImageBitmap(file);
 if(img.width*img.height>80000000){img.close();throw new Error('照片尺寸太大，请选择较小的照片');}
 const scale=Math.min(1,1400/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d')!.drawImage(img,0,0,c.width,c.height);img.close();return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('照片读取失败')),'image/png'));
}
export async function cropSticker(blob:Blob):Promise<Blob>{
 const img=await createImageBitmap(blob);const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d')!;ctx.drawImage(img,0,0);img.close();const data=ctx.getImageData(0,0,c.width,c.height).data;let left=c.width,top=c.height,right=-1,bottom=-1,solid=0;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){if(data[(y*c.width+x)*4+3]>220)solid++;if(data[(y*c.width+x)*4+3]>25){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
 if(right<left||bottom<top||solid<c.width*c.height*.01)throw new Error('没找到清晰的食物主体，试试背景更简洁的照片');
 const w=right-left+1,h=bottom-top+1;const scale=Math.min(1,640/Math.max(w,h));const out=document.createElement('canvas');out.width=Math.ceil(w*scale)+24;out.height=Math.ceil(h*scale)+24;out.getContext('2d')!.drawImage(c,left,top,w,h,12,12,w*scale,h*scale);return new Promise((resolve,reject)=>out.toBlob(b=>b?resolve(b):reject(new Error('贴纸生成失败')),'image/png'));
}
export function dataUrl(blob:Blob):Promise<string>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result as string);reader.onerror=()=>reject(new Error('图片读取失败'));reader.readAsDataURL(blob);});}

