import type { GameId, Language } from '../core/types';

type LocalizedRules = Record<Language, string[]>;

export const lisbethDominoRules: LocalizedRules = {
  ko: [
    '목표와 준비 — 1대1 또는 네 자리 팀전으로 100점이나 200점까지 경기합니다. 더블 식스 28장을 쓰며 각 자리에 7장씩 나눕니다. 첫 판은 6|6으로 열고, 이후 판은 직전 판 승자가 손패의 타일 아무거나 놓아 엽니다. 파트너 모드에서는 두 팀이 번갈아 앉습니다.',
    '차례와 패스 — 열린 끝 숫자에 맞는 타일을 놓으세요. 놓을 타일이 없으면 패스합니다. 1대1은 첫 타일 다음 사람이 첫 차례에 패스하면 시작 타일이 더블일 때 +30점, 비더블일 때 +60점 보너스 대상이 됩니다. 네 자리에서는 두 번째 자리가 패스하고 세 번째 자리가 놓아야 보너스를 받으며, 세 번째 자리도 패스하면 보너스가 없습니다. 보너스는 라운드 정산 때 더합니다.',
    '카피쿠아 — 손패를 비우는 마지막 타일이 더블이 아니고, 놓기 직전 양쪽의 서로 다른 열린 끝 모두에 맞았다면 카피쿠아입니다. 승리 팀은 +30점과 모든 손패의 남은 점수 합을 받습니다.',
    '트랑케 — 모든 모드에서 양쪽 열린 끝 숫자에 각각 맞는 서로 다른 타일 7개가 모두 놓이면 즉시 판이 막힙니다. 그 밖에는 아무도 놓을 수 없을 때 막힙니다. 마지막으로 놓아 판을 막은 사람과 바로 다음 자리의 남은 점수를 비교해 낮은 쪽이 이깁니다. 같으면 판을 막은 사람이 이깁니다. 승리 팀 점수에는 본인과 팀원을 포함한 모든 손패의 남은 점수를 셉니다.',
    '경기 점수 — 해당 보너스와 점수는 라운드 정산 때 더합니다. 먼저 목표 점수에 도달하면 매치가 끝납니다. 파소 코리도 보너스는 없습니다.',
  ],
  es: [
    'Objetivo y reparto — Jueguen a 100 o 200 puntos, en uno contra uno o con cuatro asientos por equipos. Se usan las 28 fichas doble-seis y se reparten 7 por asiento. La primera mano abre con el 6|6; en las siguientes, quien ganó la mano anterior abre con cualquier ficha de su mano. En modo parejas, los equipos se sientan alternados.',
    'Turnos y pases — Coloca una ficha que coincida con un extremo abierto. Si no puedes jugar, pasa. En uno contra uno, quien sigue a la apertura queda con un bono de +30 puntos si la ficha inicial fue doble o +60 si no lo fue, al pasar en su primer turno. Con cuatro asientos, el segundo debe pasar y el tercero jugar para recibir el bono; si el tercero también pasa, no hay bono. Los bonos se suman al cerrar la mano.',
    'Capicúa — Hay capicúa si la última ficha que vacía tu mano no es doble y, antes de colocarla, servía en ambos extremos abiertos, que deben tener números distintos. El equipo ganador recibe +30 puntos y los puntos restantes de todas las manos.',
    'Tranque — En todos los modos, la mano se bloquea de inmediato cuando ya se jugaron las 7 fichas distintas que conectan con cada extremo abierto. También se bloquea si nadie puede jugar. Se comparan los puntos de quien cerró la mano y del asiento siguiente; gana quien tenga menos. En empate gana quien la cerró. Para puntuar se cuentan todas las fichas restantes, incluidas las de quien ganó y su pareja.',
    'Puntuación — Los bonos y puntos se suman al cerrar la mano. La partida termina al alcanzar la meta. No hay bono de paso corrido.',
  ],
};

