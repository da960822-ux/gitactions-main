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
  /** Board version 1 is the saved 18-space board; 2 is the current 40-space board. */
  marbleVersion?: number;
  /** Economy 0 has no credit; 1 uses fixed construction costs; 2 uses tiered costs. */
  marbleEconomyVersion?: number;
}

type BeginnerGameId = Extract<GameId, 'davinci' | 'catchmind' | 'marble'>;

const guides: Record<BeginnerGameId, Record<Language, GuideCopy>> = {
  davinci: {
    ko: {
      goal: '상대의 숨은 숫자 타일과 조커를 모두 맞히면 이겨요.',
      steps: [
        { title: '준비하기', body: '아래는 내 손패, 위는 상대의 숨은 패예요. 숫자는 자동 정렬돼요. 조커가 있으면 손패 사이의 +를 눌러 놓고, 둘 다 ‘초기 패 준비 완료’를 눌러요.' },
        { title: '뽑고 추리하기', body: '‘타일 뽑기’를 누른 뒤 상대의 가려진 타일을 눌러요. 숫자 0~11 또는 －(조커)를 고르고 추리를 확정해요. 예: 검정 3 오른쪽의 숨은 숫자는 3 이상이에요(조커는 예외).' },
        { title: '오답과 승리', body: '맞히면 타일이 공개되니 계속 추리하거나 ‘차례 마치기’를 눌러요. 틀리면 뽑은 내 타일이 공개되고 차례가 끝나요; 더미가 비면 공개할 타일은 없어요.' },
      ],
      tip: '숫자 타일은 작은 수부터 놓고, 같은 수는 검정 타일이 먼저예요. 조커는 원하는 빈칸에 놓으면 옮길 수 없어요.',
    },
    es: {
      goal: 'Gana quien descubra todos los números y comodines de la otra persona.',
      steps: [
        { title: 'Preparación', body: 'Abajo está tu mano; arriba, las fichas rivales ocultas. Los números se ordenan solos. Si tienes un comodín, pulsa un + para colocarlo. Ambos pulsen «Terminé de preparar mi mano».' },
        { title: 'Roba y adivina', body: 'Pulsa «Robar ficha», elige una ficha rival oculta, marca 0–11 o － (comodín) y confirma. Ejemplo: a la derecha de un 3 negro, un número oculto será 3 o mayor; el comodín es una excepción.' },
        { title: 'Acierto y victoria', body: 'Si aciertas, la ficha queda visible y puedes seguir adivinando o pulsar «Terminar turno». Si fallas, se revela tu ficha recién robada y termina tu turno; con el mazo vacío, no se revela otra.' },
      ],
      tip: 'Las fichas van de menor a mayor; si coinciden, la negra va primero. El comodín puede ir en cualquier hueco y luego no se mueve.',
    },
  },
  catchmind: {
    ko: {
      goal: '번갈아 그림을 그리고 맞혀 점수를 모아요.',
      steps: [
        { title: '단어 고르기', body: '그리는 사람은 제시된 단어 중 하나를 골라요. 맞히는 사람은 글자 수와 단계별 힌트를 봐요.' },
        { title: '그림과 답', body: '그리는 사람은 펜 색·굵기, 지우개, 실행 취소와 전체 지우기를 써서 그림만 그려요. 맞히는 사람은 공유 채팅에 한국어나 스페인어로 답해요.' },
        { title: '점수와 차례', body: '정답이면 그리는 사람은 1점, 맞힌 사람은 남은 시간에 따라 1~3점을 얻어요. 역할을 바꿔 설정한 라운드 수만큼 하고, 최종 점수가 높으면 이겨요.' },
      ],
      tip: '스페인어 답은 악센트(á·é·í·ó·ú)와 ñ·ü까지 정확히 입력해요. 예: fútbol은 futbol로 쓰면 오답이에요.',
    },
    es: {
      goal: 'Dibujen y adivinen por turnos para sumar puntos.',
      steps: [
        { title: 'Elige una palabra', body: 'Quien dibuja escoge una de las opciones. Quien adivina ve la cantidad de letras y las pistas que aparecen.' },
        { title: 'Dibuja y responde', body: 'Quien dibuja usa color, grosor, borrador, deshacer y borrar todo; solo puede dar pistas con dibujos. Quien adivina responde en el chat compartido en coreano o español.' },
        { title: 'Puntos y turnos', body: 'Si acierta, quien dibuja gana 1 punto y quien adivina recibe de 1 a 3 según el tiempo restante. Cambien de papel y, al final, gana quien tenga más puntos.' },
      ],
      tip: 'Respeta las tildes (á, é, í, ó, ú) y letras como ñ y ü. Por ejemplo, fútbol no se acepta como futbol.',
    },
  },
  marble: {
    ko: {
      goal: '도시를 사고 건설해 자산을 모으거나 상대를 파산시키세요.',
      steps: [
        { title: '이동하고 구매하기', body: '보드의 말이 현재 위치이고 오른쪽은 현금·행동 버튼이에요. 첫 주사위 전에 말을 고른 뒤 ‘주사위 굴리기’를 눌러요. 빈 도시는 ‘도시 구매’ 또는 지나가기를 선택해요. 출발점을 지나면 200을 받아요.' },
        { title: '건설과 임대료', body: '내 도시를 눌러 단독주택→아파트→랜드마크를 건설하고 ‘차례 마치기’를 눌러요. 예: 광주 100, 첫 건설 40, 통행료 12→24. 통행료는 자동 지급되지만 면제권 선택창이 나오면 지급/사용을 먼저 골라요.' },
        { title: '위기와 승리', body: '돈이 부족하면 빌릴 수 있는지 확인하고, 해결하지 못하면 파산해요. 현재판은 120턴 뒤 대출을 뺀 순자산으로 승자를 정해요.' },
      ],
      tip: '현재판 건설비는 매입가의 40%→60%→80%예요. 대출은 300을 받고 330을 갚으며, 기존 대출을 먼저 상환해야 다시 빌릴 수 있어요.',
    },
    es: {
      goal: 'Compra ciudades, construye y reúne patrimonio o lleva a la otra persona a la quiebra.',
      steps: [
        { title: 'Avanza y compra', body: 'La ficha marca tu posición; a la derecha están tu efectivo y las acciones. Antes del primer lanzamiento elige una ficha; pulsa «Lanzar los dados». En una ciudad libre, elige «Comprar ciudad» o pasa. Al cruzar Salida recibes 200.' },
        { title: 'Construye y cobra', body: 'Pulsa una ciudad tuya para construir casa unifamiliar, apartamentos y monumento; luego «Terminar turno». Ejemplo: Gwangju cuesta 100, construir primero cuesta 40 y su renta pasa de 12 a 24. La renta es automática, salvo que aparezca la elección de pagar o usar un pase.' },
        { title: 'Deuda y victoria', body: 'Si te falta dinero, revisa si puedes pedir un préstamo; si no resuelves el pago, quiebras. En el tablero actual, tras 120 turnos gana el mayor patrimonio neto.' },
      ],
      tip: 'En el tablero actual construir cuesta 40 %, 60 % y 80 % del precio de compra. Recibes 300 y debes 330; paga la deuda antes de pedir otro préstamo.',
    },
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
      { title: 'Avanza y compra', body: 'Pulsa «Lanzar dados». En una propiedad libre puedes comprar o pasar; al cruzar Salida recibes 200.' },
      { title: 'Construye y cobra', body: 'Al completar un color puedes construir hasta dos casas en cada propiedad. El alquiler rival se cobra automáticamente.' },
      { title: 'Victoria', body: 'Si no puedes pagar, quiebras. Si la partida llega a 120 turnos, gana quien tenga más efectivo.' },
    ],
    tip: 'El tablero anterior tiene 18 casillas y no incluye la isla, los trenes ni el fondo común.',
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
  else guide = guides[gameId][language];
  if (gameId === 'marble' && (options.marbleVersion ?? 2) !== 1 && (options.marbleEconomyVersion ?? 2) < 2) {
    guide = { ...guide, steps: [guide.steps[0], { ...guide.steps[1], body: guide.steps[1].body.replace('첫 건설 40', '첫 건설 100').replace('construir primero cuesta 40', 'construir primero cuesta 100') }, guide.steps[2]] };
  }
  return { ...guide, imageAlt: imageAlts[gameId][language] };
}
