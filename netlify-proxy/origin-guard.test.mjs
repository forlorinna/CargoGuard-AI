import assert from 'node:assert/strict';
import {test} from 'node:test';
import guard, {config} from './edge-functions/origin-guard.js';

const origin = 'https://cargoguard-shipping.netlify.app';
test('same-origin writes preserve all methods, body, query and session headers', async () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const request = new Request(origin + '/api/documents?a=one%20two&a=%2B', {
      method, body: 'unchanged body',
      headers: {Origin: origin, Cookie: 'cg_session=test-session', 'Content-Type': 'text/plain'},
    });
    assert.equal(guard(request), undefined);
    assert.equal(request.bodyUsed, false);
    assert.equal(await request.text(), 'unchanged body');
    assert.equal(request.headers.get('cookie'), 'cg_session=test-session');
    assert.equal(new URL(request.url).search, '?a=one%20two&a=%2B');
  }
});
test('foreign, null, sibling and upstream origins cannot bypass the guard', () => {
  for (const value of ['https://untrusted.example', 'null', 'https://other.netlify.app',
    'https://cargoguard-shipping-verify.xiongrunxin.chatgpt.site']) {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      assert.equal(guard(new Request(origin + '/api/review', {method, headers: {Origin: value}})).status, 403);
    }
  }
});
test('guard covers arbitrary paths and rejects contradictory browser metadata', () => {
  for (const path of ['/api/review', '/api', '/unanticipated/path', '/']) {
    const r = new Request(origin + path, {method: 'POST', headers: {Origin: origin, 'Sec-Fetch-Site': 'cross-site'}});
    assert.equal(guard(r).status, 403);
  }
});
test('originless non-browser writes retain existing backend semantics', () => {
  assert.equal(guard(new Request(origin + '/api/retry', {method: 'POST'})), undefined);
  assert.equal(guard(new Request(origin + '/api/retry', {method: 'POST', headers: {'Sec-Fetch-Site': 'cross-site'}})).status, 403);
});
test('safe methods pass through without reading the body or inventing API responses', () => {
  for (const method of ['GET', 'HEAD', 'OPTIONS']) {
    assert.equal(guard(new Request(origin + '/runtime/file.wasm?version=1', {method})), undefined);
  }
});
test('security middleware fails closed', () => assert.equal(config.onError, 'fail'));
