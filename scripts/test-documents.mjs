import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
await mkdir('work/tests',{recursive:true});
await build({entryPoints:['tests/documents.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'work/tests/documents.test.mjs'});
const result=spawnSync(process.execPath,['--test','work/tests/documents.test.mjs'],{stdio:'inherit'});
process.exit(result.status??1);
