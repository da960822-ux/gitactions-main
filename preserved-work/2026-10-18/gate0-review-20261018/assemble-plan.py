from pathlib import Path
import re, json, hashlib, datetime
P=Path('/workspace/gate0-review-20261018')
s=Path('/workspace/gate0-deliverables/YEONSEOK-LISBETH-GATE0-PLAN.ko.md').read_text()
s=s[:s.index('\n\n## 16.')]
s=re.sub(r'작성일 .*?\n','작성일 2026-10-18 UTC · 상태 **Gate 0 계획 검토 제출 / 사용자 명시 승인 대기**\n',s,count=1)
a=s.index('## 1.');b=s.index('## 2.')
s=s[:a]+'''## 1. 결정 요약과 권한 경계

추천은 **A ‘우리의 접힌 극장 / The Folded Playhouse’**다. 승인된 두 사람의 원화가 중심이고, 얇은 무대 면의 실제 접힘이 다음 방의 벽·바닥·갤러리 선반·편지 지지면으로 이어진다. 검은 중성 공간, ivory의 넓은 곡면, rose gold 단면, burgundy 반사와 차가운 깊이 조명으로 구성한다. 거대한 고리와 두꺼운 파이프를 색만 바꿔 되살리지 않는다. B 지평·C 인쇄실과의 비교 및 선택 이유는 제4절에 있다.

**이번 지시가 권한의 기준이다. Gate 0만 수행한다.** 이전 파일에 있는 부모 검수 위임·자동 진행·후속 구현 승인 문구는 이번 계획의 승인 근거로 사용하지 않는다. 실제 Plan Mode 전환 기능은 현재 도구에 없고, 모드를 전환했다고 주장하지 않는다. 계획의 숫자·좌표·시간·성능 예산은 별도 실측 표시가 없으면 설계 초깃값이다. Awwwards 수준은 목표이며 달성 인증이 아니다.

이번에는 코드·기존 디자인·게임 파일·패키지·lockfile을 수정하거나 삭제하지 않았다. 커밋·푸시·배포·새 디자인 구현·새 영상 제작·추가 설치를 하지 않았다. 원격 조회, 기존 분석 복사본 읽기, 이미 실행 중인 기존 화면 캡처, 공식 출처 열람과 프로젝트 밖 문서 작성만 수행했다. 별도 게임 검수 작업은 편집·중단하지 않는다.

승인 순서는 **사용자 계획 승인 → Gate 1 Hero만 구현 → 실제 브라우저 영상·캡처 → 사용자가 ChatGPT 총괄 검수에 전달 → 수정·재검수 → 사용자 Hero 명시 승인 → Gate 2**다. 이후도 각 Gate 사용자 승인 전 다음 구현을 하지 않는다. 내부 테스트·빌드 성공·자체 평가는 승인에 해당하지 않는다. 불합격 시 구도·조형·영상·자산·대안 콘셉트를 재검토하며 반복 횟수를 임의 제한하지 않는다. 품질이 낮아지는 대안은 명시적인 사용자 승인 없이 채택하지 않는다.

메인이 아트 디렉션·기술 설계·교차검증을 책임진다. 사용자가 지정한 모델 설정을 바꿨다고 주장하지 않는다. 단순 스킬 이름·공식 경로 조사는 기존 독립 조사 에이전트에만 분담했다. 신규 디자인을 조사 에이전트가 결정하지 않는다.

''' +s[b:]
s=s.replace('부모','사용자')
s=s.replace('2026-10-17 조사 당시 값이며 실행 직전에 재확인한다.','2026-10-18 이번 요청에서 재조회한 값이다. 구현 승인 후 착수 직전에도 재확인한다.')
s=s.replace('원격에서 커밋 객체를 별도 분석 복사본으로 확보','기존 분석 복사본에서 객체·파일을 이번에 재확인')
a=s.index('### 2.3');b=s.index('## 3.')
s=s[:a]+'''### 2.3 이번 확인과 기존 증거의 구분

기존 분석 복사본 `/tmp/yl-gate0-audit`의 HEAD는 정확히 `24a6ec69eea712f632ee80e8f3cae863d38c769f`이고 clean이다. 원본 `/workspace/gitactions-main`도 main 계열 b37c10b에서 clean이다. 별도 로컬 후속 랜딩 worktree `yl-folded-playhouse-g1`과 `yl-folded-playhouse-r7`는 `491b16883d9ca1591065a22b23731f04587e5b38`에서 clean이다. 이는 과거 작업의 존재를 확인한 사실이며 사용자 디자인 승인·이번 구현 허가를 뜻하지 않는다. 삭제·재설정·추가 구현하지 않았다. 원격에 이 후속 로컬 커밋이 반영됐다고 보고하지 않는다.

이번에 이미 실행 중인 기존 24a6ec6 화면을 Playwright/Chromium으로 1920×1080 캡처했다. `existing-browser.json`에 시각·HEAD·언어·최상단 링크·오류 수집을 기록했다. pageerror 0, 가로 overflow false, 최상단 `#games`, `#papi-letter`, `/feedback` 링크를 확인했다. 전체 콘솔·네트워크·게임 기능 합격을 의미하지 않는다. 이번 browser renderer 문자열은 **ANGLE Vulkan / SwiftShader Device (Subzero)**였다. 사용자 PC GPU·실제 하드웨어 가속 성능을 추측하지 않는다.

선행 Gate0 진단 PNG 17개는 2026-10-17의 기존 화면 증거다. 이번에 1920 안정 Hero와 caa6d31 다빈치 선택 캡처를 직접 열어 확인했다. 선행 자료의 mid/exit/mobile 캡처와 observations도 보존되어 있다. 신규 결과 화면으로 소개하지 않는다. 승인 원화는 1254×1254 RGBA WebP/PNG로 기록돼 있으며 고해상도 얼굴 원본을 새로 생성하지 않는다.

패키지 선언은 React ^19.1.1, Three ^0.186.1, GSAP ^3.15.0, Remotion ^4.0.535, HyperFrames ^0.8.149, Playwright ^1.64.0이다. 기존 복사본의 설치 상태를 활용했으며 이번에 의존성을 설치·업데이트하지 않았다. 로컬 의존성이 있다는 것과 새 제작에 실제 사용했다는 것은 다르다.

기존 문서의 1920 소프트웨어 렌더링 약 418–429ms/frame은 과거 경고 수치다. 이번 앱 FPS 실측이 아니며 실제 GPU 성능으로 일반화하지 않는다. 이번은 전체 브라우저 녹화·성능 프로파일·모바일 실기기·게임 플레이 전수 검사를 수행하지 않았다.

''' +s[b:]
s=s.replace('새 앱 화면을 직접 본 것으로 섞지 않는다.','이번 기존 앱 실행과 선행 증거 관찰을 구분한다.')
s=s.replace('영상 로드가 늦으면 동일 live pose로 진행','영상 로드가 늦으면 같은 공유 scene의 live 진입으로 진행')
s=s.replace('HyperFrames 계정/usage 불명·CLI 렌더 미실행','HyperFrames cloud 계정/usage 불명·이번 신규 CLI 렌더 미실행')
s=s.replace('기존 CLI 프로젝트는 후자의 HTML→deterministic MP4 프레임워크이며 Apache-2.0 표시를 공식 저장소에서 확인했다.','기존 CLI 프로젝트는 후자의 HTML→MP4 프레임워크이며 라이선스·출처는 실제 도입/제작 시 고정한다.')
s=s.replace('사용자 링크 [hyperframes.app](https://hyperframes.app/)와 기존 프로젝트의 [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)는 동일 서비스라고 단정할 근거가 없다.','이번 [hyperframes.app](https://hyperframes.app/) 페이지는 HyperFrames OSS GitHub 링크를 제공한다. 기존 프로젝트는 [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) CLI를 선언한다. 링크가 있다는 사실과 cloud 계정·과금·운영 주체·기능의 동일성은 구분한다.')
s=s.replace('로컬 동일 폴더는 미확인','로컬 동일 폴더 존재 확인')
s=s.replace('4가지','4가지')
s=s.replace('제18절','본 절').replace('제19.3 T1','제16절 T1')
# Remove assets not requested in this instruction; do not carry unrelated prior decisions.
s='\n'.join(line for line in s.splitlines() if not line.startswith('| ‘구글 갤러리’'))
s=s.replace('정확한 구글 갤러리 링크','사용 허용 범위가 확인된 추억 자료')
s=s.replace('Google gallery 실제 위치, ','')
s='\n'.join(line for line in s.splitlines() if not line.startswith('| Google gallery 불명'))
s=s.replace('별도 `REQUIREMENTS-TRACE.ko.md`','부록 `REQUIREMENTS-TRACE.ko.md`')
s=s.replace('제2·7·16절','제2·7절').replace('제2·7·16','제2·7')
s=s.replace('사용자에게 위임받은 사용자의 ChatGPT 총괄 검수','사용자와 사용자가 자료를 전달하는 ChatGPT 총괄 검수')
s=s.replace('사용자의 ChatGPT 총괄 심사','ChatGPT 총괄 검수 및 사용자 최종 판단')
s=s.replace('사용자 검수 통과','사용자의 명시 승인').replace('사용자 통과 지시','사용자 명시 승인')
s=s.replace('전 Gate 사용자 검수 통과 후만','전 Gate 사용자 명시 승인 후만')
s=s.replace('최종까지 진행하라는 승인이 있어도 각 Gate 실제 증거와 사용자 통과 지시를 생략하지 않는다.','이번 계획은 Gate 1 이후 자동 진행을 허용하지 않는다. 각 Gate 실제 증거와 사용자의 명시 승인을 생략하지 않는다.')
s=s.replace('확인하지 못한 것: 현재 앱 전체 브라우저 녹화','확인하지 못한 것: 기존 앱 전체 브라우저 녹화')
s=s.replace('**사용자의 Gate 0 계획 검수 및 구현 시작 지시 대기.**','')
# Strengthen frozen source contract, receiver geometry and visible opening beyond paper-only object idea.
s+='''

## 16. 구현 가능한 연결 계약과 게임 인계 절차

### 16.1 단일 WebGL 공간과 지속되는 물체

전체 완성 시 `LandingWorldHost`가 WebGLRenderer·Scene·PerspectiveCamera·Canvas·색 관리·RAF·resize·dispose를 단독 소유한다. GSAP는 정규화 playhead만 쓰고 camera/geometry는 순수 pose evaluator가 한 번 평가한다. 기존 갤러리 조각 생성은 Gate3에서 렌더러 없는 `GalleryCollection` Object3D로 분리한다. Gallery 자체를 지금 추출하거나 수정하지 않는다. 화면이 비슷한 두 canvas를 fade로 교체하는 구조는 기본안에서 제외한다.

| 지속 ID | Hero → Story → Gallery → Letter → Ending | 검증 |
|---|---|---|
| FOLD_A | 낮은 뒤 무대 → 실제 입구 측벽 → 이야기 벽 → 게임 선반의 한 면 → 편지 뒷면/지지면 → 처음의 접힘 비율 회수 | 동일 object/geometry 계보·vertex topology·UV·seam. 모양을 바꾸는 중 새 물체로 순간 교체하지 않음 |
| FOLD_B | 앞 무대 → 통로 바닥 → 이야기 바닥 → 갤러리 바닥 → 편지 받침 → 무대 회수 | floor/wall 접속과 두께, normal, 접지와 그림자. 큰 변형은 hinge+smooth bend field로 authoring |
| PORTRAIT_01 | 승인 원화가 Hero 무대에 남음. 카메라는 옆의 안전 통로를 지나감 | 얼굴 픽셀 원본, 평면을 관통하는 카메라 금지, 필요 시 승인 원본 레이어 요청 |
| STORY_PANEL_01/02 | Hero exit부터 실제 내부에 존재, Gate2에서 내용/영상 구현 | 작은 면의 곡률·실루엣·UV가 확장. 영상은 면 내부만, 공간 자체가 전체 MP4로 바뀌지 않음 |
| GAME_* 8개 | 갤러리 내부에 미리 위치, 입구 개방으로 드러남, selected state 유지 | 8 id 고유 실루엣·프리뷰, 원본 route, reverse와 browser back |
| LETTER_FLAP/PAPER | Gate4 별도 신규 오브젝트. 기존 판 모두가 편지로 변했다고 과장하지 않음 | 실제 hinge/fold·click 중단/반전·DOM 원문·닫기/복귀 |

닫힌 종이 모양만 늘어놓는 무대가 되지 않도록, 폭 넓은 곡면·실제 통로·벽 너머의 측면 공간·높이 다른 천장과 낮은 바닥면을 하나의 구조로 연결한다. 판이 화면을 가득 덮은 뒤 갑자기 다음 공간이 나오는 대신, **카메라가 통과하기 전에 목적 공간의 바닥·천장·깊은 개구부가 충분히 보이도록 개방 시간을 앞당긴다.** 안정 Hero부터 틈새로 내부 깊이의 일부가 보인다. 구체 형상은 승인 콘셉트의 Hero만 제작·검수하며, 무의미한 소품 수를 늘려 풍성함을 가장하지 않는다.

### 16.2 영상·실시간·DOM 소유권

Remotion은 웹과 같은 순수 Three scene factory·pose·materials·framing을 import하는 canvas adapter로 프레임을 만든다. 새로운 R3F/@remotion/three 설치를 기본값으로 삼지 않는다. `frame/fps`를 명시 입력하고 texture/환경/폰트 준비·해당 프레임 실제 렌더 완료 전 `delayRender`를 유지한다. 실패는 `cancelRender`·로그로 남긴다. frame 순서를 바꿔 캡처해도 같은 pose인지 비교한다.

video에는 메인 카피·CTA를 굽지 않는다. 인트로 중 영상 속 원화/공간과 실시간 원화/공간은 동시에 중복 노출하지 않는다. 마지막 decoded frame과 live 동일 pose가 준비됐을 때 한 tick에서 픽셀 소유권을 넘긴다. DOM h1/본문/CTA/Skip은 같은 요소로 유지한다. autoplay 거절·Skip·scroll interrupt는 같은 live scene의 entry/현재 scroll pose로 수렴한다. Remotion export가 없으면 fallback만 성공했다고 명시하며 실제 제작 완료로 보고하지 않는다.

모든 공통 입력은 `introTime`, `sceneProgress`, `letterPhase`, `pointer`, `viewportProfile`로 분리한다. 이벤트에 동기화된 영상은 `T_i(p)=clamp((p-a_i)/(b_i-a_i),0,1)*duration_i`로 seek하며 autoplay와 scroll이 동시에 시간을 쓰지 않는다. 최근 seek generation만 유효하고 geometry는 오래된 decode callback에 의해 역행하지 않는다. requestVideoFrameCallback/readyState로 decoded frame을 확인한다. 비사건성 광택 디테일 loop는 명시적으로 별도다.

출력색·tone mapping·exposure·색 텍스처 sRGB/normal linear를 web/export에서 고정한다. 현재 ACES 유지와 대체 tone mapper를 임의 혼용하지 않고 승인 시 look test 하나를 선택한다. PNG 일치와 실제 decoded MP4 BT.709/sRGB 변환 일치를 별도 검증한다. 얼굴·금속·회색·검정 crop을 직접 본다. 1920×1080/1440×900/390×844별 framing을 사용하며 다른 aspect를 cover한 흔적을 fade로 숨기지 않는다. 2 CSS px 윤곽 오차는 초기 점검 목표이며 눈에 보이는 seam이면 수치와 관계없이 불합격이다.

### 16.3 조명·재질의 실측 가능한 계약

명목상 PBR만 붙인 플라스틱 재발을 막는다. 원화 key 방향에 맞춘 넓은 주광, burgundy 반사면, cold depth/rim, 실제 열린 틈으로 들어오는 빛을 구분한다. 금속 단면의 두께·roughness·normal과 넓은 무광 면을 따로 authoring한다. floor reflection은 실제 반사 geometry/공간과 맞고 재질 roughness에 맞는 blur를 가진다. 바닥보다 아래에 반사면을 두거나 model/world matrix를 중복 적용하는 오류를 방지한다.

GI/환경맵을 베이크한다면 각 receiver UV/법선/color space/flip 방향, albedo 포함 여부와 irradiance 단위를 manifest로 고정한다. material을 공유해 다른 면 atlas가 새는 것을 금지한다. 형상 상태별 조명 표본과 스펙큘러 probe가 실제 개방 상태를 반영하는지 검사한다. 같은 source·같은 camera·같은 pose의 authoring renderer와 실제 Three 캡처를 비교해 기술 불일치와 미적 문제를 분리한다. 샘플 수만 올려 조형·열린 공간·구도 문제를 해결했다고 주장하지 않는다.

### 16.4 독립 게임 작업 보존: T0/T1/T2

**T0 승인 후 Hero 착수 전:** 랜딩 기준 24a6ec6에서 새 격리 작업선을 만들고 게임/core/API/Supabase/rhythm/이미지/letter/feedback/언어/route의 파일 hash와 문자열·경로 계약을 고정한다. 기존 후속 랜딩 worktree를 파괴적으로 reset하거나 승인 없는 구현을 채택하지 않는다. 독립 게임 작업의 파일·프로세스·조커 교체를 건드리지 않는다.

**T1 게임 담당 인계본 도착 후:** 사용자 메시지의 3972aa4/ec08555는 미푸시 로컬 커밋으로 취급한다. 이후 최종 SHA/작업 상태/원본 자산/부모 커밋/working tree 포함 여부를 담당의 인계 기록으로 확인한다. 전달 bundle은 프로젝트 밖에서 checksum, `bundle verify/list-heads`, prerequisite, 별도 clone/fsck 및 파일 목록을 검증한다. 현재 원격에 없는 변경을 복원됐다고 주장하지 않는다. 기존 선행 자료에 후속 게임 bundle 언급이 있더라도 이번 직접 bytes 검증을 대신하지 않는다.

**T2 늦어도 Gate3 기능 통합 승인 전:** 확정 게임 기준 G의 별도 통합 branch에 승인된 landing 한정 변경을 적용한다. 공통 app shell/catalog/copy/manifest/lock 충돌은 ancestry와 hunk별 의도로 해결하고 전체 랜딩 branch로 덮어쓰지 않는다. game/core/API/자산은 G와 hash 대조한다. 통합 전후 8게임×2언어, 로비/초대/뒤로/새로고침, 캐치마인드 이중 정답, letter 원문, feedback 링크·문구, rhythm 원본을 회귀 검증한다. 통합 허가나 인계본이 없으면 ‘최신 게임 연결 합격’을 보류하며 시각 QA로 대신 인증하지 않는다.

Hero 격리 구현 자체는 게임 인계 완료를 기다릴 필요가 없지만 **Gate0 승인 전에는 시작하지 않는다.** push·deploy·게임 담당 변경은 이 계획의 승인 범위로 자동 포함되지 않는다.

## 17. Gate0 15개 산출물과 확인 범위

| 원문 Gate0 산출물 | 문서 대응 | 상태 |
|---|---|---|
| 1 프로젝트 구조 | 2 | 원격·분석 HEAD·경로 읽기 확인 |
| 2 Hero 실패 원인 | 3 | 사용자 진단+코드+기존 화면 증거 구분 |
| 3 갤러리 장점 | 2·6·8 | caa 소스 차이 1 import 및 기존 캡처 확인 |
| 4 최소 3개 Hero | 4 | A/B/C 실제 공간 논리 차별화 |
| 5 특징·전환 | 4·5 | 구도/색/재질/빛/geometry/camera |
| 6 추천·이유 | 1·4 | A 추천, 확정·승인 아님 |
| 7 Hero storyboard | 5·16 | H0–H6, 입력/역행/소유권 |
| 8 전체 장면 | 6·16 | S00–S06, 내용 누락 없이 Gate 구분 |
| 9 Remotion·HyperFrames | 7·16 | 각각 다른 실제 제작물 계획, 지금 새 제작 없음 |
| 10 GSAP·Three 구조 | 7·16 | 단일 renderer/pose/상태·cleanup |
| 11 기존 기능 보존 | 8·16 | T0/T1/T2·8route×2언어·담당 보호 |
| 12 신규 자산 | 9 | 장면/크기/형식/alpha/없을 때 제약 |
| 13 성능·모바일 | 11 | 목표와 실측 분리·정적 축소 금지 |
| 14 단계 순서 | 12 | G1–G6 개별 증거+사용자 승인 |
| 15 브라우저 합격 | 13 | 3해상도·9동작·10미적 항목·기능/성능 별도 |

이번에 실제 적용한 작업 지침은 프로젝트 AGENTS의 Ponytail full 및 Library 납품 절차다. Taste/Emil은 가용성·명칭·기존 문서 조사와 다음 단계 적용 계획이며, 이번에 새 모션/디자인에 실행했다고 보고하지 않는다. Playwright는 기존 화면 캡처에 실제 사용했고, GSAP/Three/Remotion/HyperFrames의 새 제작·렌더 완료는 주장하지 않는다. 도구 버전·공식 경로·실제 사용 파일·결과 영상이 연결돼야 후속 Gate의 ‘사용’으로 기록한다.

기존 로컬 결과/문서는 보존했다. 현재 원격 사실과 현재 요청의 승인 경계를 기준으로 이 문서를 독립 작성했으며, 이전 자동 승인 표현은 배제했다. 원문 0–13과 추가 맥락은 다음 요구사항 대조표의 검토 ID로 역대조한다. 대조표는 계획 대응이지 구현 충족 인증이 아니다.

**미확인:** Lusion 2023 지정 구간의 실제 재생, 미푸시 게임 최종본 bytes/플레이, GPU 가속 성능·모바일 실기기·전체 원본 브라우저 영상. 접근되지 않은 영상을 봤다고 보고하지 않는다.

**사용자의 Gate0 계획 명시 승인 대기. 승인 전에는 코드 수정·삭제·패키지 변경·Hero 구현·푸시·배포를 시작하지 않는다.**
'''
# Correct outdated internal future references and semantics.
s=s.replace('상세는 본 절.','상세는 본 절.').replace('제16.1','제7절').replace('제16.2','제4·6절').replace('제16.3','제13절')
s=s.replace('사용자 사용자','사용자')
P.joinpath('PLAN.ko.md').write_text(s)
# Preserve all original 0–13 trace rows; remove prior unrelated follow-up instructions.
t=Path('/workspace/gate0-deliverables/REQUIREMENTS-TRACE.ko.md').read_text(); rows=[]
mapping={'P':'1·12·14','I':'4·6·9','R':'5·10','A':'3·4·5','S':'5·6·16','T':'7·16','G':'12·13·15','V':'11·13','F':'15'}
for line in t.splitlines():
 if not re.match(r'\| (P|I|R|A|S|T|G|V|F)-\d+',line):continue
 cols=line.split('|');prefix=cols[1].strip().split('-')[0];cols[3]=' '+mapping[prefix]+' '
 line='|'.join(cols).replace('부모','사용자').replace('최신 사용자 전달','이번 사용자 원문').replace('사용자 원문·최신 사용자 전달','이번 사용자 원문')
 line=line.replace('앱 신규 실행 미확보를 미검증 표시','기존 앱 캡처와 새 구현 증거 구분').replace('제품 clean·외부문서/허용된기존lock복원·캡처만','제품 clean·외부문서/기존앱캡처만·이번 설치 없음').replace('제16.1','제7절')
 line=line.replace('사용자검수 위임','사용자 명시 승인').replace('사용자 각Gate통과','사용자 각Gate 명시 승인')
 rows.append(line)
