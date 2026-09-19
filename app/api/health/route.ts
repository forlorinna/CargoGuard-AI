import {db,baseline} from '@/lib/store';
export async function GET(){try{await db().prepare('SELECT COUNT(*) AS count FROM reviews').first();return Response.json({status:'ok',engine:'local-intent-v1',emails:baseline.length,storage:'D1',schema:1});}catch{return Response.json({status:'unavailable',storage:'D1'},{status:503});}}
