# 민화투 4인 분배 · 2대2 자체 팀 규칙

확인일: 2026-10-24. 기존 2인 규칙은 그대로 두고, 이 문서의 규칙은 4인 팀 모드에만 적용한다.

## 인터넷에서 확인한 바탕

- [한국어 민화투 인원별 분배 설명](https://free2cash.tistory.com/120), [별도의 한국어 민화투 설명](https://namong2.tistory.com/319): 4명은 각자 5장, 바닥 8장으로 시작한다. 48장 중 나머지 20장은 더미다. 두 자료가 일치하므로 이 분배를 채택했다. 두 자료는 개인 설명이며 단일 공식 규정집이라고 주장하지 않는다.
- [세계유희박물관의 민화투 설명](https://sekaiyugi.com/old/games/hwatu-4.html): 같은 월을 짝지어 가져오기, 손패를 낸 뒤 더미 한 장 공개, 두 장 중 하나 선택, 세 장 모두 획득이라는 흐름과 광/열끗/띠/피 20/10/5/0점을 확인했다. 이 자료의 분배 설명은 2~3인 기준이다.
- 자료마다 월·족보와 정산 방식이 다르므로, 인터넷 규칙 전부를 하나의 공식 4인 팀전이라고 합치지 않았다. 아래 보너스와 팀 정산은 기존 프로젝트를 보존하기 위한 자체 선택이다.

## 이 모드의 완전한 규칙

1. 48장을 섞어 p1·p2·p3·p4에게 5장씩 주고 바닥 8장, 더미 20장을 둔다. p1→p2→p3→p4 순서로 각자 한 차례씩 진행한다. p1+p3은 A팀, p2+p4는 B팀이다. 손패·획득패는 개인 소유이고 팀원 손패도 보이지 않는다.
2. 차례에는 손패 한 장을 낸다. 바닥의 같은 월 카드가 없으면 내려놓고, 한 장이면 짝을 가져간다. 두 장이면 하나를 선택하고, 세 장이면 세 장 전부를 가져간다. 이어 더미 맨 위 한 장을 공개해 똑같이 처리한다. 마지막 더미 카드도 선택이 필요하면 선택을 끝낸 뒤 정산한다.
3. 모두 손패와 더미가 비면 끝난다. 남아 있는 바닥패는 기존 엔진과 마찬가지로 누구에게도 추가 지급하지 않는다. 돈·베팅·고/스톱·피 빼앗기는 없다.
4. 기본점수는 광 20·열끗 10·띠 5·피 0점이다. 기존 프로젝트 선택을 보존해 홍단·청단·초단은 각 30점, 고도리는 50점, 11월 네 장은 40점, 5·10·12월 네 장은 각각 20점 보너스다. 족보는 반드시 한 개인이 모아야 하며 팀원끼리 합쳐 완성하지 않는다.
5. **자체 팀 정산:** 개인 점수 = 본인 기본점수 + 본인 족보점수×2 − 상대팀 두 사람의 족보점수 합. 같은 팀 두 명의 개인 점수를 합산해 높은 팀이 이긴다. 팀 합이 같으면 무승부다. 이는 기존 2인 야쿠 정산을 팀 단위로 확장한 선택이며 전통 민화투의 단일 공식 정산법이 아니다. 음수 점수도 그대로 표시한다.

## AI와 정보 경계

AI도 자기 손패, 모두의 공개 획득패, 바닥과 현재 공개된 더미 카드만 본다. 남의 손패와 더미 순서는 입력에 없다. 합법적 수 중 즉시 점수, 족보 완성·진행, 상대팀 족보 차단과 공개 정보에서 계산한 다음 더미 카드의 기대 이득을 비교한다. 미지 카드는 균등한 후보로 가정하며 사람의 패턴을 학습하는 AI는 아니다.

검증은 30개 seed의 완주·48장 보존·불변성, 사생활 경계, 마지막 더미 선택, 2/3장 매칭, 팀 정산과 전략 선택을 포함한다. 실제 기기 화면 검수는 이 규칙 엔진 테스트와 별개다.

## Español

Variante propia 2 contra 2: cuatro manos privadas de 5 cartas, 8 cartas en la mesa y 20 en el mazo. Turnos p1→p2→p3→p4; equipo A=p1+p3 y B=p2+p4. Se juega una carta y después se revela otra del mazo: se captura por mes; con dos coincidencias se elige una y con tres se toman las tres. Se resuelve la última elección antes del resultado. Las cartas restantes en la mesa no se adjudican.

Se conservan las cartas y los yakus de esta aplicación, incluido Godori de 50 puntos. Los yakus son individuales, sin combinar capturas de compañeros. Puntuación individual propia: puntos de cartas + 2×yakus propios − yakus de los dos rivales. Se suman los dos resultados de cada equipo; empate si las sumas coinciden. Esta adaptación no se presenta como un reglamento oficial de equipos. La IA recibe únicamente su mano y la información pública.
