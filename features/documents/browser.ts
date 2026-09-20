import type {ParsedDocument} from './model';
import type {Worker as OCRWorker} from 'tesseract.js';

const MAX_BYTES=8*1024*1024;
const MAX_TEXT=80000;
type Progress=(message:string)=>void;

function checkDocx(bytes:ArrayBuffer){
  // Bound decompression before handing a ZIP to the Word parser.
  const v=new DataView(bytes);let end=-1;
  for(let p=v.byteLength-22;p>=Math.max(0,v.byteLength-65557);p--)if(v.getUint32(p,true)===0x06054b50){end=p;break;}
  if(end<0)throw Error('Word file is not a readable DOCX archive.');
  const count=v.getUint16(end+10,true);let offset=v.getUint32(end+16,true),total=0,word=false;
  if(count>500)throw Error('Word file has too many archive entries.');
  for(let n=0;n<count;n++){
    if(offset+46>v.byteLength||v.getUint32(offset,true)!==0x02014b50)throw Error('Invalid Word archive.');
    if(v.getUint16(offset+8,true)&1)throw Error('Encrypted Word files are not supported.');
    total+=v.getUint32(offset+24,true);if(total>16*1024*1024)throw Error('Expanded Word document exceeds 16 MB.');
    const nameLength=v.getUint16(offset+28,true),extra=v.getUint16(offset+30,true),comment=v.getUint16(offset+32,true);
    if(offset+46+nameLength+extra+comment>v.byteLength)throw Error('Invalid Word archive entry.');
    word ||= new TextDecoder().decode(new Uint8Array(bytes,offset+46,nameLength))==='word/document.xml';
    offset+=46+nameLength+extra+comment;
  }
  if(!word)throw Error('This ZIP is not a Word document.');
}

async function timeout<T>(promise:Promise<T>,ms:number,message:string):Promise<T>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([promise,new Promise<T>((_,reject)=>{timer=setTimeout(()=>reject(Error(message)),ms);})]);}
  finally{if(timer)clearTimeout(timer);}
}