export const marbleCreditRules: LocalizedRules = {
  ko: [
    '목표 — 자체 부동산 게임 규칙입니다. 상대가 파산하면 이기고, 120턴 뒤에는 현금+도시 매입가+건설 비용−미상환 대출을 합친 순자산을 비교합니다.',
    '말과 이동 — 첫 주사위를 굴리기 전에 원하는 말을 고릅니다. 상대와 같은 말은 선택할 수 없고 첫 이동 뒤에는 고정됩니다. 두 주사위 합만큼 40칸 보드를 이동하며 출발점을 지나면 200을 받습니다. 광주와 산토도밍고를 포함해 24개 도시가 있습니다.',
    '도시와 건설 — 빈 도시를 구매하거나 지나갑니다. 내 도시에는 색상 도시군 완성 여부와 관계없이 단독주택→아파트→랜드마크를 순서대로 지을 수 있습니다. 단계마다 100, 통행료는 기본의 2배→4배→8배입니다. 상대 도시의 통행료는 자동 지급됩니다.',
    '대출 — 자기 차례에 미상환 대출이 없으면 300을 받을 수 있고, 상환액은 330입니다. 추가 이자나 만기는 없습니다. 지급 위기 외의 자기 차례에 330 전액을 상환합니다. 미상환액은 순자산에서 빼며, 상환 후 다시 빌려도 매번 30의 비용이 발생합니다.',
    '지급 위기 — 통행료·세금·카드 비용을 낼 현금이 부족하면 행동이 멈춥니다. 현재 현금+300으로 지급액을 충당할 수 있고 기존 대출이 없을 때만 대출로 해결할 수 있습니다. 대출을 선택하면 해당 지급을 한 번 처리하고 원래 차례로 돌아갑니다. 파산 인정은 경기 종료를 뜻하며 도시 자동 매각은 없습니다.',
    '황금열쇠 — 13종 카드는 상금(150·200·80), 여행비 100, 건설 단계당 수리비 40, 산토도밍고 방문, 출발 이동(+200), 세 칸 후퇴, 무인도 이동, 탈출권, 무료 열차표, 도시당 배당 30, 독점 경고입니다. 이동 카드의 도착 효과도 적용되며 세 칸 후퇴에는 출발 보너스가 없습니다.',
    '독점 경고 — 같은 색의 도시를 모두 가진 도시군이 가장 많은 사람이 도시군당 100, 최대 300을 은행에 냅니다. 동률이면 카드를 뽑은 사람에게 적용됩니다. 누구도 완성한 도시군이 없으면 비용이 없습니다. 도시군 완성 자체는 즉시 승리나 통행료 추가 배수가 아닙니다.',
    '무인도·열차·기금 — 무인도는 자기 차례 세 번 정지입니다. 쌍이면 탈출해 이동하고, 아니면 한 차례 쉽니다. 100이나 탈출권으로 나와 주사위를 굴릴 수도 있습니다. 역에서는 다음 차례에 운임 100으로 도시를 고르거나 건너뜁니다. 무료 표는 운임 0입니다. 기금 납부 칸에 150을 내며 사회복지기금 칸에서 쌓인 기금을 받습니다.',
  ],
  es: [
    'Objetivo — Usamos reglas propias de un juego de propiedades. Ganas si tu pareja quiebra; después de 120 turnos se compara el patrimonio neto: efectivo + precio de las ciudades + costo de construcción − deuda pendiente.',
    'Figura y movimiento — Elige una figura antes de lanzar tus primeros dados. No puede ser la misma de tu pareja y queda fija después. Avanza la suma de los dos dados por las 40 casillas. Al pasar por Salida recibes 200. Hay 24 ciudades, incluyendo Gwangju y Santo Domingo.',
    'Ciudades y construcción — Puedes comprar una ciudad libre o pasar. En cualquier ciudad tuya puedes construir casa unifamiliar, apartamentos y monumento, sin completar un color. Cada nivel cuesta 100 y el alquiler pasa a 2, 4 y 8 veces el valor base. El alquiler rival se paga automáticamente.',
    'Préstamo — En tu turno, si no tienes deuda pendiente, puedes recibir 300 y debes devolver 330. No hay intereses adicionales ni fecha de vencimiento. Pagas los 330 completos en tu turno, fuera de una crisis de pago. La deuda se resta del patrimonio; pedir otro préstamo después de pagarlo vuelve a costar 30.',
    'Crisis de pago — Si no tienes efectivo para un alquiler, impuesto o gasto de carta, el juego espera tu decisión. Solo puedes resolverlo con un préstamo si no debes otro y tu efectivo + 300 cubre el pago. Al pedirlo, el pago se procesa una sola vez y continúa el turno original. Declarar quiebra termina la partida; las ciudades no se venden automáticamente.',
    'Llave dorada — Las 13 cartas incluyen premios (150, 200 y 80), gasto de viaje 100, mantenimiento 40 por nivel construido, visita a Santo Domingo, viaje a Salida (+200), retroceso de tres casillas, isla, pase de salida, boleto gratis, dividendo 30 por ciudad y advertencia de monopolio. Se aplica también el efecto del destino; al retroceder no cobras Salida.',
    'Monopolio — Quien tenga más grupos de color completos paga 100 por grupo al banco, hasta 300. En empate paga quien sacó la carta. Si nadie completó un grupo, no se cobra. Completar un color no da una victoria inmediata ni otro multiplicador de alquiler.',
    'Isla, tren y fondo — La isla te detiene tres turnos propios. Si sacas dobles, sales y avanzas; si no, pierdes un turno. También puedes pagar 100 o usar un pase y luego lanzar. La estación permite viajar a una ciudad por 100 en tu próximo turno o pasar el tren. El boleto gratis cuesta 0. El aporte al fondo es 150 y en Fondo Social recibes lo acumulado.',
  ],
};

export const marbleTieredRules: LocalizedRules = {
  ko: marbleCreditRules.ko.map((rule, index) => index === 2
    ? '도시와 건설 — 빈 도시를 구매하거나 지나갑니다. 내 도시에는 색상 도시군 완성 여부와 관계없이 단독주택→아파트→랜드마크를 순서대로 지을 수 있습니다. 건설비는 해당 도시 매입가의 40%→60%→80%이며, 10 단위로 반올림하고 최소 40입니다. 통행료는 기본의 2배→4배→8배가 됩니다. 상대 도시의 통행료는 자동 지급됩니다.'
    : rule),
  es: marbleCreditRules.es.map((rule, index) => index === 2
    ? 'Ciudades y construcción — Puedes comprar una ciudad libre o pasar. En cualquier ciudad tuya puedes construir casa unifamiliar, apartamentos y monumento, sin completar un color. Cada nivel cuesta el 40 %, 60 % y 80 % del precio de compra de la ciudad; se redondea a 10 y nunca baja de 40. El alquiler pasa a 2, 4 y 8 veces el valor base. El alquiler rival se paga automáticamente.'
    : rule),
};

