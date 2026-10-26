import type { GameId, Language } from '../core/types';

export interface BeginnerGuideStep {
  title: string;
  body: string;
}

export interface BeginnerGuide {
  goal: string;
  steps: [BeginnerGuideStep, BeginnerGuideStep, BeginnerGuideStep];
  tip: string;
  imageAlt: string;
}

type GuideCopy = Omit<BeginnerGuide, 'imageAlt'>;

export interface BeginnerGuideOptions {
  /** Catchmind 2 uses timed hints and 100-point scoring; older saved rooms keep version 1. */
  catchmindRulesVersion?: number;
  /** Board version 1 is the saved 18-space board; 2 is the current 40-space board. */
  marbleVersion?: number;
  /** Economy 0 has no credit; 1 uses fixed construction costs; 2 uses tiered costs. */
  marbleEconomyVersion?: number;
  marbleCityRouteVersion?: number;
  /** 1 enables acquisition, color bonuses, doubles and emergency asset sales. */
  marblePropertyRulesVersion?: number;
}

type BeginnerGameId = Extract<GameId, 'davinci' | 'catchmind' | 'marble'>;

const guides: Record<BeginnerGameId, Record<Language, GuideCopy>> = {
  davinci: {
    ko: {
      goal: '상대의 숨은 숫자 타일과 조커를 모두 맞히면 이겨요.',
      steps: [
        { title: '준비하기', body: '아래는 내 손패, 위는 상대의 숨은 패예요. 숫자는 자동 정렬돼요. 조커가 있으면 손패 사이의 +를 눌러 놓고, 둘 다 ‘초기 패 준비 완료’를 눌러요.' },
        { title: '뽑고 추리하기', body: '‘타일 뽑기’ 뒤 상대의 가려진 타일과 숫자 0~11 또는 －(조커)를 골라요. ‘이 숫자로 추측하기’(조커는 ‘조커로 추측하기’)를 누르고 ‘추측 확정’으로 보내요. 확정 전에는 ‘취소’할 수 있어요.' },
        { title: '오답과 승리', body: '맞히면 타일이 공개되니 계속 추리하거나 ‘차례 마치기’를 눌러요. 틀리면 뽑은 내 타일이 공개되고 차례가 끝나요; 더미가 비면 내 비공개 타일 하나를 골라 공개해요.' },
      ],
      tip: '숫자 타일은 작은 수부터 놓고, 같은 수는 검정 타일이 먼저예요. 조커는 원하는 빈칸에 놓으면 옮길 수 없어요.',
    },
    es: {
      goal: 'Gana quien descubra todos los números y comodines de la otra persona.',
      steps: [
        { title: 'Preparación', body: 'Abajo está tu mano; arriba, las fichas rivales ocultas. Los números se ordenan solos. Si tienes un comodín, pulsa un + para colocarlo. Ambos pulsen «Terminé de preparar mi mano».' },
        { title: 'Roba y adivina', body: 'Pulsa «Robar ficha», elige una ficha rival oculta y marca 0–11 o －. Pulsa «Adivinar este número» o «Adivinar el comodín» y después «Confirmar». Antes de enviar puedes pulsar «Cancelar».' },
        { title: 'Acierto y victoria', body: 'Si aciertas, la ficha queda visible y puedes seguir adivinando o pulsar «Terminar turno». Si fallas, se revela tu ficha recién robada y termina tu turno; con el mazo vacío, eliges una ficha propia oculta para revelarla.' },
      ],
      tip: 'Las fichas van de menor a mayor; si coinciden, la negra va primero. El comodín puede ir en cualquier hueco y luego no se mueve.',
    },
  },
  catchmind: {
    ko: {
      goal: '번갈아 그림을 그리고 맞혀 점수를 모아요.',
      steps: [
        { title: '단어 고르기', body: '호스트가 주제 하나를 고르고 ‘설정 저장’을 눌러요. 그리는 사람은 제시어 하나를 골라요. 맞히는 사람은 한국어 □ / 스페인어 ? 글자 수를 나란히 봐요. 시간에 따라 글자가 공개되지는 않아요.' },
        { title: '그림과 답', body: '그리는 사람은 펜 색·굵기, 지우개, 실행 취소와 전체 지우기를 써요. 기본 색·보조 색 중 하나를 고른 뒤 색상을 선택하고, 색 바꾸기로 서로 바꿀 수 있어요. 키보드: 화살표 이동, Space 그리기/멈춤, Enter 채우기·색 선택·점 찍기, Esc 선 마침, Tab 나가기. 맞히는 사람은 공유 채팅에 한국어나 스페인어로 답해요.' },
        { title: '점수와 차례', body: '정답이면 그리는 사람은 1점, 맞힌 사람은 남은 시간에 따라 1~3점을 얻어요. 시간이 끝나면 정답이 공개돼요. ‘다음 라운드’로 역할을 바꿔 계속하고, 마지막에 점수가 높으면 이겨요.' },
      ],
      tip: '스페인어 답은 악센트(á·é·í·ó·ú)와 ñ·ü까지 정확히 입력해요. 예: fútbol은 futbol로 쓰면 오답이에요.',
    },
    es: {
      goal: 'Dibujen y adivinen por turnos para sumar puntos.',
      steps: [
        { title: 'Elige una palabra', body: 'La persona anfitriona elige una categoría y pulsa «Guardar ajustes». Quien dibuja escoge una palabra. Quien adivina ve las longitudes en coreano □ y español ?; no se revelan letras con el tiempo.' },
        { title: 'Dibuja y responde', body: 'Quien dibuja usa color, grosor, borrador, deshacer y borrar todo. Elige «Color principal» o «Color secundario» y después un color; «Intercambiar colores» los cambia entre sí. Teclado: flechas mueven; Espacio dibuja/para; Enter rellena, elige color o dibuja un punto; Esc termina el trazo; Tab sale del lienzo. Quien adivina responde en el chat compartido en coreano o español.' },
        { title: 'Puntos y turnos', body: 'Si acierta, quien dibuja gana 1 punto y quien adivina recibe de 1 a 3 según el tiempo restante. Al acabarse el tiempo se revela la respuesta. Pulsa «Siguiente ronda» para cambiar de papel; al final gana quien tenga más puntos.' },
      ],
      tip: 'Respeta las tildes (á, é, í, ó, ú) y letras como ñ y ü. Por ejemplo, fútbol no se acepta como futbol.',
    },
  },
  marble: {
    ko: {
      goal: '도시를 사고 건설해 자산을 모으거나 상대를 파산시키세요.',
      steps: [
      { title: '이동하고 구매하기', body: '보드의 말이 현재 위치이고 오른쪽은 현금·행동 버튼이에요. 첫 주사위 전에 말을 고른 뒤 ‘주사위 굴리기’를 눌러요. 빈 도시는 ‘도시 구매’ 또는 지나가기를 선택해요. 구매하면 중앙 행동 카드에서 바로 다음 행동을 확인해요. 출발점을 지나면 200을 받아요.' },
        { title: '건설과 임대료', body: '내 도시를 선택하면 현재 단계와 통행료를 확인할 수 있어요. 중앙 건설 버튼이나 다른 도시 건설 목록에서 단독주택→아파트→랜드마크를 올리고, 비용과 건설 뒤 통행료를 비교해요. 예: 광주 100, 기본 통행료 20, 첫 건설 40, 통행료 20→40. 통행료는 자동 지급되지만 면제권 선택창이 나오면 지급/사용을 먼저 골라요.' },
        { title: '위기와 승리', body: '돈이 부족하면 빌릴 수 있는지 확인하고, 해결하지 못하면 파산해요. 현재판은 120턴 뒤 대출을 뺀 순자산으로 승자를 정해요.' },
      ],
      tip: '기본 통행료는 땅값의 약 20~25%이고, 건설비는 매입가의 40%→60%→80%예요. 단계별 통행료는 기본의 1·2·3·4배예요. 대출은 300을 받고 330을 갚아요.',
    },
    es: {
      goal: 'Compra ciudades, construye y reúne patrimonio o lleva a la otra persona a la quiebra.',
      steps: [
      { title: 'Avanza y compra', body: 'La ficha marca tu posición; a la derecha están tu efectivo y las acciones. Antes del primer lanzamiento elige una ficha; pulsa «Lanzar los dados». En una ciudad libre, elige «Comprar ciudad» o pasa. Después de comprar, la tarjeta central muestra la siguiente acción. Al cruzar Salida recibes 200.' },
      { title: 'Construye y cobra', body: 'Selecciona una ciudad propia para ver su nivel y alquiler. Usa la acción central o la lista de otras ciudades para construir una casa, apartamentos o monumento; compara el costo y el nuevo alquiler. Ejemplo: Gwangju cuesta 100, alquiler base 20 y primera construcción 40; el alquiler pasa de 20 a 40. La renta es automática, salvo que aparezca la elección de pagar o usar un pase.' },
        { title: 'Deuda y victoria', body: 'Si te falta dinero, revisa si puedes pedir un préstamo; si no resuelves el pago, quiebras. En el tablero actual, tras 120 turnos gana el mayor patrimonio neto.' },
      ],
      tip: 'El alquiler base equivale aproximadamente al 20–25% del terreno; construir cuesta 40%, 60% y 80%. El alquiler por nivel es ×1, ×2, ×3 y ×4. Recibes 300 y devuelves 330.',
    },
  },
};

