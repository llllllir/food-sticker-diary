import { env } from 'cloudflare:workers';
export function foodDb() { if (!env.DB) throw new Error('Database unavailable'); return env.DB; }
