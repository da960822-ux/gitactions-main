from pathlib import Path
import subprocess,json,datetime
P=Path('/workspace/gate1-assets-r7');state={'scope':'Baseline cost and video diagnostics only, no repeated bake or existing capture'}
def mark(stage,**kw):
 state.update(stage=stage,checkedAtUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),**kw);(P/'BASELINE-COSTS-CHECKPOINT.json').write_text(json.dumps(state,indent=2));print(stage,kw,flush=True)
results=[]
for script,log in [('profile-runtime.mjs','runtime-profile.log'),('performance/profile-actual-page.mjs','actual-page-profile.log'),('performance/analyze-rgb9e5.mjs','rgb9e5-analysis.log')]:
 with(P/log).open('w')as f:
  p=subprocess.Popen(['node',str(P/script)],cwd='/workspace/yl-folded-playhouse-r7',stdout=f,stderr=subprocess.STDOUT);mark('running '+script,activePID=p.pid);code=p.wait()
 results.append({'script':script,'exitCode':code});mark('completed '+script,results=results)
mark('BASELINE_COSTS_FINISHED',results=results)
