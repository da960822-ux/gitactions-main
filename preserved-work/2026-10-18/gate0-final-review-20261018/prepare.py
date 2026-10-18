from pathlib import Path
import datetime, hashlib, html, json, re, subprocess

P=Path('/workspace/gate0-final-review-20261018')
old=Path('/workspace/gate0-review-20261018')
s=(old/'PLAN.ko.md').read_text()
s=s.replace('원격 조회, 기존 분석 복사본 읽기, 이미 실행 중인 기존 화면 캡처, 공식 출처 열람과 프로젝트 밖 문서 작성만 수행했다.', '원격 재조회, 현재 파일·기존 진단·보존 캡처 읽기, 공식 출처 열람과 프로젝트 밖 문서 작성만 수행했다. 아래 과거 실행 증거는 보존 기록이며 이번 재녹화가 아니다.')
s=s.replace('단순 스킬 이름·공식 경로 조사는 기존 독립 조사 에이전트에만 분담했다.', '기존 독립 조사 결과를 재사용하고 메인이 공식 경로와 현재 파일 존재를 재확인했다. 이번 재확인에서 새 에이전트를 생성하지 않았다.')
s=s.replace('기존 분석 복사본에서 객체·파일을 이번에 재확인', '선행 Gate0 객체·파일 비교 기록 보존; 현재 원격 head와 별개')
s=s.replace('`git diff --name-only 24a6ec6 438f50d`는 **1,545개**다.', '선행 Gate0에서 `git diff --name-only 24a6ec6 438f50d`로 집계한 기록은 **1,545개**다. 이번에는 아래 객체 저장소 제약으로 재집계하지 않았다.')
a=s.index('### 2.3');b=s.index('## 3.',a)
s=s[:a]+'''### 2.3 현재 재확인과 선행 증거의 구분

2026-10-18 최종 재확인에서 `/workspace/gitactions-main`은 b37c10b 계열에서 clean이고, 원격 main/landing/games SHA는 제2.1절과 같았다. fix/actual-ingame-ui-review-20261017은 현재 원격 heads에 없다. 별도 게임 작업의 미푸시 내용·현재 조커 교체 상태는 직접 확인하지 않았으며 작업 파일과 프로세스를 변경·중단하지 않았다.

후속 로컬 `/workspace/yl-folded-playhouse-r8`에는 AcrossHero.tsx·across-hero.css 수정, 다수 preview/공간 모듈·모델의 미커밋 작업이 이미 있다. 이번 Gate0의 구현이나 승인 결과가 아니며 채택·수정·삭제·reset하지 않았다. 현재 Git status는 사라진 `/tmp/yl-gate0-audit/.git/objects` alternate 경고를 출력한다. 소스 파일과 HEAD·작업 목록은 읽히지만 과거 분석용 객체 전체가 현재 유효하다고 인증하지 않는다. 계획 승인 후 격리 복원 및 ancestry 검증을 먼저 수행한다. 객체 복구·fetch·패키지 설치도 이번에 하지 않았다.

선행 Gate0 자료는 `/workspace/gate0-deliverables/baseline`의 17개 캡처·observations와 `/workspace/gate0-review-20261018/existing-browser.json`이다. 이번에 1920 안정 Hero와 caa6d31 다빈치 선택 캡처를 직접 열어 확인했다. 큰 청록 리본과 카피·인물의 경쟁, 중심/주변 게임 조각 구성은 보존 화면 관찰이다. 정지 캡처로 실제 시간축·스크롤 연속성까지 확인했다고 하지 않는다. 선행 1920 앱 실행 기록은 pageerror 0, 가로 overflow false, 최상단 #games/#papi-letter 및 /feedback 링크 존재다. 전체 게임 기능 합격은 아니다.

기존 Landing 코드에서 dos-language의 ko/es, document lang ko/es-DO, nav /feedback 연결을 재확인했다. catchmind.ts의 answers(c)=[c.ko,c.es].map(norm) 및 isCorrectGuess도 읽었다. 기존 편지 5문단·서명은 home.ts 보호 대상이다. 실제 온라인 양언어 플레이는 이번에 수행하지 않았다.

선행 브라우저 renderer는 ANGLE Vulkan / SwiftShader Device (Subzero)다. 이번에는 새 GPU 측정을 하지 않았으며 사용자 PC/실제 하드웨어 GPU 성능을 추측하지 않는다. 기존 418–429ms/frame도 과거 소프트웨어 렌더링 경고 수치이지 이번 FPS나 실제 GPU 결과가 아니다. 전체 브라우저 녹화·성능 프로파일·모바일 실기기·게임 전수 플레이는 미검증이다.

현재 남은 후속 트리에서 gpt-taste와 Emil 요청 5종 SKILL.md의 존재를 확인했다. 공식 upstream 5개 경로도 재열람했다. 주 작업 트리에는 일부 이름이 emil-animate/taste-redesign 등으로 다르므로 실행 시 정확한 출처와 실제 읽은 파일을 고정한다. 이번에는 새 디자인 스킬 workflow·composition 제작·render를 수행하지 않았다. 패키지 선언표는 선행 코드 분석 기록이며 설치 버전과 구별한다.

''' +s[b:]
s=s.replace('Playwright / 기존 앱 1920 캡처 실제 실행', 'Playwright / 선행 기존 앱 1920 캡처 기록 보존')
s=s.replace('Playwright는 기존 화면 캡처에 실제 사용했고', 'Playwright는 선행 기존 화면 캡처에 사용된 기록을 확인했고')
s=s.replace('이번 browser renderer 문자열', '선행 browser renderer 문자열')
s=s.replace('이번 공식 페이지 확인 범위도 남긴다.', '선행 공식 페이지 확인 범위도 남긴다.')
s=s.replace('공식 raw 원본 5개를 HTTP로 직접 열어', '공식 raw 원본 5개를 이번 웹 도구로 직접 열어')
s=s.replace('원격·분석 HEAD·경로 읽기 확인', '원격 재조회·현재 경로 읽기·선행 분석 구분')
s=s.replace('이번 현재 코드 및 Git 상태', '현재 코드 및 Git 상태')
summary=(old/'SUMMARY.ko.md').read_text().replace('이번 브라우저는 SwiftShader이며', '보존된 브라우저 진단은 SwiftShader이며')
summary=summary.replace('미확인: Lusion', '현재 후속 로컬 작업은 그대로 보존했습니다. 임시 Git alternate 객체 저장소가 사라져 전체 ancestry·diff 재검증은 승인 후 격리 복원 단계에 남겼습니다.\n\n미확인: Lusion')
trace=(old/'REQUIREMENTS-TRACE.ko.md').read_text()
trace=trace.replace('현재 전체1545, src/public229', '선행 집계 전체1545, src/public229; 현재 재집계 미실행').replace('실제 diff 재집계', '선행 diff 기록; alternate 유실로 현재 재검증 대기').replace('현 Chromium SwiftShader 직접조회', '선행 Chromium SwiftShader 기록').replace('status clean·외부 진단', '원본 clean·후속 기존 dirty 보존·외부 진단')
trace=trace.replace('기존 객체 diff·직접 캡처 관찰', '선행 객체 diff 기록·이번 보존 캡처 관찰')
trace=trace.replace('확인한 기존 객체', '선행 객체 기록')
rows=re.findall(r'^\| ([A-Z]+-\d+) \|',trace,re.M)
assert len(rows)==len(set(rows))==157
assert all(f'## {i}.' in s for i in range(1,18))
for n,v in [('PLAN.ko.md',s),('SUMMARY.ko.md',summary),('REQUIREMENTS-TRACE.ko.md',trace)]: (P/n).write_text(v)
combined=summary+'\n\n---\n\n'+s+'\n\n---\n\n'+trace
(P/'COMBINED.ko.md').write_text(combined)
def inline(t):
 t=html.escape(t)
 t=re.sub(r'`([^`]+)`',r'<code>\1</code>',t)
 t=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',t)
 return re.sub(r'\[([^\]]+)\]\((https?://[^ )]+)\)',r'<a href="\2">\1</a>',t)
