// Transport security only. No CargoGuard API or verification logic lives here.
// GET/HEAD/OPTIONS continue to the ordinary static 200 proxy rule.
const upstream = 'https://cargoguard-shipping-verify.xiongrunxin.chatgpt.site';
export default function originGuard(request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;

  const origin = request.headers.get('origin');
  const crossSite = request.headers.get('sec-fetch-site') === 'cross-site';
  if (crossSite || (origin !== null && origin !== new URL(request.url).origin)) {
    return new Response(JSON.stringify({error: 'Cross-origin writes are not allowed.'}), {
      status: 403,
      headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'},
    });
  }
  // Like the existing backend, allow non-browser clients without Origin.
  // Translate only after validating the original browser Origin. A static
  // proxy header override did not override Origin in the real Netlify test.
  const url = new URL(request.url);
  const target = new URL(upstream);
  target.pathname = url.pathname;
  target.search = url.search;
  const headers = new Headers(request.headers);
  headers.set('Origin', upstream);
  headers.delete('Host');
  headers.delete('Content-Length');
  // Stream the original body; never interpret payloads or reimplement APIs.
  // Manual redirects avoid silently resubmitting writes to another destination.
  return fetch(target, {
    method: request.method, headers, body: request.body, redirect: 'manual',
    duplex: 'half',
  });
}

// A guard failure must NEVER allow an unchecked write.
export const config = {onError: 'fail'};