export async function parseFile(file:File,progress:Progress):Promise<ParsedDocument>{
  if(!file.size||file.size>MAX_BYTES)throw Error('Choose a non-empty document up to 8 MB.');
  const bytes=await file.arrayBuffer(),head=new Uint8Array(bytes,0,Math.min(8,bytes.byteLength));
  const ext=file.name.split('.').pop()?.toLowerCase();
  const format=ext==='pdf'?'PDF':ext==='docx'?'DOCX':ext==='png'?'PNG':ext==='jpg'||ext==='jpeg'?'JPEG':ext==='txt'?'TXT':null;
  if(!format)throw Error('Supported formats: PDF, DOCX, TXT, PNG, and JPEG. Legacy .doc files must be saved as DOCX.');
  if(format==='PDF'&&new TextDecoder().decode(head).slice(0,5)!=='%PDF-')throw Error('The file is not a valid PDF.');
  if(format==='DOCX'){if(head[0]!==80||head[1]!==75)throw Error('The file is not a valid DOCX.');checkDocx(bytes);}
  if(format==='PNG'&&!(head[0]===137&&head[1]===80&&head[2]===78&&head[3]===71))throw Error('The file is not a valid PNG.');
  if(format==='JPEG'&&!(head[0]===255&&head[1]===216))throw Error('The file is not a valid JPEG.');
  const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const document:ParsedDocument={name:file.name.replace(/[\x00-\x1f/\\]/g,'_').slice(0,160),format,method:'unreadable',segments:[],sha256,ocrConfidence:null,warning:null};
  let worker:OCRWorker|undefined;
  const scores:number[]=[];
  async function recognize(canvas:HTMLCanvasElement,location:string){
    progress(`${file.name}: recognizing ${location} with English OCR`);
    if(!worker){
      const {createWorker}=await import('tesseract.js');
      const pending=createWorker('eng',1,{workerPath:'/runtime/ocr-worker.min.js',corePath:'/runtime',langPath:'/runtime',workerBlobURL:false,cacheMethod:'none',logger:m=>{if(m.status==='recognizing text')progress(`${file.name}: ${location} · OCR ${Math.round(m.progress*100)}%`);}});
      try{worker=await timeout(pending,90000,'OCR initialization timed out. Retry or supply a text-based original.');}
      catch(e){void pending.then(w=>w.terminate()).catch(()=>{});throw e;}
    }
    const {data}=await timeout(worker.recognize(canvas,{}, {text:true}),90000,'OCR timed out. Supply a clearer or smaller original.');
    document.segments.push({location:location+' · English OCR',text:data.text});
    if(Number.isFinite(data.confidence)&&data.confidence>=0&&data.confidence<=100)scores.push(data.confidence);
    document.method='ocr';document.warning='OCR can misread shipment details. Check every field against the original before finalizing.';
  }
  try{
    progress(`${file.name}: detecting and extracting ${format}`);
    if(format==='TXT'){
      const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(text.includes('\0'))throw Error('Binary content is not a text document.');
      document.segments=[{location:'Text document',text}];document.method='text';
    }else if(format==='DOCX'){
      const mammoth=await import('mammoth');
      const result=await mammoth.extractRawText({arrayBuffer:bytes});
      document.segments=[{location:'Word document · paragraphs and table cells in reading order',text:result.value}];document.method='docx-text';
      if(result.messages.length)document.warning='The Word parser reported unsupported content. Review the extracted text against the original.';
    }else if(format==='PDF'){
      const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc='/runtime/pdf.worker.min.mjs';
      const task=pdfjs.getDocument({data:bytes,useSystemFonts:true});
      try{
        const pdf=await timeout(task.promise,30000,'PDF loading timed out.');
        if(pdf.numPages>10)throw Error('This demo accepts PDFs up to 10 pages.');
        let scanned=0;document.method='pdf-text';
        for(let i=1;i<=pdf.numPages;i++){
          const page=await pdf.getPage(i),content=await page.getTextContent();
          let text='',lastY:number|undefined;
          for(const item of content.items){if(!('str'in item))continue;const y=item.transform[5];if(lastY!==undefined&&Math.abs(y-lastY)>3&&!text.endsWith('\n'))text+='\n';text+=item.str+(item.hasEOL?'\n':' ');lastY=y;}
          if(text.trim().length>=30)document.segments.push({location:`Page ${i} · PDF text layer`,text});
          else{
            if(++scanned>4)throw Error('OCR is limited to 4 pages per document in this demo.');
            const natural=page.getViewport({scale:1});const scale=Math.min(2,Math.sqrt(6000000/(natural.width*natural.height)));
            const viewport=page.getViewport({scale});
            const surface=window.document.createElement('canvas');surface.width=Math.ceil(viewport.width);surface.height=Math.ceil(viewport.height);
            await page.render({canvas:surface,viewport}).promise;
            await recognize(surface,`Page ${i}`);surface.width=surface.height=1;
          }
          page.cleanup();
        }
      }finally{await task.destroy();}
    }else{
      const bitmap=await createImageBitmap(file);
      try{
        if(bitmap.width*bitmap.height>16000000)throw Error('Image exceeds the 16-megapixel demo limit.');
        const scale=Math.min(1,Math.sqrt(6000000/(bitmap.width*bitmap.height)));
        const canvas=window.document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
        canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);await recognize(canvas,'Image 1');canvas.width=canvas.height=1;
      }finally{bitmap.close();}
    }
    if(document.segments.reduce((n,s)=>n+s.text.length,0)>MAX_TEXT)throw Error('Extracted text exceeds the 80,000-character document limit.');
    if(!document.segments.some(s=>s.text.trim())){document.method='unreadable';document.warning='No readable text found. Supply a readable original for review.';}
  }catch(error){
    document.method='unreadable';document.warning=error instanceof Error?error.message:'Document extraction failed.';
    // Partial extraction must never be mistaken for a complete document.
    document.segments=[];
  }finally{if(worker)await worker.terminate();}
  document.ocrConfidence=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
  return document;
}