const catchmindCurrentGuide: Record<Language, GuideCopy> = {
  ko: {
    goal: '번갈아 그림을 그리고 맞혀 점수를 모아요. 기본 6개 개별 턴으로 각자 세 번 그려요.',
    steps: [
      { title: '단어 고르기', body: '호스트가 주제를 고르고 설정을 저장해요. 그리는 사람은 세 보기 중 하나를 15초 안에 골라요. 시간이 지나면 자동으로 골라 줘요. 기본 그림 시간은 80초예요.' },
      { title: '그림과 답', body: '그리는 사람은 펜 색·굵기, 지우개, 실행 취소와 전체 지우기를 써요. 기본 색·보조 색 중 하나를 고른 뒤 색상을 선택하고, 색 바꾸기로 서로 바꿀 수 있어요. 키보드: 화살표 이동, Space 그리기/멈춤, Enter 채우기·색 선택·점 찍기, Esc 선 마침, Tab 나가기. 맞히는 사람은 공유 채팅에 한국어나 스페인어로 답해요. 힌트를 켜면 시작 언어로 글자 수가 보이고 50%, 75% 시점에 한 글자씩 공개돼요.' },
      { title: '점수와 차례', body: '정답이면 그린 사람은 100점, 맞힌 사람은 남은 시간에 따라 100~200점에서 실제 공개된 글자마다 20점을 뺀 점수(최소 50점)를 얻어요. 시간초과나 건너뛰기는 둘 다 0점이에요. 정답과 점수를 5초 보여 주고 자동으로 다음 사람에게 넘어가요.' },
    ],
    tip: '한국어나 스페인어 정답 또는 등록된 별칭을 입력해요. 대소문자·연속 공백과 스페인어 모음 악센트·ü 차이는 무시하지만, ñ와 n은 구분해요.',
  },
  es: {
    goal: 'Dibujen y adivinen por turnos para sumar puntos. Hay seis turnos individuales, tres por persona.',
    steps: [
      { title: 'Elige una palabra', body: 'Quien creó la sala elige una categoría y guarda los ajustes. Quien dibuja tiene 15 segundos para elegir una de tres palabras; después se elige automáticamente. Hay 80 segundos para dibujar por defecto.' },
      { title: 'Dibuja y responde', body: 'Quien dibuja usa color, grosor, borrador, deshacer y borrar todo. Elige «Color principal» o «Color secundario» y después un color; «Intercambiar colores» los cambia entre sí. Teclado: flechas mueven; Espacio dibuja/para; Enter rellena, elige color o dibuja un punto; Esc termina el trazo; Tab sale del lienzo. Quien adivina responde en el chat compartido en coreano o español. Con pistas se muestra la longitud en su idioma inicial y se revela un carácter al 50 % y otro al 75 % del tiempo.' },
      { title: 'Puntos y turnos', body: 'Al acertar, quien dibuja suma 100 puntos y quien adivina recibe entre 100 y 200 según el tiempo, menos 20 por cada carácter realmente revelado (mínimo 50). Al agotarse el tiempo o pasar, ambos reciben 0. La respuesta y los puntos aparecen cinco segundos antes del siguiente turno automático.' },
    ],
    tip: 'Responde con la palabra en coreano o español o un alias registrado. No se distinguen mayúsculas, espacios repetidos ni los acentos de las vocales y ü; ñ y n sí se distinguen.',
  },
};

