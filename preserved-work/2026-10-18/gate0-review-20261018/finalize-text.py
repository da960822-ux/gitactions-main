from pathlib import Path
P=Path('/workspace/gate0-review-20261018');s=P.joinpath('PLAN.ko.md').read_text()
s=s.replace('사용자 검수 위임·자동 진행·후속 구현 승인 문구','이전 승인 주체·자동 진행·후속 구현 허용 문구')
s=s.replace('이후 허용된 기존 lockfile 복원으로 설치한 실제 버전은 제2.3절에 기록했다.','이번에는 설치·업데이트하지 않았으며 선언 범위와 실제 사용 버전을 혼동하지 않는다.')
s=s.replace('Playwright / 시스템 설치 확인, 빈 페이지 진단 실제 실행','Playwright / 기존 앱 1920 캡처 실제 실행')
s=s.replace('직접 `ls-remote` HEAD `f624f37a8c650b9cc550253104925efe4c8de246`. upstream 현재 기본 이름 `design-taste-frontend`, 로컬은 기존 `gpt-taste`. 둘을 같은 버전으로 소개하지 않는다.','공식 README와 공개 원본에서 정확 설치 이름 `gpt-taste`, 파일 경로 [skills/gpt-tasteskill/SKILL.md](https://github.com/Leonxlnx/taste-skill/blob/main/skills/gpt-tasteskill/SKILL.md)를 확인했다. 기본 `design-taste-frontend`와 별개다. 로컬 지침도 이번에 읽었지만 random mock·AIDA·stock/bento 강제는 사용자 요구보다 우선하지 않는다. 설치나 전체 workflow 실행은 하지 않았다.')
s=s.replace('HEAD `d0da232ec96d5178b1d18bd1c6b155e4cbada6ea`.','이전 조사 HEAD를 이번 최신 버전으로 재사용하지 않는다.')
s=s.replace('Luna 초벌 조사에서는 HyperFrames OSS 출처를 찾지 못했지만 메인이 위 공식 repo를 추가 검증하여 보완했다. 그래서 초벌의 ‘클라우드 서비스로만 취급’ 결론은 최종 계획에 채택하지 않는다. 사용량/로그인 가능성은 여전히 미확인이다.','Emil 공식 원본 5개 경로는 `skills/{animate,review-animations,animation-performance,emil-design-eng,prototype}/SKILL.md`이며 이번 독립 조사로 가용성을 재확인했다. 새 프로젝트 적용·설치·모션 리뷰를 수행했다는 뜻은 아니다. HyperFrames cloud 사용량/로그인은 미확인이다. 공개 CLI와 기존 설치를 우선 활용하고, 계정 연결·유료 제작이 필요해지면 실제 필요사항과 비용을 구체화한다.')
s=s.replace('최종까지 진행하라는 승인이 있어도 각 Gate 실제 증거와 사용자 명시 승인를 생략하지 않는다.','이번 승인은 자동 완성 지시로 해석하지 않으며, 각 Gate의 실제 증거와 사용자 명시 승인을 생략하지 않는다.')
s=s.replace('아직 실제 개별 화면을 분석했다고 보고하지 않는다.','공개 페이지 텍스트·목록의 열람과 개별 영상/회원 화면의 시각·모션 분석을 구분한다.')
marker='Bruno Simon은 reference·이미지·코드·구도·모션 분석 모두에서 제외한다.'
extra='''이번 공식 페이지 확인 범위도 남긴다. [Codrops](https://tympanus.net/codrops/)에서는 Three.js/GLSL 브라우저 영화 및 GSAP 타이포 사례 목록을 확인했다. [Nicelydone](https://nicelydone.club/)에서는 화면·컴포넌트·전체 흐름의 분리와 탐색 구조를 확인했다. 우리 적용은 게임 선택과 진입을 분리하고 nav/언어 접근성을 유지하는 UX 판단이며 SaaS 레이아웃을 복제하지 않는다. [Refero](https://refero.design/)는 이 도구의 텍스트 추출이 비어 개별 화면 분석은 미완료다. [Paired](https://www.paired.com/)와 [Life360](https://intl.life360.com/) 공개 페이지는 열람했지만, 친밀함·거리 연결이라는 맥락만 참고하고 상담·질문·위치추적을 새 기능으로 소개하지 않는다. Lazyweb/WebsitePrompts.ai/InspoAI는 제공 명칭의 사이트 접근을 시도했으나 이 도구에서 열리지 않아 구도·타입·모션을 보았다고 주장하지 않는다. Inspo MCP는 현재 도구에서 찾지 못했다. 이 후보는 후속 reference board의 미완료 조사 항목으로 남기며 부재 때문에 핵심 효과를 제거하지 않는다.

Lusion 공식 페이지와 Landing Love 소개는 이번에 열람했다. 원본 후보 `cdn.landing.love/videos/lusion.mp4`는 이 도구에서 접근되지 않았다. 따라서 위 타임코드 표는 **사용자 제공 분석을 요구 검증으로 옮긴 것**이고 원본 실제 시청 완료가 아니다. 접근 가능한 원본을 확보하면 Gate1 시각 비교 전 지정 구간별 카메라/법선/오클루전/오브젝트 계보를 프레임 단위로 재검토한다.

'''
s=s.replace(marker,extra+marker)
P.joinpath('PLAN.ko.md').write_text(s)
P.joinpath('COMBINED.ko.md').write_text(P.joinpath('SUMMARY.ko.md').read_text()+'\n\n---\n\n'+s+'\n\n---\n\n'+P.joinpath('REQUIREMENTS-TRACE.ko.md').read_text())
# Documentation rendering only. Reuse established renderer without any dependency installation.
script=Path('/tmp/render-gate0-doc.py').read_text().replace("root=Path('/workspace/gate0-deliverables')","root=Path('/workspace/gate0-review-20261018')").replace("'YEONSEOK-LISBETH-GATE0-PLAN.ko.md'","'PLAN.ko.md'").replace('font-size:8px;line-height:1.55','font-size:9px;line-height:1.6').replace('GATE0-REVIEW.ko.html','GATE0-PLAN-REVIEW.ko.html')
exec(compile(script,'render-doc','exec'))
print('TEXT_AND_HTML_READY')
