# Yeonseok ♡ Lisbeth — 후반 장면 설계 v2

> 최신 자산 정정: 이 로컬 조사보다 메인 측 승인 정보가 우선한다. 승인 게임말7종(핑크토끼, 살리·술리 두 마리 강아지, 로즈하트 우주인, 말티푸, 랙돌, 판다, 친칠라), 흑수변/백실내 커플사진 조커, 의사/한복 커플 귀족2종을 사용한다. robot ID는 핑크토끼다. 로컬의 옛6종 말·‘－’조커·기존 귀족은 최신 승인본이 아니다. 실제 메인 경로/ID 인수는 EASTER-EGGS.ko.md v3의 목록을 따른다.


2026-10-18 · 설계 전용 · 독립 환경 기준 커밋 `b37c10b5a93d44236a7d5ed5834b817531e8ea39`

## 수정된 전제와 증거 범위

v1에서 단일 봉투 이미지의 한계를 이유로 핵심 개봉을 제외한 판단을 철회한다. 신규 자산 제작은 허용되어 있다. 이번 단계에서는 신규 3D 봉투·편지·표면·카메라를 설계만 하며 제품 코드, 의존성, 신규 자산 생성, 영상 렌더, push·배포는 하지 않는다. 새 문서만 현재 디렉터리에 쓴다.

로컬에서 조사한 기존 제품에는 영상/제작 런타임이 없었다. 이것은 메인 개발 세션의 상태를 의미하지 않는다. 부모가 전달한 최신 사실은 **기존 MP4 7개와 제작 소스 있음, 4 Remotion / 3 HyperFrames, 현재 lightwell만 연결**이다. 영상의 실제 파일명·내용·길이·마지막 프레임은 이 환경에서 확인하지 않았다. 부모가 기존 제작 폴더에서 매핑할 항목으로 기록하며 사용자에게 재업로드를 요청하지 않는다. 아래 R1–R4/H1–H3는 기존 파일명이 아닌 조사 슬롯이다.

기존 원본 조사 결과는 `ASSET-AUDIT.ko.md`, 양언어 편지 원문과 해시는 `SOURCE-SNAPSHOT.ko.md`에 보존했다. 승인 컷아웃은 그대로 사용하며 재승인을 요구하지 않는다. 과거 리듬게임 서비스명은 서사에 필요하지 않고 사용자 확인 질문으로 만들지 않는다.

사실은 한국과 도미니카, 언어 장벽, 도미니카에서 한국 리듬게임에 접속하지 못해 함께 놀 곳을 만들었다는 이야기, 2025-04-04 연애 시작이다. 기존 편지의 통화·가족 도미노 문구도 보존한다. 가상 만남·여행·청혼·결혼 서약·가짜 채팅 기록은 없다. 아래 공간은 사실을 표현하는 추상 무대다. Bruno Simon식 운전/탐색을 도입하지 않는다.

## 연속성의 기준: 같은 표면 속으로 들어갔다 나오는 카메라

주체는 **같은 봉투, 그 안의 같은 종이, 주위를 감싸는 한 장의 버건디 표면**이다. 로즈골드 선은 보조 단서다. 선의 이동만으로 공간 연속성이 충족됐다고 보지 않는다.

Hero 전경 표면이 굽어 양쪽의 낮은 곡면이 되고, 카메라가 그 사이를 지나 한국/도미니카의 거리 공간을 드러낸다. 표면 가운데 접힌 간극을 카메라가 비스듬히 통과하면 표면이 넓은 놀이 테이블로 펴진다. 같은 테이블 위 봉투에 카메라가 접근하고 봉인·플랩·편지 추출을 본 뒤 편지를 정면으로 읽는다. 엔딩에서는 실제 dolly-out으로 종이·봉투·테이블·커플 그림의 앞뒤 관계를 한 번에 다시 보여준다.

필수 공간 증거는 가까운 물체의 전경 가림, 원근에 따른 크기 차, 표면 법선/반사 방향 변화, 카메라 위치와 목표점 이동, 개봉 전후 동일 geometry/재질이다. 무관한 영상 crossfade나 같은 JPG 확대만으로 대체할 수 없다.