export const marbleExpandedRules: LocalizedRules = {
  ko: [
    ...marbleTieredRules.ko.map((rule, index) => index === 5
      ? rule.replace('황금열쇠 — 13종 카드는', '황금열쇠 — 새 방은 16종이며 이전 저장 방은 기존 덱을 유지합니다. 기본 13종 카드는') : rule),
    '도시 축제·정전 — 축제는 내 도시 하나를 선택해 다음 상대 착지 1회 통행료를 2배로 만듭니다. 정전은 상대 도시 하나를 선택해 다음 내 착지 1회 통행료를 절반으로 만듭니다(내림, 최소 1). 대상 착지까지 유지되며 다른 도시는 바뀌지 않습니다. 둘 다 걸린 도시는 2배×절반으로 기본 통행료가 됩니다. 같은 효과를 다시 선택하면 중복 배수가 아닌 해당 효과 갱신입니다. 선택 가능한 도시가 없으면 효과가 없습니다.',
    '통행료 면제권 — 한 장을 보관하고 앞으로 통행료가 발생하면 지급 전에 직접 사용하거나 지급을 선택합니다. 자동 사용되지 않으며 세금에는 쓸 수 없습니다. 사용하면 통행료 1회만 면제하고 카드는 덱으로 돌아갑니다. 대상 도시 축제·정전은 착지 순간 소모되므로 면제권을 써도 도시 효과는 소모됩니다. 지급을 선택한 뒤 현금이 부족하면 일반 지급 위기로 넘어갑니다.',
  ],
  es: [
    ...marbleTieredRules.es.map((rule, index) => index === 5
      ? rule.replace('Llave dorada — Las 13 cartas incluyen', 'Llave dorada — Las salas nuevas usan 16 cartas; las guardadas conservan su mazo. Las 13 cartas básicas incluyen') : rule),
    'Festival y apagón — Festival elige una ciudad propia y duplica el alquiler en la próxima llegada rival, una vez. Apagón elige una ciudad rival y reduce a la mitad el alquiler en tu próxima llegada, una vez (redondeo hacia abajo, mínimo 1). Persisten hasta esa llegada y no cambian otras ciudades. Juntos dan el alquiler base: doble por mitad. Repetir el mismo efecto lo renueva, sin acumular multiplicadores. Sin ciudad elegible, no tienen efecto.',
    'Pase de alquiler — Guarda un pase y elige usarlo o pagar antes de un futuro alquiler. No se usa automáticamente ni sirve para impuestos. Exime un solo alquiler y vuelve al mazo. Festival y apagón se consumen al llegar, incluso si usas el pase. Si eliges pagar sin efectivo suficiente, se aplica la crisis de pago normal.',
  ],
};

export const dominoPremiumRules: LocalizedRules = {
  ko: [
    '준비 — 더블 식스 28장(0|0~6|6)을 사용합니다. 각 자리에는 7장씩 배분하고, 1대1의 남은 14장은 뽑지 않습니다. 가장 높은 더블로 시작하며, 더블이 없으면 숫자 합이 가장 큰 타일로 시작합니다.',
    '모드와 AI — 첫 타일 전에 방장이 1대1, 사람+AI 대 사람+AI, 사람 2명 협동 대 AI 2명을 선택합니다. AI는 유료 API 없이 자기 손패와 공개 정보만 사용합니다. 쉬움은 첫 번째 가능한 타일, 보통은 큰 숫자를 우선, 어려움은 남은 패의 연결성과 공개된 숫자도 고려합니다.',
    '놓기 — 내 타일을 고르면 실제로 연결 가능한 끝이 빛납니다. 첫 타일은 시작 버튼으로, 이후에는 왼쪽·오른쪽 끝을 눌러 놓습니다. 더블은 세로로 표시해도 연결 숫자 규칙은 같습니다.',
    'Paso와 Tranque — 맞는 타일이 없을 때만 패스합니다. 타일을 놓으면 연속 패스가 초기화됩니다. 1대1은 2번, 2대2는 4번 연속 패스하면 막힙니다. 기본은 팀의 남은 숫자 합이 낮은 쪽이 승리하며, 선택 설정에서는 각 팀에서 합이 가장 낮은 한 사람끼리 비교합니다. 비교값이 같으면 무승부입니다.',
    '단판과 누적 경기 — 기본 단판은 손패를 먼저 비우거나 막힌 판에서 이기면 끝납니다. 100·200점 경기를 선택하면 라운드 승리 팀이 상대 팀의 남은 숫자 합을 얻습니다. 라운드가 끝나면 모두의 남은 패와 정산을 공개하고 방장이 다음 라운드를 시작합니다. 목표점수 도달 여부는 라운드 정산 후 판단하며, 두 팀이 모두 도달하면 누적 점수가 높은 팀이 승리합니다.',
    'Capicúa — 마지막 비더블 타일을 놓기 직전 양쪽 끝 어디에든 놓을 수 있었다면 카피쿠아 연출이 나옵니다. 기본은 추가 점수 없음이며, 방 설정에서 보너스 25점을 켤 수 있습니다.',
    'Paso corrido — 마지막 타일을 놓은 뒤 다른 모든 자리가 연속 패스하여 그 사람에게 차례가 돌아오면 파소 코리도입니다. 판은 계속 진행합니다. 선택 보너스 25점은 놓인 타일마다 한 번만 기록하고, 해당 팀의 라운드 정산 때 더합니다. 기본 보너스는 꺼져 있습니다.',
    '우리 방의 규칙 — Capicúa·Paso corrido 보너스와 Tranque 비교 방법은 지역과 집마다 다릅니다. 첫 타일 전에 선택한 설정을 함께 확인하세요. 진행 중에는 상대·AI·팀원의 비공개 패와 숫자 합을 볼 수 없습니다.',
  ],
  es: [
    'Preparación — Usamos las 28 fichas del doble seis, del 0|0 al 6|6. Cada asiento recibe 7. En 1 contra 1, las otras 14 no se roban. Abre el doble más alto; si no hay dobles, abre la ficha de mayor suma.',
    'Modo e IA — Antes de la primera ficha, quien creó la sala elige 1 contra 1, parejas de una persona con una IA, o ustedes dos contra dos IA. Las IA no usan servicios de pago ni ven manos ajenas. Fácil juega la primera ficha posible, normal prioriza soltar puntos y difícil también cuida las conexiones de su mano y los números ya jugados.',
    'Jugar — Selecciona una ficha de tu mano: se iluminan los extremos donde sirve. Para abrir, pulsa el botón de primera ficha; después, elige izquierda o derecha. Los dobles se muestran de pie, sin cambiar cómo conectan los números.',
    'Paso y tranque — Solo puedes pasar si no tienes ficha que sirva. Jugar reinicia los pases consecutivos. Dos pases cierran el 1 contra 1; cuatro cierran el juego por parejas. Por defecto se compara la suma del equipo y gana quien tenga menos. La opción alternativa compara a la persona con menos puntos de cada equipo. Si empatan, la mano queda empatada.',
    'Una mano o partido por puntos — Por defecto jugamos una sola mano. En partidos a 100 o 200, el equipo que gana la mano recibe los puntos que quedaron en el equipo contrario. Al terminar se muestran todas las manos y la cuenta; quien creó la sala inicia la próxima. La meta se revisa al cerrar la mano. Si ambos equipos llegan, gana el de mayor puntuación acumulada.',
    'Capicúa — Hay capicúa cuando tu última ficha, sin ser doble, servía en cualquiera de los dos extremos antes de jugarla. La celebración aparece aunque no haya bono. El bono de 25 puntos es opcional y viene apagado.',
    'Paso corrido — Si los demás asientos pasan seguidos y vuelve el turno a quien puso la última ficha, hay paso corrido. La mano sigue. El bono opcional de 25 se registra una sola vez por ficha jugada y se suma al equipo al cerrar la mano. Viene apagado.',
    'Reglas de esta mesa — Los bonos de capicúa y paso corrido y la forma de contar un tranque cambian según la familia o el lugar. Revisen los ajustes antes de empezar. Durante la mano no se muestran las fichas ni la suma oculta de tu pareja, del rival o de las IA.',
  ],
};

