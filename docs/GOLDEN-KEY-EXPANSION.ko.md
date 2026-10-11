# 황금열쇠 16종: 전략 카드 3종

사용자 최신 요청에 따라 이전 10종 확장안을 모두 제거했습니다. 새 방은 기존 13종과 도시 축제·정전·통행료 면제권의 16종입니다. `boardVersion: 2`, `economicVersion: 2`, `eventVersion: 3`으로 생성합니다. 이벤트 버전이 없는 기존 저장 방은 원래 8종(18칸), 12종(경제 없음), 13종(경제 버전 1·2)의 덱과 보충 규칙을 유지합니다. 공개 전의 이전 10종 확장 저장 데이터는 마이그레이션 대상이 아닙니다.

## 카드 목록 / Inventario bilingüe

| ID | 한국어 제목 | Título español | 한국어 효과·금액 | Efecto y cantidades |
| --- | --- | --- | --- | --- |
| festival | 동네 축제 | Fiesta del barrio | 축제 준비를 도와 150을 받습니다. | Ayudas con la fiesta del barrio y recibes 150. |
| lottery | 작은 복권 당첨 | Premio de lotería | 복권에 당첨되어 200을 받습니다. | Te ganas un premio de lotería y recibes 200. |
| rent-rebate | 임대료 환급 | Reembolso de alquiler | 임대료 일부를 돌려받아 80을 받습니다. | Te devuelven parte del alquiler: recibes 80. |
| travel-cost | 여행 경비 | Gastos de viaje | 여행 경비로 100을 냅니다. | Pagas 100 por gastos de viaje. |
| maintenance | 건물 수리 | Mantenimiento de edificios | 내 도시의 건설 단계 합계에 40을 곱한 수리비를 냅니다. 별장은 1단계, 빌딩은 2단계, 랜드마크는 3단계입니다. | Pagas 40 por cada nivel construido en tus ciudades: villa cuenta 1, edificio 2 y monumento 3. |
| visit-santo-domingo | 산토도밍고 방문 | Visita a Santo Domingo | 산토도밍고로 이동해 그곳의 부동산 규칙을 적용합니다. | Ve a Santo Domingo y aplica las reglas normales de esa propiedad. |
| advance-start | 출발점으로 이동 | Ve a Salida | 출발점으로 이동하고 200을 받습니다. | Ve a Salida y recibe 200. |
| retreat | 세 칸 뒤로 | Retrocede tres casillas | 세 칸 뒤로 이동합니다. 출발 보너스는 받지 않습니다. | Retrocede tres casillas. No cobras al pasar por Salida. |
| go-to-island | 무인도로 이동 | Ve a la isla desierta | 무인도로 갑니다. 다음 세 번의 차례를 쉽니다. | Ve a la isla desierta y pierde tus próximos tres turnos. |
| escape-pass | 탈출권 | Pase de salida | 무인도에서 나올 때 쓸 탈출권을 받습니다. | Recibes un pase para salir de la isla. |
| train-ticket | 무료 열차표 | Boleto de tren gratis | 운임 없이 부동산 한 곳으로 이동할 수 있습니다. | Puedes viajar a una propiedad sin pagar el pasaje. |
| city-dividend | 도시 배당금 | Dividendo de la ciudad | 소유한 부동산마다 30을 받습니다. | Recibes 30 por cada propiedad que tengas. |
| monopoly-warning | 독점 경고 | Advertencia de monopolio | 완성한 색상 도시군이 가장 많은 사람에게 도시군당 100, 최대 300의 독점 부담금을 부과합니다. 동률이면 카드를 뽑은 사람, 완성한 도시군이 없으면 부담금이 없습니다. | Quien tenga más grupos de color completos paga 100 por grupo, hasta 300. En empate paga quien sacó la carta; si nadie completó un grupo, no se cobra. |
| city-festival | 도시 축제 | Festival de ciudad | 내 도시 하나를 선택합니다. 그 도시의 다음 상대 착지 1회 통행료가 2배가 됩니다. 대상 착지까지 유지됩니다. | Elige una ciudad propia. Su alquiler se duplica una vez, en la próxima llegada rival. Permanece hasta esa llegada. |
| blackout | 정전 | Apagón | 상대 도시 하나를 선택합니다. 그 도시의 다음 내 착지 1회 통행료가 절반이 됩니다(내림, 최소 1). 대상 착지까지 유지됩니다. | Elige una ciudad rival. En tu próxima llegada a ella pagas la mitad una vez (redondeo hacia abajo, mínimo 1). Permanece hasta esa llegada. |
| rent-pass | 통행료 면제권 | Pase de alquiler | 통행료 면제권 한 장을 보관합니다. 앞으로 통행료를 내기 전에 직접 선택해 1회 면제할 수 있습니다. 자동 사용되지 않으며 세금에는 쓸 수 없습니다. | Guarda un pase. Antes de un futuro alquiler puedes elegir usarlo para eximir un solo pago. No se usa automáticamente ni sirve para impuestos. |

