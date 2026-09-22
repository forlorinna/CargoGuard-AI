import {mkdir, writeFile} from 'node:fs/promises';

// No application imports, npm build, dependencies, corpus, or generated frontend.
const output = new URL('./public/', import.meta.url);
await mkdir(output, {recursive: true});
await writeFile(new URL('proxy.txt', output), 'CargoGuard reverse proxy deployment.\n');
console.log('Static proxy directory ready. All public paths use the forced 200 proxy rule.');
