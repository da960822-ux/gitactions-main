# 스플렌더 4인 / Splendor a cuatro

2026-10-24 확인. [퍼블리셔 제공 2024 규칙 PDF](https://cdn.svc.asmodee.net/production-asmodeeca/uploads/2022/01/SCSPL01EN_SPLENDOR_RULES_LIGHT.pdf)를 기준으로, 색별 보석 7개·금 5개·공개 귀족 5명과 시계방향 차례를 적용합니다. 행동·개인 토큰 10개 제한·예약 3장 제한·구매 보너스·차례당 귀족 최대 한 명은 기본 규칙을 재사용합니다. 예약 카드와 덱 순서는 다른 좌석에 공개하지 않습니다. 보석 수와 구매 보너스는 공개 정보입니다.

## 이 앱의 2대2 조정 / Variante propia por equipos

공식 규칙의 승리 조건은 개인 15점입니다. 아래 팀전은 공식 모드라고 주장하지 않는 자체 변형입니다.

- 좌석 p1+p3이 A팀, p2+p4가 B팀입니다. 차례는 p1→p2→p3→p4입니다.
- 팀원도 각자의 토큰·예약·보너스·귀족을 보유합니다. 카드나 자원을 주고받지 않습니다.
- 팀 합계 30점이 나오면 마지막 한 바퀴를 진행해 네 좌석의 차례 횟수를 맞춥니다.
- 팀 합계 점수가 높은 쪽이 승리합니다. 동점이면 합산 구매 카드가 적은 팀이 이기며, 그것도 같으면 무승부입니다.
- AI는 본인 예약 카드와 공개 시장·보석·귀족 조건만으로 목표 카드 비용 감소, 점수 구매와 귀족 접근 가치를 비교합니다.

En esta variante propia, p1+p3 forman A y p2+p4 forman B. Los recursos y las reservas siguen siendo individuales. Cuando un equipo alcanza 30 puntos, se igualan los turnos de las cuatro personas. Gana la mayor suma de puntos; en empate, menos cartas compradas, y después empate compartido. Las reglas oficiales terminan a 15 puntos individuales: el umbral de 30 y la suma por equipos son ajustes de esta aplicación.

El motor reutiliza las acciones y validaciones existentes del modo de dos jugadores mediante una proyección de un turno. La rotación y la puntuación de equipo se resuelven por separado; la partida anterior no se transforma ni se sustituye.
