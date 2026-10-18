"""Local-only recovery: exact baseline snapshot, owned overlay, authoring and evidence."""
from pathlib import Path
import subprocess,hashlib,json,os,tarfile,tempfile,shutil,datetime
R=Path('/workspace/yl-folded-playhouse-r8');P=Path('/workspace/gate1-assets-r8');B=P/'recovery-v8-20261018'
B.mkdir(mode=0o700,exist_ok=True)
def git(*args):return subprocess.check_output(['git','-C',str(R),*args],env={**os.environ,'GIT_OPTIONAL_LOCKS':'0'}).decode().strip()
def digest(path):
 if path.is_symlink():return hashlib.sha256(os.readlink(path).encode()).hexdigest()
 h=hashlib.sha256()
 with path.open('rb')as f:
  for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
 return h.hexdigest()
def owned(name):return name=='src/landing/AcrossHero.tsx'or name.startswith(('src/landing/cinematic/folded/','public/models/folded-chamber-'))
head=git('rev-parse','HEAD');tracked=[x for x in git('ls-files').splitlines()if x];changed=[x for x in git('diff','--name-only').splitlines()if x];new=[x for x in git('ls-files','--others','--exclude-standard').splitlines()if x]
assert all(owned(name)for name in changed+new)
expected={name:{'sha256':digest(R/name),'kind':'symlink'if(R/name).is_symlink()else'file'}for name in sorted(set(tracked+new))}
base=B/f'baseline-{head[:12]}.tar'
if not base.exists():subprocess.run(['git','-C',str(R),'archive','--format=tar','--output='+str(base),head],check=True)
overlay=B/'owned-changes-and-authoring.tar.gz'
authors=[P/'chamber-space-v6.blend',P/'author-space-v6.py',P/'space-v6-probes.py',P/'check-v6-annex-native.py',P/'prepare-space-v7.py',P/'prepare-space-v8-synced.py',P/'record-v8-native-browser.mjs',P/'record-v8-responsive-native-browser.mjs',Path('/workspace/gate1-assets-r7/chamber.blend')]
with tarfile.open(overlay,'w:gz',compresslevel=1)as archive:
 for name in sorted(set(changed+new)):archive.add(R/name,arcname='overlay/'+name,recursive=False)
 for p in authors:
  if p.exists():archive.add(p,arcname='authoring/'+('r7-base-chamber.blend'if str(p).startswith('/workspace/gate1-assets-r7/')else p.name),recursive=False)
 provenance=P/'provenance'
 if provenance.exists():archive.add(provenance,arcname='provenance')
 private=P/'delivery/G1R8-v4-v5-review-evidence-and-source.zip';archive.add(private,arcname='preserved-private-original/'+private.name,recursive=False)
evidence=B/'completed-review-evidence.tar'
packets=[p for p in P.glob('review-packet-v*-20261018')if p.is_dir()]
for packet in packets:
 if packet.name.startswith('review-packet-v8-responsive'):
  obs=json.loads((packet/'observations.json').read_text());assert not obs.get('failure'),'Do not label failed primary recording complete'
with tarfile.open(evidence,'w')as archive:
 for packet in sorted(packets):archive.add(packet,arcname=packet.name)
validated=0
with tempfile.TemporaryDirectory(prefix='v8-restore-check-',dir=B)as folder:
 target=Path(folder)/'restored';target.mkdir();extras=Path(folder)/'extras';extras.mkdir()
 with tarfile.open(base)as archive:archive.extractall(target,filter='data')
 with tarfile.open(overlay)as archive:archive.extractall(extras,filter='data')
 for name in sorted(set(changed+new)):
  src=extras/'overlay'/name;dst=target/name;dst.parent.mkdir(parents=True,exist_ok=True)
  if src.is_symlink():
   if dst.exists()or dst.is_symlink():dst.unlink()
   dst.symlink_to(os.readlink(src))
  else:shutil.copy2(src,dst)
 for name,record in expected.items():assert digest(target/name)==record['sha256'],name;validated+=1
 # Verify every archived evidence payload against the completed local packet.
 with tarfile.open(evidence)as archive:
  for member in archive.getmembers():
   if not member.isfile():continue
   payload=archive.extractfile(member);h=hashlib.sha256()
   for block in iter(lambda:payload.read(1024*1024),b''):h.update(block)
   assert h.hexdigest()==digest(P/member.name),member.name
manifest={'createdUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'HEAD':head,'branch':git('branch','--show-current'),'baselineArchive':base.name,'changedTracked':changed,'untracked':new,'restoredFilesVerified':validated,'workingTreeFiles':expected,'archives':[{'name':p.name,'bytes':p.stat().st_size,'sha256':digest(p)}for p in[base,overlay,evidence]],'note':'Local-only; no commit, upload, push or deploy. Dependencies and Git history are not included. Baseline tracked snapshot plus overlay restores exact working files.'}
(B/'BACKUP-MANIFEST.json').write_text(json.dumps(manifest,indent=2))
(B/'RESTORE.ko.md').write_text(f'''# Gate1 v8 로컬 복구 백업\n\n기준 HEAD: `{head}`\n브랜치: `{manifest['branch']}`\n\n1. 비어 있는 새 디렉터리에 `{base.name}`를 풉니다. 기존 저장소에 직접 덮어쓰지 마세요.\n2. `owned-changes-and-authoring.tar.gz`를 별도 디렉터리에 풉니다. 그 안의 `overlay/` 내용을 1번 디렉터리에 같은 상대 경로로 복사합니다.\n3. `authoring/`은 Blender 원본과 생성 스크립트입니다. 원본 경로 참조는 환경에 맞게 복구해야 합니다. 기존 R7 Blender 원본도 `r7-base-chamber.blend`로 보존했습니다.\n4. `completed-review-evidence.tar`는 원본 브라우저 영상·캡처·검증 보고서입니다.\n5. `BACKUP-MANIFEST.json`의 해시와 대조합니다. 실제 임시 디렉터리 복구 후 {validated}개 파일을 전부 비교했고, 증거 아카이브의 각 파일도 원본과 비교했습니다.\n\nGit 이력과 node_modules는 포함하지 않았습니다. 패키지 정의·락 파일은 기준 스냅샷에 있으며, 현재 작업에서 패키지를 변경하거나 재설치하지 않았습니다. 비공개 원본 ZIP도 같은 바이트로 로컬 보존했습니다. 외부 전송은 하지 않았습니다.\n''')
for p in B.iterdir():
 if p.is_file():p.chmod(0o600)
print(json.dumps({'backup':str(B),'restoredFilesVerified':validated,'archives':manifest['archives']},indent=2))
