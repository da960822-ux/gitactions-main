import { build } from 'esbuild';
await build({entryPoints:['src/core/server.ts'],bundle:true,format:'esm',platform:'neutral',outfile:'supabase/functions/_shared/engines.js'});
