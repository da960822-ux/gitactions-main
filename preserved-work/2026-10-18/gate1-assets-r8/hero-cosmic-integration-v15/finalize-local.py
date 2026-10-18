from pathlib import Path
import datetime,hashlib,json,tarfile
P=Path('/workspace/gate1-assets-r8/hero-cosmic-integration-v15');R=Path('/workspace/yl-folded-playhouse-r8')
d=json.loads((P/'observations.json').read_text());arrival=next(x['frame'] for x in d['frames'] if x['name']=='arrival')
h=json.loads(Path('/workspace/gate1-assets-r8/hero-cosmic-integration-v13/hero-exit-handoff-state.json').read_text())
h['status']='V15 actual Hero exit; Gate1 visual UNAPPROVED. Hero ownership only; separate approved story/letter/event worker owns independent components.'
h['completedFrame']=arrival;h['camera'].update(position=[-3.8,.25,-40],target=[-12,.15,-69])
h['sameSurface'].update(evaluators=['arrivalCoveV15.ts','floorSupportV15.ts','shellTwist.ts'],coveEndSpread=9,coveEndRoofRise=35)
h['sameSurface']['lightwell']='Warm_Recessed_Lightwell and Lightwell_* use same deformation as enclosing corridor; RectAreaLight position/target/size follow field with conserved total flux.'
h['portrait'].pop('centerAtExit',None);h['portrait']['stageEvaluator']='stageMotionV15.ts';h['portrait']['positionContract']='Camera-relative end distance8.5 and NDC x .34 at16:9/FOV48; actual world matrix in completedFrame; same portrait object.'
names=['previewSpaceV15.ts','poseSpaceV15.ts','stageMotionV15.ts','arrivalCoveV15.ts','floorSupportV15.ts','curvedReflectionV14.ts','shellTwist.ts','pointerResponse.ts']
h['sourceSHA256']={n:hashlib.sha256((R/'src/landing/cinematic/folded'/n).read_bytes()).hexdigest() for n in names}
(P/'hero-exit-handoff-state.json').write_text(json.dumps(h,ensure_ascii=False,indent=2))
recovery=P/'source-only-snapshot.tar.gz'
files=[R/'src/landing/AcrossHero.tsx',R/'src/landing/across-hero.css',*sorted((R/'src/landing/cinematic/folded').glob('*.ts')),*sorted((R/'src/landing/cinematic/folded').glob('*.tsx'))]
with tarfile.open(recovery,'w:gz') as t:
 for f in files:t.add(f,arcname=str(f.relative_to(R)))
protected=json.loads(Path('/workspace/gate1-evidence/protected-file-sha256.json').read_text());changed=[];missing=[]
for f in protected['files']:
 p=R/f['path']
 if not p.exists():missing.append(f['path'])
 elif hashlib.sha256(p.read_bytes()).hexdigest()!=f['sha256']:changed.append(f['path'])
(P/'protection-recheck.json').write_text(json.dumps({'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':len(protected['files']),'changed':changed,'missing':missing},ensure_ascii=False,indent=2))
assert not changed and not missing,(changed,missing)
for file in [Path('/workspace/gate1-assets-r8/CURRENT-TASK.json'),Path('/workspace/GATE1-CURRENT-STATUS.json')]:
 state=json.loads(file.read_text());state.update(updatedUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),authority='Parent latest instruction: complete authorized Gate1 V13 wall/arrival/occlusion corrections. Original background direction approved only. Gate1 visual UNAPPROVED; independent later-scene worker separately authorized and untouched.',active=str(R)+'; AcrossHero→previewSpaceV15; Vite5201 single instance',phase='V15 actual Hero/Middle/Arrival/Reverse and pointer stills verified; right wall/portrait/lightwell corrected. Actual short recording status in V15 observations.',next='Deliver actual short clip and V15 comparison for parent/user visual review; no high-cost bake, new GLB, long recording, push or deploy.',handoffState=str(P/'hero-exit-handoff-state.json'),sourceRecoverySnapshot=str(recovery))
 state.setdefault('libraryLatest',{})['actualV15Comparison']='libfile_602ecc50e5608191bcf28a70ee9f4191'
 state['functionalQA']='V10 functional QA retained: all8 direct lobbies and dynamic selections, KO/es-DO letters+toggle/lang refresh/feedback. V15 actual pointer left/right completed frames verified. No online gameplay pass claimed.'
 state['important']='Gate1 not visually approved. Environment image remains2.5D; live camera/surface deformation is actual WebGL. Small lightwell video is not completed image-to-video panel morph; Remotion intro handoff still pending.'
 file.write_text(json.dumps(state,ensure_ascii=False,indent=2))
print(json.dumps({'protectedFiles':len(protected['files']),'changed':changed,'missing':missing,'snapshotFiles':len(files),'snapshotBytes':recovery.stat().st_size}))
