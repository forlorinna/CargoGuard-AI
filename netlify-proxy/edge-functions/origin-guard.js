// Transport security only. No CargoGuard API or verification logic lives here.
// Netlify runs this before the static proxy rule translates the Origin header.
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
  // Leave method, URL/query, body, Cookie and other headers untouched.
}

// A guard failure must NEVER fall through to the Origin-translating proxy.
export const config = {onError: 'fail'};