export const gameRules: Record<GameId, LocalizedRules> = {
  davinci: {
    ko: [
      '목표 — 상대의 가려진 숫자와 조커를 모두 맞혀 공개하면 이깁니다.',
      '준비 — 조커 포함 규칙을 사용합니다. 흑백 각각 0~11 숫자 타일과 조커 － 한 장씩, 총 26장입니다. 각자 네 장을 받고 숫자 순서대로 놓습니다. 같은 숫자면 검정이 먼저예요. 처음 받은 조커는 원하는 위치를 고르고 두 사람 모두 «초기 패 준비 완료»를 눌러 시작합니다.',
      '내 차례 — 더미에서 하나를 뽑습니다. 숫자 타일은 순서대로 자동 삽입되고, 조커는 앞·사이·뒤 중 원하는 자리를 클릭해 넣습니다. 배치한 조커는 다시 옮길 수 없습니다. 더미가 비면 뽑기 없이 추리합니다.',
      '추리 — 상대 타일을 클릭하면 색과 위치가 자동 선택됩니다. 0~11 또는 － 버튼을 선택하고 추리를 확정합니다. 정답이면 그 타일이 공개돼요. 아직 끝나지 않았다면 계속 추리하거나 차례를 마칠 수 있습니다.',
      '오답 — 방금 뽑은 내 타일이 공개되고 차례가 끝납니다. 조커를 뽑았다면 그 조커가 공개됩니다. 더미가 빈 뒤에는 새 타일 공개 없이 상대 차례가 됩니다.',
      '승리 — 상대의 숫자 타일과 조커가 모두 공개되면 끝납니다. 새 판 요청은 두 사람이 모두 선택해야 시작됩니다.',
    ],
    es: [
      'Objetivo — Ganas al revelar todos los números y comodines de las fichas rivales.',
      'Preparación — Jugamos con comodines (variante avanzada). Hay 26 fichas: del 0 al 11 en blanco y negro, más un comodín － de cada color. Cada persona recibe cuatro y las ordena; si el número coincide, la negra va primero. Elige la posición de cualquier comodín inicial y ambos pulsen «Terminé de preparar mi mano».',
      'Tu turno — Roba una ficha. Los números se insertan automáticamente en orden; para un comodín, pulsa el espacio donde quieres colocarlo, al principio, entre fichas o al final. Después no puedes moverlo. Si el mazo está vacío, adivina sin robar.',
      'Adivina — Pulsa una ficha rival para seleccionar su color y posición. Elige un número del 0 al 11 o － y confirma. Si aciertas, la ficha se revela. Si la partida sigue, puedes volver a adivinar o terminar tu turno.',
      'Si fallas — Se revela la ficha que acabas de robar y termina tu turno. Si era un comodín, ese comodín queda visible. Con el mazo vacío, no se revela otra ficha y juega la otra persona.',
      'Victoria — Termina cuando todas las fichas rivales, incluidos los comodines, están visibles. Una nueva partida requiere que ambas personas la elijan.',
    ],
  },
  catchmind: {
    ko: [
      '목표 — 번갈아 출제자와 맞히는 사람이 되어 그림을 보고 단어를 맞히세요. 기본 설정은 6라운드이며 두 사람 모두 세 번씩 그립니다.',
      '준비 — 호스트가 주제 하나를 골라 설정을 저장하면 출제자에게만 단어 보기가 나와요. 기본은 3개 보기와 80초이며 시간은 30~180초로 바꿀 수 있어요. 맞히는 화면에는 한국어 □ / 스페인어 ? 마스크가 고정 표시되고 글자가 점차 드러나지 않아요.',
      '그리기 — 캔버스에 마우스나 손가락으로 그립니다. 펜 색·굵기, 지우개, 채우기, 실행 취소, 전체 지우기를 사용할 수 있어요. 출제자는 정답을 말하거나 글자로 쓰지 말고 그림으로 설명해 주세요.',
      '맞히기 — 맞히는 사람은 방의 공유 채팅 입력란에 한국어나 스페인어로 답을 보내요. 기본 표기와 사전에 등록된 별칭만 인정하며 대소문자와 양끝 공백은 무시해요. 등록된 별칭이 없는 악센트·ñ·ü를 임의로 바꾸거나 비슷한 단어를 쓰면 정답으로 처리하지 않아요.',
      '점수 — 정답을 맞히면 출제자에게 1점, 맞힌 사람에게 남은 시간에 따라 1~3점이 들어옵니다. 출제자는 ‘이 단어 건너뛰기’ 또는 ‘라운드 마치기’를 눌러 정답 공개와 다음 차례로 넘어갈 수 있어요.',
      '끝내기 — 역할은 매 라운드 바뀝니다. 기본 6라운드 뒤 점수가 높은 사람이 이깁니다. 시작 전에 호스트만 주제·라운드 수·시간·보기·글자 수 표시와 직접 입력한 단어를 바꿀 수 있어요. 시작 후 설정은 잠기고, 다시 하기는 두 사람 모두 수락해야 해요.',
    ],
    es: [
      'Objetivo — Se turnan para dibujar y adivinar. La configuración inicial tiene 6 rondas: cada persona dibuja tres veces.',
      'Preparación — La persona anfitriona elige y guarda una categoría; solo quien dibuja ve las opciones. Por defecto hay 3 opciones y 80 segundos, ajustables entre 30 y 180. Quien adivina ve una máscara fija en coreano □ / español ?, sin revelar letras progresivamente.',
      'Dibujo — Dibuja en el lienzo con el mouse o el dedo. Puedes cambiar color y grosor, usar borrador, rellenar, deshacer o borrar todo. Explica con dibujos; quien dibuja no debe escribir ni decir la respuesta.',
      'Adivinar — La persona que adivina responde en el chat compartido de la sala, en coreano o español. Se acepta la forma base o un alias registrado en el diccionario, ignorando mayúsculas y espacios al inicio o al final. No se eliminan tildes, ñ o ü ni se aceptan aproximaciones salvo un alias registrado. Las respuestas incorrectas no revelan la palabra.',
      'Puntos — Al acertar, quien dibuja recibe 1 punto y quien adivinó gana de 1 a 3 según el tiempo restante. Quien dibuja también puede pulsar «Pasar palabra» o «Terminar ronda» para revelar la respuesta y avanzar.',
      'Final — Los papeles cambian en cada ronda. Tras las 6 rondas iniciales, gana quien tenga más puntos. Antes de empezar, solo la persona anfitriona cambia categoría, rondas, tiempo, opciones, longitud visible y palabras propias. Los ajustes se bloquean al empezar y ambos deben aceptar una revancha.',
    ],
  },
  domino: {
    ko: [
      '목표 — 선택한 모드에서 손패를 먼저 비우거나, 막힌 판에서 우리 편의 남은 숫자 합을 상대보다 낮게 만드세요. 카피쿠아 보너스는 적용하지 않는 단판입니다.',
      '준비 — 기본은 두 명이 더블 식스 28장 중 7장씩 받는 블록 도미노입니다. 남은 14장은 뽑지 않아요. 첫 타일은 가장 높은 더블, 더블이 없으면 합이 가장 높은 타일입니다.',
      '모드 선택 — 첫 타일을 놓기 전 1대1, 사람 두 명 대 봇 두 명, 또는 사람-봇 혼합 팀전을 선택할 수 있어요. 네 자리 모드는 네 명이 각 7장씩 받고 봇은 자동으로 둡니다.',
      '타일 놓기 — 손패에서 공개된 줄의 왼쪽이나 오른쪽 끝 숫자와 맞는 타일을 골라 놓습니다. 방향을 고르면 타일은 끝 숫자에 맞게 자동으로 뒤집힙니다.',
      '둘 곳이 없으면 — 가능한 타일이 없을 때만 ‘패스’를 누를 수 있어요. 1대1에서 연속 두 번, 네 자리 모드에서 연속 네 번 패스하면 판이 막힙니다. 타일을 놓으면 패스 횟수는 초기화됩니다.',
      '승리 — 먼저 손패를 다 내면 그 편이 즉시 이깁니다. 막히면 손에 남은 타일의 점(양 끝 숫자)을 더해 비교하고, 합이 낮은 편이 이깁니다. 사람-봇 팀전은 각 팀의 합계를 비교합니다.',
    ],
    es: [
      'Objetivo — En el modo elegido, quédate sin fichas primero o, si se bloquea la mano, termina con menos puntos en tu lado. Es una sola mano y no se aplica bono de capicúa.',
      'Preparación — El modo inicial es dominó bloqueado doble-seis para dos personas: cada quien recibe 7 de las 28 fichas. Las otras 14 no se roban. Abre el doble más alto; si nadie tiene doble, abre la ficha de mayor suma.',
      'Modo — Antes de colocar la primera ficha puedes elegir 1 contra 1, dos personas contra dos bots o equipos mixtos de una persona y un bot. En los modos de cuatro asientos, cada asiento recibe 7 fichas y los bots juegan automáticamente.',
      'Colocar — Elige una ficha de tu mano que coincida con el número del extremo izquierdo o derecho. Al escoger el lado, la ficha se orienta para que los números conecten.',
      'Si no puedes jugar — Pulsa «Pasar» solo cuando ninguna ficha de tu mano coincida. Dos pases consecutivos bloquean el 1 contra 1; en los modos de cuatro asientos hacen falta cuatro. Colocar una ficha reinicia el conteo.',
      'Victoria — Si un lado se queda sin fichas, gana de inmediato. Si se bloquea, se suman los números de las fichas restantes y gana el lado con menos puntos. En equipos mixtos se compara la suma de cada equipo.',
    ],
  },
  jaipur: {
    ko: [
      '목표 — 최대 세 라운드 중 두 라운드를 먼저 이기세요. 상품 토큰 점수에 낙타가 더 많은 사람의 보너스 5점을 더해 라운드 승자를 정합니다.',
      '준비 — 시장의 다섯 장과 각자 손패로 시작합니다. 손패는 상품 7장까지이며 낙타는 별도 무리로 모아 손패 제한에 포함되지 않아요.',
      '가져오기 — 차례마다 시장의 상품 한 장, 시장의 낙타 전부, 또는 손패와 시장에서 같은 수의 카드 2~5장을 교환하는 행동 중 하나를 하세요. 낙타는 별도 무리에 들어가며 교환할 수 없어요. 교환은 ‘교환’을 누른 뒤 양쪽에서 카드를 고르고 확인합니다.',
      '판매 — 손패에서 같은 상품을 한 종류 골라 판매합니다. 옷감·향신료·가죽은 한 장 이상, 다이아몬드·금·은은 두 장 이상 판매할 수 있어요. 판매 버튼에서 장수를 고릅니다. 상품 더미의 높은 점수 토큰부터 받고 3장 이상을 팔고 해당 보너스 더미가 남아 있으면 보너스도 받아요. 토큰이 판매 장수보다 적어도 팔 수 있으며, 받지 못한 몫은 버려집니다.',
      '라운드 종료 — 상품 토큰 더미 세 종류가 비거나 보충할 카드 더미가 바닥나면 라운드가 끝납니다. 낙타 무리의 크기가 더 큰 사람이 5점을 얻고 상품 점수까지 합산해 라운드 승리를 정합니다.',
      '게임 종료 — 두 라운드를 먼저 이기면 바로 승리합니다. 세 라운드 뒤에도 승수가 같으면 무승부입니다. 상품이나 낙타를 가져오면 덱에서 시장을 보충합니다. 다음 라운드는 자동으로 시작하며, 이전 판의 상품·판매 보너스·낙타 점수는 정산표에서 확인할 수 있어요. 낙타 수가 같으면 둘 다 낙타 보너스를 받지 않습니다.',
    ],
    es: [
      'Objetivo — Gana primero dos rondas, de un máximo de tres. Para decidir cada ronda se suman las fichas de mercancía y 5 puntos para quien tenga más camellos.',
      'Preparación — Empiezas con cinco cartas en el mercado y una mano. Puedes tener hasta 7 mercancías en la mano; los camellos se guardan aparte y no cuentan para ese límite.',
      'Tomar — En cada turno elige una acción: tomar una mercancía del mercado, llevarte todos los camellos o cambiar de 2 a 5 cartas por la misma cantidad del mercado. Los camellos van a tu manada y no se cambian. Para intercambiar mercancías, pulsa «Intercambiar», marca cartas de tu mano y del mercado, y confirma.',
      'Vender — Elige una sola mercancía de tu mano. Puedes vender una o más cartas de tela, especias o cuero; para diamantes, oro y plata necesitas al menos dos. Pulsa el botón con la cantidad. Recibes primero las fichas de mayor valor y, con tres o más cartas y fichas de bono disponibles, también un bono sorpresa. Puedes vender aunque queden menos fichas que cartas; recibes las disponibles y el resto se descarta.',
      'Fin de ronda — La ronda termina cuando se agotan tres tipos de fichas de mercancía o el mazo para reponer el mercado. Quien tenga más camellos recibe 5 puntos; se suman a las mercancías para decidir quién gana la ronda.',
      'Fin de partida — Gana al conseguir dos rondas. Si después de tres rondas siguen empatados, la partida termina empatada. El mercado se repone al tomar mercancías o camellos. La siguiente ronda empieza automáticamente; revisa la cuenta anterior para ver mercancías, bonos y camellos. Si las manadas empatan, nadie recibe los 5 puntos de camellos.',
    ],
  },
  splendor: {
    ko: [
      '목표 — 개발 카드와 귀족으로 15점에 도달하세요. 15점에 도달한 사람이 나오면 두 사람의 차례 수를 맞춘 뒤 점수와 개발 카드 수로 승자를 정합니다.',
      '준비 — 색 보석마다 은행 토큰 4개, 황금 토큰 5개, 공개 귀족 3명과 단계별 공개 카드 4장으로 시작합니다. 카드의 점수·비용·보너스는 카드 앞면에 표시됩니다.',
      '토큰 가져오기 — 차례마다 서로 다른 색 토큰 세 개를 하나씩 가져옵니다. 은행에 보석 색이 세 종류 미만 남았다면 남은 색을 하나씩 모두 가져와요. 또는 은행에 네 개 이상 남은 같은 색 토큰 두 개를 가져올 수 있습니다. 황금은 카드의 아무 색 비용을 대신하며, 보유 토큰은 열 개가 한도예요. 초과하면 선택창에서 돌려줄 토큰을 고릅니다.',
      '카드 예약 — 공개 카드나 덱에서 한 장을 예약해 내 예약 칸에 둡니다. 가능한 경우 황금 토큰 한 개를 받아요. 예약은 세 장까지이고, 예약한 카드는 나중에 구매할 수 있습니다. 토큰이 열 개를 넘으면 반환할 토큰을 선택합니다.',
      '카드 구매 — 공개 카드나 내 예약 카드에서 살 카드를 선택하세요. 비용에서 내 개발 보너스를 빼고 남은 만큼 토큰을 냅니다. 카드의 보너스는 이후 비용을 줄이고 카드 점수는 즉시 더해집니다.',
      '귀족과 승리 — 카드 구매 뒤 조건에 맞는 귀족이 한 명이면 자동으로 오고, 여러 명이면 하나를 선택합니다. 누군가 15점에 도달하면 상대도 같은 수의 차례를 마칩니다. 점수가 높으면 승리하고, 동점이면 개발 카드가 더 적은 쪽이 이깁니다.',
    ],
    es: [
      'Objetivo — Llega a 15 puntos con cartas de desarrollo y nobles. Cuando alguien alcanza 15, ambas personas completan la misma cantidad de turnos; luego se comparan los puntos y la cantidad de cartas de desarrollo.',
      'Preparación — El banco tiene 4 fichas de cada gema y 5 doradas. Hay 3 nobles y 4 cartas visibles por nivel. El costo, los puntos y la bonificación de cada carta aparecen en su frente.',
      'Tomar fichas — En tu turno toma 3 gemas de colores distintos, una de cada color; si quedan menos de 3 colores en el banco, toma una de cada color disponible. También puedes tomar 2 del mismo color si quedan al menos 4. El oro sustituye cualquier color al comprar. El límite es de 10 fichas; si lo superas, elige cuáles devolver.',
      'Reservar — Reserva una carta visible o roba la superior de un mazo para guardarla. Si hay oro disponible, recibes una ficha dorada. Puedes reservar hasta 3 cartas y comprarlas después. Si pasas el límite de 10 fichas, elige cuáles devolver.',
      'Comprar — Elige una carta visible o una de tus reservadas. Resta tus bonificaciones de gema al costo y paga lo que falte con fichas; el oro puede cubrir cualquier color. La bonificación de la carta reduce costos futuros y sus puntos se suman de inmediato.',
      'Nobles y victoria — Después de comprar, recibes automáticamente el noble si solo cumples un requisito; si cumples varios, eliges uno. Al llegar alguien a 15, la otra persona completa sus turnos pendientes. Gana quien tenga más puntos; en empate, gana quien tenga menos cartas de desarrollo.',
    ],
  },
  minhwatu: {
    ko: [
      '목표와 준비 — 같은 달의 패를 잡아 점수를 모읍니다. 48장 중 각자 10장, 바닥 8장, 더미 20장으로 시작하는 2인 한 판입니다.',
      '내 차례 — 손패에서 한 장을 내고, 이어 더미 맨 위 카드를 공개합니다. 화면은 같은 달 패와 선택 가능한 행동을 표시합니다.',
      '짝 맞추기 — 바닥에 같은 달이 없으면 낸 패가 남고, 있으면 규칙에 따라 가져갑니다. 아래 그림은 0·1·2·3장 일치 때의 결과를 보여 줍니다.',
      '점수와 조합 — 광·열끗·띠·피 점수와 홍단·청단·초단·고도리 및 달 완성 보너스를 사용합니다. 아래 예시에서 카드와 실제 점수 계산을 확인하세요.',
      '정산 — 손패와 더미가 끝나면 기본 점수 + 내 조합 보너스 2배 − 상대 조합 보너스로 계산합니다. 점수가 높으면 이기고, 같으면 무승부입니다. 고·스톱과 피 교환은 없습니다.',
    ],
    es: [
      'Objetivo y preparación — Captura cartas del mismo mes para sumar puntos. Se usan 48 cartas: 10 para cada persona, 8 en la mesa y 20 en el mazo. Es una sola mano para dos personas.',
      'Tu turno — Juega una carta de tu mano y luego se revela la carta superior del mazo. La pantalla señala las cartas del mismo mes y las acciones disponibles.',
      'Emparejar — Si no hay coincidencia, tu carta se queda en la mesa; si la hay, la capturas según la regla. La guía ilustrada muestra qué pasa con 0, 1, 2 o 3 coincidencias.',
      'Puntos y combinaciones — Se usan los valores de brillantes, animales, cintas y simples, además de Hongdan, Cheongdan, Chodan, Godori y los meses completos. Mira las cartas y el cálculo real en los ejemplos de abajo.',
      'Cuenta final — Al terminar manos y mazo: puntos base + el doble de tus bonos − los bonos de la otra persona. Gana quien tenga más; si empatan, queda empate. No usamos parar/seguir ni intercambio de pi de Go-Stop.',
    ],
  },
  marble: {
    ko: [
      '목표 — 현금을 모으거나 상대를 파산시키면 이깁니다. Marble은 고전 부동산 보드게임에서 영감을 받은 자체 규칙입니다.',
      '이동 — ‘주사위 굴리기’를 눌러 두 주사위의 합만큼 이동합니다. 출발점을 지나면 200을 받습니다. 40칸 보드에는 광주, 산토도밍고를 포함한 24개 도시가 있습니다.',
      '부동산과 건물 — 빈 부동산에서는 ‘구매’를 누르거나 지나갈 수 있고, 상대 부동산의 임대료는 자동으로 냅니다. 소유한 부동산에는 단독주택→아파트→호텔 순서로 건설할 수 있습니다. 단계마다 100이며 임대료는 기본의 2배→4배→8배가 됩니다.',
      '황금열쇠와 기금 — 황금열쇠 칸에서는 공개 카드가 바로 적용됩니다. 카드에는 상금·비용·이동·탈출권·무료 열차표가 있습니다. 기금 납부 칸에 도착하면 150을 공동 기금에 내고, 사회복지기금 칸에서는 쌓인 기금을 모두 받습니다.',
      '무인도와 열차 — 무인도에 보내지면 세 번의 자기 차례를 쉽니다. 차례마다 쌍을 노려 탈출할 수 있고, 아니면 차례를 잃습니다. 또는 100을 내거나 탈출권을 써서 나온 뒤 주사위를 굴립니다. 역에 도착하면 다음 자기 차례에 운임 100으로 부동산을 골라 이동하거나 열차를 건너뛸 수 있습니다.',
      '승리 — 무료 열차표로는 운임 없이 부동산으로 이동합니다. 이동 경로가 출발점을 지나면 200을 받습니다. 임대료나 비용을 낼 수 없으면 파산하며, 120턴 뒤에는 현금+부동산 가격+건물 비용을 합친 총자산이 많은 사람이 이깁니다.',
    ],
    es: [
      'Objetivo — Gana quien reúna más efectivo o lleve a la otra persona a la quiebra. Marble usa reglas propias inspiradas en los juegos clásicos de propiedades.',
      'Movimiento — Pulsa «Lanzar dados» y avanza la suma de los dos dados. Al pasar por Salida recibes 200. El tablero tiene 40 casillas y 24 ciudades, entre ellas Gwangju y Santo Domingo.',
      'Propiedades y edificios — En una propiedad libre puedes pulsar «Comprar» o pasar; el alquiler rival se cobra automáticamente. En cada propiedad tuya puedes construir villa, edificio y hotel, en ese orden. Cada nivel cuesta 100 y multiplica el alquiler base por 2, 4 y 8.',
      'Llave dorada y fondo — Las cartas de Llave dorada se aplican de inmediato y pueden dar o quitar dinero, mover tu ficha, darte un pase o un boleto de tren. En el espacio de aporte depositas 150 en el fondo común; en el de Fondo Social recibes todo lo acumulado.',
      'Isla y tren — En la isla pierdes tres turnos. En cada turno allí puedes intentar sacar dobles; si no salen, pierdes ese turno. También puedes pagar 100 o usar un pase para salir y lanzar los dados. Al llegar a una estación, en tu próximo turno puedes pagar 100 y viajar a una propiedad, o pasar el tren.',
      'Victoria — El boleto gratis permite viajar sin pagar. Si el recorrido pasa por Salida, recibes 200. Si no puedes pagar un alquiler o costo, quiebras; a los 120 turnos gana quien tenga más patrimonio total: efectivo, valor de sus propiedades y costo de sus edificios.',
    ],
  },
  rhythm: {
    ko: [
      '목표 — Music Talk Talk의 독립 리듬 게임을 플레이어에서 실행해 화면의 음악 입력에 맞춰 진행합니다. 방의 대화나 점수 기록과는 별개입니다.',
      '준비 — 게임을 불러올 때까지 기다립니다. 불러오지 못하면 ‘다시 불러오기’를 누를 수 있고, 계속 실패하면 원작 제공처를 열어 보세요.',
      '조작 — 게임 안내에 표시된 방향키로 움직이고 스페이스바로 입력합니다. 화면에 나온 박자와 방향을 따라 누르세요.',
      '화면 — 필요하면 ‘전체 화면’을 눌러 크게 볼 수 있습니다. 다시 누르면 전체 화면에서 나옵니다.',
      '알아둘 점 — 원작 안내에는 ‘처음으로’ 버튼이 작동하지 않을 수 있다고 적혀 있습니다. 전체 플레이는 브라우저에서 아직 검증되지 않았습니다.',
    ],
    es: [
      'Objetivo — Ejecuta el juego de ritmo independiente Music Talk Talk y sigue las indicaciones musicales en pantalla. Su puntuación y final, si aparecen, pertenecen al juego original; la sala no registra un ganador.',
      'Preparación — Espera a que cargue el juego. Si no carga, pulsa «Volver a cargar»; si sigue fallando, puedes abrir la página original.',
      'Controles — Usa las flechas que indica el juego para moverte y la barra espaciadora para tocar. Sigue el ritmo y las direcciones que aparecen en pantalla.',
      'Pantalla — Si lo necesitas, pulsa «Pantalla completa» para ampliar el juego y vuelve a pulsarlo para salir.',
      'Nota — La publicación original avisa que el botón «Inicio» puede fallar. El juego completo aún no se ha verificado en todos los navegadores.',
    ],
  },
};

