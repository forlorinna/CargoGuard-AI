# Netlify clean-domain proxy

Target: https://cargoguard-shipping.netlify.app

The existing application, backend and D1 database remain at
https://cargoguard-shipping-verify.xiongrunxin.chatgpt.site. Netlify only forwards
requests; it does not build Vinext, host another API, or store participant data.
No Cloudflare deployment is needed for this configuration.

## Build and redeploy

The root `netlify.toml` selects `netlify-proxy` as the base, runs `node build.mjs`,
and publishes `public` relative to that base. The isolated package has no
dependencies or Next.js configuration. The build produces one 37-byte marker;
the forced wildcard HTTP **200 rewrite** shadows it, including at `/`. There is
no substitute frontend. App source, `data/corpus.json`, participant documents,
and the root application's dependencies are not needed or published by Netlify.

1. Use the existing `cargoguard-shipping` Netlify project linked to this repository
   and production branch `main`.
2. Remove the UI-installed **Next.js Runtime**. In the current dashboard this is
   **Project configuration → Developer settings → Build settings → Configure →
   Runtime: Next.js → Remove → Save**. Older dashboards expose it under
   **Build & deploy → Build plugins → @netlify/plugin-nextjs → Disable**.
   The repository's defensive `NETLIFY_NEXT_PLUGIN_SKIP=true` does **not** claim
   to uninstall a UI-enabled plugin.
3. Build settings: base `netlify-proxy`, package directory unset, command
   `node build.mjs`, publish `public` (displayed relative to `netlify-proxy/`).
   The root TOML is authoritative. Do not select a Next.js runtime.
4. After pushing `main`, use **Deploys → Trigger deploy → Clear cache and deploy
   site** (or **Deploy project without cache**, depending on the dashboard).
5. Confirm the build runs only `node build.mjs`, packages `origin-guard`, and
   contains no `@netlify/plugin-nextjs` execution. Then run the checklist below.

Local checks, without installing the application or importing the corpus:

```sh
node netlify-proxy/build.mjs
node --test netlify-proxy/origin-guard.test.mjs
```

If Netlify CLI is installed, `netlify build` can additionally inspect/build this
configuration. Actual Netlify deployment is still needed to validate CDN proxy
headers, edge ordering, browser cookies and runtime assets.

## Origin and session security

A plain rewrite alone is insufficient: a probe with the Netlify Origin was
rejected by the unchanged upstream `checkOrigin()`; an upstream-origin probe
passed the origin check and reached the expected unknown-case validation.

The only Edge Function is a transport guard on **all paths**. It rejects unsafe
methods whose incoming Origin differs from the requested site's origin, as well
as requests marked `Sec-Fetch-Site: cross-site`. For accepted writes it streams
the original request to the fixed upstream with an explicitly translated Origin.
Method, cookies, path, query and body are preserved; Host and Content-Length are
recomputed by fetch. The upstream Response, including status and Set-Cookie, is
returned unchanged. GET/HEAD/OPTIONS continue through the static wildcard proxy.
Missing-Origin non-browser clients retain existing backend semantics. Errors
fail closed; no response caching is enabled on the guard. No permissive CORS
headers or backend security exceptions are added. This tiny transport adapter
contains no application handlers, payload interpretation or storage.

The first live deployment proved that a TOML proxy `headers.Origin` setting alone
did not make same-origin writes pass the upstream check. That setting was removed
in favor of explicit forwarding of validated writes. Without the Edge Function,
the upstream would still reject mismatched browser origins rather than accept
unchecked mutations.

`cg_session` is host-only, `HttpOnly; Secure; SameSite=Strict; Path=/`, with a
30-day lifetime. A browser should store the proxied Set-Cookie for the Netlify
hostname and send it on subsequent same-origin calls. Netlify and the direct
Cloudflare hostname have independent browser cookie jars: pre-existing reviews
on one hostname do not automatically appear on the other. D1 is still the same
database. API responses remain `Cache-Control: no-store`.

The upstream can also send a Cloudflare `__cf_bm` cookie with `Domain=chatgpt.site`;
that cookie is not the application session and is invalid for the Netlify host.
Do not weaken or rewrite CargoGuard's cookie security to accommodate it.

## Paths, assets and limitations

The single `/* → upstream/:splat` forced status-200 rule covers `/api/*`, arbitrary
paths, `/_next/*`, `/assets/*`, `/runtime/*`, `/demo/*` and query strings. An
upstream 404 or API validation error stays an error; the 200 rule does not turn
every upstream response into success. `/api/state` is not a current API route:
the real workspace endpoint is `/api/cases`. Its upstream 404 must also be
preserved. Existing mutation routes use POST; transport tests additionally
exercise PUT/PATCH/DELETE without introducing new API methods.

The application's fetches, source document links, parser/model assets and demo
links are same-origin paths. Initial source/HTML inspection found no hard-coded
upstream navigation URL requiring application changes. OCR runs on the browser,
so the original PDF/image is not uploaded to Netlify; only extracted evidence is
POSTed through the proxy. Upstream dependency and Netlify's proxy timeout remain
operational limits; this is not an independent deployment or a backend migration.

## After-deployment acceptance checklist

- [ ] Homepage and Dashboard load on the Netlify hostname.
- [ ] Smart Inbox opens; search `email_004` and open the result.
- [ ] Verification shows source evidence plus Consignee and Notify Party discrepancies.
- [ ] Human Review loads; save a review and reload to verify persistence.
- [ ] Confirm `cg_session` remains host-only, HttpOnly, Secure and SameSite=Strict.
- [ ] Same-origin POST works; foreign and `null` Origin writes fail.
- [ ] Upload documents loads; OCR/runtime assets return successfully.
- [ ] Process the synthetic `SI-scan.pdf` example and inspect evidence/review status.
- [ ] `/api/health` returns the existing 520-email D1 application health.
- [ ] Reports, audit and submission/export endpoints work.
- [ ] Paths and query strings are preserved; missing upstream routes stay 404.
- [ ] All navigation and source links keep the Netlify hostname in the address bar.

Authoritative platform references:
[rewrites and proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/),
[base directory isolation](https://docs.netlify.com/build/configure-builds/monorepos/),
[edge function ordering](https://docs.netlify.com/build/edge-functions/declarations/),
[fail-closed edge configuration](https://docs.netlify.com/build/edge-functions/optional-configuration/).