const marbleLegacyGuide: Record<Language, GuideCopy> = {
  ko: {
    goal: '부동산을 모아 현금을 지키거나 상대를 파산시키세요.',
    steps: [
      { title: '이동하고 구매하기', body: '‘주사위 굴리기’를 누르고 빈 부동산에서 구매하거나 지나가요. 출발점을 지나면 200을 받아요.' },
      { title: '건설과 임대료', body: '한 색 부동산을 모두 소유하면 집을 최대 두 채까지 지을 수 있어요. 상대 임대료는 자동 지급돼요.' },
      { title: '승리', body: '낼 돈이 없으면 파산해요. 120턴 안에 끝나지 않으면 현금이 더 많은 사람이 이겨요.' },
    ],
    tip: '이전 18칸 보드에는 현재판의 섬·열차·공동 기금 규칙이 없어요.',
  },
  es: {
    goal: 'Conserva efectivo y propiedades o lleva a la otra persona a la quiebra.',
    steps: [
      { title: 'Avanza y compra', body: 'Pulsa «Lanzar los dados». En una propiedad libre puedes comprar o pasar; al cruzar Salida recibes 200.' },
      { title: 'Construye y cobra', body: 'Al completar un color puedes construir hasta dos casas en cada propiedad. El alquiler rival se cobra automáticamente.' },
      { title: 'Victoria', body: 'Si no puedes pagar, quiebras. Si la partida llega a 120 turnos, gana quien tenga más efectivo.' },
    ],
    tip: 'El tablero anterior tiene 18 casillas y no incluye la isla, los trenes ni el fondo común.',
  },
};

