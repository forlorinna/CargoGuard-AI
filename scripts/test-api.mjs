import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base=process.env.TEST_URL||'http://localhost:5173';
let cookie='';
async function call(path, body, extra = {}) {
  const r = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: {'Content-Type': 'application/json', ...(cookie ? {Cookie: cookie} : {}), ...extra},
    ...(body ? {body: JSON.stringify(body)} : {}),
  });
  // Cloudflare can refresh its own cookie without resetting the app session.
  // Preserve cookies by name, as a browser does, instead of replacing the jar.
  const pairs = cookie.split('; ').filter(Boolean);
  const jar = new Map(pairs.map(pair => [pair.slice(0, pair.indexOf('=')), pair]));
  for (const header of r.headers.getSetCookie()) {
    const pair = header.split(';')[0];
    jar.set(pair.slice(0, pair.indexOf('=')), pair);
  }
  cookie = [...jar.values()].join('; ');
  const txt = await r.text();
  let data;
  try { data = JSON.parse(txt); } catch { data = {error: txt}; }
  return {status: r.status, data};
}
const checks=[];
const record=(name)=>checks.push({name,passed:true});
assert.equal((await call('/api/health')).status,200);record('API and D1 health');
const initial=await call('/api/cases');assert.equal(initial.data.cases.length,520);assert.equal(initial.data.persistent,true);record('Full inbox and session initialization');
const original=initial.data.cases.find(c=>c.status==='MISMATCH');assert(original);const id=original.email.email_id;
const values=Object.fromEntries(original.comparisons.map(c=>[c.field,{si:c.si.raw,bl:c.bl.raw}]));
const rejected=await call('/api/review',{id,revision:0,decision:'reject',values,reviewer:'API test',note:'Test-only rejection to verify human escalation.'});assert.equal(rejected.status,200);assert.equal(rejected.data.cases.find(c=>c.email.email_id===id).status,'NEEDS_REVIEW');record('Reject result into review and audit');
const bad=await call('/api/review',{id,revision:1,decision:'confirm',values:{},reviewer:'API test',note:'Incomplete values should not finalize.'});assert.equal(bad.status,400);record('Incomplete confirmation rejected');
const stale=await call('/api/review',{id,revision:0,decision:'confirm',values,reviewer:'API test',note:'Stale revision must not overwrite a review.'});assert.equal(stale.status,400);record('Stale revision blocked');
const finalized=await call('/api/review',{id,revision:1,decision:'confirm',values,reviewer:'API test',note:'Confirmed all unchanged values against the original SI and BL.'});assert.equal(finalized.status,200);assert.equal(finalized.data.cases.find(c=>c.email.email_id===id).reviewed,true);record('Finalization recomputes report');
const reload=await call('/api/cases');const saved=reload.data.cases.find(c=>c.email.email_id===id);assert.equal(saved.reviewed,true);assert.deepEqual(saved.defect_fields,original.defect_fields);assert.equal(reload.data.audit.length,2);record('Review and audit persist across reload');
const retry=await call('/api/retry',{id,revision:2});assert.equal(retry.status,400);record('Retry cannot overwrite finalized review');
const forbidden=await call('/api/process',{}, {Origin:'https://unrelated.example'});assert.notEqual(forbidden.status,200);record('Cross-origin mutation blocked');
const processed=await call('/api/process',{});assert.equal(processed.status,200,JSON.stringify(processed.data).slice(0,300));assert.equal(processed.data.cases.find(c=>c.email.email_id===id).reviewed,true);record('Full reprocessing preserves human work');
const sub=await call('/api/submission');assert.equal(Object.keys(sub.data).length,520);assert.deepEqual(Object.keys(sub.data[id]).sort(),['category','defect_fields','has_defect','review_reason','status']);record('API submission exact schema');
cookie='';const isolated=await call('/api/cases');assert.equal(isolated.data.audit.length,0);assert.equal(isolated.data.cases.find(c=>c.email.email_id===id).reviewed,undefined);record('New visitor has isolated persistent workspace');
const missing=isolated.data.cases.find(c=>c.review_reason==='missing_attachment');const cannot=await call('/api/review',{id:missing.email.email_id,revision:0,decision:'confirm',values,reviewer:'API test',note:'Missing evidence cannot be silently finalized.'});assert.equal(cannot.status,400);record('Missing originals prevent finalization');
const ordinaryRetry=await call('/api/retry',{id:missing.email.email_id,revision:0});assert.equal(ordinaryRetry.status,200);record('Unresolved case retry succeeds and remains visible');
await writeFile('exports/api-test-results.json',JSON.stringify({base,checks,passed:checks.length,failed:0},null,2));console.log(JSON.stringify({passed:checks.length,failed:0,checks},null,2));
