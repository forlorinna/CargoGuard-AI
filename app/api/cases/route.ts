import {session,state,json} from '@/lib/store';
export async function GET(request:Request){const s=session(request);try{return json(await state(s.id),s,request);}catch(e){console.error('case-load',e);return json({error:'Persistent storage unavailable. Apply migrations or retry shortly.'},s,request,503);}}
