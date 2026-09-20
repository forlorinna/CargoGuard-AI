import {mkdir,copyFile,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const target='public/runtime';await mkdir(target,{recursive:true});
const copies=[
  ['node_modules/pdfjs-dist/build/pdf.worker.min.mjs','pdf.worker.min.mjs'],
  ['node_modules/tesseract.js/dist/worker.min.js','ocr-worker.min.js'],
  ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz','eng.traineddata.gz'],
  ['node_modules/pdfjs-dist/LICENSE','PDFJS-LICENSE'],
  ['node_modules/tesseract.js/LICENSE.md','TESSERACT-LICENSE'],
  ['node_modules/tesseract.js-core/LICENSE','TESSERACT-CORE-LICENSE'],
];
for(const name of await readdir('node_modules/tesseract.js-core'))if(name.endsWith('.wasm.js'))copies.push(['node_modules/tesseract.js-core/'+name,name]);
const manifest={};
for(const [source,name]of copies){await copyFile(source,target+'/'+name);const bytes=await readFile(source);manifest[name]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}
await writeFile(target+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(`Prepared ${copies.length} same-origin parser/OCR assets from locked dependencies.`);
