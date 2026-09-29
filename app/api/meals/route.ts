import { foodDb } from '@/lib/food-db';
const json = (v: unknown, status = 200) => Response.json(v, { status, headers: { 'Cache-Control': 'no-store' } });
function validDate(s: unknown): s is string { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s; }
export async function GET(req: Request) {
 const owner = req.headers.get('oai-authenticated-user-id'); if (!owner) return json({error:'请登录后查看记录'},401);
 const date = new URL(req.url).searchParams.get('date'); if (!validDate(date)) return json({error:'日期无效'},400);
 try { const result = await foodDb().prepare('SELECT id, date, meal, food, amount, note FROM meals WHERE owner = ? AND date = ? ORDER BY created, id').bind(owner,date).all(); return json(result.results); }
 catch(e) { console.error(e); return json({error:'暂时无法读取记录，请重试'},503); }
}
async function write(req: Request) {
 const owner = req.headers.get('oai-authenticated-user-id'); if (!owner) return json({error:'请登录后保存记录'},401);
 if (req.headers.get('origin') && req.headers.get('origin') !== new URL(req.url).origin) return json({error:'请求来源无效'},403);
 let data: Record<string, unknown>; try { const raw = await req.json(); if (!raw || typeof raw !== 'object') throw new Error(); data = raw as Record<string, unknown>; } catch { return json({error:'内容无效'},400); }
 if (!data || typeof data.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(data.id)) return json({error:'记录编号无效'},400);
 try {
 if (req.method === 'DELETE') { await foodDb().prepare('DELETE FROM meals WHERE owner = ? AND id = ?').bind(owner,data.id).run(); return json({ok:true}); }
 if (!validDate(data.date) || (typeof data.meal !== 'string' || !['早餐','午餐','晚餐','加餐'].includes(data.meal)) || typeof data.food !== 'string' || !data.food.trim() || data.food.length > 100 || typeof data.amount !== 'string' || data.amount.length > 80 || typeof data.note !== 'string' || data.note.length > 500) return json({error:'请检查食物、日期和份量'},400);
 if (req.method === 'PUT') { const r = await foodDb().prepare('UPDATE meals SET date = ?, meal = ?, food = ?, amount = ?, note = ? WHERE id = ? AND owner = ?').bind(data.date,data.meal,data.food.trim(),data.amount.trim(),data.note.trim(),data.id,owner).run(); if (!r.meta.changes) return json({error:'记录不存在，请刷新'},404); }
 else { await foodDb().prepare('INSERT INTO meals (id, owner, date, meal, food, amount, note, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING').bind(data.id,owner,data.date,data.meal,data.food.trim(),data.amount.trim(),data.note.trim(),new Date().toISOString()).run(); }
 return json({ok:true});
 } catch(e) { console.error(e); return json({error:'保存失败，内容已保留，请重试'},503); }
}
export const POST = write; export const PUT = write; export const DELETE = write;

