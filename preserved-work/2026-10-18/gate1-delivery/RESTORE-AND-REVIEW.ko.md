# Hero 검토본 복원

로컬 커밋: `d6d5f53f0734d3e9461ebe15b067ec4c73937dd2`
랜딩 기준: `24a6ec69eea712f632ee80e8f3cae863d38c769f`
브랜치: `redesign/folded-playhouse-gate1-20261017`

`folded-playhouse-gate1.bundle`은 위 기준 커밋을 필요로 하는 증분 bundle이다. 이 작업 환경에서 `git bundle verify`가 성공했다. 전체 저장소를 포함하는 독립 fresh-clone bundle이라고 주장하지 않는다. `folded-playhouse-gate1.patch`는 같은 14개 파일의 binary 포함 diff다.

게임 검수 작업이나 기존 작업 트리 위에서 reset/checkout/apply하지 않는다. 별도 랜딩 검토 복사본에서만 아래 순서를 사용한다.

```sh
git clone --no-checkout https://github.com/da960822-ux/gitactions-main.git hero-review
cd hero-review
git fetch origin redesign/across-the-distance
git bundle verify /path/to/folded-playhouse-gate1.bundle
git fetch /path/to/folded-playhouse-gate1.bundle refs/heads/redesign/folded-playhouse-gate1-20261017
git checkout -b review/folded-playhouse-g1 FETCH_HEAD
git rev-parse HEAD
npm ci --ignore-scripts --no-audit --no-fund
npm run dev -- --port 5195
```

HEAD가 위 d6d5f53f 전체 SHA인지 확인한다. package.json과 lockfile은 기존 랜딩 기준과 동일하다. 새 앱은 `/`에서 열고, 첫 방문 테스트는 해당 브라우저 세션의 `folded-playhouse-seen` 상태가 없는 새 context에서 시작한다. 세션 재방문과 #games/#papi-letter 직접 진입은 인트로를 생략한다.

검수는 1920×1080 DPR1에서 시작한다. 첫 방문 전체→안정 Hero→포인터→정방향 p=.18/.35/.45/.58/.62/.66/.72/1→역방향 .72/.62/.45/.18/0 순서를 확인한다. 실제 GPU를 사용할 수 있으면 renderer 문자열과 가속 여부부터 기록한다. 제공된 클라우드 녹화는 SwiftShader 결과이므로 하드웨어 성능 통과 증거가 아니다.

원본 브라우저 녹화와 PNG는 동일 SHA의 실제 앱 결과다. 최종 영상용 direct pass는 녹화 중 screenshot readback을 하지 않는다. PNG·진단 pass와 분리해 readback 부담을 줄였다. Remotion/HyperFrames MP4는 제작 자산이며 실제 구동 증거를 대신하지 않는다.

게임 담당 최종 `df087fc85b35edc5e14eb3a196fc0fc60f86dc33`과의 통합은 Gate3에서 별도 복원·충돌·언어/route 회귀 검증 후 수행한다. 이 Hero 검토용 bundle은 그 게임 최종본을 포함하지 않는다. 랜딩 기준의 오래된 게임 파일을 최종 게임본 위에 덮어쓰면 안 된다. 별도 게임 작업은 변경·중단하지 않았다.

부모 Hero 검수 통과 전 Gate2 새 이야기·새 갤러리·새 편지·전체 연결 구현으로 진행하지 않는다. 이 저장소의 현재 기존 갤러리·편지는 보존된 기존 구현이며 이번에 새로 제작한 결과물이 아니다.
