# Official material inspection

Read before implementation: four-page problem statement; participant DOCX including timeline and hyperlinks; every README in both ZIPs; participant loader; sample submission schema; Docker compose and FastAPI evaluator endpoints; scoring implementation without loading private labels; representative emails from all five categories; actual TXT, PDF, DOCX and XLSX documents.

The supplied Downloads paths were stale. Originals were found in `C:/Users/34075/Desktop/CargoGuard-AI`. The working copies were extracted into the task's `work/` directory. The original ZIPs were not modified.

The participant ZIP has 775 entries: 520 inbox JSON records, 1 sample JSON, 1 README, 1 loader, 250 attachment files, and 2 directory entries. Attachments comprise 192 TXT, 28 PDF, 22 XLSX, and 8 DOCX files. There are no direct image files; some PDFs are image-only scans. Eight individual PDFs across five cases could not yield readable text. There are no received timestamp fields on inbox records; dates in forwarded message bodies are not used as receive dates.

The Docker distribution is explicitly organizer-oriented and contains `ground_truth.json`. That file was not extracted, read, or used. Dataset generators were not read or run. The public README necessarily describes edge-case groups; implementation never branches on IDs or positions.

Official status rules: unknown/unreadable/missing/wrong documents are `NEEDS_REVIEW`, not defects. Ordinary requests to send a future draft retain official `OK` with no asserted defect and get `AWAITING_DOCUMENTS` in the operational UI. All exported records contain exactly category, status, review_reason, has_defect, and defect_fields.

The handbook links an external Google rules document. Fetching it failed, so requirements beyond the supplied handbook and problem statement remain for organizer confirmation. The handbook gives preliminary submission on 22 September 2026 at 12 PM (timezone unspecified), finalist shortlisting on 23 September, announcement on 24 September, and final pitch on 26 September.