게임은 Hero에서 바로 접근 가능하고 기존 여덟 게임 선택 구간을 유지한다. 권장 흐름은 Hero → 게임 선택 → 스토리 → 편지 → 엔딩이다. 게임 선택 동안 무대는 정착하고 일반 DOM rail이 전면을 차지한다. 게임 도달을 긴 영상 뒤로 보내지 않는다.

## 월드·재질·레이어 계약

오른손 좌표, X 오른쪽/Y 위/Z 관객 쪽. 봉투 폭 1.60을 월드 단위 기준으로 삼는다. 테이블 윗면 Y=0, 봉투 두께는 로컬 Z. Perspective camera 기준 vertical FOV 38°, near .05/far 60. 위치와 lookAt을 함께 보간하며 view/projection으로 화면 투영을 계산한다. 아래 좌표는 검토 가능한 초안이며 승인 Hero 좌표계로 일괄 변환한다. 단계마다 좌표계를 새로 시작하지 않는다.

| 오브젝트 | 구조·재질 | 연속성·시각 내용 |
|---|---|---|
| world-surface | 동일 64×32 grid, 폭10/깊이7. 양쪽 fold lobe 높이 .2→1.4→0. 버건디 직조/가죽, roughness .65, rosegold edge 폭 .06 | 정점 인덱스/UV 고정. 별도 plane 교체 금지. 펴지며 직조 원근·접촉 그림자가 변함 |
| envelope-root | 아래 상세의 body/flap/seal/insert 메시. Ivory paper·버건디 wax·로즈골드 foil | 같은 ID/geometry 유지. 봉투 안쪽·종이 두께와 실제 가림 관계 |
| couple-art | 승인 yeonseok-lisbeth-cutout.webp의 알파 plane | 얼굴·의상·비율 보존, plane 변형 없음, 두 사람 분리 없음. 표면에 얼굴을 굽거나 생성하지 않음 |
| country-relief-L/R | 신규 추상 종이 relief 2개. 국가 label은 DOM | 실재 도시나 랜드마크로 위장하지 않음. 같은 표면 두 높은 면으로 거리 표현 |
| play-props | 도미노2개, rhythm bar3개, 연필1개. 기존 게임 미술 색과 매칭 | 게임 상태를 대신하지 않는 장식. 전경 도미노가 봉투 모서리를 일부 가려 깊이 증명 |
| 광원·대기 | 좌상 warm key, 우측 rose fill, 버건디 암부. seeded dust 12–20개 | 읽기 구역 비움. 독서 중 shimmer/반복 움직임 정지 |

배경 #120f19, 버건디 #7b293d, 로즈골드 #d7a18f, 종이 #f4e8d2, 본문 #402935, 밝은 UI #fff0e9. 반사 하이라이트는 오브젝트 경계에 제한한다. 제목은 기존 Gowun Batang, UI/본문은 기존 DM Sans·한국어 fallback. 본문17px/1.75, mobile16px/1.8, max54ch. 서체 추가를 전제로 하지 않는다.

## 장면별 스크롤·표면·카메라 상태

후반 시각 무대의 시작 p=0, 끝 p=1. desktop 기준 약4.8 viewport에 대응하는 시각 진행도이며 편지 DOM 독서의 자연 높이는 별도로 추가된다. 전체 페이지 %가 아니다. wheel/touch 입력을 가로채지 않는다. 무대만 sticky가 가능하고 본문·링크는 정상 흐름이다. 본문을 읽는 중앙 구간은 pose hold, 이동은 진입·이탈 구간에 모은다. 카메라는 위치/target을 함께 보간하며 역스크롤은 동일 pose evaluator를 역평가한다.