## 전략 효과 및 회계

- 도시 축제는 내 도시 하나를 선택해 그 도시의 **다음 상대 착지 1회** 통행료를 2배로 만듭니다. 정전은 상대 도시 하나를 선택해 그 도시의 **다음 내 착지 1회** 통행료를 절반으로 만듭니다(정수 내림, 양수 통행료 최소 1). 효과는 해당 착지까지 유지되며 다른 도시나 자산 평가를 바꾸지 않습니다.
- 두 효과는 함께 적용할 수 있습니다: 2배×절반으로 기본 통행료가 됩니다. 같은 효과를 같은 도시에 다시 걸면 해당 효과를 갱신하며 배수를 추가하지 않습니다. 선택 가능한 도시가 없으면 카드의 공개 설명에 무효를 명시합니다. 소유권·건설 단계를 바꾸지 않습니다.
- 통행료 면제권은 자동 사용되지 않습니다. 보유한 사람의 앞으로 발생하는 통행료에서 `rent-decision` 단계가 열리고 지급 또는 면제권 사용을 고릅니다. 사용은 한 번의 통행료만 면제하며 세금에는 사용할 수 없습니다. 카드 한 장은 보유 중 덱에서 빠지고 사용하면 한 번만 덱 뒤로 돌아갑니다. 덱 보충에서도 보유 중인 면제권을 추가하지 않습니다.
- 도시 효과는 대상 **착지 시** 소모합니다. 이후 면제권으로 통행료를 면제해도 도시 효과는 소모됩니다. 통행료 산정액은 선택 전에 고정되며, 지급 선택 후 현금 부족 시 기존 지급 위기·대출·파산으로 진행합니다. 대출 정산은 지급을 한 번만 처리하며 도시 효과와 통행료를 다시 산정하지 않습니다.
- 면제권은 현금을 이동하지 않습니다. 면제 로그는 금액 0과 양쪽 `moneyDelta: 0`을 기록하고 본문에 면제한 산정액을 명시합니다. 실제 지급은 기존 `rent` 로그에서 지급자·수령자·현금 변화량을 기록합니다.

## UI 및 보안 계약

- `event-decision`: `pendingEvent {id, playerId}`와 소유자에 맞는 `choose-event-city {tile:number}` 행동. 틀린 소유자, 비부동산, 범위 밖, 비정수, 문자열 번호와 자기 차례가 아닌 행동을 거부합니다.
- `rent-decision`: `pendingRent {amount, creditor, playerId, tile, reason}`와 `pay-rent`, `use-rent-pass`. 지급·사용 이외 행동과 상대 행동을 거부합니다. 부족한 현금도 지급 선택은 허용하되 이후 정상 지급 위기에 들어갑니다.
- 공개 보드: `eventVersion`, `eventCardCount:16`, 복사된 `pendingEvent`, `pendingRent`, `rentPasses {p1,p2}`, `rentModifiers`. 각 도시의 `rentModifiers`는 `{festival?,blackout?}` 또는 `null`이며 효과마다 `{source,playerId,owner}`가 있습니다. 덱 순서와 난수는 숨깁니다. 공개 뷰·후속 행동은 원래 상태의 중첩 효과·지급 사유를 바꾸지 않습니다.

## 통합 파일 명세

작업은 `/workspace/onboarding/golden-key-expansion`에서만 진행합니다. 운영 QA 체크아웃을 수정하지 않습니다.

1. `src/games/marble.ts`: 16종 엔진, 선택 단계, 통행료 효과, 면제권·지급 재개, 공개 메타데이터.
2. `src/games/marble.test.ts`: 기존 초기 덱 기대값 16 및 전략 카드 6개 시나리오 테스트.
3. `src/games/rules.ts`: 구형 규칙을 유지한 새 16종 한국어·스페인어 설명.
4. `docs/GOLDEN-KEY-EXPANSION.ko.md`: 이 문서.

루트 소유: `PlayApp.tsx`, `PlayApp.test.ts`. UX 담당: `MarbleBoard.tsx`, 공개 UI 테스트. 아트 담당: `MarbleEventStage.tsx`, 이벤트 CSS·테스트, 16종 카드 아트. 최종 통합 후 루트가 `npm run build`로 `supabase/functions/_shared/engines.js`를 다시 생성합니다.

검증: Marble 엔진 30개 테스트 통과, 타입 검사 통과. 전체 브라우저 QA·최종 아트 통합·최종 프로덕션 빌드는 루트 담당입니다. 새 의존성·서버·재산 탈취·건물 철거·추가 현금 카드가 없습니다.
