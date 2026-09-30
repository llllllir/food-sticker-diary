import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig(({mode})=>({
 base: mode==='pages'?'/food-sticker-diary/':'/',
 root: fileURLToPath(new URL('./local', import.meta.url)),
 publicDir: fileURLToPath(new URL('./public', import.meta.url)),
 plugins:[react()],
 resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
 build:{outDir:mode==='pages'?'../pages-dist':'../local-dist',emptyOutDir:true,target:'es2022'},
 worker:{format:'es'},
}));

