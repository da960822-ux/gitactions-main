# 후속 게임 통합 — 로컬 검증본

최종 전체 완료본이 아니다. 원래 랜딩`1cf833215196aa68b68b062d5a01e3c1b01f7530`과6a통합worktree의`3b3f2700f9ca58ae72ddf51b908a39b6e577f39a`를그대로보존하고, 별도`/workspace/gitactions-game-integration-b4c9f28`, `local/game-integration-b4c9f28-20261012`에서후속게임delta만통합했다. 원격branch`games/desktop-improvements-20261011-8c90594-379a58`이 exact **b4c9f28b22f7dae3e114ddf6a78a6a72d2f930ee**인것을확인했다. 공통조상6a4d21f 이후06d5586/b4c9f28의29파일변경을대조했다. 로컬통합자의외부code push·배포·DB변경은없다.

이전`LOCAL-GAME-INTEGRATION-2026-10-12.ko.md`의ed26전달대기/살리술리미연결/영상승인대기는당시기록이다. 후속게임원격전달과살리술리canonical연결,두영상비공개전달은이제성공했다. 원격의`DESKTOP-FUNCTIONAL-INTEGRATION-2026-10-12.ko.md`는다른실행기의12b통합기록이므로그테스트수치를이번검증으로쓰지않는다.

## 후속 변경과 충돌

- Catchmind:기존엔진의논리적strokeId/segmentIndex계약으로전송대기열을복원한다. 실패한배치/색/폭과확정전임시그림을유지하고명시재시도를제공한다. 전송중ACK가배치를제거해도다음배치를잘못삭제하지않는다. 방/좌석/라운드/단계/deadline변경시과거그림을새판에전송하지않는다. 설정snapshot이작성중설정을반복덮는경로와지우개해제의흰색펜을복원했다. 기존272단어/6주제·양언어정답·힌트공백·서버clock/CAS·채우기회귀를보존한다.
- Marble:주사위620ms→칸이동→도착640ms와CSS타이밍을일치시킨다. 중복재경기버튼을정리하고저장된판의경제/도시/사건버전및현재실제건물자산에맞는도움말을쓴다. 기존40칸/24도시·legacy18·가격/임대/순서/기존6말ID/두사람동의규칙은보존한다.
- Splendor:점수동점이지만개발카드수가적어승자가정해진경우에만KO/ES이유를표시한다. 기존카드비용/점수/판정·비공개예약·동일snapshot효과를보존한다. 승인귀족두이미지의private-host주입을table/방문공지/모션/도움말에연결하는resolver만준비한다. 실제개인이미지는없다.
- 살리·술리:기존6종뒤의일곱 번째단일ID에승인된WebP를연결한다. 새로운위치/주사위/차례를추가하지않는다.

충돌은2파일이었다. `docs/PRIVATE-GAME-ART.ko.md`는기존제한local env조커주입과최신runtime/noble주입설명을함께유지했다. `MarblePawn.test.tsx`는새실제canonicalSali/Suli img검증과기존6저장ID보존검증을합쳤다. `private-game-art.test.ts`는사라진임시Sali private주입API대신신규private noble입력으로검증을맞췄고, 제한local Joker env검증은그대로다. 사용자승인연결을중복으로재구현하거나새그림을만들지않았다.

## 실제 bytes와 개인 그림 경계

canonical원래32개WebP의파일내용/SHA256/메타데이터는3b3f270과전부같다. 새`public/images/marble/premium/pawns/sali-suli.webp`는**29,794bytes**, **232×256RGBA**, SHA256`fdcada517e081847686eb4bfc9f51cb54adf71a158692fbc37bd6f4ab7c3b98e`다. source519dcdf의원본PNG2,008,991bytes/SHA256`05c637e38bdd22187f1cf9984c8874e589155c322ac6f2ba03b6b64e23ba7560`와source provenance를확인했다. 원본은저장소밖private-input에보존했고임의재편집하지않았다.

현재33WebP총**2,236,776bytes**. public canonical/diorama/common-stage/pawn의33경로집합이일치하고모든파일의SHA256/bytes/크기/RGBAdecode/transparent alpha가검증됐다. 일곱말manifest는모두실제이미지경로를가진다. 살리·술리둘이하나의받침대/한말인원본픽셀을검사했지만게임내축소화면/이동품질합격과는구분한다.

개인4PNG는Drive metadata와raw-file참조를확인했으며owner하나/sharedfalse였다. 소비실행기의로컬다운로드는초기및원인확인1회재시도모두**URLError: Tunnel connection failed:403 Forbidden**였다. 이실행기에개인4그림bytes는0,픽셀미확인·실제주입미완료다. 다른endpoint/공개upload/proxy제거로우회하지않았다. 원본Drive IDs·임시전송URL·개인bytes는Git에추가하지않았다. 기본조커－와원래귀족얼굴/engineID/비용/점수는유지된다.

## 이번 검증과 전달

현재 source의TypeScript/Vite/generated Edgebuild및diff공백검사통과. 전체Vitest JSON은**55실제파일·490테스트통과·실패0**이다. 과거6a의55파일483,게임환경의53파일484와합산하지않는다. Vite큰chunk경고(PlayApp501.59KB,Three571.04KB)는남는다.

랜딩/preview/copy/Router/FeedbackRoute/home이미지/원본커플,원본화투·스플렌더카드/귀족·RhythmSWF, Catchmind엔진/topics/words/dictionary·client/Edge action·기존migrations의17그룹231파일은1cf8332와동일한것을Git diff로확인했다. f0/5f/1c/1cf/6a조상과이전worktree는보존된다. 실제개인그림이없는상태의UI/규칙회귀결과이며새그림표시성공을뜻하지않는다.

요청한WIP137비교MP4와최신1cf8332MP4두개는같은계정My Drive에성공적으로저장했다. 사전동명검색은0건,각파일readback에서owner da960822@gmail.com하나/sharedfalse/각6,045,348·6,031,862bytes일치확인. 공개sharing권한을만들지않았다. 두영상은히어로포인터/첫scroll비교녹화이며전체갤러리/편지를한번에보여주는새전체페이지녹화라고주장하지않는다. 최신영상의대표/연속프레임검사는앞선랜딩검수이고,부모의전체영상최종시각판정은별도다. URL/상세전달기록은repo밖`video-delivery-20261012.json`에만보존한다.

증거:`/workspace/game-integration-b4c9f28-deliverables-20261012/{tests.json,asset-audit.json,integration-audit.json}`, 비공개입력상태:`/workspace/game-integration-private-inputs-20261012/manifest.json`. 새코드의최종Luna2세션실플레이/개인4그림적용/실기기GPU·물리음향·운영Auth/Realtime·네트워크유실경기/전체승패특수분기화면검수는남는다. 모든이미지와요청수정이끝난뒤Luna검수를실행해야한다.
