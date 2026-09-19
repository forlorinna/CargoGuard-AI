# Five-minute CargoGuard demonstration

Use the official synthetic dataset and a fresh browser session. Do not invent values for a source that is genuinely missing.

| Time | Action | Point to explain |
|---|---|---|
| 0:00–0:40 | Dashboard → Process inbox | 520 mixed emails. Classification sends only comparison requests to verification. Counts come from the pipeline. |
| 0:40–1:15 | Smart inbox → filter SI request; then BL comparison | A new SI can mention invoices and future drafts; current intent matters more than isolated words. Future-draft requests are awaiting documents. |
| 1:15–2:20 | Search `email_004` → open case → click Consignee and Notify party | The real SI and BL have different company names. Only those fields are discrepancies. Inspect exact source quotes and original attachments. |
| 2:20–3:05 | Human review → inspect wrong-type, unreadable, and missing-value cases | An invoice is not a BL; a blank is not a defect. Evidence gates prevent false assurance. |
| 3:05–4:00 | Return to `email_004` → Review case → reject with a clearly labeled demo note → review again, preserve source values, confirm | Demonstrate a result entering review, human confirmation, and saved audit history without inventing missing official data. |
| 4:00–4:35 | Reports & audit → inspect actions → export submission | Corrections persist in D1. Official schema stays separate from the user-facing workflow. |
| 4:35–5:00 | Processing → cloud architecture | Cloudflare serves the frontend and API; D1 stores review state. Optional external AI/OCR are clearly disclosed as unconfigured. |

For a clean matching example use `email_001`. For Excel use `email_005`. Word/PDF cases can be found by attachment format in the workspace source-document tab (for example `email_055` and `email_059`). Confirm every example against the current application before recording the presentation.

Never call the displayed 98% routing confidence “98% accuracy.” It is a heuristic. Only the organizer scoreboard can establish official dataset accuracy.