def render(md):
 lines=md.splitlines();out=[];i=0
 while i<len(lines):
  l=lines[i]
  if not l.strip():i+=1;continue
  if l.startswith('|'):
   table=[]
   while i<len(lines) and lines[i].startswith('|'):table.append(lines[i]);i+=1
   out.append('<table>')
   for k,row in enumerate(table):
    if re.match(r'^\|[- :|]+$',row):continue
    tag='th' if k==0 else 'td';out.append('<tr>'+''.join(f'<{tag}>{inline(c.strip())}</{tag}>' for c in row.strip('|').split('|'))+'</tr>')
   out.append('</table>');continue
  m=re.match(r'^(#{1,6}) (.*)',l)
  if m:out.append(f'<h{len(m[1])}>{inline(m[2])}</h{len(m[1])}>')
  elif l.startswith('- '):out.append('<p class="bullet">• '+inline(l[2:])+'</p>')
  else:out.append('<p>'+inline(l)+'</p>')
  i+=1
 return ''.join(out)
oldhtml=(old/'GATE0-PLAN-REVIEW.ko.html').read_text()
prefix=oldhtml[:oldhtml.index('<main>')]
(P/'GATE0-PLAN-REVIEW.ko.html').write_text(prefix+'<main>'+''.join('<article>'+render(v)+'</article>' for v in [summary,s,trace])+'</main></html>')
diag={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Gate0 read-only product analysis and external documents only','requirements':len(rows),'product_edits_this_pass':False,'git_original_status':subprocess.check_output(['git','-C','/workspace/gitactions-main','status','--short'],text=True),'remote_heads':subprocess.check_output(['git','-C','/workspace/gitactions-main','ls-remote','--heads','origin'],text=True),'known_limitation':'Missing /tmp audit Git alternate; no history repair attempted; previous local product work left untouched'}
(P/'READONLY-RECHECK.json').write_text(json.dumps(diag,ensure_ascii=False,indent=2))
print(json.dumps({'requirements':len(rows),'plan_bytes':len(s.encode()),'summary_bytes':len(summary.encode()),'html_bytes':(P/'GATE0-PLAN-REVIEW.ko.html').stat().st_size},ensure_ascii=False))
