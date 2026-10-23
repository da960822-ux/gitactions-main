# 랜딩 보존 게임 통합 — 검증용 로컬 분기

**후속 상태:** 이 문서는6a4d21f/3b3f270시점의이력이다. 최신b4c9f28 delta와살리술리연결/490회귀/영상전달은 `LOCAL-GAME-INTEGRATION-B4C9F28-2026-10-12.ko.md`를읽는다. 원래6aworktree는당시상태로보존했다.

전체 게임 요청의 최종 완료본이 아니다. 별도 `/workspace/gitactions-game-integration-6a4d21f`, `local/game-integration-6a4d21f-20261012`에 랜딩 **1cf833215196aa68b68b062d5a01e3c1b01f7530** 위로 원격 게임 **6a4d21f046843abc10d07ad3819845d51fea3a6c**를3-way 통합했다. 요청 원격 `games/desktop-improvements-20261011-8c90594-379a58`의 SHA가 정확히 일치함을 확인했다. 공통 조상은8c90594a8e1345ee6870aa504d97d4b716b00493이다. 게임 담당의 추가 누락 수정과 모든 개인 그림을 수령한 뒤 최종검수를 해야 한다.

원래 `/workspace/gitactions-home-integration`의1cf8332와 `/workspace/gitactions-main`의51a9ee3를 변경하지 않았다. 외부 push·공개·배포·DB/migration 실행·영상 업로드를 하지 않는다. 현재 개인 영상의 Drive 승인은 응답 대기이며 재시도하지 않았다.

## 선별 범위와 원본 보존

원격의8c 이후119파일을 대조했다. 새 game UI/도움말/Marble route3·7번째말/approved canonical 자산 renderer/개인 runtime config와 이에 필요한 테스트·문서·private ignore만 게임 분기에 합쳤다. f0/5f의 이미 동일한 수정은 다시 덮어쓰지 않았다. 최종 landing 대비 실제 변경은40파일과 이 통합 기록이다. 생성 Edge 엔진은 통합 source로 다시 build했다.

초기 **f0c6d01a53eeac96cb4d55804689b6724bfc184e**, Catchmind **5f7e75d3602365e081e9f59bf585f05bf812cfea**, 기존 pawn **1c20ea3d47517c656d3f52205c1992228bc1940e**는 랜딩의 조상이므로 통합 뒤에도 조상으로 보존된다. `src/app/CatchmindTable.tsx`, `src/games/catchmind.ts`/topics/words/dictionary, `src/core/client.ts`, 실제 Edge action handler, `TableGames.tsx`, `SplendorMotion.tsx`, `marble-motion.ts`는1cf8332와 동일하다. 따라서 기존 채우기·주제/타이머/양언어 정답·마스크 공백 보정·스플렌더 중복 snapshot·Marble 경로 보정 시간축의 소스를 보존했다. 새 대조에서 발견된 미포함 기능까지 해결됐다고 확대하지 않는다.

랜딩/preview/copy/Router/FeedbackRoute/기존 home 이미지/원본 커플 WebP, 원작 화투·스플렌더 카드/귀족·Rhythm SWF, canonical premium32와 기존 migrations의22그룹268파일도landing과 동일한 것을Git diff로 확인했다. 조커/살리·술리 외부 경로는 room state에서 읽지 않는다.

## 일곱 충돌의 해결

| 충돌 파일 | 해결 |
|---|---|
| `.gitignore` | 기존dist-preview/private-assets와새private-game-art를모두유지 |
| `src/app/DaVinciTable.tsx` | 최신trusted runtime config/컴포넌트 prop 주입, 읽기 실패 시중립－, 숨긴 상대 타일의이미지 DOM/URL 제외. 기존 제한된local env 설정은아래helper에서유지 |
| `src/app/DaVinciTable.test.tsx` | runtime/prop 주입과상대숨김회귀를보존. local env경로/미전달회귀는private-game-art.test로추가 |
| `src/app/MarblePawn.tsx` | 기존6저장ID순서와SVGfallback을유지하고최신이름/canonical6raster/살리·술리한ID를추가 |
| `src/app/MarblePawn.test.tsx` | canonical/일곱 번째미전달표시/private주입회귀와원래6ID보존검증 |
| `src/app/beginner-guides.ts` | 현재실제조작의준비/선택/추측/확정/취소를설명하는최신KO/ES도움말 |
| `src/styles/davinci-premium.css` | 기존공통portrait스타일과f0레이아웃을유지하고동일media선언중복을제외. 결과는기존landing CSS와같음 |

