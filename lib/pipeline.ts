import {classify,currentMessage} from './classification';
import {extract,docType} from './extraction';
import {compare} from './comparison';
import type {Case,Corpus,Email,Reason,Classification} from './types';
export function processEmail(email:Email,corpus:Corpus,override?:Classification):Case {
 const start=performance.now(),classification=override||classify(email);
 const docs=email.attachments.map(p=>corpus.documents[p]).filter(Boolean);
 const siDocs=docs.filter(d=>docType(d)==='SI'),blDocs=docs.filter(d=>docType(d)==='BL');
 const si=siDocs[0]||docs.find(d=>/[_-]SI\./i.test(d.name)),bl=blDocs[0]||docs.find(d=>/[_-]BL\./i.test(d.name));
 const result:Case={email,classification,category:classification.category,status:'OK',review_reason:null,has_defect:false,defect_fields:[],operationalStatus:'CLASSIFIED',explanation:'Routed to the appropriate inbox category.',comparisons:[],documents:docs,durationMs:0,siPath:si?.path,blPath:bl?.path};
 const finish=()=>({...result,durationMs:Math.round((performance.now()-start)*100)/100});
 const review=(reason:Reason,explanation:string)=>{result.status='NEEDS_REVIEW';result.operationalStatus='NEEDS_REVIEW';result.review_reason=reason;result.explanation=explanation;return finish();};
 if(classification.category!=='BL_COMPARISON') {if(classification.needsReview){result.operationalStatus='NEEDS_REVIEW';result.explanation='Low-confidence email category. Confirm routing before acting.';}return finish();}
 const message=currentMessage(email.body);
 if(email.attachments.length===0 && /(?:send|provide|forward).{0,40}draft\s+(?:bl|bill of lading)/is.test(message) && !/missing|dropped|attached|compare/is.test(message)) {
   result.operationalStatus='AWAITING_DOCUMENTS';result.explanation='Draft requested for a future check. No documents received; no verification performed.';return finish();
 }
 result.comparisons=compare(extract(si),extract(bl));
 if(docs.length!==email.attachments.length||email.attachments.length<2)return review('missing_attachment','A requested SI or draft BL attachment is missing. Obtain the source before finalizing.');
 if(docs.some(d=>d.error))return review('unreadable','At least one attachment cannot be read reliably. Inspect the original, supply readable text, or enable an OCR adapter.');
 if(docs.some(d=>docType(d)==='OTHER')||!si||!bl||docType(si)!=='SI'||docType(bl)!=='BL')return review('wrong_doc_type','Expected a Shipping Instruction and draft Bill of Lading. One attachment is a different or unrecognized document type.');
 if(siDocs.length!==1||blDocs.length!==1)return review('missing_value','Multiple SI or BL candidates: select the authoritative pair in review.');
 if(classification.needsReview)return review('missing_value','The comparison intent is uncertain; confirm the email category and evidence.');
 if(result.comparisons.some(c=>c.status==='NEEDS_REVIEW'))return review('missing_value','A required value is blank, ambiguous, or unsupported. Confirm the highlighted fields against the source.');
 result.defect_fields=result.comparisons.filter(c=>c.status==='MISMATCH').map(c=>c.field);
 result.has_defect=result.defect_fields.length>0;result.status=result.has_defect?'MISMATCH':'OK';result.operationalStatus=result.status;
 result.explanation=result.has_defect?`${result.defect_fields.length} discrepanc${result.defect_fields.length===1?'y':'ies'} detected against the Shipping Instruction.`:'No mismatch detected';
 return finish();
}
export function processCorpus(corpus:Corpus){return corpus.emails.map(email=>processEmail(email,corpus));}
