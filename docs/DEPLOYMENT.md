# Frozen-scoring production deployment

**Current release: version 3**, the final competition branding pass, deployed successfully on 20 September 2026 (Asia/Shanghai). It preserves the public URL, D1 binding, complete demo data, and frozen evaluated engine. The new release passed all 14 API checks and full production smoke checks. Its [integrity record](deployment/branding-v3-integrity.json), [smoke results](deployment/branding-v3-smoke-results.json), and [API results](deployment/branding-v3-api-results.json) supplement the original version 2 evidence below without overwriting it. See [all branding changes and retention decisions](BRANDING.md).

Public HTTPS application: https://cargoguard-shipping-verify.xiongrunxin.chatgpt.site

Health endpoint: https://cargoguard-shipping-verify.xiongrunxin.chatgpt.site/api/health

Publication succeeded on 19 September 2026 through the authenticated Sites integration, using Cloudflare Workers, Worker assets, and Cloudflare D1. Public access was verified. The application does not require an API key; production runtime environment entries were empty. The package contains the intended synthetic participant data and no private evaluator files, credentials, or secret environment files.

## Frozen engine

No classification, extraction, normalization, comparison, reporting, review-validation, or scoring logic changed. Every `lib/*.ts` fingerprint still matches the official baseline record. Production's unreviewed `/api/submission` response equals the complete officially evaluated submission, field for field, for all 520 emails. The baseline submission SHA-256 is `b0fac824010298e6bfa3b231c0490452916e50f47bc2df76df249321d659333c`.

Changes made during this deployment task were limited to verification scripts and documentation. The API test client was corrected to preserve its session cookie when Cloudflare adds or refreshes a separate infrastructure cookie; this was a test-harness issue, not an application or engine change.

## Public checks

| Check | Observed result |
|---|---|
| Homepage | HTTP 200; CargoGuard dashboard renders |
| Frontend assets | All six referenced JavaScript/CSS assets return HTTP 200 |
| `/api/health` | `status: ok`, `emails: 520`, `storage: D1`, `schema: 1` |
| Demo inbox | All 520 cases present |
| Original attachments | All 250 downloaded from production and SHA-256 matched against participant sources |
| Submission/export API | Complete 520-record output equals the frozen evaluated baseline |
| Production API integration suite | All 14 checks passed |
| Reviewer persistence | Confirmed review and audit entry survive a full browser reload |
| Visitor isolation | A new visitor sees baseline results and no other visitor's audit entries |

Machine-readable records: [production smoke results](deployment/production-smoke-results.json) and [production API results](deployment/production-api-test-results.json). These files contain check outcomes, not session cookies or copied participant records.

## Browser workflow checks

- Dashboard displayed 520 messages, 220 BL comparisons, 109 verified pairs, 46 discrepancies, 91 awaiting-document requests, and 20 review cases.
- Smart Inbox rendered the mixed categories; category filtering and search narrowed to a real participant case.
- Verification displayed all seven SI/BL fields and the two genuine differences in case 004. Opening source evidence displayed source line references and both original documents.
- Human review confirmed the unchanged evidence-backed values in a test visitor session. Reports showed the resulting audit event, which persisted after a full reload.
- The Human Review Queue displayed all 20 unresolved cases; opening a wrong-document-type case retained its reason and did not assert invented defects.
- Reports displayed the official submission and discrepancy report controls. Clicking the JSON export produced no browser-console error, but the embedded browser did not emit a download-completion event. Browser download completion is therefore **not claimed as verified**. The public export API and its complete JSON contents were independently verified.
- The Processing view displayed the local engine and live D1 status. Its Process inbox action completed for all 520 emails in the browser; the production API suite also verified that reprocessing preserves finalized human work.

## What is stored in production

The intended demo consists of 520 synthetic participant emails and 250 source documents bundled with the Worker/static assets. It is **not a table of 520 seeded email rows in D1**. D1 contains the migrated `reviews` and `audit` tables, storing per-session corrections and event history. Real production writes, reads, revision conflicts, and session isolation were tested through the API and browser. This preserves the existing architecture without modifying the frozen engine or duplicating the corpus in the database.

Test reviews are restricted to their own synthetic demo sessions. Reviewer names remain self-declared; this is not an authenticated customer-document production system. The organizer evaluator and its private data remain local and separate from the deployed app.

## Deployment provenance

- Site: `appgprj_6aad63adc6d88191883ce49326d38a93`
- Saved version: `appgprj_6aad63adc6d88191883ce49326d38a93~appgver_a68c63127270819187ad15308f6282c3` (version 2)
- Deployment: `appgdep_6aae82a4ce8c8191993988722840266a`
- Native deployment status: `succeeded`
- Deployed source revision: `63165453811f351d6fe709fa63ad9110f175b2c7`
- Its source tree matches the frozen application revision `0f985ed289d88c5130751533d9faad6efa0f4e01`. A separate deployment-history branch preserves the managed hosting repository's ancestry; GitHub `main` retains its clean source-only history.
- D1 logical binding: `DB`; migration: `0000_graceful_nomad.sql`.

To repeat the checks from PowerShell after local participant ingestion:

```powershell
$env:TEST_URL = 'https://cargoguard-shipping-verify.xiongrunxin.chatgpt.site'
npm run test:production
npm run test:api
```

The first command is read-only. The API suite creates isolated synthetic test sessions and records their review/audit events. Neither test changes the frozen engine or accesses private evaluator data.