const marblePropertyGuide: Record<Language, GuideCopy> = {
  ko: {
    goal: '도시를 사고 건설해 자산을 모으거나 상대를 파산시키세요.',
    steps: [
      { title: '굴리고 구매하기', body: '두 주사위를 굴려요. 원하면 첫 굴림 전에 말을 바꿀 수 있어요. 빈 도시는 구매하거나 지나가요. 출발을 통과하면 200을 받아요. 더블이면 도착 행동을 마친 뒤 한 번 더 굴리고, 3연속 더블이면 바로 무인도로 가요.' },
      { title: '건설하고 인수하기', body: '내 도시는 단독주택→아파트→랜드마크로 올려요. 상대 도시에 도착하면 통행료부터 처리한 뒤 누적 투자액의 2배로 인수할 수 있어요. 랜드마크는 인수와 정전에서 보호돼요. 한 사람이 같은 색을 전부 모으면 통행료가 2배예요.' },
      { title: '현금을 지키기', body: '의무 지급액이 부족하면 내 도시와 건물을 은행에 팔아 누적 투자액의 절반을 받아요. 300을 빌리면 330을 갚아요. 매각과 대출로도 해결할 수 없을 때만 파산해요. 120개 완료 차례 뒤에는 대출을 뺀 순자산을 비교해요.' },
    ],
    tip: '건설비 40%·60%·80%는 각 단계의 추가 비용이에요. 인수는 선택이며, 최종 3단계 랜드마크는 인수할 수 없어요.',
  },
  es: {
    goal: 'Compra ciudades, construye y reúne patrimonio o lleva a la otra persona a la quiebra.',
    steps: [
      { title: 'Lanza y compra', body: 'Lanza los dos dados. Si quieres, cambia de ficha antes del primer lanzamiento. Si la ciudad está libre, puedes comprarla o rechazar la compra. Al pasar por Salida cobras 200. Si los dos dados muestran el mismo número, son dobles: resuelve la llegada y vuelve a lanzar; con tres dobles seguidos vas directo a la isla.' },
      { title: 'Construye y adquiere', body: 'Mejora tus ciudades: casa, apartamentos y monumento. Al llegar a una ciudad rival, resuelve primero el alquiler; después puedes adquirirla por el doble de la inversión acumulada. El monumento no se puede adquirir ni recibe apagón. Completar un color tú solo duplica sus alquileres.' },
      { title: 'Cuida tu efectivo', body: 'Si no te alcanza para un pago obligatorio, vende al banco una ciudad con sus edificios por la mitad de su inversión. Puedes pedir 300 y devolver 330. Solo quiebras si vender y pedir crédito tampoco basta. Tras 120 turnos completos se compara el patrimonio, restando la deuda.' },
    ],
    tip: 'El 40 %, 60 % y 80 % son costos adicionales de cada nivel. Adquirir es opcional; el monumento de nivel 3 está protegido.',
  },
};

const imageAlts: Record<BeginnerGameId, Record<Language, string>> = {
  davinci: { ko: '숫자와 조커 타일을 비교하며 추리하는 다빈치 게임판', es: 'Tablero de Da Vinci con fichas numeradas y comodines para adivinar' },
  catchmind: { ko: '한 사람이 단어를 그림으로 그리고 다른 사람이 맞히는 화면', es: 'Una persona dibuja una palabra y la otra intenta adivinarla' },
  marble: { ko: '도시와 건물이 있는 부동산 보드게임 말판', es: 'Tablero de propiedades con ciudades y edificios' },
};

