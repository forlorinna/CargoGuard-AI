# Official evaluation log

Two real submissions were made on 19 September 2026 to the organizer's `POST http://localhost:8080/submit`. Both used the complete 520-email participant dataset, freshly ingested from its public bundle. No user-review overrides were included.

| Run | Change before submission | E2E | Stage-1 Macro-F1 | Stage-3 Defect-F1 | Review P/R/F1 | Final |
|---|---|---:|---:|---:|---:|---:|
| 001 — baseline | Fresh ingestion and processing; engine unchanged from `b74cc1faa003eb434e85a0c471f246635fd5eb96` | 1.0 (46/46) | 1.0 | 1.0 | 1.0 / 1.0 / 1.0 | 1.0 |
| 002 — reproducibility | Added adapter run logging and complete-inbox checks; no engine changes; identical submission bytes | 1.0 (46/46) | 1.0 | 1.0 | 1.0 / 1.0 / 1.0 | 1.0 |

The baseline reached the evaluator's maximum. No metric-driven tuning, ID-specific rules, hidden-label lookup, or speculative engine changes were performed.

After these two scoring submissions, an adapter failure-path test targeted an intentionally unavailable local endpoint. Health checking failed before any `/submit` call; the adapter logged the failure and preserved the existing successful score. This is [recorded separately](evaluation/003-adapter-negative-test-run.json), and is not an official evaluation result. All 15 engine tests, 14 API checks, and TypeScript checking passed again after evaluation.

## Evidence

- [Baseline scoreboard](evaluation/001-baseline-score.json) and [baseline record](evaluation/001-baseline-run.json).
- [Repeat scoreboard](evaluation/002-reproducibility-score.json) and [repeat record](evaluation/002-reproducibility-run.json).
- [Organizer code hashes and runtime provenance](evaluation/organizer-provenance.json).

The score files contain the returned aggregate metrics, not private answer records. Submission snapshots and original attachments stay in ignored local directories. The initial adapter formatted the baseline JSON response; the updated adapter preserves response bytes verbatim. The run records include input and engine hashes so the equal-input/equal-result comparison can be checked independently.

Final weighting returned by the evaluator: 0.30 × classification Macro-F1 + 0.20 × defect F1 + 0.50 × end-to-end rate. Reliability is a separately returned metric. All 20 review cases were caught with no extra review predictions; the evaluator reported 5/5 caught for each of its four review-reason groups. This measures escalation by reason group, not a separate scored accuracy for predicted reason labels.

## Runtime and data boundary

Docker and WSL were absent, so starting `docker compose` was not possible. The supplied distribution also documents non-Docker scoring. Its unmodified FastAPI application and scoring module were run in an isolated Python environment, bound only to `127.0.0.1:8080`. Python was 3.12.14, FastAPI 0.141.1, and Uvicorn 0.53.0, satisfying the organizer requirements. Their source hashes were checked against the original distribution. No substituted scoring implementation was used.

The organizer runtime was extracted opaquely outside the Git project. Only the organizer process consumed its private reference data to score requests. `REVEAL_GT` remained `0`; no judge endpoint was requested, and no label contents or generator code were inspected. CargoGuard ingested only the participant bundle's inbox and referenced attachments. Public `/emails` matched all 520 local records, and public attachment downloads matched all 250 local hashes.

This distinction matters: the recorded results are real organizer-code/API scores, but Docker-container startup and deployment were not tested. Installing Docker/WSL and repeating the same submission in the original container remains an infrastructure follow-up, not an unmeasured accuracy claim.

## Reproduce with Docker

In a Docker-capable environment, an organizer starts the original extracted distribution:

```sh
docker compose up --build
```

Keep reference data inside that organizer environment, leave `REVEAL_GT` disabled, and use only the public endpoints. From CargoGuard after participant-data ingestion:

```sh
npm run process:dataset
python scripts/evaluate.py --url http://localhost:8080 --runtime docker --note "Reproduce the measured baseline in the official Docker environment."
```

## Reproduce the native organizer service used here

In PowerShell, using an existing organizer-distribution folder and its own isolated Python environment:

```powershell
python -m venv /path/to/evaluator-venv
& /path/to/evaluator-venv/Scripts/python.exe -m pip install -r /path/to/organizer/server/requirements.txt
$env:DATA_DIR = '/path/to/organizer/data_v2'
$env:GROUND_TRUTH = '/path/to/organizer/data_v2/ground_truth.json'
$env:REVEAL_GT = '0'
$env:JUDGE_TOKEN = ''
$env:PYTHONUTF8 = '1'
& /path/to/evaluator-venv/Scripts/python.exe -m uvicorn app:app --app-dir /path/to/organizer/server --host 127.0.0.1 --port 8080
```

Pointing the organizer service at its private data is not permission to open that file, expose it through an endpoint, or copy it into CargoGuard. Run the participant workflow in a separate shell:

```sh
npm run process:dataset
python scripts/evaluate.py --url http://localhost:8080 --runtime native-python --note "Describe the baseline or meaningful engine change."
```

The adapter checks health and complete public inbox coverage before submitting. Each attempt writes an immutable timestamped local run directory containing a submission snapshot, response if returned, and success/failure record. It updates the latest score only after a validated successful response. An unavailable evaluator produces an explicit failure, never an inferred score.

These scores apply to the supplied synthetic dataset only. New layouts and unseen operational data still require independent evaluation and human-review safeguards.