extra=[
('C-01','현재 원격 먼저 확인','2','ls-remote 재조회: main b37c10b/landing24a6ec6/games438f50d','원격 heads·조회시점','착수 직전 재확인'),
('C-02','선호 갤러리 caa6d31 기준','2·6','현재 gallery StudioScene과 import 1줄 차이','기존 객체 diff·직접 캡처 관찰','G3 같은 조건 비교'),
('C-03','이전 77개 차이 재검증','2','현재 전체1545, src/public229, 충돌 수와 구분','실제 diff 재집계','통합 hunk별 검토'),
('C-04','미푸시3972aa4/ec08555 안전 보호','8·16','remote 없음; 담당 인계까지 임의 merge/수정 금지','사용자 전달 사실','T1 verify/fsck/hash'),
('C-05','독립 조커 원화 교체 작업 편집·중단 금지','1·8·16','파일·프로세스 소유권 분리','이번 작업은 계획·읽기 전용','T0/T2 보호'),
('C-06','게임과 랜딩 분리·안전 연결 전략만','8·16','게임 G 기준 통합 branch에 landing 한정 변경','새 game 구현 없음','G3 전 회귀'),
('C-07','오프라인 PC와 클라우드 구분·GPU 추측 금지','2·11','현 Chromium SwiftShader 직접조회, 실제 GPU 미검증','existing-browser.json','가속 환경 실측 전 미합격'),
('C-08','허용 범위는 읽기·기존 실행/캡처·공식 조사','1·2·7','이번 설치/코드/패키지/커밋/푸시/배포 없음','status clean·외부 진단','최종 재확인'),
('C-09','접근 못한 영상 봤다고 주장 금지','2·10·17','2023 지정구간 사용자 관찰 기반·직접시청 미완료','페이지 열람/동영상 재생 구분','실제 원본 접근 뒤 분석'),
('C-10','프로젝트 밖 한국어 전체문서+짧은 요약·Library','1·17','읽기 쉬운 PDF에 본문/전체 대조표, 요약 먼저','최종 파일·납품 결과','G0'),
('C-11','메인6.1 sol medium·Luna 단순 조사','1·7','모델변경 주장 없음·메인 아트/기술 책임','스킬 이름독립 조사만','G0'),
('C-12','설치 계획과 실제 사용 분리','7·17','존재/열람/설치/새제작/웹검증 별도','도구명·파일·실행증거 체인','각 Gate'),
('C-13','원문대조·3콘셉트·추천·상세storyboard·위험/자산/게이트','3–17','전체문서 각 표로 대응','이 대조표 및15산출물 표','G0'),
('C-14','계획 승인 전 구현 금지·승인 대기로 종료','1·12·17','사용자 명시 승인만 유효, 이전 위임 문구 배제','문서 승인 상태','G0 이후 Gate별'),
]
for id,req,sec,decision,evidence,check in extra:rows.append(f'| {id} | {req} | {sec} | {decision} | {evidence} | {check} | 명시 사용자 승인 |')
trace='# 원문 요구사항 대조표\n\n2026-10-18 · 원문 0–13절과 추가 작업 맥락을 대응한다. **계획 대응표이며 구현 완료표가 아니다.** 검증 열은 후속 수행 계획이고 이번 확인은 제2·7·17절을 따른다. 승인 주체는 사용자이며 ChatGPT는 총괄 검수·권고를 맡는다.\n\n| ID | 요구사항 | 계획 절 | 구체 대응 | 근거/상태 | 검증 방법 | 승인 시점 |\n|---|---|---|---|---|---|---|\n'+'\n'.join(rows)+f'\n\n총 {len(rows)}개 검토 ID. 개수는 품질·무누락 보증이 아니며 원문 역대조와 사용자 검수를 계속한다. 사용자 계획 명시 승인 대기.\n'
P.joinpath('REQUIREMENTS-TRACE.ko.md').write_text(trace)
summary='''# YEONSEOK ♡ LISBETH — Gate0 검토 요약

2026-10-18 · 계획 전용 · 사용자 명시 승인 대기

추천은 **A. 우리의 접힌 극장**입니다. 승인된 커플 원화를 가장 강한 시각적 중심에 두고, 로즈골드 단면·버건디 반사·차가운 깊이 조명이 있는 실제 3D 공간에서 무대 면이 이야기 벽과 게임 공간으로 연속 변형됩니다. **B. 두 지평의 만남**, **C. 우리 둘의 빛나는 인쇄실**과 구도·재질·전환·위험을 비교했습니다.

현재 원격은 랜딩 `24a6ec6`, 게임 `438f50d`, main `b37c10b`입니다. 기존 Hero는 큰 청록 리본·평면 원화·카피가 경쟁하고, 다음 방이 아닌 표면에 접근하는 구성이 핵심 문제입니다. 선호 갤러리의 중앙/주변 조각·3D 선택 재미는 보존하며 단순 카드 그리드로 바꾸지 않습니다. 기존 후속 로컬 작업도 삭제하거나 승인된 것으로 취급하지 않습니다.

계획의 핵심은 **단일 Three 공간·단일 camera/pose·동일 mesh 계보·실제 열린 통로**입니다. 카메라가 표면 앞에서 멈추는 대신 미리 드러난 목적 공간 안으로 들어가고, 역스크롤은 같은 경로·형상으로 복귀합니다. 원화 얼굴은 재생성하지 않습니다. KO/ES, 8게임 route, 이중 정답, 편지 원문, 건의사항, 데이터/API를 보호합니다.

Remotion은 공유 Three 장면 기반의 짧은 선물 인트로·실제 이야기 영상, HyperFrames는 별도 kinetic typography·게임별 고유 프리뷰·전환 면 디테일을 담당합니다. 두 도구를 각각 실제 제작/웹 연결 증거로 확인할 계획이며 이번에 새 제작했다고 보고하지 않습니다. GSAP는 playhead, Three는 geometry/camera/조명, Playwright는 실제 브라우저 검증을 맡습니다.

승인 후 첫 구현은 **Gate1 Hero와 직접 연결된 진입·공간 전환만**입니다. 1920×1080 실제 원본 브라우저 영상에 최초 진입·등장 전체·안정 Hero·포인터·정방향 스크롤·변형·다음 방 진입·역행·복귀를 담습니다. 1440×900/390×844도 확인합니다. ChatGPT 총괄 검수와 사용자 명시 승인 전 Gate2로 넘어가지 않습니다. 이후 스토리→갤러리→편지→전체 연결→모바일을 별도 승인합니다.

이번에는 제품 코드·패키지·기존 작업·게임 파일을 수정하지 않았고 설치·커밋·푸시·배포하지 않았습니다. 별도 게임 작업의 미푸시 변경은 담당 인계본의 SHA/bundle/파일 hash를 확인한 뒤 독립 통합에서 연결합니다. 이번 브라우저는 SwiftShader이며 실제 GPU 성능을 추측하지 않습니다. 60FPS는 목표이고 실측 결과가 아닙니다.

미확인: Lusion 2023 지정 구간 실제 재생, 미푸시 게임 최종본 직접 검증, GPU 가속/모바일 실기기 성능. 이 항목을 완료로 처리하지 않았습니다.

**Gate0 계획 명시 승인 대기. 승인 전 구현을 시작하지 않습니다.**
'''
P.joinpath('SUMMARY.ko.md').write_text(summary)
P.joinpath('COMBINED.ko.md').write_text(summary+'\n\n---\n\n'+s+'\n\n---\n\n'+trace)
print(json.dumps({'plan_bytes':len(s.encode()),'trace_rows':len(rows),'combined_bytes':P.joinpath('COMBINED.ko.md').stat().st_size},ensure_ascii=False))
