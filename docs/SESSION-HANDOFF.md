# 작업 인계 — 2026-10-23

## 현재 상태

- 비공개 저장소의 개인용 한국어·스페인어 게임 앱입니다. 현재 통합 기준은 `main`의 `7634634`; 정리 병합은 아직 진행 중입니다. 새 작업 전 `git status`와 브랜치를 확인하세요.
- 다빈치 코드, 캐치마인드, 도미노, 자이푸르, 스플렌더, 민화투, 부루마블, 뮤직톡톡의 8개 게임과 승인된 홈 구성을 보존합니다. 별도 요청 없이 기능을 제거하거나 게임 수를 바꾸지 않습니다.
- 디자인 승인과 자동 검증은 구분합니다. 현재 보드 검수와 명시된 미검증 범위는 관련 `docs/GAME-READINESS-*`, `docs/GAME-POLISH-*`, `docs/VERIFICATION.md`에 있습니다. 최신 문서의 증거만 현재 결과로 인용하세요.

## 시작과 검증

```sh
npm ci
npm run dev
npm test
npm run build
```

Supabase 공개 빌드 값이 없으면 앱은 같은 브라우저에서만 동작하는 연습 모드입니다. 기존 Supabase project `yeonseok-lisbeth-games` (`yqswgvqkqofxcfypvbbi`, Singapore `ap-southeast-1`)에는 여덟 migration을 Dashboard SQL transaction으로 적용했고 13 tables/RLS/grants/Realtime/cron/월 400,000자 cap을 원격 확인했습니다. Anonymous sign-ins, canonical `action`/`shared-event` 배포, restricted Google Translation key secret도 설정되어 있습니다. 별도 두 브라우저의 익명 사용자로 방 생성/참가, 양측 Catchmind 선택, KO↔ES 일반 채팅 번역과 원문 표시를 확인했습니다. 단, Site revision 18은 아직 이전 demo이며 Site env revision 1에 public 값이 설정된 상태에서 새 production build/publish가 대기 중입니다. 이 검증 결과는 현재 배포된 Site 확인과 구분하세요. Dashboard 적용은 CLI migration history를 만들지 않았으므로, 링크 후 [배포 안내](DEPLOYMENT.md)의 `migration repair --status applied` 절차를 거쳐야 합니다. 비밀키나 publishable key의 실제 값은 문서에 넣지 않습니다.

## 배포와 콘텐츠 보존

기본 대상은 기존 소유자 전용 ChatGPT Site입니다. 루트 앱을 빌드하여 `dist`를 준비하고, 등록된 Site의 `.openai/hosting.json` ID와 접근 audience를 유지합니다. Cloudflare Pages는 별도로 구성할 때의 대안입니다. 빌드가 성공해도 배포 완료로 간주하지 않습니다.

게임 규칙, 개인 손패/RLS 보호, 번역의 원문 보존 및 7일 보관, 피드백 게시물 보관 정책을 유지합니다. 홈과 게임 이미지의 자산 출처는 `docs/ASSETS.md`를 따르세요. 장미 배경·아틀라스는 정적 장식 이미지이며 라이브 3D가 아닙니다. `public/` 자산은 Site에 접근 가능한 사용자에게 URL로 제공되므로 현재 소유자 전용 접근 정책을 바꾸지 않습니다.

뮤직톡톡은 원본 SWF와 Ruffle을 사용합니다. 전체 게임플레이·오디오·동반 SWF 동작과 SWF 재배포 권리는 확인되지 않았습니다. 출시 범위나 권리 상태를 임의로 확대해 표현하지 말고 [리듬게임 안내](RHYTHM.md)를 참조하세요.
