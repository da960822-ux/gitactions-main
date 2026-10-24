# 다빈치 코드 · 4인 조커 팀 변형

2026-10-24 확인. [Da Vinci Code 규칙서 스캔](https://upload.snakesandlattes.com/rules/d/DaVinciCodeGamethe.pdf)의 4인 분배, 숫자 정렬, 추리와 탈락, 고급 조커 규칙을 바탕으로 구성했습니다. 아래 팀전 조정은 이 프로젝트의 하우스 규칙이며 공식 2대2 규칙으로 부르지 않습니다.

## 규칙서에서 확인한 내용

- 네 명이면 처음 타일은 각 3장입니다. 숫자는 오름차순, 같은 숫자는 검정 먼저입니다.
- 차례에 더미에서 한 장 뽑고 상대의 비공개 타일을 추리합니다. 맞히면 계속하거나 멈추고, 틀리면 뽑은 타일이 공개됩니다.
- 패가 전부 공개된 사람은 탈락합니다. 기본 개인전은 마지막 생존자가 이깁니다.
- 고급 규칙은 흑백 조커를 한 장씩 더합니다. 조커는 원하는 위치에 놓고 이후 옮기지 않습니다.

## 이 프로젝트의 2대2 조정

- A팀은 P1+P3, B팀은 P2+P4입니다. 순서는 P1→P2→P3→P4이며 탈락자는 건너뜁니다.
- 고급 조커 포함 총 26장, 각자 3장, 더미 14장으로 시작합니다. 시작 조커 배치와 준비 완료를 네 좌석이 순서대로 진행합니다.
- 같은 팀은 서로 공격하지 않습니다. 팀원 패도 공유하지 않습니다. 상대 팀 두 사람의 타일을 모두 공개하면 이깁니다.
- 점수 표시는 각자의 정답 횟수와 팀별 합계입니다. 승패는 이 점수가 아니라 상대 팀 전원 탈락으로 결정합니다.
- 기존 앱과 같이 뽑은 타일은 즉시 정렬해 보여 주고 조커 위치를 정한 뒤 추리합니다. 틀리면 그 타일을 공개합니다. 조커 배치 위치나 새 타일의 숫자는 상대에게 알리지 않습니다.

## AI와 비공개 정보

AI에는 자기 패, 모두에게 공개된 타일, 타일 색과 개수, 공개된 추리 결과만 전달합니다. 팀원 비공개 패와 더미 순서는 전달하지 않습니다. 가능한 숫자 정렬과 조커 배치를 계산해 가능성이 높은 공격을 선택하며, 마지막 타일인 상대를 우선하고 자기 비공개 타일이 적으면 위험한 연속 추리를 멈춥니다. 상대가 새로 뽑은 뒤에는 위치가 바뀔 수 있어 그 패의 오래된 오답 제약을 버립니다.

조커 위치에 대한 확률은 합법적인 배치를 고르게 가정하는 추론 모델입니다. 사람의 조커 배치 습관까지 학습하지는 않습니다.

## 네 사람 전용 화면

2인 `DaVinciTable`을 팀전에서 재사용하지 않습니다. 네 사람용 화면은 내 패를 아래, 팀원의 공개 패를 맞은편, 상대 두 사람을 양옆에 놓습니다. 상대의 숨은 타일을 직접 누르면 그 좌석·위치를 대상으로 가운데 숫자 선택기를 사용합니다. 숫자나 조커를 고른 다음, 대상과 값을 적은 추측 버튼을 한 번 누릅니다. 취소와 Escape는 선택한 숫자를 지우고 해당 타일로 키보드 초점을 돌려줍니다. 전송 중에는 다른 타일과 추측 입력을 잠급니다.

[Da Vinci Code Online](https://www.davincicodegame.online/)의 공개 AI 모드를 실제 브라우저에서 확인했습니다. 이 사이트의 2인 화면은 자기 패가 아래, 상대 패가 위, 남은 더미가 가운데 놓이며 간단한 현재 행동 안내가 중앙에 있습니다. 상대 타일 선택 후에는 대상의 위치·색을 적은 숫자/조커 선택기가 나옵니다. 참고한 것은 물리적 자리 배치와 대상 가까이 추리 도구를 두는 원칙입니다. 외부 사이트의 자산이나 코드는 복사하지 않았고, 기존 앱의 타일·조커 그림과 뒤집기·승리 효과를 유지했습니다.

1366×768 실제 브라우저에서 시작 배치와 추리 화면의 네 패·숫자 선택기·주요 버튼이 모두 한 화면에 들어오는 것을 확인했습니다. 양쪽 상대의 타일을 직접 선택하여 정확한 좌석으로 추측이 전송되는지, 중복 클릭 차단, 취소/Escape 및 규칙 창 닫기를 함께 확인했습니다.

## Reglas en español

Variante casera por equipos basada en la distribución oficial para cuatro personas y los comodines avanzados. A=P1+P3; B=P2+P4. Cada persona empieza con tres fichas; las 14 restantes forman el mazo. Se juega en orden, saltando a las personas eliminadas. Solo se atacan fichas del equipo rival. Gana el equipo que revela por completo las dos filas rivales. No se comparten fichas privadas entre compañeros. Los aciertos se muestran como puntuación informativa; la eliminación decide la victoria.

La IA deduce usando su propia fila, fichas públicas y fallos conocidos. No recibe las fichas ocultas de compañeros o rivales ni el orden del mazo.
