import {session,state,json} from '@/lib/store';
import {submission,validateSubmission} from '@/lib/reporting';
export async function GET(request:Request){const s=session(request);try{const {cases}=await state(s.id);const data=submission(cases);validateSubmission(data,cases.map(c=>c.email.email_id));const response=json(data,s,request);response.headers.set('Content-Disposition','attachment; filename="submission.json"');return response;}catch{return json({error:'Export unavailable; retry after restoring storage.'},s,request,503);}}
