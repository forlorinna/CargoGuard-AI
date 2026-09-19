# Local participant data

Official emails, attachments, parsed text, and generated predictions are deliberately excluded from GitHub. Obtain the participant bundle from the organizers and place its `inbox/` and `attachments/` directories together outside this repository. Never use private/reference answers or generator code.

From the project root, run:

```sh
python -m pip install -r requirements.txt
python scripts/ingest.py --source /path/to/participant-bundle
npm run process:dataset
```

Ingestion creates ignored `data/corpus.json` and `public/documents/`. Processing creates ignored `exports/`. Import the corpus before building, running tests, or starting the app. The original input files remain unchanged.

The published demonstration already contains the imported synthetic corpus. GitHub holds the reusable source code, configuration templates, migration files, and documentation.