| 구간 | camera position → lookAt / 표면 | 구도·풍성한 시각 내용 / 가림 |
|---|---|---|
| S0 p .00–.10 인수 | Hero pose에서 (0,2.4,6.8)→(0,.45,0). lobe .2 | 같은 표면·봉투·커플 plane. 봉투 우하단, 먼 rosegold 광원. 게임 rail 동안 정지. 전경 접힘이 하단8%만 가림 |
| S1 .10–.28 두 나라 | (-.8,1.7,5.5)→(0,.65,0), 이어 (.55,1.45,4.8). lobe .2→1.4, 중앙 간극 .9 | 좌우 relief·국가 label, 깊은 빛의 틈, 틈 너머 작은 봉투. 카메라 truck으로 앞 접힘이 봉투 왼쪽10–15%를 가렸다 드러냄. 함께 있는 커플 plane은 원경. 본문 좌상단 |
| S2 .28–.46 함께 놀 공간 | (.55,1.45,4.8)→(0,.45,-.4)로 통로 진입, 이어 (0,2.8,4.5)→(0,0,0)로 crane-up. lobe1.4→0 | KO/ES 타이포 band가 두 곡면에 나란히 정착. rhythm bar3개는 간극 앞에서 멈춤. 접힌 표면이 table로 펴지며 도미노·연필·봉투 드러남. 가까운 모서리가 프레임을 지나고 카메라가 상승해 상면을 드러냄. 가짜 채팅/에러 UI 없음 |
| S3 .46–.57 놀이 테이블 | (0,2.8,4.5)→(0,0,0), 우측 .45 truck. lobe0/edge fold .08 | 좌하 전경 큰 도미노, 우중앙 봉투, 뒤 커플 plane/rhythm bar. rosegold inlay는 물체 아래에서 실제 가려짐. 사이 안정 영역에 기존 기능설명3개·번역한도·실제 링크. 조작 중 장면 정지 |
| S4 .57–.65 봉투 접근 | (.45,2.8,4.5)→(1,.3,.2)에서 (1,1.25,2.8)→(1,.12,.2). surface정착 | 봉투가 table에서18° 세워지고 foil/wax/종이 두께에 빛이 걸림. 전경 도미노는 아래로 벗어남. 봉인 위 DOM 개봉 button44px 이상. For Lisbeth decal은 참고 자산 기반이며 본문 아님 |
| S5 .65–.79 실제 개봉 | (1,1.25,2.8)→(1,.12,.2)에서 (.85,1.6,2.5)→(.85,.65,.15). surface정착 | q 스코어 적용. seal분리→flap열림→안감/카드edge→편지추출→두패널펼침. camera 상승으로 실제 내부를 봄. 앞판이 카드 하부를 가리다가 점차 reveal |
| S6 .79–.90 읽기 진입 | (.85,1.6,2.5)→(.85,.65,.15)에서 (.4,1.25,3)→(.4,1.25,0). card camera정면 | 펼친 card 사각형과 DOM을 일치시킨 뒤 정상 흐름 독서로 정착. 뒤 열린 봉투/flap과 종이 두께가 테두리로 보임. 카메라·표면·입자 정지. 원문5문단과 서명 전체, 시간제 넘김 없음 |
| S7 .90–1 엔딩 | 독서영역 아래에서 (.4,1.25,3)→(.4,1.25,0)에서 (0,3.1,6.6)→(0,.25,0). lobe0→.15 | dolly-out/crane-up으로 열린 편지·열린 봉투·도미노·커플 plane이 같은 table 위임을 다시 확인. 표면이 낮은 뒤 배경. 2025.04.04/Baby한줄/#games/feedback. 최종 pose hold, 흑전·강제접기·무한orbit 없음 |

표의 연속 카메라 경로는 각 세그먼트 접점에서 위치/target/속도를 연결한다. 통로 진입 중 봉투와의 충돌이나 plane 관통이 생기면 통로 폭·경로를 수정한다. 카메라 clipping을 와이프로 위장하지 않는다. 본문은 desktop 좌측8–43% 또는 상단12–34% 안정 구역에 고정, 오브젝트는 나머지55%를 사용. 편지 장면은 중앙 max760px를 독서에 쓴다.

## 핵심 하이라이트: 신규 3D 봉투와 편지 개봉

### 메시·리깅

