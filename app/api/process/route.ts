import {session,state,json,checkOrigin,event,corpus} from '@/lib/store';
import {processCorpus} from '@/lib/pipeline';
import {submission,validateSubmission} from '@/lib/reporting';
export async function POST(request: Request) {
  const s = session(request);
  // Consume the payload even when rejecting it so Worker keep-alive connections
  // do not carry an unread request body into the next request.
  await request.text();
  try {
    checkOrigin(request);
  } catch {
    return json({error: 'Cross-origin writes are not allowed.'}, s, request, 403);
  }
  try {
    const start = performance.now();
    const cases = processCorpus(corpus);
    validateSubmission(submission(cases), corpus.emails.map(e => e.email_id));
    const elapsed = Math.round(performance.now() - start);
    await event(s.id, 'Inbox processed', `${cases.length} messages processed; existing human reviews preserved.`, {
      count: cases.length, elapsedMs: elapsed, engine: 'local-intent-v1',
    });
    return json({...await state(s.id), message: `${cases.length} emails processed in ${elapsed} ms. Human reviews preserved.`}, s, request);
  } catch (e) {
    console.error('process', e);
    return json({error: 'Processing failed: ' + (e as Error).message}, s, request, 503);
  }
}
