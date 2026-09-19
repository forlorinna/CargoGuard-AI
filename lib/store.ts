import {env} from 'cloudflare:workers';
import corpus from '@/data/corpus.json';
import {processCorpus} from './pipeline';
import type {Case} from './types';
const baseline=processCorpus(corpus);
export function db(){if(!env.DB)throw Error('Persistent storage is unavailable. Check the D1 binding and migrations.');return env.DB;}
export function session(request:Request){const existing=request.headers.get('cookie')?.match(/(?:^|;\s*)cg_session=([a-f0-9-]{36})(?:;|$)/)?.[1];return {id:existing||crypto.randomUUID(),fresh:!existing};}
export function json(data:unknown,s:{id:string;fresh:boolean},request:Request,status=200){const h=new Headers({'Cache-Control':'no-store','Content-Type':'application/json'});if(s.fresh)h.set('Set-Cookie',`cg_session=${s.id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${new URL(request.url).protocol==='https:'?'; Secure':''}`);return new Response(JSON.stringify(data),{status,headers:h});}
export function checkOrigin(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw Error('Cross-origin writes are not allowed.');}
export async function state(id:string){
 const [r,a]=await Promise.all([db().prepare('SELECT email_id, result, revision FROM reviews WHERE session = ?').bind(id).all<{email_id:string;result:string;revision:number}>(),db().prepare('SELECT id, email_id AS emailId, action, actor, note, created_at AS createdAt FROM audit WHERE session = ? ORDER BY created_at DESC LIMIT 200').bind(id).all()]);
 const overrides=new Map(r.results.map(row=>[row.email_id,{...JSON.parse(row.result),revision:row.revision}]));
 return {cases:baseline.map(c=>overrides.get(c.email.email_id)||c) as Case[],audit:a.results,persistent:true};
}
export async function saveCase(id:string,before:Case,after:Case,action:string,actor:string,note:string){
 const now=new Date().toISOString(),auditId=crypto.randomUUID(),revision=(before.revision||0)+1;
 const save=db().prepare('INSERT INTO reviews (session,email_id,result,revision,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(session,email_id) DO UPDATE SET result=excluded.result,revision=excluded.revision,updated_at=excluded.updated_at WHERE reviews.revision = ?').bind(id,before.email.email_id,JSON.stringify({...after,revision}),revision,now,before.revision||0);
 const audit=db().prepare('INSERT INTO audit (id,session,email_id,action,actor,note,details,created_at) SELECT ?,?,?,?,?,?,?,? WHERE changes() = 1').bind(auditId,id,before.email.email_id,action,actor,note,JSON.stringify({before,after:{...after,revision}}),now);
 const result=await db().batch([save,audit]);
 if(!result[0].meta.changes)throw Error('This case changed in another tab. Reload before saving.');
}
export async function event(id:string,action:string,note:string,details:unknown){await db().prepare('INSERT INTO audit (id,session,email_id,action,actor,note,details,created_at) VALUES (?,?,NULL,?,?,?,?,?)').bind(crypto.randomUUID(),id,action,'System',note,JSON.stringify(details),new Date().toISOString()).run();}
export {corpus,baseline};
