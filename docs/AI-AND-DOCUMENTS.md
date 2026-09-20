# CargoGuard: AI, extraction, and reliability

**AI where interpretation is needed. Deterministic verification where accuracy and auditability are required.**

## What actually runs

| Component | Implementation | AI/ML status | Reliability boundary |
|---|---|---|---|
| Official email routing | Token-count cosine similarity to curated intent descriptions, plus explicit action/document signals | Lexical vector-space inference and rules; no learned embeddings, trained classifier, or LLM | Margin-derived heuristic routing signal, not calibrated probability |
| Uploaded scan recognition | Tesseract.js 7, WebAssembly Tesseract core, English LSTM trained model | **Active learned neural OCR**, running in a browser worker | Every OCR-derived document remains review-required, regardless of recognition score |
| Text PDF parsing | PDF.js text layer; pages with little text are rendered for OCR | Deterministic parsing, then learned OCR only when needed | Page labels retained; failures and incomplete extraction do not become verified results |
| Word parsing | Mammoth raw-text extraction, including paragraphs and table cells | Deterministic | Reading-order text retained; unsupported content flags human review; no HTML from documents is rendered |
| Document role / fields | Existing heading detection and label/synonym extraction | Deterministic | SI and BL must be recognized; required fields need evidence |
| Normalization / comparison | Existing entity-preserving string normalization, units, numeric checks, seven-field comparison | Deterministic | Ambiguity is unresolved, never guessed; SI is the reference |
| Optional classification assistant | Existing HTTPS chat-completions adapter on uncertain Retry | LLM integration **implemented but unconfigured and not verified with a provider** | Exact body quote, allowed category, bounded confidence and timeout checks; failure retains local routing |
| Human review | Existing `applyReview`, plus explicit source-confirmation requirement for uploads | Human judgment, not AI | All seven normalized values required; source types checked; corrections and before/after evidence audited |

The learned OCR component materially extends real document ingestion without changing official email decisions. It does not synthesize shipment facts or modify the 520-email baseline. The official 1.0/1.0 result was achieved by the frozen local engine, **not by the new OCR workflow**. Whether this satisfies the competition's “AI as a key component” criterion is a judging decision; the implementation and demonstration evidence are stated without guaranteeing points.

## Actual confidence signals

The frozen classifier maps the winning-score margin into a heuristic signal between 0.4 and 0.98; below 0.72 it marks routing uncertain. The UI describes it as a signal out of 100, not a success probability. Human-confirmed routing is labeled by its method.

The frozen label extractor assigns 0.98 to a successfully normalized field and zero when unresolved. This is a deterministic completeness flag, not statistical extraction accuracy. The upload UI instead shows the actual issue, source snippet, location, normalized value, and document reliability state. OCR confidence is the real Tesseract recognition score, averaged over OCR pages; it is explicitly uncalibrated and never bypasses review. Human confirmation does not erase the original OCR warning or source text.

## Two independent input paths

**Official participant path:** Python CLI uses pypdf, python-docx, and openpyxl to ingest participant inbox/attachments. The frozen corpus is bundled into the Worker. It includes 28 PDFs and 8 DOCX files, plus TXT/XLSX. Existing image-only/unreadable cases keep their evaluated NEEDS_REVIEW outcomes. The original CLI's optional OCR command remains unchanged and is not silently enabled.

**Uploaded-document path:** The browser accepts one SI and one BL, checks file signatures and limits, parses PDF/DOCX/TXT, and runs English OCR for scanned PDF pages or PNG/JPEG images. PDF rendering and OCR use local browser workers. Parser/model assets are served from the same CargoGuard origin, copied from locked packages during `prebuild`/`predev`; no third-party OCR or generative API receives documents.

The browser sends only bounded extracted text, source locations, method, OCR signal, filename, and a device-computed file hash to `/api/documents`. The Worker validates the payload, creates an `upload_` case, and invokes the unchanged pipeline. D1 stores this case and its audit trail through the existing storage primitives. Original bytes are not uploaded, retained in D1, or stored in R2. Source hashes establish which device file was parsed; the server cannot independently authenticate client-supplied text against bytes it never receives. This is a transparent synthetic-data demonstration, not a signed document-ingestion service.

Uploaded cases have their own workspace and report. They never enter the official submission. Retry rechecks saved extraction; replacement documents must be selected and extracted as a new pair. Finalized human work is protected from Retry. D1 retains saved evidence after reload, while local original-file preview links disappear when the files are no longer held by the page.

## Limits and fail-safe behavior

- 8 MB per file; PDF up to 10 pages and 4 OCR pages; images up to 16 megapixels, rendered at no more than 6 megapixels for OCR.
- Word archive expansion is bounded before parsing (500 entries, 16 MB expanded data). Encrypted/invalid archives are rejected. Legacy `.doc` is not supported.
- At most 80,000 text characters per document and a 240 KB API request. OCR initialization and recognition have timeouts; text-layer PDF loading has a timeout.
- Printed English is the supported OCR scope. Handwriting, multilingual scans, complex multi-column layouts, rotated/low-resolution images, and damaged files can fail or misread. No claim of general document-understanding accuracy is made.
- OCR and parser warnings force review. A failed or incomplete parse drops partial text and cannot report an automatic verified match. Missing evidence cannot be filled by a language model.
- Review requires a reviewer name, an evidence note, explicit confirmation against originals, complete normalized values, and recognized SI/BL sources. Reviewer names remain self-declared.
- Ten saved pairs per demo session; no organization authentication, global abuse rate limiting, automatic retention expiry, or durable original-file storage is implemented. The per-session limit is not a global storage quota or protection against concurrent/multiple-session abuse. Use synthetic inputs only.
- Existing original-inbox review behavior remains byte-for-byte frozen; the new upload guard applies only to uploaded pairs.

## Reproducible demonstration

`public/demo/` contains four small original synthetic documents generated by `scripts/create-demo-documents.py`, independent of organizer data. The PDF/Word pair has one genuine consignee difference. The scanned PDF contains **no text layer**, so the example must execute real OCR; its PNG counterpart tests image ingestion. Fixture regeneration needs Python reportlab, python-docx, and Pillow in addition to the ingestion requirements. The committed fixtures let judges run the examples without those tools.

Use **Upload documents → Try PDF + Word example**, then **Try scanned PDF example**. Inspect field evidence and the recognition score, retry the unresolved scan, compare against the originals, confirm the review, reload, and export the separate report. The scan is intentionally review-required even when recognition is good.

Upstream API references: [PDF.js](https://mozilla.github.io/pdf.js/examples/), [Mammoth raw-text extraction](https://github.com/mwilliamson/mammoth.js), [Tesseract worker and recognition API](https://github.com/naptha/tesseract.js/blob/master/docs/api.md), and [English model distribution](https://github.com/naptha/tessdata). Third-party licenses are retained in dependencies and copied alongside deployed OCR runtime files where provided.
