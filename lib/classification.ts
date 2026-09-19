import {CATEGORIES,type Category,type Email,type Classification} from './types';
// Curated intent descriptions, independent of email IDs and reference labels.
// A small vector-space classifier complements explicit document/action context.
const prototypes:Record<Category,string[]>={
 BL_COMPARISON:['Compare shipping instruction against draft bill of lading and verify details match.','Check draft BL against SI and report discrepancies before confirmation.','Please send the draft BL for checking and amendment.','Attached shipping documents for confirmation and approval.'],
 SI_REQUEST:['Please prepare a new shipping instruction for this shipment.','Shipping instruction with shipper consignee notify party POL POD description of goods. Revert with draft BL once available.','Customer SI needed for booking. Submit new instruction to shipping line.'],
 INVOICE_QUERY:['Please explain invoice freight local charges breakdown and billing.','Cancel invoice and reverse PGI booking amended.','Missing goods receipt GR post billing invoice.','Confirm detention demurrage D&D charges before payment.'],
 GENERAL:['Daily berthing report vessel berthed on schedule.','Operational update summary loading completed documents to follow.','Reminder submit SI and AED pending shipments outstanding list.','Automated RPA billing completed successfully no action required.','Happy new year office holiday management announcement.'],
 SPAM:['Congratulations winner claim prize gift card click link.','Mailbox storage exceeded verify account immediately avoid deactivation.','Package delivery unpaid customs fee confirm payment suspicious link.','Limited time offer discount buy now marketing promotion.']
};
const stop=new Set('a an the this that these those for to of in on and or with as is are be by have has your you our please dear hi kindly it its from at we before'.split(' '));
const tokens=(s:string)=>(s.toLowerCase().match(/[a-z]+/g)||[]).filter(t=>!stop.has(t));
function cosine(a:string,b:string){const av=new Map<string,number>(),bv=new Map<string,number>();for(const t of tokens(a))av.set(t,(av.get(t)||0)+1);for(const t of tokens(b))bv.set(t,(bv.get(t)||0)+1);let dot=0,aa=0,bb=0;for(const [t,v]of av){dot+=v*(bv.get(t)||0);aa+=v*v;}for(const v of bv.values())bb+=v*v;return dot/Math.sqrt(aa*bb||1);}
export function currentMessage(body:string){return body.replace(/^WARNING[^\n]*\n\s*/i,'').split(/\n(?:Best Regards|Best regards|_{5,}|From:)/)[0];}
export function classify(email:Email):Classification {
 const body=currentMessage(email.body), text=body.toLowerCase(), subject=email.subject.toLowerCase();
 const scores=Object.fromEntries(CATEGORIES.map(c=>[c,Math.max(...prototypes[c].map(p=>cosine(body,p)))*2+Math.max(...prototypes[c].map(p=>cosine(subject,p)))*0.3])) as Record<Category,number>;
 const reasons:Record<string,string[]>={};
 const add=(c:Category,w:number,r:string)=>{scores[c]+=w;(reasons[c]??=[]).push(r);};
 if(/\b(shipper|consignee)\s*:/.test(text)&&/shipping instruction|\bsi\b/.test(text)) add('SI_REQUEST',6,'Shipment instructions in the current message; draft requested as a follow-up.');
 if(/(?:prepare|create|need|request).{0,35}(?:shipping instruction|\bsi\b)/s.test(text))add('SI_REQUEST',3,'Intent to prepare new shipping instructions.');
 if(/(?:compare|check|verify|confirm).{0,100}(?:draft|\bbl\b|bill of lading)|(?:draft|\bbl\b).{0,100}(?:checking|confirm|discrepanc)/s.test(text))add('BL_COMPARISON',4,'Current message requests draft BL checking or comparison.');
 if(email.attachments.length>=2)add('BL_COMPARISON',1.4,'Multiple attached documents support comparison intent.');
 if(/query on invoice|cancel invoice|\bgr\b.{0,35}missing|missing.{0,35}invoice|detention charges|demurrage|billed separately/.test(text))add('INVOICE_QUERY',5,'Current message asks for a billing action or charge clarification.');
 if(/berthing report|update summary|outstanding (?:bl|list)|no action required|new year|all pending shipments|office resumes/.test(text))add('GENERAL',5,'Operational announcement, summary, or group reminder.');
 if(/claim.{0,30}(prize|gift)|mailbox.{0,50}(limit|storage)|limited time offer|unpaid customs fee|buy now|verify your account|you have won|business proposal.{0,60}million/.test(text))add('SPAM',5,'Promotional or credential/payment solicitation in the message.');
 const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);const category=ranked[0][0] as Category;
 const margin=ranked[0][1]-ranked[1][1]; const confidence=Math.min(0.98,Math.max(0.4,0.55+margin*0.075));
 return {category,confidence,method:'Local intent ensemble',reasons:reasons[category]||['Nearest curated intent description; limited corroborating evidence.'],needsReview:confidence<0.72};
}
