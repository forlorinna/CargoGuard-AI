import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
await mkdir('work/tests',{recursive:true});
await build({entryPoints:['tests/engine.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'work/tests/engine.test.mjs'});
const r=spawnSync(process.execPath,['--test','work/tests/engine.test.mjs'],{stdio:'inherit'});
process.exit(r.status??1);
