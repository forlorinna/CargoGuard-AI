import {db,session,json,saveCase,checkOrigin} from '@/lib/store';
import {verifyDocuments,reviewDocuments,type UploadCase} from '@/features/documents/model';
import type {ReviewInput} from '@/lib/review';

async function list(sessionId:string){
  const rows=await db().prepare("SELECT result FROM reviews WHERE session = ? AND email_id LIKE 'upload_%' ORDER BY updated_at DESC LIMIT 10").bind(sessionId).all<{result:string}>();
  const audit=await db().prepare("SELECT id,email_id AS emailId,action,actor,note,created_at AS createdAt FROM audit WHERE session = ? AND email_id LIKE 'upload_%' ORDER BY created_at DESC LIMIT 50").bind(sessionId).all();
  return {cases:rows.results.map(r=>JSON.parse(r.result) as UploadCase),audit:audit.results};
}
async function body(request:Request){
  const reader=request.body?.getReader();if(!reader)throw Error('Request body is required.');
  const parts:Uint8Array[]=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>240000){await reader.cancel();throw Error('Upload text exceeds the 240 KB request limit.');}parts.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function GET(request:Request){const s=session(request);try{return json(await list(s.id),s,request);}catch{return json({error:'Document workspace storage is unavailable. Please retry.'},s,request,503);}}
export async function POST(request:Request){
  const s=session(request);
  try{
    // Read a bounded body even on forbidden requests so keep-alive connections stay usable.
    const input=await body(request);checkOrigin(request);
    if(input.action==='compare'){
      const count=await db().prepare("SELECT COUNT(*) AS n FROM reviews WHERE session = ? AND email_id LIKE 'upload_%'").bind(s.id).first<{n:number}>();
      if((count?.n||0)>=10)throw Error('This demo workspace has reached its limit of 10 uploaded pairs. Existing pairs remain available.');
      const after=verifyDocuments(input.documents,'upload_'+crypto.randomUUID());
      await saveCase(s.id,after,after,'Uploaded documents verified','System','Parsed document evidence saved; original file bytes remain on the user device.');
      return json({...await list(s.id),selectedId:after.email.email_id},s,request);
    }
    if(!/^upload_[a-f0-9-]{36}$/.test(input.id||''))throw Error('Unknown uploaded pair.');
    const row=await db().prepare('SELECT result,revision FROM reviews WHERE session = ? AND email_id = ?').bind(s.id,input.id).first<{result:string;revision:number}>();
    if(!row)throw Error('This uploaded pair is unavailable in your session.');
    const before={...JSON.parse(row.result),revision:row.revision} as UploadCase;
    if(input.revision!==before.revision)throw Error('This pair changed in another tab. Reload before saving.');
    if(input.action==='retry'){
      if(before.reviewed)throw Error('Finalized human work is preserved. Use human review to change it.');
      const after=verifyDocuments(before.documents.map(d=>({name:d.name,format:d.format,method:d.method,segments:d.segments,sha256:d.sha256,ocrConfidence:d.ocrConfidence,warning:d.error})),input.id);
      await saveCase(s.id,before,after,'Uploaded pair retried','System','Rechecked saved source text with the frozen engine; OCR remains review-required.');
    }else if(input.action==='review'){
      const after=reviewDocuments(before,input as ReviewInput & {sourceConfirmed?:boolean});
      await saveCase(s.id,before,after,input.decision==='confirm'?'Uploaded pair finalized':'Uploaded pair rejected',input.reviewer,input.note);
    }else throw Error('Unknown document action.');
    return json({...await list(s.id),selectedId:input.id},s,request);
  }catch(error){
    const message=error instanceof Error?error.message:'Document operation failed.';
    // Database details and validation internals do not belong in public error messages.
    return json({error:message.startsWith('D1_')?'Document storage is unavailable. Please retry.':message.slice(0,700)},s,request,400);
  }
}