- body: 폭1.60×높이1.08, 종이두께 .012, 내부깊이 .045. 뒷판/앞판의 하단·좌우 접힘/입구 안감 별도 mesh. 겹침 여유 .004 이상, 열린 각도에서 내부가 비지 않게 양면 paper material.
- flap: 상단 hinge의 별도 삼각면, 24×12 subdivided grid. 접힘축 .06폭이 휘고 끝은 뒤로 넘어간다. 기존 한 장의 이미지 일부를 회전시키는 방식이 아니다.
- seal: 지름 .22/두께 .025 버건디 wax mesh, 얕은 heart emboss와 rosegold inset. 접착부에서 떨어져 앞판 아래에 남는다. 반지·보석상자 형상 없음.
- insert: 펼침1.44×2.1의 3-panel paper/card mesh. 패널 grid와 두 hinge. 접힌 높이 .70으로 내부 수납. 텍스트를 texture에 굽지 않고 fiber normal/roughness만 사용.
- DOM letter: 기존 landingCopy의 원문 영역 단 하나. 3D card의 마지막 pose가 DOM 영역으로 이어진다. 전환용 원문 복제·스크린리더 중복 없음.

### q=0..1 개봉 스코어

q0=sealed, q1=open. scroll p .65–.79를 q로 매핑한다. click 검토 길이는1.8초이며 동일 evaluator를 쓴다. 독서는 이 길이에 포함하지 않는다.

| q / click시간 | 물리 상태 | 카메라·가림 |
|---|---|---|
| 0–.12 / 0–.22s | wax가 앞 .035 들리고8° 기울어 접착부 분리 | 앞판 유지, 접촉그림자 변화. button press160ms 별도 |
| .12–.36 / .22–.65s | seal아래정착, flap0→165° 개방, 축근처 종이 휨 | camera상승, liner노출. insert는 아직 앞판 뒤 |
| .36–.62 / .65–1.12s | 접힌 insert가 localY +.92 이동 | body앞판의 실제 depth occlusion을 지나 추출. flap열림 유지 |
| .62–.84 / 1.12–1.51s | 두 hinge를 차례로150°→0° 펼침, 접힘부 곡률변화 | 위패널→아래패널. card법선이 camera향해 정렬, 화면밖으로 튀지 않음 |
| .84–1 / 1.51–1.8s | 펼침정착, 잔여변위 .02이하 | DOM corner투영오차2px이하에서 DOM opacity0→1/160ms. backing은 정착 후 본문 자연높이 수용 |

### 클릭·스크롤·닫기·역진행 상태 계약

sealed/opening/open/closing 네 상태. scroll·click 중 마지막 명시 입력 하나만 q를 소유한다. 클릭은 현재 q에서 open으로 진행하며 자동 스크롤하지 않는다. 입력 반전은 현재 q/velocity에서 목표만 바꾼다. scroll이 재개되면 현재 q를 출발값으로 잡아 남은 구간에 연속 재매핑한다. 큰 점프는 목표 pose로 즉시 정착한다. transform을 쓰는 controller는 하나다.

닫기 버튼은 읽기영역 상/하단에서 도달 가능하다. focus가 편지 안이면 먼저 개봉 버튼으로 이동 → DOM시각숨김 → card접힘 → insert수납 → flap닫힘 → seal접착으로 q 역평가. 도중 열면 현재 q에서 반전. 닫은 뒤 같은 읽기 scroll범위에 머무르면 재개봉하지 않으며, 범위를 벗어나 재진입하거나 열기 클릭해야 재개한다. 역스크롤도 긴 편지의 독서영역에서는 q1을 유지하고 그 위 경계를 넘을 때 접힌다. 엔딩에서는 사용자가 닫지 않았다면 열린 모습이 남는다.

원문은 초기부터 DOM에 온전히 있어야 한다. normal-motion 시 sealed 무대와 개봉 버튼을 보여주되 스크린리더/키보드에는 즉시 편지 읽기 경로를 둔다. 이 경로·#papi-letter 직접진입·reduced motion은 즉시 q1과 공개 DOM으로 정착한다. 기존 기본열림/원문보존 검사를 유지하려면 의미상 원문은 기본 공개하고 장면의 시각 opacity만 통제한다. 버튼의 aria-expanded는 실제 원문 공개상태를 나타내며 q를 잘못 대입하지 않는다. 사용자 명시적 닫기 이후에만 원문을 hidden 처리한다. 접근성의 공개상태와 장식 개봉상태를 분리하고 본문 요소를 복제하지 않는다.

