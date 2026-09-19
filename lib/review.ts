import {FIELDS,type Case,type Field,type Values,type Category,CATEGORIES} from './types';
import {normalize} from './normalization';
import {compare} from './comparison';
import {docType} from './extraction';
export interface ReviewInput {id:string;revision:number;decision:'confirm'|'reject';values:Record<Field,{si:string;bl:string}>;note:string;reviewer:string;category?:Category}
export function applyReview(original:Case,input:ReviewInput):Case {
 if(!input.reviewer?.trim()||!input.note?.trim()||input.note.trim().length<10)throw Error('Enter a reviewer name and an evidence note of at least 10 characters.');
 if(input.reviewer.length>100||input.note.length>2000)throw Error('Reviewer name or note is too long.');
 if(!['confirm','reject'].includes(input.decision))throw Error('Invalid review decision.');
 const result=structuredClone(original);
 if(input.category&&!CATEGORIES.includes(input.category))throw Error('Unknown category.');
 if(input.category){result.category=input.category;result.classification={category:input.category,confidence:1,method:'Human-confirmed routing',reasons:[input.note],needsReview:false};}
 result.reviewNote=input.note;result.reviewed=input.decision==='confirm';result.revision=(original.revision||0)+1;
 if(input.decision==='reject') {
  result.operationalStatus='NEEDS_REVIEW';result.explanation='Reviewer rejected the result: '+input.note;
  if(result.category==='BL_COMPARISON'){result.status='NEEDS_REVIEW';result.review_reason=result.review_reason||'missing_value';result.has_defect=false;result.defect_fields=[];}
  return result;
 }
 if(result.category!=='BL_COMPARISON') {result.status='OK';result.operationalStatus='CLASSIFIED';result.review_reason=null;result.has_defect=false;result.defect_fields=[];result.comparisons=[];result.explanation='Email routing confirmed by '+input.reviewer;return result;}
 if(original.documents.length<2)throw Error('Source documents are missing. Supply the SI and BL through ingestion, then retry.');
 if(!original.documents.some(d=>docType(d)==='SI')||!original.documents.some(d=>docType(d)==='BL'))throw Error('A readable SI and BL are required. Ingest the correct replacement documents before finalizing.');
 const si={} as Values,bl={} as Values;
 for(const field of FIELDS) {
  for(const side of ['si','bl'] as const) {
   const raw=input.values?.[field]?.[side];
   if(typeof raw!=='string'||raw.length>3000)throw Error(`Invalid ${side.toUpperCase()} ${field} value.`);
   const normalized=normalize(field,raw);
   if(normalized===null)throw Error(`Resolve ${side.toUpperCase()} ${field.replaceAll('_',' ')} before finalizing.`);
   const previous=original.comparisons.find(c=>c.field===field)?.[side];
   (side==='si'?si:bl)[field]={raw,normalized,confidence:1,location:'Human review by '+input.reviewer,evidence:previous?.evidence||'Manual transcription; see review note'};
  }
 }
 result.comparisons=compare(si,bl);result.defect_fields=result.comparisons.filter(c=>c.status==='MISMATCH').map(c=>c.field);result.has_defect=result.defect_fields.length>0;
 result.status=result.has_defect?'MISMATCH':'OK';result.operationalStatus=result.status;result.review_reason=null;
 result.explanation=result.has_defect?`${result.defect_fields.length} discrepanc${result.defect_fields.length===1?'y':'ies'} confirmed by ${input.reviewer}.`:'No mismatch detected';
 return result;
}
