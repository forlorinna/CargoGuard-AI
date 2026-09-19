export const FIELDS = ['shipper','consignee','notify_party','port_of_loading','port_of_discharge','container_count','gross_weight_kg'] as const;
export type Field = typeof FIELDS[number];
export const CATEGORIES = ['BL_COMPARISON','SI_REQUEST','INVOICE_QUERY','GENERAL','SPAM'] as const;
export type Category = typeof CATEGORIES[number];
export type Reason = 'wrong_doc_type'|'missing_attachment'|'unreadable'|'missing_value';
export type Status = 'OK'|'MISMATCH'|'NEEDS_REVIEW';
export interface Email {email_id:string; from:string; subject:string; body:string; attachments:string[]; received_at?:string}
export interface SourceDocument {path:string; name:string; format:string; method:string; text:string; segments:{location:string;text:string}[]; error:string|null; sha256:string}
export interface Corpus {emails:Email[]; documents:Record<string,SourceDocument>}
export interface Extracted {raw:string; normalized:string|number|null; evidence:string; location:string; confidence:number; issue?:string}
export type Values = Record<Field,Extracted>;
export interface Classification {category:Category; confidence:number; method:string; reasons:string[]; needsReview:boolean}
export interface Comparison {field:Field; si:Extracted; bl:Extracted; status:'MATCH'|'MISMATCH'|'NEEDS_REVIEW'}
export interface SubmissionRecord {category:Category; status:Status; review_reason:Reason|null; has_defect:boolean; defect_fields:Field[]}
export interface Case extends SubmissionRecord {email:Email; classification:Classification; operationalStatus:string; explanation:string; comparisons:Comparison[]; documents:SourceDocument[]; siPath?:string; blPath?:string; durationMs:number; reviewed?:boolean; revision?:number; reviewNote?:string}
export const LABELS:Record<Field,string> = {shipper:'Shipper',consignee:'Consignee',notify_party:'Notify party',port_of_loading:'Port of loading',port_of_discharge:'Port of discharge',container_count:'Container count',gross_weight_kg:'Gross weight (kg)'};
