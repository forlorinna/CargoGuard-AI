import type {Field} from './types';
export function missing(value:string) {return !value.trim() || /\?{2,}|_{2,}|\b(tba|tbd|unknown|not available|pending|n\/a)\b/i.test(value);}
function number(value:string):number|null {
  let s=value.trim();
  if(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s=s.replace(/,/g,'');
  else if(/^\d{1,3}(\.\d{3})+,\d+$/.test(s)) s=s.replace(/\./g,'').replace(',','.');
  else if(/^\d{1,3}( \d{3})+(\.\d+)?$/.test(s)) s=s.replace(/ /g,'');
  else if(!/^\d+(\.\d+)?$/.test(s)) return null;
  const n=Number(s); return Number.isFinite(n)?n:null;
}
export function normalize(field:Field,raw:string):string|number|null {
  if(missing(raw)) return null;
  let text=raw.normalize('NFKC').trim().toUpperCase();
  if(field==='container_count') {
    const m=text.match(/^(\d+(?:,\d{3})*)(?:\s*[X×]\s*\d+(?:['’])?\s*[A-Z]+|\s*(?:CONTAINERS?|UNITS?))?\s*$/);
    if(!m) return null; const n=number(m[1]); return n!==null&&Number.isInteger(n)&&n>0?n:null;
  }
  if(field==='gross_weight_kg') {
    const m=text.match(/^([\d., ]+)\s*(KG|KGS|KILOGRAMS?|MT|MTS|METRIC TONNES?|TONNES?|T|LBS?|POUNDS?)?\s*$/);
    if(!m)return null; const n=number(m[1]); if(n===null||n<=0)return null;
    const unit=m[2]||'KG'; return Math.round(n*(/^(MT|MTS|METRIC|TONNE|T$)/.test(unit)?1000:/^(LB|POUND)/.test(unit)?0.45359237:1)*1000)/1000;
  }
  if(field.startsWith('port_')) {
    // Strip an optional UN/LOCODE only when a readable port name is also present.
    text=text.replace(/\s*\([A-Z]{2}[A-Z0-9]{3}\)\s*$/,'').replace(/\bUNITED STATES(?: OF AMERICA)?\b/g,'USA').replace(/\bUAE\b/g,'UNITED ARAB EMIRATES');
  }
  // Preserve every name/address token and digit. Never fuzzy-match two companies.
  return text.replace(/\bP\s*\.\s*O\s*\./g,'PO').replace(/&/g,' AND ').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
}
