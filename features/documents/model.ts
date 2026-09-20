import {z} from 'zod';
import {processEmail} from '@/lib/pipeline';
import {applyReview, type ReviewInput} from '@/lib/review';
import type {Case, SourceDocument} from '@/lib/types';

export const documentSchema = z.object({
  name: z.string().min(1).max(160).refine(s => !/[\x00-\x1f/\\]/.test(s)),
  format: z.enum(['TXT','PDF','DOCX','PNG','JPEG']),
  method: z.enum(['text','pdf-text','docx-text','ocr','unreadable']),
  segments: z.array(z.object({location:z.string().min(1).max(160),text:z.string().max(50000)})).max(30),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  ocrConfidence: z.number().min(0).max(100).nullable(),
  warning: z.string().max(500).nullable(),
}).strict().superRefine((d,ctx)=>{
  if(d.segments.reduce((n,s)=>n+s.text.length,0)>80000)ctx.addIssue({code:'custom',message:'Extracted text exceeds the document limit.'});
  if(['PNG','JPEG'].includes(d.format)&&!['ocr','unreadable'].includes(d.method))ctx.addIssue({code:'custom',message:'Images require OCR.'});
});
export type ParsedDocument = z.infer<typeof documentSchema>;
export type UploadDocument = SourceDocument & {ocrConfidence:number|null; reliability:string};
export type UploadCase = Omit<Case,'documents'> & {documents:UploadDocument[]};

export function verifyDocuments(input:unknown,id:string):UploadCase {
  const pair=z.array(documentSchema).length(2).parse(input);
  const documents:UploadDocument[]=pair.map((d,i)=>{
    const text=d.segments.map(s=>s.text).join('\n');
    const uncertain=d.method==='ocr'||d.method==='unreadable'||!text.trim()||!!d.warning;
    return {path:`uploads/${i===0?'SI':'BL'}/${d.name}`,name:d.name,format:d.format,method:d.method,
      text,segments:d.segments,sha256:d.sha256,ocrConfidence:d.ocrConfidence,
      error:uncertain?(d.warning||'OCR text requires human confirmation against the original.') : null,
      reliability:uncertain?'Human confirmation required':'Text layer parsed; field evidence still required'};
  });
  const email={email_id:id,from:'Document upload',subject:'Uploaded SI / BL verification',
    body:'Please compare the attached Shipping Instruction against the draft Bill of Lading and report discrepancies.',attachments:documents.map(d=>d.path)};
  return processEmail(email,{emails:[email],documents:Object.fromEntries(documents.map(d=>[d.path,d]))}) as UploadCase;
}

export function reviewDocuments(before:UploadCase,input:ReviewInput & {sourceConfirmed?:boolean}):UploadCase {
  if(input.decision==='confirm'&&input.sourceConfirmed!==true)throw Error('Confirm that all seven values were checked against the original documents.');
  // Uploads always represent an SI/BL pair. They cannot escape source validation by reclassifying the case.
  return applyReview(before,{...input,category:'BL_COMPARISON'}) as UploadCase;
}