## 영상·WebGL·DOM 연결과 실제 책임

공유 pose 데이터는 surface vertex state, body/flap/seal/card transforms, camera pos/target/FOV, light, p/q, 레이어 상태다. 하나의 마스터 진행값에서 파생하며 같은 transform을 두 툴이 쓰지 않는다.

| 기술 | 실제 책임 | 연결·경계 |
|---|---|---|
| WebGL | live surface·봉투·개봉·camera·depth test. 클릭/스크롤/반전/최종상태 | p/q→pose evaluator1개. 메인 세션 runtime을 확인해 사용하며 임의 엔진 중복 설치 없음 |
| Remotion | S1–S5/S7 공간·오브젝트 제작소스, review pose/film export. 기존R1–R4 source 우선 평가 | frame→동일p/q. 편지본문/실제링크/입력상태 소유 안 함. MP4만으로 웹개봉을 대체하지 않음 |
| HyperFrames | 제목·국가label·KO/es-DO band·전환 안무. 기존H1–H3 source 우선 평가 | 동일마스터 시간의 paused finite timeline. camera/봉투transform 쓰기 금지. 최종본문/CTA의 의미는 DOM |
| 기존MP4 | 배경·비상호작용 story film/전환·저성능 대안 | 7개 내용 확인 후 구간매핑. 현재 lightwell 연결은 유지. 임의 파일명/장면 내용 단정 금지 |
| DOM | 실제8게임·이야기·국가명·번역한도·언어·편지원문·개봉/닫기·CTA | poster/영상미준비에도 접근. renderer hit대상과 별개로 button/키보드/터치 정상 |

Hero가 MP4로 끝나면 승인 마지막frame과 후반 WebGL 첫pose를 동일camera/geometry로 맞춘다. 전경 표면이 frame70%이상을 가리는 .15–.25초 구간에서 소유권을 한 번 바꾼다. 전환 전/중간/후에 표면윤곽·subject위치·광원방향을 확인한다. 불일치를 디졸브로 숨기지 않는다. WebGL준비실패 시 마지막poster+DOM독서로 이어간다.

WebGL→영상도 승인 matching pose에서만 한다. MP4 metadata/프레임 준비 후 p→media time을 seek하며 대기요청은 최신목표 하나로 합친다. 역스크롤에서 매frame decode를 강제하지 않고 가용frame을 유지하고 live surface가 전환을 담당한다. 저성능 poster경로도 DOM개봉/닫기와 원문 전체 제공. interactive봉투와 영화속봉투의 외관이 달라지지 않는다.

부모가 기존 영상7개에서 조사할 항목: 실제path/source/poster/duration/fps/resolution, 시작·끝camera/pose, alpha/opaque, baked text, 광원/look, 현재연결위치, 재사용가능구간. 슬롯별 재사용/수정/불일치를 기록한 뒤 신규영상 필요량을 정한다. lightwell은 현재 연결 사실만 확정하며 후반 담당이 임의 교체하지 않는다.

## 기존 재사용과 신규 필요 자산

