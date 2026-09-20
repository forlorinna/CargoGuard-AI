'use client';
import {useEffect,useState} from 'react';
import {Upload,RefreshCw,Download,FileText,ShieldCheck,AlertTriangle,CheckCheck} from 'lucide-react';
import {FIELDS,LABELS,type Field} from '@/lib/types';
import type {UploadCase} from './model';
import './documents.css';

type Audit={id:string;emailId:string;action:string;actor:string;note:string;createdAt:string};
type Values=Record<Field,{si:string;bl:string}>;
type WorkspaceResponse={cases:UploadCase[];audit:Audit[];selectedId?:string;error?:string};
function downloadReport(active:UploadCase,audit:Audit[]){
  const url=URL.createObjectURL(new Blob([JSON.stringify({kind:'Uploaded document verification — not an official evaluator submission',case:active,audit:audit.filter(a=>a.emailId===active.email.email_id)},null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='cargoguard-document-report.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function UploadWorkspace(){
  const [files,setFiles]=useState<[File|null,File|null]>([null,null]),[urls,setUrls]=useState<string[]>([]);
  const [sourceHashes,setSourceHashes]=useState<string[]>([]);
  const [cases,setCases]=useState<UploadCase[]>([]),[audit,setAudit]=useState<Audit[]>([]),[selected,setSelected]=useState('');
  const [busy,setBusy]=useState('Loading document workspace'),[error,setError]=useState(''),[editing,setEditing]=useState(false);
  const [reviewer,setReviewer]=useState(''),[note,setNote]=useState(''),[confirmed,setConfirmed]=useState(false),[values,setValues]=useState<Values>({} as Values);
  const active=cases.find(c=>c.email.email_id===selected)||cases[0];
  async function load(){setBusy('Loading document workspace');setError('');try{const r=await fetch('/api/documents');const d=await r.json() as WorkspaceResponse;if(!r.ok)throw Error(d.error||'Document workspace unavailable.');setCases(d.cases);setAudit(d.audit);}catch(e){setError((e as Error).message);}finally{setBusy('');}}
  useEffect(()=>{void load();},[]);
  useEffect(()=>{const current=files.map(f=>f?URL.createObjectURL(f):'');setUrls(current);setSourceHashes([]);return()=>current.forEach(u=>{if(u)URL.revokeObjectURL(u);});},[files]);
  async function send(payload:unknown){const r=await fetch('/api/documents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await r.json() as WorkspaceResponse;if(!r.ok)throw Error(d.error||'Document operation failed.');setCases(d.cases);setAudit(d.audit);setSelected(d.selectedId||'');setEditing(false);}
  async function processPair(pair=files){
    if(!pair[0]||!pair[1]){setError('Choose both an SI and a draft BL.');return;}
    setError('');setBusy('Preparing document extraction');
    try{const {parseFile}=await import('./browser');const documents=[];for(const f of pair)documents.push(await parseFile(f!,setBusy));setSourceHashes(documents.map(d=>d.sha256));setBusy('Verifying seven fields and saving evidence');await send({action:'compare',documents});}
    catch(e){setError((e as Error).message);}finally{setBusy('');}
  }
  async function sample(scanned=false){
    setBusy('Loading synthetic example documents');setError('');
    try{const paths=scanned?['SI-scan.pdf','BL-table.docx']:['SI-text.pdf','BL-table.docx'];
      const pair=await Promise.all(paths.map(async name=>{const r=await fetch('/demo/'+name);if(!r.ok)throw Error('Example document is unavailable.');return new File([await r.blob()],name);}));
      setFiles(pair as [File,File]);await processPair(pair as [File,File]);
    }catch(e){setError((e as Error).message);setBusy('');}
  }
  function begin(){if(!active)return;setValues(Object.fromEntries(active.comparisons.map(c=>[c.field,{si:c.si.raw,bl:c.bl.raw}])) as Values);setNote('');setConfirmed(false);setEditing(true);}
  async function action(kind:'retry'|'confirm'|'reject'){
    if(!active)return;setBusy(kind==='retry'?'Rechecking saved source text':'Saving human review');setError('');
    try{await send({action:kind==='retry'?'retry':'review',id:active.email.email_id,revision:active.revision,decision:kind,values,reviewer,note,sourceConfirmed:confirmed});}
    catch(e){setError((e as Error).message);}finally{setBusy('');}
  }
  return <div className="upload-workspace">
    <section className="panel upload-intro"><div><h2>Upload Shipping Documents</h2><p>Choose a Shipping Instruction and draft Bill of Lading. Inspect extracted evidence, compare seven fields, and review any uncertainty.</p></div>
      <p className="upload-privacy">Use synthetic demo documents. Parsing and English OCR run on your device. Extracted text and review history are saved to your isolated cloud session; original files stay on your device. Keep the originals for review.</p>
      <div className="upload-inputs">{(['Shipping Instruction (SI)','Draft Bill of Lading (BL)'] as const).map((label,i)=><label key={label}><FileText size={18}/>{label}<input type="file" aria-label={label} accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" disabled={!!busy} onChange={e=>{const next=[...files] as [File|null,File|null];next[i]=e.target.files?.[0]||null;setFiles(next);setError('');}}/>{files[i]&&<small>{files[i]!.name}</small>}</label>)}</div>
      <p className="upload-limits">Up to 8 MB per file · PDF, DOCX, TXT, PNG, JPEG · PDF: 10 pages, at most 4 OCR pages · English printed text · 10 saved pairs per session</p>
      <div className="upload-actions"><button className="primary" disabled={!!busy||!files[0]||!files[1]} onClick={()=>processPair()}><Upload size={16}/> Extract & verify</button><button className="secondary" disabled={!!busy} onClick={()=>sample()}>Try PDF + Word example</button><button className="secondary" disabled={!!busy} onClick={()=>sample(true)}>Try scanned PDF example</button></div>
    </section>
    {busy&&<div className="banner" role="status"><RefreshCw size={16} className="spin"/>{busy}…</div>}
    {error&&<div className="banner error" role="alert"><AlertTriangle size={18}/><span>{error}</span><button onClick={load} disabled={!!busy}>Reload saved pairs</button></div>}
    {cases.length>0&&<label className="upload-history">Saved pairs<select aria-label="Saved document pairs" value={active?.email.email_id||''} disabled={!!busy} onChange={e=>{setSelected(e.target.value);setEditing(false);}}>{cases.map(c=><option key={c.email.email_id} value={c.email.email_id}>{c.documents.map(d=>d.name).join(' ↔ ')} · {c.email.email_id.slice(-6)} · {c.operationalStatus}</option>)}</select></label>}
    {active&&<>
      <section className="panel upload-result"><div className="panel-heading"><div><h2>{active.reviewed?'Human-confirmed verification':active.status==='NEEDS_REVIEW'?'Human review required':active.has_defect?'Discrepancies detected':'No mismatch detected'}</h2><p>{active.explanation}</p><small>Seven-field deterministic verification · separate from the 520-email official submission</small></div><ShieldCheck size={24}/></div>
        <div className="upload-actions"><button className="primary" disabled={!!busy} onClick={begin}>Review & correct</button><button className="secondary" disabled={!!busy||active.reviewed} onClick={()=>action('retry')}><RefreshCw size={15}/> Retry saved extraction</button><button className="secondary" onClick={()=>downloadReport(active,audit)}><Download size={15}/> Export document report</button></div>
        {active.review_reason&&<p className="upload-reason">Review reason: {active.review_reason.replaceAll('_',' ')}. Field-level differences below are provisional until the case is resolved.</p>}
        <div className="table-scroll"><table className="upload-table"><thead><tr><th>Field</th><th>SI · reference</th><th>BL · draft</th><th>Result</th></tr></thead><tbody>{active.comparisons.map(c=><tr key={c.field}><td>{LABELS[c.field]}</td>{(['si','bl'] as const).map(side=><td key={side}><span>{c[side].raw||'Not extracted'}</span><details><summary>Evidence & reliability</summary><p>{c[side].location}</p><pre>{c[side].evidence||'No source evidence'}</pre><p>Normalized: {String(c[side].normalized??'Unresolved')}</p><p>{c[side].issue||'Label and value parsed; no statistical accuracy probability is claimed.'}</p></details></td>)}<td>{active.status==='NEEDS_REVIEW'?'Provisional · ':''}{c.status.replaceAll('_',' ')}</td></tr>)}</tbody></table></div>
      </section>
      <div className="documents-grid">{active.documents.map((d,i)=><section className="panel document" key={d.path}><div className="panel-heading"><div><h3>{d.name}</h3><p>{d.method} · {d.reliability}</p></div>{sourceHashes[i]===d.sha256&&urls[i]&&<a className="text-button" href={urls[i]} target="_blank" rel="noreferrer">Original on device</a>}</div>{d.ocrConfidence!==null&&<p className="upload-reason">OCR recognition score: {d.ocrConfidence}/100. This is the OCR engine’s signal, not a calibrated probability or permission to finalize.</p>}{d.error&&<div className="outcome needs_review">{d.error}</div>}<details className="upload-source"><summary>Show extracted source text</summary><pre>{d.text||'No readable text. Supply a readable replacement and extract again.'}</pre></details><div className="document-hash">Device-computed SHA-256 · {d.sha256}</div></section>)}</div>
      {editing&&<section className="panel review-form"><div className="panel-heading"><div><h2>Confirm against the originals</h2><p>Correct only values you can read in the source. Missing or unrecognized document types cannot be finalized.</p></div></div><div className="review-fields">{FIELDS.map(f=><div key={f}><label>{LABELS[f]}</label>{(['si','bl'] as const).map(side=><input key={side} aria-label={`Upload ${side.toUpperCase()} ${LABELS[f]}`} value={values[f]?.[side]||''} onChange={e=>setValues({...values,[f]:{...values[f],[side]:e.target.value}})}/>)}</div>)}</div><div className="review-notes"><label>Reviewer name<input value={reviewer} onChange={e=>setReviewer(e.target.value)} maxLength={100}/></label><label>Evidence note<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={2000}/></label></div><label className="source-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I checked all seven fields against the original SI and BL.</label><div className="review-buttons"><button className="secondary" disabled={!!busy} onClick={()=>action('reject')}>Keep in review</button><button className="primary" disabled={!!busy||!confirmed} onClick={()=>action('confirm')}><CheckCheck size={16}/> Confirm & finalize</button></div></section>}
      <section className="panel upload-audit"><div className="panel-heading"><h2>Document audit trail</h2></div>{audit.map(a=><div className="audit-row" key={a.id}><div><strong>{a.action}</strong><p>{a.note}</p><small>{a.actor} · {new Date(a.createdAt).toLocaleString()}</small></div></div>)}</section>
    </>}
  </div>;
}