export function getBeginnerGuide(
  gameId: GameId,
  language: Language,
  options: BeginnerGuideOptions = {},
): BeginnerGuide | null {
  if (gameId !== 'davinci' && gameId !== 'catchmind' && gameId !== 'marble') return null;
  let guide: GuideCopy;
  if (gameId === 'marble' && (options.marbleVersion ?? 2) === 1) guide = marbleLegacyGuide[language];
  else if (gameId === 'marble' && options.marblePropertyRulesVersion === 1) guide = marblePropertyGuide[language];
  else if (gameId === 'marble' && (options.marbleEconomyVersion ?? 2) === 0) {
    const current = guides.marble[language];
    guide = {
      ...current,
      steps: [current.steps[0], current.steps[1], {
        title: language === 'ko' ? '위기와 승리' : 'Dificultades y victoria',
        body: language === 'ko'
          ? '낼 돈이 없으면 파산해요. 120턴 뒤에는 현금과 도시·건물 가치를 합친 자산으로 승자를 정해요.'
          : 'Si no puedes pagar, quiebras. Tras 120 turnos gana quien tenga más efectivo y valor en ciudades y edificios.',
      }],
      tip: language === 'ko'
        ? '이 경제 규칙은 건설비가 단계마다 100이고 대출 기능이 없어요.'
        : 'Esta versión cobra 100 por cada nivel de construcción y no tiene préstamos.',
    };
  }
  else if (gameId === 'marble' && (options.marbleEconomyVersion ?? 2) === 1) {
    const current = guides.marble[language];
    guide = {
      ...current,
      tip: language === 'ko'
        ? '건설비는 단계마다 100이에요. 대출은 300을 받고 330을 갚으며, 기존 대출을 먼저 상환해야 다시 빌릴 수 있어요.'
        : 'Cada nivel de construcción cuesta 100. Recibes 300 y debes 330; paga la deuda antes de pedir otro préstamo.',
    };
  }
  else guide = gameId === 'catchmind' && options.catchmindRulesVersion !== 1 ? catchmindCurrentGuide[language] : guides[gameId][language];
  if (gameId === 'marble' && (options.marbleVersion ?? 2) !== 1 && options.marblePropertyRulesVersion !== 1) {
    const economy = options.marbleEconomyVersion ?? 2;
    if (economy < 2) {
      const historicBuild = language === 'ko'
        ? '내 도시를 선택해 단독주택→아파트→랜드마크를 차례로 지어요. 예: 광주 100, 첫 건설 100, 통행료 12→24. 통행료는 자동 지급되지만 면제권 선택창에서는 먼저 선택해요.'
        : 'Selecciona una ciudad tuya para construir una casa, apartamentos o monumento. Ejemplo: Gwangju cuesta 100, construir primero cuesta 100 y su renta pasa de 12 a 24. La renta es automática, salvo que aparezca la elección de usar un pase.';
      guide = { ...guide, steps: [guide.steps[0], { ...guide.steps[1], body: historicBuild }, guide.steps[2]], tip: economy === 0
        ? (language === 'ko' ? '이 규칙은 단계별 건설비가 100이고 대출 기능이 없어요.' : 'Esta versión cobra 100 por cada nivel de construcción y no tiene préstamos.')
        : (language === 'ko' ? '건설비는 단계마다 100이에요. 대출은 300을 받고 330을 갚으며, 기존 대출을 먼저 상환해야 다시 빌릴 수 있어요.' : 'Cada nivel de construcción cuesta 100. Recibes 300 y debes 330; paga la deuda antes de pedir otro préstamo.') };
    } else if (economy === 2) {
      const historicBuild = language === 'ko'
        ? '내 도시를 선택해 단독주택→아파트→랜드마크를 차례로 지어요. 예: 광주 100, 첫 건설 40, 통행료 12→24. 단계별 통행료는 기본의 1·2·4·8배예요.'
        : 'Selecciona una ciudad tuya para construir una casa, apartamentos o monumento. Ejemplo: Gwangju cuesta 100, construir primero cuesta 40 y su renta pasa de 12 a 24. Los niveles cobran ×1, ×2, ×4 y ×8.';
      guide = { ...guide, steps: [guide.steps[0], { ...guide.steps[1], body: historicBuild }, guide.steps[2]], tip: language === 'ko'
        ? '건설비는 단계마다 땅값의 40%·60%·80%예요. 단계별 통행료는 1·2·4·8배이며, 대출은 300을 받고 330을 갚아요.'
        : 'Construir cuesta 40 %, 60 % y 80 % del precio del terreno. El alquiler por nivel es ×1, ×2, ×4 y ×8; recibes 300 y devuelves 330.' };
    }
  }
  return { ...guide, imageAlt: imageAlts[gameId][language] };
}