| 분류 | 항목 | 용도·제작 경계 |
|---|---|---|
| 기존 승인 | public/images/yeonseok-lisbeth-cutout.webp | 같은couple plane, 얼굴/비율그대로, 재승인요청없음 |
| 기존 원본 | portrait JPG, envelope PNG/WebP, universe/sky, game atlas/실제thumbnail, fonts | look·foil/wax참고, fallbackposter, 기존게임표시. 단일봉투는 개봉mesh를 대신하지 않음 |
| 기존 메인 제작 | MP4 7개 + 4Remotion/3HyperFrames source | 먼저조사·재사용. 로컬에없다는 이유로 다시 만들지 않음 |
| 신규 필수 | body/front-fold/liner/flap/seal/insert mesh와rig 1세트 | 실제개봉/역개봉. 현재 제작은 하지 않음 |
| 신규 필수 | unlettered paper fiber normal/roughness, wax/heart emboss, foil decal | 원문과얼굴은 신규생성없음. PBR만설계 |
| 신규 필수 | 변형surface grid1개+relief lobe pose | Hero→거리→table 동일topology/UV |
| 신규 최소 | domino pair/rhythm bars/pencil | 기존모델있으면재사용, 없으면단순mesh. 기능과구별 |
| 조사 후 판단 | 후반film/export/poster | 기존7개 매핑 후 빈구간만제작. 전체재렌더부터하지않음 |

## 카피·기능 보존

신규 제안의 웃음 규칙은 사용자 직접 정정을 따른다. 한국어 웃음표현은 필요할 때 `ㅋㅋㅋ`, Lisbeth에게 건네는 말은 `haha` 우선이며 스페인어라고 `jajaja`로 바꾸지 않는다. 웃음을 모든 문장에 붙이지 않는다. 기존 편지 원문은 이 규칙으로 수정하지 않는다.

최신 문체 기준과 후반 소개문 임시안은 `EASTER-EGGS.ko.md`의 “문구의 출처와 말투”를 따른다. 이유 → 만든 행동 → 함께 놀고 싶다는 확인된 동기 → 짧은 질문의 순서로 장면 S1/S2에 나눠 배치한다. 부모가 전달한 표현 특성만 사용하고 개인 사건·감정 강도·자책·갈등은 가져오지 않는다. 실제 평소 말투 검증 완료로 표시하지 않는다. 기존 편지는 그대로다.

엔딩: “우리 시작, 2025.04.04 / Desde el 4 de abril de 2025”, “Baby, 오늘은 뭐 할래? / Baby, ¿qué jugamos hoy?”, 기존 primaryAction→#games, ideasAction→/feedback. 새es-DO는 검토초안, 기존편지수정없음.

landingCopy[language]의 letterAddress/letterTitle/letterBody[0..4]/letterSignature를 한 글자도 바꾸지 않는다. 기존 Mami/Papi도 보존한다. language state는 Landing한곳, 저장키dos-language, document lang ko/es-DO. 언어변경은 q·열림·독서위치 유지, DOM높이만 자연 재배치. 글자를mesh/MP4에 굽지 않는다.

실제8게임 davinci/catchmind/domino/jaipur/splendor/minhwatu/marble/rhythm 및 /play?game=<id>, #games, #papi-letter, Catchmind번역·원문·한도설명, /feedback 보존. 번역을 모든게임 기능으로 확대하지 않는다. 모바일Jaipur예외와 기존서비스·보안·free-tier정책 변경없음.

## 반응형·접근성 구도

| 조건 | 무대·카메라 | 읽기·입력 |
|---|---|---|
| 1440×900 / 1920×1080 | FOV38°, content max1240, 무대55–60%우측. 근경모서리·도미노는하단/옆 | 본문17px, 편지max760px. 44px개봉/닫기. 전체원문자연높이 |
| 768×1024 | camera거리×1.18/FOV42°, 위본문·아래무대. relief는좌우+앞뒤배치 | 편지W−48px, 버튼·card투영분리, 게임rail정상흐름 |
| 390×844 | 짧은camera경로, lateral .25와가림유지. 봉투폭 .76W/card .90W. lobe최고 .55 | 이야기→무대단일열, 편지W−40px/padding20px, 열린뒤sticky해제. 그림/CTA수직 |
| 200%확대/짧은landscape | 고정높이제거, scene짧은block, 장식이동축소 | 원문정상흐름, title2–3줄허용, 본문clamp없음 |
| reduced-motion | 국가·table·열린편지완성pose. dolly/표면휨/입자loop제거 | 개봉/닫기즉시또는opacity≤160ms, 원문즉시접근 |
| WebGL실패/저성능 | 기존poster/MP4사용, 무거운scene정지 | DOM개봉/닫기/full letter, 로딩이게임·독서의필수대기아님 |

