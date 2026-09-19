import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir} from 'node:fs/promises';

const base = process.env.TEST_URL;
assert(base && new URL(base).protocol === 'https:', 'Set TEST_URL to the public HTTPS deployment.');
const expected = JSON.parse(await readFile('exports/submission.json', 'utf8'));
const corpus = JSON.parse(await readFile('data/corpus.json', 'utf8'));
const get = async path => {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, `HTTP failure: ${path}`);
  return response;
};
const html = await (await get('/')).text();
assert(html.includes('CargoGuard'));
const assetPaths = [...new Set([...html.matchAll(/(?:src|href)="([^"<>]+\.(?:js|css))"/g)].map(m => m[1]))];
assert(assetPaths.length > 0, 'No frontend assets discovered.');
for (const path of assetPaths) {
  assert.equal(new URL(path, base).origin, new URL(base).origin);
  await get(path);
}
const health = await (await get('/api/health')).json();
assert.equal(health.status, 'ok');
assert.equal(health.storage, 'D1');
assert.equal(health.emails, corpus.emails.length);
const state = await (await get('/api/cases')).json();
assert.equal(state.persistent, true);
assert.equal(state.cases.length, corpus.emails.length);
const productionSubmission = await (await get('/api/submission')).json();
assert.deepEqual(productionSubmission, expected, 'Production differs from the frozen evaluated submission.');
const documents = Object.values(corpus.documents);
let next = 0;
await Promise.all(Array.from({length: 8}, async () => {
  while (next < documents.length) {
    const document = documents[next++];
    const bytes = Buffer.from(await (await get('/documents/' + encodeURIComponent(document.name))).arrayBuffer());
    assert.equal(createHash('sha256').update(bytes).digest('hex'), document.sha256, document.name);
  }
}));
const report = {
  checkedAt: new Date().toISOString(), base, homepageStatus: 200,
  frontendAssetsChecked: assetPaths.length, health, emails: state.cases.length,
  originalAttachmentsVerified: documents.length, submissionMatchesFrozenBaseline: true,
  baselineSubmissionSha256: createHash('sha256').update(await readFile('exports/submission.json')).digest('hex'),
  dataStorage: 'Demo corpus is bundled in the Worker; D1 persists session review overrides and audit events.',
};
await mkdir('exports', {recursive: true});
await writeFile('exports/production-smoke-results.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
