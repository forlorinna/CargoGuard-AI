import {FIELDS,type Values,type Comparison} from './types';
export function compare(si:Values,bl:Values):Comparison[]{return FIELDS.map(field=>{
 const siCode=field.startsWith('port_')?si[field].raw.match(/\(([A-Z]{2}[A-Z0-9]{3})\)\s*$/i)?.[1].toUpperCase():undefined;
 const blCode=field.startsWith('port_')?bl[field].raw.match(/\(([A-Z]{2}[A-Z0-9]{3})\)\s*$/i)?.[1].toUpperCase():undefined;
 const conflictingCodes=!!siCode&&!!blCode&&siCode!==blCode;
 return {field,si:si[field],bl:bl[field],status:si[field].normalized===null||bl[field].normalized===null?'NEEDS_REVIEW':si[field].normalized===bl[field].normalized&&!conflictingCodes?'MATCH':'MISMATCH'};
});}