장식은 aria-hidden. 국가점/장식에 가짜focus없음. button44px, 기존focus윤곽보존, aria-controls는 단일편지영역, expanded는 실제공개상태. 원문은 접근성트리에1회, scroll매frame announcement없음. 본문뒤하이라이트제거. 한국어glyph/fallback·ES악센트·contrast는실제검증예정.

## 구현 파일 소유 경계·Hero 인수

현재수정은 이 설계디렉터리뿐. 승인후 Hero담당=HeroScene.tsx/hero-scene.css/Hero test. 후반UI담당=신규PostHeroStory.tsx/post-hero-story.css 및 LandingMoments.tsx/landing-moments.css/후반test. 부모통합담당=Landing.tsx/home.ts/공유scene controller·pose데이터·shared CSS. 게임담당=GameRail.tsx/game-rail.css. 영상담당은 메인세션의 기존제작폴더에서 source수정. 다른폴더를새로만들어런타임중복하지않는다. 엔진·방·RLS·원본이미지는후반편집영역밖.

Hero인수값: object IDs/mesh·material refs, world축·단위, camera pos/target/FOV/near/far, surface vertex pose, envelope body/flap/seal/card local transforms, light/exposure/color space, 승인couple source/비율, 마지막MP4time/poster, 첫WebGL ready pose, occlusion순서, p/q소유권. 최종Hero에3D봉투가없으면 물리형상/pose가같은bridge를제작설계하며 문서만으로무조건이미맞는다고주장하지않는다. 공유파일은부모가통합한다.

## 합격 기준·남은 통합 확인

1. 설계승인: S1거리/S2표면통과/S5개봉중간/S6읽기/S7전체공간의5key pose에서 camera·surface·occlusion증거가보임. 단순선이동/JPG확대만이면불합격. Hero pose와7영상매핑은부모가소스로확인.
2. 저비용proof: 고비용렌더전에640px스틸과2초개봉preview. q0/.12/.36/.62/.84/1및역순. seal/flap/insert관통·순간이동·앞뒤반전없음. 동일봉투외관유지.
3. 영상/WebGL경계: 전/중/후 silhouette와card corner평균오차2px이하(1440기준), exposure점프없음. 불일치는source pose수정으로해결하며crossfade길이로숨기지않음.
4. 입력: sealed→click→scroll반전→재클릭→닫기→역scroll→재진입에서q연속·controller1개·사용자닫기유지·scroll잠금없음. 큰jump지연없이정착.
5. 원문·기능: 양언어5문단/주소/제목/서명일치, DOM1개, focus회수, 언어변경시열림·위치유지, 직접anchor즉시독서, 실제8목적지·Catchmind/feedback정상. 기존원문test유지하고새상태전환검증만추가.
6. 구도: 1440×900/768×1024/390×844 양언어·200%·reduced-motion에서얼굴둘/본문잘림·가로넘침없음. 버튼위3D가림없음. 44px목표/명확focus.
7. 성능·실패: 대표desktop60fps목표,30fps미만지속시효과축소. seek최신요청1개, decode실패/context loss에도게임·편지DOM정상. 모두목표이며아직측정하지않음.

남은것은 사용자질문이아닌 부모의기존소스조사·통합사항이다: 새Hero최종pose,7개영상/source매핑, 메인WebGL runtime, camera/color pipeline일치, 신규es-DO·폰트·장치시각검증. 승인컷아웃과과거게임서비스명은미확인목록에서제외한다.

실제적용지침: Ponytail full(최소편집/원본조사/한계), couple-games-landing-design(그림·8게임·양언어·실제CTA·접근성), HyperFrames core(단일paused유한결정timeline), animation(레이어·시간소유권), keyframes(동일주체중간pose/가림/최종hold/역seek). 사용자최신요구가일반간소화선호보다우선한다. Remotion skill은이환경에없으며실행했다고주장하지않는다.

완료증거는 새로컬설계와기존원문·자산조사다. 신규제작·렌더·제품실행검증은하지않았고 위합격기준은이후검증계획이다.
