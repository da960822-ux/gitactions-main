# 랜딩 후속 시각 검토와 반영

구현 원본: f805a19f5e64346682687a14e7c611faa2bfe2f4. 실제 production root에서 확인했다. 새 개인 사진/조커/귀족과 게임 구현 파일은 바꾸지 않았다. 중앙 커플 이미지 원본, 색상, 실제 놀이 서사, 여덟 게임 전시, 가느다란 섹션 곡선을 유지했다.

## 편지의 최종 읽기 상태

개봉 중간에는 종이가 봉투에서 올라오므로 서명이 잠시 가려진다. 최종 상태는 본문과 서명이 온전히 드러난다. 정상인 종이의 최종 이동량·봉투 높이를 불필요하게 바꾸지 않았다.1440×900/1280×800과 KO/ES를 조합한4상태에서 글자 Range의 위아래·좌중우 지점이 봉투 면이 아닌 종이에 닿는지 검사하고 실제 PNG도 확인했다. 열린 상단 안내는 «천천히 읽어줘, baby. 너에게 쓴 편지야.» / «Lee con calma, baby. La escribí para ti.»로 바뀐다.

## 봉투의 재질

기존 삼각형 면의 실루엣과 개봉 회전은 그대로 두고 정적128×128 SVG 종이 결을 공유한다. 좌우 면과 아래 접힌 면의 광원 방향/밝기를 구분하고,2–5px 가장자리 두께,1.5/.7px의 접힌 경계 음영/빛, 종이와 봉투의 접촉 그림자를 추가했다. 장미 원본은 바꾸지 않았다.

- 파일: `public/images/landing-preview/envelope-paper-grain.svg`, `src/preview/preview.css`, `LandingPreview.tsx`.
- 실제 확인: `landing-polish-20261011/letter-arrival-ko-1440.png`, `letter-arrival-es-1280.png`, 영상의 KO/ES 개봉 완료 상태.
- 이 캡처는 새 실제 렌더이며 source 이미지나 Lusion 녹화가 아니다. 개인 커플이 포함된 캡처/영상은 공개 Git에 올리지 않았다.

## 인물 중심과 모션 명료도

하트의 위치/색은 유지하고 크기는 로즈골드 약7.7%,핑크6%,펄9.7% 줄였다. 로즈골드 roughness.28/clearcoat.65,펄 roughness.30/clearcoat.65로 강한 백색 광택을 낮췄다. 분홍의 satin 재질은 유지한다.

기존 서로 다른 회전 주기에 작은 포인터 기울기를 합쳐 고정광원 아래 표면 변화를 더 읽을 수 있게 했다. 실물 mesh 좌우 기울기 차이가.18rad를 넘는지 검사했다. software 모드는 기존 세 앞면 포즈를 더 명확히 섞고 좌우 이동 때 대체 포즈 비중이.5를 넘는지 검사했다. 뒷면/연속3D인 것처럼 표현하지 않는다.14px 반발·700ms 복귀, 글자 고정, 인물4px 이동 상한과 canvas1개/화면밖 해제/축소 모션을 유지했다.

성운 위치는 고정하고 밝기만.52/.55/.58 세 단계다. source PNG의 중앙500,180–940,640은 알파0이다. 별 개수를 늘리지 않고 기존 별의 크기1px와 빛/깜빡임 밝기만 조정했다.

- 파일: `heroMotion.ts`, `heroMaterials.ts`, `StudioScene.tsx`, `HeroDecorations.tsx`, 같은 지오메트리에서 재출력한10개 PNG와 layout.
- 실제 확인: `hero-depth-1440.png`, 녹화의 각 하트 접근/이탈 및 좌우 정착 프레임.

## 새 실제 녹화와 범위

[software 실제 홈29.77초](https://drive.google.com/file/d/1Fzt9CQezdIH5hVsxZ8uPRsjqMZJZOGSR/view?usp=drivesdk), [WebGL 동작 확인35.23초](https://drive.google.com/file/d/1BOFt2lqOijR6nX4uh_z3-snmnksE20qG/view?usp=drivesdk). 둘 다 shared false·owner 권한만 확인했다. 각 하트의 실제 중심을 찾아 접근하고 이탈하며 좌우 전체 이동을 보여준다. WebGL 선택 분기는 강제했지만 실제 GPU는 SwiftShader다. 고정광원/실제회전의 동작 확인이며 하드웨어 PC 성능 영상이 아니다.

`record-home-motion.mjs`는 CDP 원본 프레임 간격과 마지막 정적 hold를 보존한다. CFR30 변환은 프레임을 반복할 수 있고 보간/공백 제거/배속은 없다. 원시 JSON·타임스탬프·JPEG·PNG는 비공개 로컬 `/workspace/home-integration-deliverables-20261011/landing-polish-20261011`에 있다.

현재 비녹화 성능 비교는 승인된 옛 단순 히어로와 같은 Chromium/SwiftShader,1440×900/DPR1,6.5초,50ms 포인터,ABBA다. 기준29.98/30.58,현재22.29/22.58 unique rAF/sec,GL clear0,errors0. 평균25.9% 낮으며 GPU 표시 FPS가 아니다. 이번 정교화 전후만 비교한 측정으로 오해하지 않는다. 상용 수준의 실기기 부드러움이나 사용자 최종 시각 승인까지 완료했다고 주장하지 않는다.
