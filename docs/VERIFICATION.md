# Verification record

Verified on 19 September 2026. The official organizer `/submit` endpoint now reports the measured results below; operational counts and automated tests are documented separately.

The same frozen engine is now verified on the public Cloudflare deployment. Homepage, assets, health, all 520 cases, all 250 original attachment hashes, D1 review/audit persistence, and exact submission equivalence passed production checks. See [the deployment record](DEPLOYMENT.md) for browser workflow coverage and limitations.

## Measured official evaluator result

| Returned metric | Result |
|---|---:|
| End-to-end rate | **1.0 (46/46)** |
| Stage-1 Macro-F1 | **1.0** |
| Stage-1 accuracy | **1.0 (520 emails)** |
| Stage-3 Defect-F1 | **1.0** |
| Stage-3 defect precision / recall | **1.0 / 1.0** |
| Stage-3 field F1 / exact-match rate | **1.0 / 1.0** |
| Review escalation precision / recall / F1 | **1.0 / 1.0 / 1.0** |
| Review cases expected / predicted | **20 / 20** |
| Final weighted score | **1.0** |

Both the fresh baseline and reproducibility run returned identical scores for all 520 emails. The evaluator reports 5/5 escalations caught for each review reason. Its Stage-3 denominator is 200 non-review BL-comparison emails, which includes awaiting-document requests; this is not a claim that 200 attachment pairs were verified.

The organizer API was available at `localhost:8080` with `emails: 520` and `scoring_available: true`. All public inbox records and all 250 served attachment hashes matched the participant data. The unchanged organizer application and scoring module were verified against the supplied ZIP. **Docker and WSL were unavailable, so the service ran directly under Python 3.12.14; this is an official-code/API evaluation, not a Docker-container test.** `REVEAL_GT=0`; no judge-only endpoint, reference labels, or generator code was inspected or used by CargoGuard. Only the separate organizer service read its reference data internally to calculate the response.

No classification, extraction, normalization, or comparison changes were needed: the pre-existing baseline reached the maximum legitimate score. Only the evaluation adapter and documentation changed. See [the run log](EVALUATION.md), [baseline response](evaluation/001-baseline-score.json), [repeat response](evaluation/002-reproducibility-score.json), and [organizer provenance](evaluation/organizer-provenance.json). This known-dataset result is not a guarantee for unseen or production data.

After official evaluation, all **15 existing engine tests**, **14 existing API checks**, and TypeScript checking passed again. The evaluation adapter also passed Python compilation and an unavailable-endpoint check: it returned failure, wrote a failed-run record, and left the previous successful official score unchanged. No additional score was inferred from that negative test.

## Automated checks

- 15 engine tests passed: normalization, label variants, classification context, source types, evidence, discrepancies, uncertainty, review validation, and complete submission schema.
- TypeScript `tsc --noEmit` passed after the final API change.
- Production build completed successfully using Node 22.18.0 x64 and Vinext/Vite.
- 14 integration checks passed against the built Worker with local D1 at `http://127.0.0.1:8787`, using Miniflare directly. The same suite previously passed in development mode. Results are in `exports/api-test-results.json`.
- Tested rejection, confirmation, persistence across reload, audit records, stale-revision protection, prevention of automatic overwrite of a finalized review, reprocessing, exact submission export, isolated visitor state, missing-source guards, and retry.
- The processing endpoint consumes its request body before returning, including forbidden requests. This addresses a reproducible local Worker keep-alive failure after an early rejection. The built integration sequence passed after this change.

## Dataset and integrity

- All 520 inbox records and 250 referenced attachments processed: 192 TXT, 28 PDF, 22 XLSX, 8 DOCX.
- Every copied original attachment is byte-identical to its source ZIP entry. See `exports/source-integrity.json`.
- Original archives and documents were not modified. Private/reference answers and generator code were not read or used.
- Machine results: 63 matching pairs, 46 discrepant pairs, 91 awaiting-document requests, 20 review cases, and 300 messages in other categories.
- Each of the four official review reasons occurred five times. Unreadable/missing evidence remains unresolved rather than invented.
- The generated submission contains all 520 IDs with exactly the five official fields per record.

## Browser observations

- Dashboard loaded real corpus counts and processing results.
- Verification opened a real discrepant case (`email_004`), highlighting only consignee and notify party.
- Selecting the consignee comparison revealed both raw values and source-line evidence.
- Mobile viewport around 413 px rendered the responsive layout; desktop geometry at 1440 px had no page-level horizontal overflow. The comparison table intentionally scrolls within its panel on narrow screens.
- Human-review persistence and every major mutation were verified through the API. A complete form-clicking browser test was not completed after the app's browser automation connection became unavailable.

## Environment limitations

- Standard Wrangler preview could no longer start after the session changed to a restricted filesystem profile: its resolver tried to enumerate a denied parent directory. Direct Miniflare execution of the already-built modules allowed the production API suite to complete within the permitted workspace.
- The initial evaluator-unavailable blocker was resolved by running the unmodified organizer service natively. Docker remains uninstalled; measured scores are recorded above, with the runtime limitation stated explicitly.
- External LLM and OCR integrations have not been exercised with real provider credentials.
- Public deployment status is supplied separately with the final delivery; a successful local build is not evidence of successful cloud publication.

Before presenting, repeat the demo in `DEMO.md`, check the published app from a judge-accessible connection, and run the official evaluator when its service is available.

## GitHub readiness recheck — 19 September 2026

The current source was checked again before pushing to `forlorinna/CargoGuard-AI`:

- All 15 engine tests passed with the locally imported official participant corpus.
- TypeScript checking and a fresh production build passed.
- Local D1 migration checking reported no outstanding migrations.
- The built Worker ran successfully through standard Wrangler preview on port 5173; the earlier restricted-environment resolver issue did not recur.
- All 14 API integration checks passed against that running production build, including durable review, audit history, reprocessing, export, and visitor isolation.
- The frontend returned HTTP 200 and contained CargoGuard markup. All six referenced JavaScript/CSS assets returned HTTP 200, as did an original SI document. This was an HTTP smoke check, not a new browser-interaction test.
- The source tree contains no tracked participant corpus, attachment copies, generated exports, dataset ZIPs, dependency folders, virtual environments, build output, or real environment-value files. `.env.example` contains empty values only. A scan for common credential patterns found no matches in the tracked source.

The README covers the architecture, AI components, fresh-clone data import, setup, deployment, and official evaluation workflow. Local data and generated reports remain ignored. The later official evaluation above supersedes the initial absence of a measured score; external-provider limitations remain unchanged.
