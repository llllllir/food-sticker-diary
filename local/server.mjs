import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,existsSync,statSync,createReadStream} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const dataDir=process.env.FOOD_DIARY_DATA_DIR || path.join(root,'.local-data');
mkdirSync(dataDir,{recursive:true});
const db=new DatabaseSync(path.join(dataDir,'food-stickers.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS stickers (id TEXT PRIMARY KEY, date TEXT NOT NULL, caption TEXT NOT NULL, rotation REAL NOT NULL, image BLOB NOT NULL, created TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_stickers_date ON stickers(date);`);
const port=Number(process.env.PORT || 3000);
const validDate=s=>typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s;
const json=(res,value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
async function body(req){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>12*1024*1024)throw Object.assign(new Error('图片过大，请选择较小的图片'),{status:413});chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw Object.assign(new Error('内容无效'),{status:400});}}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');res.setHeader('X-Content-Type-Options','nosniff');
 const allowed=new Set([`localhost:${port}`,`127.0.0.1:${port}`]);
 if(!allowed.has(req.headers.host))return json(res,{error:'仅允许本地访问'},403);
 if(req.headers.origin&&!new Set([`http://localhost:${port}`,`http://127.0.0.1:${port}`]).has(req.headers.origin))return json(res,{error:'请求来源无效'},403);
 try{
 const url=new URL(req.url,`http://localhost:${port}`); const p=url.pathname;
 if(p==='/api/health')return json(res,{ok:true,modelReady:existsSync(path.join(root,'.local-models','resources.json'))});
 if(p==='/api/stickers'&&req.method==='GET'){
 const month=url.searchParams.get('month');if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month||''))return json(res,{error:'月份无效'},400);
 return json(res,db.prepare('SELECT id,date,caption,rotation,created FROM stickers WHERE date LIKE ? ORDER BY created,id').all(month+'%'));
 }
 const imageMatch=p.match(/^\/api\/stickers\/([a-f0-9-]{36})\/image$/);
 if(imageMatch&&req.method==='GET'){const row=db.prepare('SELECT image FROM stickers WHERE id=?').get(imageMatch[1]);if(!row)return json(res,{error:'贴纸不存在'},404);res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'private, max-age=3600'});res.end(Buffer.from(row.image));return;}
 if(p==='/api/stickers'&&req.method==='POST'){
 if(!req.headers['content-type']?.startsWith('application/json'))return json(res,{error:'内容格式无效'},415);
 const v=await body(req);if(!v||!validDate(v.date)||typeof v.caption!=='string'||v.caption.length>100||typeof v.id!=='string'||!/^[a-f0-9-]{36}$/.test(v.id)||typeof v.image!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(v.image)||typeof v.rotation!=='number'||!Number.isFinite(v.rotation)||Math.abs(v.rotation)>20)return json(res,{error:'请检查日期和图片'},400);
 const image=Buffer.from(v.image.split(',')[1],'base64');if(image.length>8*1024*1024||image.length<24||!image.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return json(res,{error:'请使用有效的 PNG 贴纸'},400);
 const width=image.readUInt32BE(16),height=image.readUInt32BE(20);if(width<1||height<1||width>4096||height>4096)return json(res,{error:'图片尺寸无效'},400);
 db.prepare('INSERT INTO stickers(id,date,caption,rotation,image,created) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').run(v.id,v.date,v.caption.trim(),v.rotation,image,new Date().toISOString());return json(res,{id:v.id},201);
 }
 const match=p.match(/^\/api\/stickers\/([a-f0-9-]{36})$/);
 if(match&&req.method==='PATCH'){const v=await body(req);if(!v||!validDate(v.date)||typeof v.caption!=='string'||v.caption.length>100||typeof v.rotation!=='number'||!Number.isFinite(v.rotation)||Math.abs(v.rotation)>20)return json(res,{error:'记录内容无效'},400);const r=db.prepare('UPDATE stickers SET date=?,caption=?,rotation=? WHERE id=?').run(v.date,v.caption.trim(),v.rotation,match[1]);return json(res,r.changes?{ok:true}:{error:'贴纸不存在'},r.changes?200:404);}
 if(match&&req.method==='DELETE'){db.prepare('DELETE FROM stickers WHERE id=?').run(match[1]);return json(res,{ok:true});}
 if(p.startsWith('/api/'))return json(res,{error:'接口不存在'},404);
 if(req.method!=='GET'&&req.method!=='HEAD')return json(res,{error:'方法不支持'},405);
 const isModel=p.startsWith('/models/');const dir=path.join(root,isModel?'.local-models':'local-dist');const relative=decodeURIComponent(isModel?p.slice(8):p==='/ '||p==='/'?'index.html':p.slice(1));
 const file=path.resolve(dir,relative);if(!file.startsWith(dir+path.sep)||!existsSync(file)||!statSync(file).isFile())return json(res,{error:'文件不存在'},404);
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':statSync(file).size,'Cache-Control':isModel?'public, max-age=31536000, immutable':'no-cache'});if(req.method==='HEAD')return res.end();createReadStream(file).pipe(res);
 }catch(e){console.error(e.message);if(!res.headersSent)json(res,{error:e.status?e.message:'本地保存失败，请重试'},e.status||500);else res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`食日记已启动: http://localhost:${port}\n记录保存在: ${dataDir}`));
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?`端口 ${port} 已被占用，请设置 PORT 后重试`:err);process.exit(1);});
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>server.close(()=>{db.close();process.exit(0);}));
