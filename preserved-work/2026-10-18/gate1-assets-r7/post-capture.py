from pathlib import Path
import subprocess,json,time,datetime
P=Path('/workspace/gate1-assets-r7');R=Path('/workspace/yl-folded-playhouse-r7');state={}
def mark(stage,**kw):
 state.update(stage=stage,checkedAtUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),**kw);(P/'POST-CAPTURE-CHECKPOINT.json').write_text(json.dumps(state,indent=2));print(stage,kw,flush=True)
def run(args,log):
 with (P/log).open('w')as f:
  p=subprocess.Popen(args,cwd=R,stdout=f,stderr=subprocess.STDOUT);mark('running '+log,activePID=p.pid);code=p.wait()
 assert code==0,(log,code)
 mark('completed '+log)
try:
 mark('waiting on existing capture; no restart')
 while True:
  first=json.loads((P/'PIPELINE-CHECKPOINT.json').read_text())
  if first['stage']=='PIPELINE_COMPLETE':break
  if first['stage']=='PIPELINE_FAILED':raise RuntimeError('Existing pipeline failed; preserve state for targeted recovery')
  time.sleep(5)
 run(['python3',str(P/'assemble-evidence.py')],'assembly.log')
 run(['python3',str(P/'finalize-record.py')],'final-record.log')
 run(['node',str(P/'profile-runtime.mjs')],'runtime-profile.log')
 run(['node',str(P/'performance/profile-actual-page.mjs')],'actual-page-profile.log')
 run(['node',str(P/'performance/analyze-rgb9e5.mjs')],'rgb9e5-analysis.log')
 run(['python3',str(P/'performance/report-fragment.py')],'performance-report.log')
 run(['python3',str(P/'prepare-delivery.py')],'prepare-delivery.log')
 mark('POST_CAPTURE_COMPLETE',note='External analysis/report only. No product edit, commit, push, deploy or quality approval. Existing Library native and web Mid/Arrival identities preserved.')
except BaseException as e:mark('POST_CAPTURE_FAILED',error=repr(e));raise
