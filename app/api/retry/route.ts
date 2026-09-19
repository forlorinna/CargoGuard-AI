import {env} from 'cloudflare:workers';
import {session,state,json,checkOrigin,saveCase,corpus} from '@/lib/store';
import {processEmail} from '@/lib/pipeline';
import {classify} from '@/lib/classification';
import {assistClassification,type AIConfig} from '@/lib/ai';
export async function POST(request:Request){const s=session(request);try{checkOrigin(request);const input=await request.json() as {id:string;revision:number};const before=(await state(s.id)).cases.find(c=>c.email.email_id===input.id);if(!before)throw Error('Unknown case.');if(input.revision!==(before.revision||0))throw Error('Case changed. Reload before retrying.');if(before.reviewed)throw Error('This case has a finalized human review. Reopen Review case to amend it; automated retry cannot overwrite it.');const classification=await assistClassification(before.email,classify(before.email),env as AIConfig);const after=processEmail(before.email,corpus,classification);await saveCase(s.id,before,after,'Processing retried','System',after.explanation);return json({...await state(s.id),message:'Case reprocessed. Evidence and outcome refreshed.'},s,request);}catch(e){return json({error:(e as Error).message},s,request,400);}}
