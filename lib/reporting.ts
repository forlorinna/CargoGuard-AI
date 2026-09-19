import {CATEGORIES,FIELDS,type Case,type SubmissionRecord} from './types';
export function submission(cases:Case[]):Record<string,SubmissionRecord> {
 return Object.fromEntries(cases.map(c=>[c.email.email_id,{category:c.category,status:c.status,review_reason:c.review_reason,has_defect:c.has_defect,defect_fields:c.defect_fields}]));
}
export function validateSubmission(data:Record<string,SubmissionRecord>,ids:string[]) {
 if(Object.keys(data).length!==ids.length||ids.some(id=>!data[id]))throw Error('Submission must contain every inbox ID exactly once.');
 for(const [id,r]of Object.entries(data)) {
  if(Object.keys(r).sort().join(',')!=='category,defect_fields,has_defect,review_reason,status')throw Error(`${id}: unexpected schema`);
  if(!CATEGORIES.includes(r.category)||!['OK','MISMATCH','NEEDS_REVIEW'].includes(r.status)||typeof r.has_defect!=='boolean'||!Array.isArray(r.defect_fields)||r.defect_fields.some(f=>!FIELDS.includes(f)))throw Error(`${id}: invalid enum or type`);
  if(r.status==='MISMATCH'&&(!r.has_defect||!r.defect_fields.length||r.review_reason))throw Error(`${id}: mismatch invariant`);
  if(r.status!=='MISMATCH'&&(r.has_defect||r.defect_fields.length))throw Error(`${id}: uncertainty must not be exported as defect`);
  if(r.status==='NEEDS_REVIEW'&&!['wrong_doc_type','missing_attachment','unreadable','missing_value'].includes(r.review_reason||''))throw Error(`${id}: review reason required`);
  if(r.status!=='NEEDS_REVIEW'&&r.review_reason!==null)throw Error(`${id}: unexpected review reason`);
 }
 return true;
}
