"""Use only the organizer's public API; retain an auditable record of every run.

This adapter never opens reference answers or imports the organizer scorer.
Only POST /submit performs scoring, inside the separate organizer service.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]


def git_value(*args):
    try:
        result = subprocess.run(
            ['git', '-c', f'safe.directory={ROOT.as_posix()}', *args],
            cwd=ROOT, capture_output=True, text=True, timeout=10, check=True,
        )
        return result.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return None


def public_json(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        return json.load(response)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://localhost:8080')
    parser.add_argument('--submission', type=Path, default=Path('exports/submission.json'))
    parser.add_argument('--output', type=Path, default=Path('exports/official-score.json'))
    parser.add_argument('--runs-dir', type=Path, default=Path('exports/evaluation-runs'))
    parser.add_argument('--note', required=True, help='What changed since the preceding evaluation.')
    parser.add_argument('--runtime', choices=['docker', 'native-python', 'remote'], required=True,
                        help='How the organizer service is actually running; never inferred.')
    args = parser.parse_args()
    run_id = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S.%fZ')
    run_dir = args.runs_dir / run_id
    run_dir.mkdir(parents=True, exist_ok=False)
    record = {
        'run_id': run_id, 'started_at': datetime.now(timezone.utc).isoformat(),
        'endpoint': args.url.rstrip('/') + '/submit', 'runtime': args.runtime,
        'change_note': args.note, 'source_commit': git_value('rev-parse', 'HEAD'),
        'working_tree_dirty': bool(git_value('status', '--porcelain')),
        'engine_sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                          for p in sorted((ROOT / 'lib').glob('*.ts'))},
        'status': 'started',
    }
    try:
        payload = args.submission.read_bytes()
        submitted = json.loads(payload)
        if not isinstance(submitted, dict) or not submitted:
            raise ValueError('Submission must be a nonempty object keyed by email ID.')
        record['submission_sha256'] = hashlib.sha256(payload).hexdigest()
        record['email_count'] = len(submitted)
        (run_dir / 'submission.json').write_bytes(payload)

        health = public_json(args.url.rstrip('/') + '/health')
        if health.get('status') != 'ok' or not health.get('scoring_available'):
            raise ValueError('Organizer health endpoint reports scoring unavailable.')
        emails = public_json(args.url.rstrip('/') + '/emails')
        expected_ids = {email['email_id'] for email in emails}
        if set(submitted) != expected_ids or health.get('emails') != len(submitted):
            raise ValueError('Submission must cover the complete organizer inbox exactly.')
        record['health'] = health
        record['complete_inbox_verified'] = True

        request = urllib.request.Request(record['endpoint'], data=payload,
                                         headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=30) as response:
            raw_score = response.read()
        result = json.loads(raw_score)
        # Preserve the exact response bytes; never calculate a replacement score.
        (run_dir / 'score.json').write_bytes(raw_score)
        for score in [result['stage1']['macro_f1'], result['stage3']['defect_f1'],
                      result['end_to_end']['rate'], result['final_score']]:
            if not isinstance(score, (int, float)) or not 0 <= score <= 1:
                raise ValueError('Organizer response contains an invalid score.')
        if result['n_emails'] != len(submitted):
            raise ValueError('Scored email count differs from the complete submission.')
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(raw_score)
        record['status'] = 'succeeded'
        record['score_sha256'] = hashlib.sha256(raw_score).hexdigest()
        print(json.dumps(result, indent=2))
        return 0
    except (urllib.error.URLError, OSError, ValueError, KeyError, TypeError) as error:
        record['status'] = 'failed'
        record['error'] = str(error)
        print('Official evaluation failed:', str(error))
        print('No new validated score was generated. Any previous successful score is unchanged.')
        return 2
    finally:
        record['finished_at'] = datetime.now(timezone.utc).isoformat()
        (run_dir / 'run.json').write_text(json.dumps(record, indent=2), encoding='utf8')
        print('Evaluation run record:', run_dir / 'run.json')


if __name__ == '__main__':
    raise SystemExit(main())
