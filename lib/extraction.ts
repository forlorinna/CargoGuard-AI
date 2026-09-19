import {FIELDS,type Field,type SourceDocument,type Values} from './types';
import {normalize} from './normalization';
export function fieldLabel(label:string):Field|null {
  const s=label.toLowerCase().replace(/[\u3400-\u9fff]/g,'').trim().replace(/^total\s+(?=gross)/,'');
  if(/^(shipper|exporter)(?:\b|\/)/.test(s))return 'shipper';
  if(/^(consignee|to the order of)\b/.test(s))return 'consignee';
  if(/^notify\b/.test(s))return 'notify_party';
  if(/^(port of loading|load port|pol)\b/.test(s))return 'port_of_loading';
  if(/^(port of discharge|discharge port|pod)\b/.test(s))return 'port_of_discharge';
  if(/^(container count|total containers|number of containers|no\.? of containers)\b/.test(s))return 'container_count';
  if(/^gross\s*(weight|wt)\b/.test(s))return 'gross_weight_kg';
  return null;
}
export function docType(doc:SourceDocument):'SI'|'BL'|'OTHER'|'UNKNOWN' {
  const heading=doc.text.slice(0,250).toUpperCase();
  if(/COMMERCIAL INVOICE|PACKING LIST|CERTIFICATE OF ORIGIN/.test(heading))return 'OTHER';
  if(/SHIPPING INSTRUCTION|BL INSTRUCTION|BILL OF LADING INSTRUCTION/.test(heading))return 'SI';
  if(/BILL OF LADING|DRAFT B\/?L/.test(heading))return 'BL';
  return 'UNKNOWN';
}
export function extract(doc?:SourceDocument):Values {
  const result=Object.fromEntries(FIELDS.map(f=>[f,{raw:'',normalized:null,evidence:'',location:'No source evidence',confidence:0,issue:'Required value not found'}])) as Values;
  if(!doc)return result;
  for(const segment of doc.segments) {
    const lines=segment.text.split(/\r?\n/); let active:Field|null=null; let values:string[]=[]; let evidence:string[]=[]; let start=0;
    function flush(){
      if(!active)return;
      const raw=values.join('\n').trim(); const normalized=normalize(active,raw);
      const prev=result[active];
      if(prev.raw && prev.normalized!==normalized) {
        result[active]={...prev,normalized:null,confidence:0,issue:'Conflicting repeated values; confirm source',evidence:prev.evidence+'\n'+evidence.join('\n')};
      } else result[active]={raw,normalized,evidence:evidence.join('\n'),location:`${segment.location} · line ${start+1}`,confidence:normalized===null?0:0.98,...(normalized===null?{issue:'Missing, placeholder, or ambiguous value'}:{})};
      active=null; values=[]; evidence=[];
    }
    for(let i=0;i<lines.length;i++) {
      const line=lines[i], clean=line.trim();
      const split=clean.indexOf(':');
      const label=split>=0?clean.slice(0,split):clean;
      let key=fieldLabel(label);
      // In PDF container tables, a standalone gross-weight column is not the total.
      if(key==='gross_weight_kg' && doc.format==='PDF' && !/^TOTAL\b/i.test(clean) && split<0){flush();continue;}
      if(key){flush();active=key;start=i;evidence=[line];if(split>=0)values=[clean.slice(split+1).trim()];continue;}
      if(/^(vessel|ocean vessel|export carrier|voy|commodity|description|kinds of packages|hs\b|h\.s\.|booking|b\/l|bill of lading|oc no|freight|container no|net weight|order no)/i.test(clean)){flush();continue;}
      if(active&&clean){values.push(clean);evidence.push(line);}
    }
    flush();
  }
  return result;
}
