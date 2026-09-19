import {readdir,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
// Wrangler records applied migrations. This command is safe on repeated runs.
const files=(await readdir('drizzle')).filter(f=>f.endsWith('.sql'));
if(!files.length)throw Error('Generate migrations first.');
const config=JSON.parse(await readFile('dist/server/wrangler.json','utf8'));
await mkdir('work',{recursive:true});
await writeFile('work/migrations.json',JSON.stringify({name:config.name,compatibility_date:config.compatibility_date,d1_databases:config.d1_databases.map(d=>({...d,migrations_dir:path.resolve('drizzle')}))}));
const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local','--config','work/migrations.json','--persist-to','.wrangler/state'],{stdio:'inherit'});
process.exit(result.status??1);
