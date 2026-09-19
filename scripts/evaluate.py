"""POST predictions to the official evaluator. Never reads reference answers."""
import argparse
import json
from pathlib import Path
import urllib.request
import urllib.error

p=argparse.ArgumentParser()
p.add_argument('--url',default='http://localhost:8080')
p.add_argument('--submission',type=Path,default=Path('exports/submission.json'))
p.add_argument('--output',type=Path,default=Path('exports/official-score.json'))
a=p.parse_args()
try:
    req=urllib.request.Request(a.url.rstrip('/')+'/submit',data=a.submission.read_bytes(),headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=30) as r: result=json.load(r)
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(result,indent=2),encoding='utf8')
    print(json.dumps(result,indent=2))
except (urllib.error.URLError,OSError) as e:
    print('Official evaluation unavailable:',str(e))
    print('Start the organizer evaluation service or supply --url. No score was generated.')
    raise SystemExit(2)