export const marbleLegacyRules: LocalizedRules = {
  ko: [
    '목표 — 현금을 모으거나 상대를 파산시키면 이깁니다. 이 저장된 게임은 이전 18칸 Marble 규칙을 유지합니다.',
    '이동과 구매 — 차례에 두 주사위를 굴려 이동하고 출발점을 지나면 200을 받습니다. 빈 부동산에 도착하면 구매하거나 지나갈 수 있고, 상대 부동산 임대료는 자동으로 냅니다.',
    '건설 — 한 색 부동산을 모두 소유하면 각 부동산에 최대 두 채까지 집을 지을 수 있습니다. 집은 한 채에 100이며, 집마다 기본 임대료가 한 번 더해집니다.',
    '이벤트 — 두 이벤트 칸에는 8장의 현금·수리비·산토도밍고 방문·출발점 이동·세 칸 후진 카드가 있습니다. 공개 카드를 즉시 적용하고, 카드 이동 뒤 이벤트 칸에 도착해도 다시 뽑지 않습니다.',
    '세금과 휴식 — 세금 칸에서는 표시된 금액을 내고 휴식 칸에서는 아무 효과 없이 차례를 계속합니다. 비용이나 임대료를 낼 수 없으면 파산합니다.',
    '승리 — 120턴까지 끝나지 않으면 현금이 더 많은 사람이 이깁니다. 이 저장된 게임에는 새 보드의 무인도·열차·공동 기금 규칙이 적용되지 않습니다.',
  ],
  es: [
    'Objetivo — Gana quien reúna más efectivo o lleve a la otra persona a la quiebra. Esta partida guardada conserva las reglas anteriores de Marble, con 18 casillas.',
    'Movimiento y compra — En tu turno lanza dos dados y avanza; al pasar por Salida recibes 200. Si llegas a una propiedad libre, puedes comprarla o pasar. El alquiler rival se cobra automáticamente.',
    'Construcción — Cuando posees todas las propiedades de un color, puedes construir hasta dos casas en cada una. Cada casa cuesta 100 y suma otro alquiler base.',
    'Eventos — Las dos casillas de evento usan ocho cartas de dinero, mantenimiento, visita a Santo Domingo, viaje a Salida o retroceso de tres espacios. La carta visible se aplica de inmediato; su movimiento no activa otra carta.',
    'Impuestos y descanso — En las casillas de impuesto pagas la cantidad indicada; las de descanso no tienen efecto. Si no puedes pagar un alquiler o costo, quiebras.',
    'Victoria — Si la partida llega a 120 turnos, gana quien tenga más efectivo. Esta partida guardada no usa la isla, los trenes ni el fondo común del tablero nuevo.',
  ],
};
