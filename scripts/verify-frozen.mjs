import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const checkpoint=JSON.parse(await readFile('docs/evaluation/004-engineering-checkpoint.json','utf8'));
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
for(const [file,expected] of Object.entries(checkpoint.frozenFiles))assert.equal(await hash(file),expected,`Frozen file changed: ${file}`);
assert.equal(await hash('exports/submission.json'),checkpoint.submissionSha256,'Frozen evaluated submission changed.');
const report={checkedAt:new Date().toISOString(),frozenFilesChecked:Object.keys(checkpoint.frozenFiles).length,allByteIdentical:true,submissionSha256:checkpoint.submissionSha256};
await mkdir('exports',{recursive:true});await writeFile('exports/frozen-integrity.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