`private-game-art.ts`는host의runtime/provided prop을우선사용하고,색별미주입시에만기존VITE_DAVINCI_BLACK/WHITE_JOKER_IMAGE의제한된`/private-assets/davinci/<name>.(webp|png|jpg|jpeg)`를사용한다. 이env fallback은외부URL/경로이동을거절한다. 실제개인파일이나URL을repo/room상태에추가하지않았다. runtime호스트의인증이미지/blob주입과기존local경로중하나만선택해없애지않는다.

## 실제 자산 경로와 미전달 상태

`public/images/marble/premium/manifest.json`의도시24·공통건물2·기존말6,총32WebP를각각SHA256/bytes/크기/RGBAdecode/transparent alpha로확인했다. 총**2,206,982bytes**이며원본ccec83d와최적화ac25936의기존승인자산이다. 새그림제작/재압축은없다.

- 도시:`public/images/marble/premium/cities/*.webp`24개. 실제경로전부는로컬assets-and-private-state.json의rendererPaths와public canonical manifest에있다.
- 공통건물:`public/images/marble/premium/buildings/stage1-house.webp`, `stage2-apartment.webp`. route3의1/2단계에는동일raster형태를도시색SVGfilter로사용한다. 실제tint픽셀의게임화면검수는아직미실행이다.
- 기존6말:`public/images/marble/premium/pawns/{maltipoo,ragdoll,panda,astronaut-rose-heart,lisyeon,chinchilla}.webp`. fox/cat/penguin/astronaut/robot/dragon저장ID는유지한다.
- `public/images/marble/dioramas/manifest.json`과`pawns/manifest.json`의유효32렌더참조집합은canonical32경로와정확히같다. 건물메타데이터크기도실제decode크기와일치한다.
- 살리·술리:`sali-suli`는일곱 번째단일말선택/서버허용/기존턴·위치/private주입코드만있다. manifest `path:null, applied:false`; 기본이미지없이S·S/그림준비중표시. 새승인그림의bytes미전달이다.
- 새개인조커2개/귀족2장도bytes미전달·미적용. 기본조커－와기존귀족10장/비용/점수mapping을유지한다. 두private디렉터리의local/tracked개인파일은0개다. Library전달을이번작업에서재시도하지않았다.

## 이번 검증과 다음 통합

통합후 `npm run build`의TypeScript/Vite/generated Edge 통과, `git diff --check`통과. 전체Vitest JSON결과는**55실제파일·483테스트통과·실패0**이다. JSON의numTotalTestSuites119는nested suite까지포함하며파일수와다르다. 신규private주입compatibility3회귀와기존6ID보존1회귀를포함한다. 이수치는다른환경의53파일483테스트나이전게임소스의50파일466결과와합산하지않는다. 기존Three571KBchunk경고는남는다.

세부로컬증거:`/workspace/game-integration-deliverables-20261012/tests.json`, `assets-and-private-state.json`, `integration-audit.json`. 새인게임스크린샷/상용품질판정/최종Luna플레이증거는작성하지않았다.

**추가게임대조결과대기:** 부모가다른환경의로컬`games/local-integration-20261012`, **ed26cb9**를보고했다. Catchmind전송대기열·논리적선ID·ACK경합복원, Marble620/640ms연출·중복재경기버튼·현재자산/버전별도움말, Splendor동점승리이유KO/ES가추가됐다. 아직해당변경의원격새SHA/bytes를수령하지않았고이통합에포함하지않았다. 원격확정SHA수령후6a→후속delta만현재랜딩/게임보존상태에선별추가통합해야한다. 신규디자인을만들지않는다.

부모의후속보고에따르면ed26cb9외부push지시는자동승인검토에서거절되어새원격SHA가없다. 이는**전달승인대기**이며이통합기의빌드/테스트실패가아니다. 다른경로/브랜치/공개upload로전송을우회하지않는다.7d01b62는6a4d21f까지만통합한merge commit이다.

새직접사용자포괄승인후기존비교원본video업로드를요청범위에서1회재시도했지만자동승인검토가다시거절했다. 사유는‘all development-related permissions’승인은있지만sensitive egress에필요한specific payload/destination식별이부족하다는것이다.기존개인영상metadata의owner da960822@gmail.com/shared false를read-only확인했으며새파일/공개권한은생성하지않았다.최신1cf8332녹화는`/workspace/home-integration-deliverables-20261011/unified-space-20261011/video-path-cleanup/after-fixes-actual.mp4`,비교WIP137은`video/before-wip-actual.mp4`에그대로보존한다.거절후수정본업로드나우회호출은하지않았다.

최종Luna두사람실플레이는모든이미지와요청수정이끝난뒤다. 실제운영Auth/Realtime/두기기/물리음향과새자산tint·말공간·전체게임최종픽셀검수도이번자동검증범위밖이다.
