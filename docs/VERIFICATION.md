# Verification record

Verified on 19 September 2026. Counts below are observed behavior, not accuracy against private answers.

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
- The official evaluator at port 8080 was unavailable, and Docker was not installed. No official accuracy score has been claimed or generated.
- External LLM and OCR integrations have not been exercised with real provider credentials.
- Public deployment status is supplied separately with the final delivery; a successful local build is not evidence of successful cloud publication.

Before presenting, repeat the demo in `DEMO.md`, check the published app from a judge-accessible connection, and run the official evaluator when its service is available.
