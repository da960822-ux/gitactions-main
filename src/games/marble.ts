import { marbleExpandedRules } from './rules';
import { GameAction, GameEngine, GameResult, PlayerId, otherPlayer, seededRandom, shuffle } from '../core/types';

export interface MarbleTile {
  name: { ko: string; es: string };
  kind: 'start' | 'property' | 'tax' | 'rest' | 'event' | 'island' | 'train' | 'fund' | 'fund-deposit';
  price?: number;
  rent?: number;
  group?: string;
}
export type MarbleEventId = 'festival' | 'lottery' | 'rent-rebate' | 'travel-cost' | 'maintenance' | 'visit-santo-domingo' | 'advance-start' | 'retreat' | 'go-to-island' | 'escape-pass' | 'train-ticket' | 'city-dividend' | 'monopoly-warning' | 'city-festival' | 'blackout' | 'rent-pass';
export const marblePawnIds = ['fox', 'cat', 'penguin', 'astronaut', 'robot', 'dragon'] as const;
export type MarblePawnId = typeof marblePawnIds[number];
const pawnNames: Record<MarblePawnId, { ko: string; es: string }> = { fox: { ko: '말티푸', es: 'Maltipoo' }, cat: { ko: '랙돌', es: 'Ragdoll' }, penguin: { ko: '판다', es: 'Panda' }, astronaut: { ko: '우주인', es: 'Astronauta' }, robot: { ko: '리스연', es: 'Lisyeon' }, dragon: { ko: '친칠라', es: 'Chinchilla' } };
export interface MarbleActionEvent {
  sequence: number; type: 'roll' | 'move' | 'arrival' | 'buy' | 'build' | 'rent' | 'tax' | 'bonus' | 'event-card' | 'loan' | 'repay' | 'crisis' | 'bankruptcy' | 'monopoly-warning' | 'island' | 'escape' | 'train' | 'rest' | 'turn' | 'win' | 'pawn';
  actor: PlayerId; title: { ko: string; es: string }; text: { ko: string; es: string };
  tile?: number; from?: number; to?: number; steps?: number; amount?: number; moneyDelta?: Partial<Record<PlayerId, number>>;
  fromPlayer?: PlayerId; toPlayer?: PlayerId; fromAccount?: PlayerId | 'bank' | 'fund'; toAccount?: PlayerId | 'bank' | 'fund'; cardId?: MarbleEventId; group?: string; debtAfter?: number;
}
type PendingPayment = { amount: number; creditor: PlayerId | 'bank' | 'fund'; reason: { ko: string; es: string }; tile?: number; resumePhase: 'main'; resumeActive: PlayerId; type: 'rent' | 'tax' | 'monopoly-warning' };
type RentModifier = { source: 'city-festival' | 'blackout'; playerId: PlayerId; owner: PlayerId };
type PendingRent = { amount: number; creditor: PlayerId; playerId: PlayerId; tile: number; reason: { ko: string; es: string } };
type CardData = Pick<MarblePublicEvent, 'title' | 'text' | 'effect'>;
export interface MarblePublicEvent {
  id: MarbleEventId; sequence: number; playerId: PlayerId; title: { ko: string; es: string }; text: { ko: string; es: string };
  effect: 'cash' | 'build' | 'maintenance' | 'visit' | 'move' | 'island' | 'pass' | 'train'; cashDelta: number; from: number | null; to: number | null; steps: number | null;
}
export interface MarbleState {
  rng: number; active: PlayerId; positions: Record<PlayerId, number>; money: Record<PlayerId, number>;
  properties: Record<string, { owner: PlayerId; houses: number }>;
  phase: 'roll' | 'decision' | 'main' | 'island' | 'train-decision' | 'event-decision' | 'rent-decision' | 'debt' | 'finished'; pendingTile: number | null; lastRoll: number[]; turns: number; result: GameResult | null;
  eventRng?: number; eventDeck?: MarbleEventId[]; eventSequence?: number; lastEvent?: MarblePublicEvent | null;
  boardVersion?: 2; cityRouteVersion?: 2 | 3; islandTurns?: Record<PlayerId, number>; escapePasses?: Record<PlayerId, number>; trainReady?: Record<PlayerId, boolean>;
  pendingTrainFare?: number | null; pendingTrainSource?: 'station' | 'card' | null;
  lastMove?: { sequence: number; playerId: PlayerId; from: number; to: number; steps: number | null; source: 'dice' | 'card' | 'train' | 'island' } | null;
  moveSequence?: number; fundPool?: number; diceSequence?: number;
  eventVersion?: 3;
  pendingEvent?: { id: 'city-festival' | 'blackout'; playerId: PlayerId } | null;
  pendingRent?: PendingRent | null; rentPasses?: Record<PlayerId, number>;
  rentModifiers?: Record<string, { festival?: RentModifier; blackout?: RentModifier }>;
  economicVersion?: 1 | 2; debt?: Record<PlayerId, number>; pendingPayment?: PendingPayment | null;
  actionLog?: MarbleActionEvent[]; actionSequence?: number;
  pawns?: Record<PlayerId, MarblePawnId>; pawnLocked?: Record<PlayerId, boolean>;
}

const legacyBoard: MarbleTile[] = [
  { kind: 'start', name: { ko: '출발', es: 'Salida' } },
  { kind: 'property', name: { ko: '광주', es: 'Gwangju' }, price: 100, rent: 12, group: 'green' },
  { kind: 'property', name: { ko: '산토도밍고', es: 'Santo Domingo' }, price: 120, rent: 15, group: 'green' },
  { kind: 'rest', name: { ko: '휴식 광장', es: 'Plaza de descanso' } },
  { kind: 'property', name: { ko: '바람 언덕', es: 'Colina del viento' }, price: 140, rent: 18, group: 'blue' },
  { kind: 'tax', name: { ko: '도시세', es: 'Impuesto municipal' }, price: 100 },
  { kind: 'property', name: { ko: '별빛 거리', es: 'Calle estelar' }, price: 160, rent: 22, group: 'blue' },
  { kind: 'event', name: { ko: '이벤트 카드', es: 'Carta de evento' } },
  { kind: 'property', name: { ko: '파도길', es: 'Camino de las olas' }, price: 180, rent: 26, group: 'yellow' },
  { kind: 'property', name: { ko: '등대 거리', es: 'Calle del faro' }, price: 200, rent: 30, group: 'yellow' },
  { kind: 'rest', name: { ko: '정원', es: 'Jardín' } },
  { kind: 'property', name: { ko: '구름 대로', es: 'Avenida de nubes' }, price: 220, rent: 34, group: 'red' },
  { kind: 'property', name: { ko: '달 정원', es: 'Jardín lunar' }, price: 240, rent: 38, group: 'red' },
  { kind: 'tax', name: { ko: '수리비', es: 'Reparación' }, price: 80 },
  { kind: 'property', name: { ko: '햇살 광장', es: 'Plaza del sol' }, price: 260, rent: 42, group: 'purple' },
  { kind: 'event', name: { ko: '이벤트 카드', es: 'Carta de evento' } },
  { kind: 'property', name: { ko: '숲길', es: 'Camino del bosque' }, price: 280, rent: 48, group: 'purple' },
  { kind: 'property', name: { ko: '무지개 길', es: 'Camino del arcoíris' }, price: 300, rent: 55, group: 'purple' },
];
const modernBoard: MarbleTile[] = [
  { kind: 'start', name: { ko: '출발', es: 'Salida' } },
  { kind: 'property', name: { ko: '광주', es: 'Gwangju' }, price: 100, rent: 12, group: 'green' },
  { kind: 'event', name: { ko: '황금열쇠', es: 'Llave dorada' } },
  { kind: 'property', name: { ko: '산토도밍고', es: 'Santo Domingo' }, price: 120, rent: 15, group: 'green' },
  { kind: 'property', name: { ko: '마드리드', es: 'Madrid' }, price: 140, rent: 18, group: 'blue' },
  { kind: 'property', name: { ko: '산티아고', es: 'Santiago' }, price: 160, rent: 22, group: 'blue' },
  { kind: 'tax', name: { ko: '도시세', es: 'Impuesto municipal' }, price: 100 },
  { kind: 'event', name: { ko: '황금열쇠', es: 'Llave dorada' } },
  { kind: 'property', name: { ko: '푸에르토플라타', es: 'Puerto Plata' }, price: 180, rent: 26, group: 'purple' },
  { kind: 'property', name: { ko: '산후안', es: 'San Juan' }, price: 200, rent: 30, group: 'purple' },
  { kind: 'island', name: { ko: '무인도', es: 'Isla desierta' } },
  { kind: 'property', name: { ko: '라베가', es: 'La Vega' }, price: 220, rent: 34, group: 'orange' },
  { kind: 'event', name: { ko: '황금열쇠', es: 'Llave dorada' } },
  { kind: 'property', name: { ko: '푼타카나', es: 'Punta Cana' }, price: 240, rent: 38, group: 'orange' },
  { kind: 'train', name: { ko: '열차역', es: 'Estación de tren' } },
  { kind: 'property', name: { ko: '뉴욕', es: 'Nueva York' }, price: 260, rent: 42, group: 'red' },
  { kind: 'property', name: { ko: '파리', es: 'París' }, price: 280, rent: 48, group: 'red' },
  { kind: 'property', name: { ko: '도쿄', es: 'Tokio' }, price: 300, rent: 55, group: 'yellow' },
  { kind: 'event', name: { ko: '황금열쇠', es: 'Llave dorada' } },
  { kind: 'property', name: { ko: '바르셀로나', es: 'Barcelona' }, price: 320, rent: 60, group: 'yellow' },
  { kind: 'fund', name: { ko: '사회복지기금', es: 'Fondo social' } },
  { kind: 'property', name: { ko: '사마나', es: 'Samaná' }, price: 340, rent: 64, group: 'teal' },
  { kind: 'property', name: { ko: '아바나', es: 'La Habana' }, price: 360, rent: 70, group: 'teal' },
  { kind: 'rest', name: { ko: '휴식 광장', es: 'Plaza de descanso' } },
  { kind: 'property', name: { ko: '멕시코시티', es: 'Ciudad de México' }, price: 380, rent: 75, group: 'dark' },
  { kind: 'property', name: { ko: '리스본', es: 'Lisboa' }, price: 400, rent: 80, group: 'dark' },
  { kind: 'train', name: { ko: '열차역', es: 'Estación de tren' } },
  { kind: 'event', name: { ko: '황금열쇠', es: 'Llave dorada' } },
  { kind: 'property', name: { ko: '런던', es: 'Londres' }, price: 420, rent: 84, group: 'pink' },
  { kind: 'property', name: { ko: '로마', es: 'Roma' }, price: 440, rent: 88, group: 'pink' },
  { kind: 'train', name: { ko: '세계 여행', es: 'Viaje mundial' } },
  { kind: 'property', name: { ko: '마이애미', es: 'Miami' }, price: 460, rent: 92, group: 'brown' },
  { kind: 'property', name: { ko: '발파라이소', es: 'Valparaíso' }, price: 480, rent: 96, group: 'brown' },
  { kind: 'property', name: { ko: '세부', es: 'Cebú' }, price: 500, rent: 100, group: 'gold' },
  { kind: 'event', name: { ko: '황금열쇠', es: 'Llave dorada' } },
  { kind: 'property', name: { ko: '토론토', es: 'Toronto' }, price: 520, rent: 104, group: 'gold' },
  { kind: 'property', name: { ko: '오클랜드', es: 'Auckland' }, price: 540, rent: 108, group: 'silver' },
  { kind: 'fund-deposit', name: { ko: '기금 납부', es: 'Aporte al fondo' }, price: 150 },
  { kind: 'property', name: { ko: '밴쿠버', es: 'Vancouver' }, price: 560, rent: 112, group: 'silver' },
  { kind: 'rest', name: { ko: '휴식 광장', es: 'Plaza de descanso' } },
];
// Saved version-2 rooms keep their original indexed properties and destinations.
const journeyBoard = modernBoard.map((tile, index) => index === 3 ? modernBoard[15] : index === 15 ? modernBoard[3]
  : index === 31 ? { ...tile, name: { ko: '뉴어크', es: 'Newark' } }
    : index === 38 ? { ...tile, name: { ko: '서울', es: 'Seúl' } } : tile);
const landmarkJourneyBoard = journeyBoard.map((tile, index) => {
  const names: Record<number, { ko: string; es: string }> = {
    11: { ko: '베를린', es: 'Berlín' }, 13: { ko: '마이애미', es: 'Miami' },
    21: { ko: '이스탄불', es: 'Estambul' }, 32: { ko: '아그라', es: 'Agra' },
    33: { ko: '아테네', es: 'Atenas' }, 36: { ko: '시드니', es: 'Sídney' },
  };
  return names[index] ? { ...tile, name: names[index] } : tile;
});
const boardFor = (s: MarbleState) => s.boardVersion === 2
  ? s.cityRouteVersion === 3 ? landmarkJourneyBoard : s.cityRouteVersion === 2 ? journeyBoard : modernBoard : legacyBoard;
const legacyIds: MarbleEventId[] = ['festival', 'lottery', 'rent-rebate', 'travel-cost', 'maintenance', 'visit-santo-domingo', 'advance-start', 'retreat'];
const modernIds: MarbleEventId[] = [...legacyIds, 'go-to-island', 'escape-pass', 'train-ticket', 'city-dividend'];
const expandedIds: MarbleEventId[] = [...modernIds, 'monopoly-warning', 'city-festival', 'blackout', 'rent-pass'];
const cards: Record<MarbleEventId, CardData> = {
  festival: { title: { ko: '동네 축제', es: 'Fiesta del barrio' }, text: { ko: '축제 준비를 도와 150을 받습니다.', es: 'Ayudas con la fiesta del barrio y recibes 150.' }, effect: 'cash' },
  lottery: { title: { ko: '작은 복권 당첨', es: 'Premio de lotería' }, text: { ko: '복권에 당첨되어 200을 받습니다.', es: 'Te ganas un premio de lotería y recibes 200.' }, effect: 'cash' },
  'rent-rebate': { title: { ko: '임대료 환급', es: 'Reembolso de alquiler' }, text: { ko: '임대료 일부를 돌려받아 80을 받습니다.', es: 'Te devuelven parte del alquiler: recibes 80.' }, effect: 'cash' },
  'travel-cost': { title: { ko: '여행 경비', es: 'Gastos de viaje' }, text: { ko: '여행 경비로 100을 냅니다.', es: 'Pagas 100 por gastos de viaje.' }, effect: 'cash' },
  maintenance: { title: { ko: '건물 수리', es: 'Mantenimiento de edificios' }, text: { ko: '내 도시의 건설 단계 합계에 40을 곱한 수리비를 냅니다. 단독주택은 1단계, 아파트는 2단계, 랜드마크는 3단계입니다.', es: 'Pagas 40 por cada nivel construido en tus ciudades: casa unifamiliar cuenta 1, apartamentos 2 y monumento 3.' }, effect: 'maintenance' },
  'visit-santo-domingo': { title: { ko: '산토도밍고 방문', es: 'Visita a Santo Domingo' }, text: { ko: '산토도밍고로 이동해 그곳의 부동산 규칙을 적용합니다.', es: 'Ve a Santo Domingo y aplica las reglas normales de esa propiedad.' }, effect: 'visit' },
  'advance-start': { title: { ko: '출발점으로 이동', es: 'Ve a Salida' }, text: { ko: '출발점으로 이동하고 200을 받습니다.', es: 'Ve a Salida y recibe 200.' }, effect: 'move' },
  retreat: { title: { ko: '세 칸 뒤로', es: 'Retrocede tres casillas' }, text: { ko: '세 칸 뒤로 이동합니다. 출발 보너스는 받지 않습니다.', es: 'Retrocede tres casillas. No cobras al pasar por Salida.' }, effect: 'move' },
  'go-to-island': { title: { ko: '무인도로 이동', es: 'Ve a la isla desierta' }, text: { ko: '무인도로 갑니다. 다음 세 번의 차례를 쉽니다.', es: 'Ve a la isla desierta y pierde tus próximos tres turnos.' }, effect: 'island' },
  'escape-pass': { title: { ko: '탈출권', es: 'Pase de salida' }, text: { ko: '무인도에서 나올 때 쓸 탈출권을 받습니다.', es: 'Recibes un pase para salir de la isla.' }, effect: 'pass' },
  'train-ticket': { title: { ko: '무료 열차표', es: 'Boleto de tren gratis' }, text: { ko: '운임 없이 부동산 한 곳으로 이동할 수 있습니다.', es: 'Puedes viajar a una propiedad sin pagar el pasaje.' }, effect: 'train' },
  'city-dividend': { title: { ko: '도시 배당금', es: 'Dividendo de la ciudad' }, text: { ko: '소유한 부동산마다 30을 받습니다.', es: 'Recibes 30 por cada propiedad que tengas.' }, effect: 'cash' },
  'monopoly-warning': { title: { ko: '독점 경고', es: 'Advertencia de monopolio' }, text: { ko: '완성한 색상 도시군이 가장 많은 사람에게 도시군당 100, 최대 300의 독점 부담금을 부과합니다. 동률이면 카드를 뽑은 사람, 완성한 도시군이 없으면 부담금이 없습니다.', es: 'Quien tenga más grupos de color completos paga 100 por grupo, hasta 300. En empate paga quien sacó la carta; si nadie completó un grupo, no se cobra.' }, effect: 'cash' },
  'city-festival': { title: { ko: '도시 축제', es: 'Festival de ciudad' }, text: { ko: '내 도시 하나를 선택합니다. 그 도시의 다음 상대 착지 1회 통행료가 2배가 됩니다. 대상 착지까지 유지됩니다.', es: 'Elige una ciudad propia. Su alquiler se duplica una vez, en la próxima llegada rival. Permanece hasta esa llegada.' }, effect: 'cash' },
  blackout: { title: { ko: '정전', es: 'Apagón' }, text: { ko: '상대 도시 하나를 선택합니다. 그 도시의 다음 내 착지 1회 통행료가 절반이 됩니다(내림, 최소 1). 대상 착지까지 유지됩니다.', es: 'Elige una ciudad rival. En tu próxima llegada a ella pagas la mitad una vez (redondeo hacia abajo, mínimo 1). Permanece hasta esa llegada.' }, effect: 'cash' },
  'rent-pass': { title: { ko: '통행료 면제권', es: 'Pase de alquiler' }, text: { ko: '통행료 면제권 한 장을 보관합니다. 앞으로 통행료를 내기 전에 직접 선택해 1회 면제할 수 있습니다. 자동 사용되지 않으며 세금에는 쓸 수 없습니다.', es: 'Guarda un pase. Antes de un futuro alquiler puedes elegir usarlo para eximir un solo pago. No se usa automáticamente ni sirve para impuestos.' }, effect: 'pass' },
};
const propertyRent = (tile: MarbleTile, record: { owner: PlayerId; houses: number }, modern: boolean) => (tile.rent ?? 0) * (modern ? [1, 2, 4, 8][record.houses] ?? 1 : record.houses + 1);
export function marbleBuildCost(tile: MarbleTile, level: number, economicVersion?: number) {
  if (economicVersion !== 2) return 100;
  const factor = [0.4, 0.6, 0.8][Math.max(0, Math.min(2, Math.trunc(level)))] ?? 0.4;
  return Math.max(40, Math.round((Math.max(0, tile.price ?? 0) * factor) / 10) * 10);
}
const assetsFor = (s: MarbleState, p: PlayerId, board: MarbleTile[]) => s.money[p] - (s.debt?.[p] ?? 0) + Object.entries(s.properties).reduce((sum, [index, record]) => {
  if (record.owner !== p) return sum;
  const tile = board[Number(index)];
  const buildingCost = tile ? Array.from({ length: record.houses }, (_, level) => marbleBuildCost(tile, level, s.economicVersion)).reduce((total, cost) => total + cost, 0) : 0;
  return sum + (tile?.price ?? 0) + buildingCost;
}, 0);
const completedGroups = (s: MarbleState, p: PlayerId) => {
  const board = boardFor(s);
  return [...new Set(board.filter(t => t.kind === 'property').map(t => t.group!))].filter(group => board.every((t, index) => t.kind !== 'property' || t.group !== group || s.properties[String(index)]?.owner === p));
};
function emit(s: MarbleState, type: MarbleActionEvent['type'], actor: PlayerId, ko: string, es: string, textKo: string, textEs: string, extra: Omit<Partial<MarbleActionEvent>, 'sequence' | 'type' | 'actor' | 'title' | 'text'> = {}) {
  const sequence = (s.actionSequence ?? 0) + 1;
  s.actionSequence = sequence;
  s.actionLog = [...(s.actionLog ?? []), { sequence, type, actor, title: { ko, es }, text: { ko: textKo, es: textEs }, ...extra }].slice(-40);
}
const numeric = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
const propIndices = (board: MarbleTile[]) => board.flatMap((tile, index) => tile.kind === 'property' ? [index] : []);
function view(s: MarbleState, p: PlayerId) {
  const board = boardFor(s);
  const actions: { label: { ko: string; es: string }; action: GameAction }[] = [];
  const add = (ko: string, es: string, action: GameAction) => actions.push({ label: { ko, es }, action });
  if (!s.result && s.active === p) {
    if (s.phase === 'event-decision' && s.pendingEvent) {
      const owner = s.pendingEvent.id === 'city-festival' ? p : otherPlayer(p);
      for (const index of propIndices(board)) if (s.properties[String(index)]?.owner === owner) add(`${board[index].name.ko} 선택`, `Elegir ${board[index].name.es}`, { type: 'choose-event-city', payload: { tile: index } });
    } else if (s.phase === 'rent-decision' && s.pendingRent) {
      add(`통행료 지급 · ${s.pendingRent.amount}`, `Pagar alquiler · ${s.pendingRent.amount}`, { type: 'pay-rent' });
      if ((s.rentPasses?.[p] ?? 0) > 0) add('면제권 사용 · 이번 통행료 1회', 'Usar pase · este alquiler', { type: 'use-rent-pass' });
    }
    if ((s.economicVersion === 1 || s.economicVersion === 2) && s.phase !== 'event-decision' && s.phase !== 'rent-decision') {
      const debt = s.debt?.[p] ?? 0;
      if (debt === 0 && (s.phase !== 'debt' || s.money[p] + 300 >= (s.pendingPayment?.amount ?? Infinity))) add('대출 받기 · 300 / 상환 330', 'Pedir préstamo · 300 / devolver 330', { type: 'borrow' });
      if (debt > 0 && s.money[p] >= debt && s.phase !== 'debt') add(`대출 상환 · ${debt}`, `Pagar préstamo · ${debt}`, { type: 'repay' });
      if (s.phase === 'debt') add('파산 인정 · 경기 종료', 'Declarar quiebra · terminar partida', { type: 'declare-bankruptcy' });
      if (s.phase === 'roll' && !s.pawnLocked?.[p]) for (const pawn of marblePawnIds) if (pawn !== s.pawns?.[otherPlayer(p)]) add(`말 선택 · ${pawnNames[pawn].ko}`, `Elegir figura · ${pawnNames[pawn].es}`, { type: 'choose-pawn', payload: { pawn } });
    }
    if (s.phase === 'roll') add('주사위 굴리기', 'Lanzar dados', { type: 'roll' });
    if (s.phase === 'island') {
      add('쌍이 나오는지 굴리기', 'Intentar sacar dobles', { type: 'attempt-doubles' });
      if (s.money[p] >= 100) add('100을 내고 탈출', 'Pagar 100 para salir', { type: 'pay-escape' });
      if ((s.escapePasses?.[p] ?? 0) > 0) add('탈출권 사용', 'Usar pase de salida', { type: 'use-escape-pass' });
    }
    if (s.phase === 'train-decision') {
      const fare = s.pendingTrainFare ?? 100;
      for (const index of propIndices(board)) if (s.money[p] >= fare) {
        const name = board[index].name;
        add(`열차: ${name.ko} (${fare})`, `Tren: ${name.es} (${fare})`, { type: 'choose-train', payload: { destination: index } });
      }
      add(s.pendingTrainSource === 'card' ? '열차를 건너뛰고 차례 마치기' : '열차를 건너뛰고 주사위 굴리기', s.pendingTrainSource === 'card' ? 'Pasar el tren y terminar turno' : 'Pasar el tren y lanzar dados', { type: 'skip-train' });
    }
    if (s.phase === 'decision' && s.pendingTile !== null) {
      const tile = board[s.pendingTile];
      if (tile?.kind === 'property' && !s.properties[String(s.pendingTile)] && s.money[p] >= (tile.price ?? Infinity)) add(`구매 (${tile.price})`, `Comprar (${tile.price})`, { type: 'buy' });
      add('구매 거절 / 계속', 'Pasar / continuar', { type: 'decline' });
    }
    if (s.phase === 'main') {
      for (const [indexText, record] of Object.entries(s.properties)) {
        const index = Number(indexText), tile = board[index];
        if (record.owner !== p || tile?.kind !== 'property') continue;
        const groupSize = board.filter(space => space.kind === 'property' && space.group === tile.group).length;
        const ownedCount = Object.entries(s.properties).filter(([ownedIndex, owned]) => owned.owner === p && board[Number(ownedIndex)]?.group === tile.group).length;
        const canBuild = s.boardVersion === 2 || ownedCount === groupSize;
        const levels = s.boardVersion === 2 ? 3 : 2;
        const cost = marbleBuildCost(tile, record.houses, s.economicVersion);
        if (canBuild && record.houses < levels && s.money[p] >= cost) {
          const tier = s.boardVersion === 2 ? [['단독주택', 'Casa unifamiliar'], ['아파트', 'Apartamentos'], 'landmark'][record.houses] : ['집', 'Casa'];
          const name = Array.isArray(tier) ? tier : (s.economicVersion === 1 || s.economicVersion === 2 ? ['랜드마크', 'Monumento'] : ['호텔', 'Hotel']);
          add(`${name[0]}: ${tile.name.ko} (${cost})`, `${name[1]}: ${tile.name.es} (${cost})`, { type: 'build', payload: { tile: index } });
        }
      }
      add('차례 마치기', 'Terminar turno', { type: 'endTurn' });
    }
  }
  return {
    turn: s.active, phase: s.result ? 'finished' : s.phase,
    board: {
      version: s.boardVersion ?? 1,
      cityRouteVersion: s.cityRouteVersion ?? 1,
      tiles: board.map((tile, index) => {
        const houses = s.properties[String(index)]?.houses ?? 0;
        const maxLevels = s.boardVersion === 2 ? 3 : 2;
        const canUpgrade = tile.kind === 'property' && houses < maxLevels;
        return { ...tile, name: { ...tile.name }, index, owner: s.properties[String(index)]?.owner ?? null, houses,
          rentModifiers: s.rentModifiers?.[String(index)] ? { ...(s.rentModifiers[String(index)].festival ? { festival: { ...s.rentModifiers[String(index)].festival! } } : {}), ...(s.rentModifiers[String(index)].blackout ? { blackout: { ...s.rentModifiers[String(index)].blackout! } } : {}) } : null,
          nextBuildCost: canUpgrade ? marbleBuildCost(tile, houses, s.economicVersion) : null,
          nextRent: canUpgrade ? propertyRent(tile, { owner: s.properties[String(index)]?.owner ?? p, houses: houses + 1 }, s.boardVersion === 2) : null };
      }),
      positions: { ...s.positions }, money: { ...s.money }, assets: { p1: assetsFor(s, 'p1', board), p2: assetsFor(s, 'p2', board) }, lastRoll: [...s.lastRoll], diceSequence: s.diceSequence ?? 0, turn: s.active, turns: s.turns,
      islandTurns: { p1: s.islandTurns?.p1 ?? 0, p2: s.islandTurns?.p2 ?? 0 }, escapePasses: { p1: s.escapePasses?.p1 ?? 0, p2: s.escapePasses?.p2 ?? 0 }, fundPool: s.fundPool ?? 0,
      trainReady: { p1: s.trainReady?.p1 ?? false, p2: s.trainReady?.p2 ?? false }, pendingTrainFare: s.phase === 'train-decision' ? s.pendingTrainFare ?? 100 : null,
      lastEvent: s.lastEvent ? { ...s.lastEvent, title: { ...s.lastEvent.title }, text: { ...s.lastEvent.text } } : null,
      lastMove: s.lastMove ? { ...s.lastMove } : null,
      pendingEvent: s.pendingEvent ? { ...s.pendingEvent } : null,
      pendingRent: s.pendingRent ? { ...s.pendingRent, reason: { ...s.pendingRent.reason } } : null,
      rentPasses: { p1: s.rentPasses?.p1 ?? 0, p2: s.rentPasses?.p2 ?? 0 },
      rentModifiers: Object.fromEntries(Object.entries(s.rentModifiers ?? {}).map(([tile, effects]) => [tile, { ...(effects.festival ? { festival: { ...effects.festival } } : {}), ...(effects.blackout ? { blackout: { ...effects.blackout } } : {}) }])),
      eventVersion: s.eventVersion ?? 0, eventCardCount: s.boardVersion !== 2 ? 8 : s.eventVersion === 3 ? 16 : s.economicVersion ? 13 : 12, economicVersion: s.economicVersion ?? 0, debt: { p1: s.debt?.p1 ?? 0, p2: s.debt?.p2 ?? 0 },
      pendingPayment: s.pendingPayment ? { ...s.pendingPayment, reason: { ...s.pendingPayment.reason } } : null,
      monopolies: { p1: completedGroups(s, 'p1'), p2: completedGroups(s, 'p2') },
      pawns: { p1: s.pawns?.p1 ?? 'fox', p2: s.pawns?.p2 ?? 'cat' }, pawnLocked: { p1: s.pawnLocked?.p1 ?? true, p2: s.pawnLocked?.p2 ?? true },
      actionSequence: s.actionSequence ?? 0, actionLog: (s.actionLog ?? []).map(event => ({ ...event, title: { ...event.title }, text: { ...event.text }, ...(event.moneyDelta ? { moneyDelta: { ...event.moneyDelta } } : {}) })),
    },
    ownHand: { money: s.money[p], assets: assetsFor(s, p, board), position: s.positions[p] }, opponentCount: 1,
    status: s.result ? 'finished' : s.active === p ? 'Your turn' : 'Opponent turn',
    result: s.result ? { ...s.result, scores: s.result.scores ? { ...s.result.scores } : undefined } : null, actions,
  };
}
function validation(s: MarbleState, p: PlayerId, a: GameAction): string | null {
  const board = boardFor(s);
  if (p !== 'p1' && p !== 'p2') return 'Invalid player';
  if (!a || typeof a.type !== 'string') return 'Invalid action';
  if (s.result) return 'Game is finished';
  if (p !== s.active) return 'Not your turn';
  if (s.phase === 'event-decision') {
    const index = a.payload?.tile, pending = s.pendingEvent;
    if (a.type !== 'choose-event-city' || !pending || pending.playerId !== p) return 'Choose an event city first';
    const owner = pending.id === 'city-festival' ? p : otherPlayer(p);
    return !Number.isInteger(index) || board[index as number]?.kind !== 'property' || s.properties[String(index)]?.owner !== owner ? 'Invalid event city' : null;
  }
  if (s.phase === 'rent-decision') {
    if (!s.pendingRent || s.pendingRent.playerId !== p) return 'No rent decision';
    if (a.type === 'pay-rent') return null;
    if (a.type === 'use-rent-pass') return (s.rentPasses?.[p] ?? 0) > 0 ? null : 'No rent pass';
    return 'Resolve the rent decision first';
  }
  if (['choose-event-city', 'pay-rent', 'use-rent-pass'].includes(a.type)) return 'No matching decision';
  if (['borrow', 'repay', 'declare-bankruptcy', 'choose-pawn'].includes(a.type)) {
    if (s.economicVersion !== 1 && s.economicVersion !== 2) return 'Credit and figure selection unavailable in this saved ruleset';
    if (s.phase === 'finished') return 'Game is finished';
    if (a.type === 'borrow') return (s.debt?.[p] ?? 0) !== 0 ? 'Repay the existing loan first' : a.payload?.amount !== undefined ? 'Loan amount is fixed' : s.phase === 'debt' && s.money[p] + 300 < (s.pendingPayment?.amount ?? Infinity) ? 'Loan cannot cover this payment' : null;
    if (a.type === 'repay') return a.payload?.amount !== undefined ? 'Repayment amount is fixed' : s.phase === 'debt' || !(s.debt?.[p]) || s.money[p] < s.debt[p] ? 'Cannot repay now' : null;
    if (a.type === 'declare-bankruptcy') return s.phase === 'debt' && s.pendingPayment ? null : 'No compulsory payment pending';
    const pawn = a.payload?.pawn;
    return s.phase !== 'roll' || s.pawnLocked?.[p] ? 'Figure is locked after your first roll' : !marblePawnIds.includes(pawn as MarblePawnId) || pawn === s.pawns?.[otherPlayer(p)] ? 'Invalid or occupied figure' : null;
  }
  if (s.phase === 'debt') return 'Resolve the compulsory payment first';
  if (a.type === 'roll') return s.phase === 'roll' ? null : 'Cannot roll now';
  if (a.type === 'attempt-doubles') return s.phase === 'island' ? null : 'Not on the island';
  if (a.type === 'pay-escape') return s.phase !== 'island' ? 'Not on the island' : s.money[p] < 100 ? 'Insufficient funds' : null;
  if (a.type === 'use-escape-pass') return s.phase !== 'island' ? 'Not on the island' : (s.escapePasses?.[p] ?? 0) < 1 ? 'No escape pass' : null;
  if (a.type === 'choose-train') {
    if (s.phase !== 'train-decision') return 'No train decision';
    const destination = a.payload?.destination;
    if (!Number.isInteger(destination) || board[(destination as number)]?.kind !== 'property') return 'Invalid destination';
    if (s.money[p] < (s.pendingTrainFare ?? 100)) return 'Insufficient funds';
    return null;
  }
  if (a.type === 'skip-train') return s.phase === 'train-decision' ? null : 'No train decision';
  if (a.type === 'buy' || a.type === 'decline') {
    if (s.phase !== 'decision' || !Number.isInteger(s.pendingTile) || s.pendingTile !== s.positions[p]) return 'No purchase decision';
    const tile = board[s.pendingTile!];
    if (tile.kind !== 'property' || s.properties[String(s.pendingTile)]) return 'No property to decide';
    if (a.type === 'buy' && s.money[p] < (tile.price ?? Infinity)) return 'Insufficient funds';
    return null;
  }
  if (a.type === 'build') {
    const index = a.payload?.tile;
    if (s.phase !== 'main' || !Number.isInteger(index) || (index as number) < 0 || (index as number) >= board.length || board[index as number]?.kind !== 'property' || !s.properties[String(index)] || s.properties[String(index)].owner !== p) return 'Invalid property';
    const tile = board[index as number];
    const groupSize = board.filter(space => space.kind === 'property' && space.group === tile.group).length;
    const ownedCount = Object.entries(s.properties).filter(([ownedIndex, owned]) => owned.owner === p && board[Number(ownedIndex)]?.group === tile.group).length;
    const canBuild = s.boardVersion === 2 ? s.properties[String(index)].houses < 3 : ownedCount === groupSize && s.properties[String(index)].houses < 2;
    if (!canBuild || s.money[p] < marbleBuildCost(tile, s.properties[String(index)].houses, s.economicVersion)) return 'Cannot build here';
    return null;
  }
  if (a.type === 'endTurn') return s.phase === 'main' ? null : 'Cannot end turn now';
  return 'Unknown action';
}
function bankrupt(s: MarbleState, loser: PlayerId, winner: PlayerId): MarbleState {
  const board = boardFor(s), value = (p: PlayerId) => s.boardVersion === 2 ? assetsFor(s, p, board) : s.money[p];
  emit(s, 'bankruptcy', loser, '파산', 'Quiebra', '지급 의무를 해결하지 못해 경기가 끝났습니다.', 'La partida termina porque no se pudo cubrir el pago obligatorio.');
  emit(s, 'win', winner, '승리', 'Victoria', '상대의 파산으로 승리했습니다.', 'Ganaste por la quiebra de la otra persona.');
  return { ...s, phase: 'finished', pendingPayment: null, result: { winner, reason: 'insolvent / insolvente', scores: { p1: value('p1'), p2: value('p2') } } };
}
function pay(s: MarbleState, p: PlayerId, amount: number, creditor: PlayerId | 'bank' | 'fund' = 'bank', reason = { ko: '비용 지급', es: 'Pago de gastos' }, type: 'rent' | 'tax' | 'monopoly-warning' = 'tax'): MarbleState {
  if (s.money[p] < amount) {
    if (s.economicVersion !== 1 && s.economicVersion !== 2) return bankrupt(s, p, otherPlayer(p));
    s.pendingPayment = { amount, creditor, reason, type, tile: s.positions[p], resumePhase: 'main', resumeActive: s.active };
    s.active = p; s.phase = 'debt';
    emit(s, 'crisis', p, '파산 위기', 'Riesgo de quiebra', `${reason.ko}: ${amount} 지급에 ${amount - s.money[p]}이 부족합니다. 대출 조건을 확인하거나 파산을 인정하세요.`, `${reason.es}: te faltan ${amount - s.money[p]} para pagar ${amount}. Revisa el préstamo o declara la quiebra.`, { amount, fromPlayer: p, fromAccount: p, toAccount: creditor, ...(creditor === 'p1' || creditor === 'p2' ? { toPlayer: creditor } : {}) });
    return s;
  }
  s.money[p] -= amount;
  if (creditor === 'fund') s.fundPool = (s.fundPool ?? 0) + amount;
  else if (creditor === 'p1' || creditor === 'p2') s.money[creditor] += amount;
  emit(s, type, p, reason.ko, reason.es, `${amount}을 지급했습니다.`, `Pagaste ${amount}.`, { amount, fromPlayer: p, fromAccount: p, toAccount: creditor, ...(creditor === 'p1' || creditor === 'p2' ? { toPlayer: creditor } : {}), moneyDelta: { [p]: -amount, ...(creditor === 'p1' || creditor === 'p2' ? { [creditor]: amount } : {}) }, tile: s.positions[p] });
  return s;
}
function bonus(s: MarbleState, p: PlayerId, amount: number, ko: string, es: string, source: 'bank' | 'fund' = 'bank') {
  s.money[p] += amount;
  emit(s, 'bonus', p, ko, es, `${amount}을 받았습니다.`, `Recibiste ${amount}.`, { amount, toPlayer: p, fromAccount: source, toAccount: p, moneyDelta: { [p]: amount } });
}
function moveForward(s: MarbleState, p: PlayerId, to: number, board: MarbleTile[]) {
  const from = s.positions[p];
  if (to < from) bonus(s, p, 200, '출발 보너스', 'Bono de Salida');
  s.positions[p] = to;
}
function resolveLanding(s: MarbleState, p: PlayerId, index: number, drawEvent: boolean): MarbleState {
  const board = boardFor(s), tile = board[index];
  s.pendingTile = index;
  emit(s, 'arrival', p, `${tile.name.ko} 도착`, `Llegaste a ${tile.name.es}`, `${tile.name.ko} 칸의 효과를 확인하세요.`, `Revisa el efecto de ${tile.name.es}.`, { tile: index });
  if (tile.kind === 'property') {
    const owner = s.properties[String(index)];
    if (!owner) { s.phase = 'decision'; return s; }
    if (owner.owner !== p) {
      let rent = propertyRent(tile, owner, s.boardVersion === 2);
      const effects = s.eventVersion === 3 ? s.rentModifiers?.[String(index)] : undefined;
      const festival = effects?.festival?.owner === owner.owner && effects.festival.playerId === owner.owner;
      const blackout = effects?.blackout?.owner === owner.owner && effects.blackout.playerId === p;
      if (festival) rent *= 2;
      if (blackout) rent = Math.max(1, Math.floor(rent / 2));
      if (festival || blackout) {
        const remaining = { ...effects };
        if (festival) delete remaining.festival;
        if (blackout) delete remaining.blackout;
        s.rentModifiers ??= {}; s.rentModifiers[String(index)] = remaining;
        if (!remaining.festival && !remaining.blackout) delete s.rentModifiers[String(index)];
        emit(s, 'event-card', p, '도시 효과 적용', 'Efecto de ciudad aplicado', '대상 도시 착지로 통행료 효과 1회를 소모했습니다. 면제권을 써도 도시 효과는 소모됩니다.', 'La llegada consume el efecto de alquiler de una vez, incluso si usas un pase.', { tile: index, amount: rent });
      }
      const reason = { ko: `${tile.name.ko} 통행료`, es: `Alquiler en ${tile.name.es}` };
      if (s.eventVersion === 3 && (s.rentPasses?.[p] ?? 0) > 0) {
        s.pendingRent = { amount: rent, creditor: owner.owner, playerId: p, tile: index, reason }; s.phase = 'rent-decision'; return s;
      }
      s = pay(s, p, rent, owner.owner, reason, 'rent');
    }
  } else if (tile.kind === 'tax') s = pay(s, p, tile.price ?? 0, 'bank', tile.name);
  else if (tile.kind === 'fund') { bonus(s, p, s.fundPool ?? 0, '공동 기금 수령', 'Cobro del fondo común', 'fund'); s.fundPool = 0; }
  else if (tile.kind === 'fund-deposit') {
    const amount = tile.price ?? 150;
    s = pay(s, p, amount, 'fund', tile.name);
  }
  else if (tile.kind === 'island') { s.islandTurns ??= { p1: 0, p2: 0 }; s.islandTurns[p] = 3; emit(s, 'island', p, '무인도에 머물러요', 'Estancia en la isla', '다음 자기 차례에 탈출 방법을 선택합니다.', 'En tu próximo turno podrás elegir cómo salir.', { tile: index }); }
  else if (tile.kind === 'train') { s.trainReady ??= { p1: false, p2: false }; s.trainReady[p] = true; emit(s, 'train', p, '열차 탑승 준비', 'Tren disponible', '다음 자기 차례에 목적지를 고를 수 있습니다.', 'Podrás elegir un destino en tu próximo turno.', { tile: index }); }
  else if (tile.kind === 'rest') emit(s, 'rest', p, '잠깐 쉬어가요', 'Un descanso', '이 칸에서는 추가 비용이 없습니다.', 'Esta casilla no tiene un costo adicional.', { tile: index });
  else if (tile.kind === 'event' && drawEvent) return resolveEvent(s, p);
  if (!s.result && s.phase !== 'debt') s.phase = 'main';
  return s;
}
function noteMove(s: MarbleState, p: PlayerId, from: number, to: number, steps: number | null, source: 'dice' | 'card' | 'train' | 'island') {
  const sequence = (s.moveSequence ?? 0) + 1;
  s.moveSequence = sequence; s.lastMove = { sequence, playerId: p, from, to, steps, source };
  emit(s, 'move', p, '말 이동', 'Movimiento', `${from + 1}번에서 ${to + 1}번 칸으로 이동합니다.`, `Avanzas de la casilla ${from + 1} a la ${to + 1}.`, { from, to, steps: steps ?? undefined });
}
function resolveEvent(s: MarbleState, p: PlayerId): MarbleState {
  const board = boardFor(s), isModern = s.boardVersion === 2, ids = isModern ? s.eventVersion === 3 ? expandedIds : s.economicVersion === 1 || s.economicVersion === 2 ? [...modernIds, 'monopoly-warning' as const] : modernIds : legacyIds;
  s.phase = 'main';
  let deck = s.eventDeck ? [...s.eventDeck] : [];
  if (!deck.length) {
    const rng = s.eventRng ?? ((s.rng ^ 0xa5a5a5a5) >>> 0);
    deck = shuffle(ids.filter(id => !(s.eventVersion === 3 && ((id === 'escape-pass' && ((s.escapePasses?.p1 ?? 0) + (s.escapePasses?.p2 ?? 0)) > 0) || (id === 'rent-pass' && ((s.rentPasses?.p1 ?? 0) + (s.rentPasses?.p2 ?? 0)) > 0)))), seededRandom(rng));
    s.eventRng = (rng + (deck.length - 1) * 0x6d2b79f5) >>> 0;
  }
  const id = deck.shift()!;
  if (isModern && id !== 'escape-pass' && id !== 'rent-pass') deck.push(id);
  s.eventDeck = deck;
  let card = cards[id];
  const from = s.positions[p], beforeCash = s.money[p];
  emit(s, 'event-card', p, card.title.ko, card.title.es, card.text.ko, card.text.es, { cardId: id, tile: from });
  let movement: 'visit' | 'move' | null = null, steps: number | null = null;
  if (id === 'festival') bonus(s, p, 150, card.title.ko, card.title.es);
  else if (id === 'lottery') bonus(s, p, 200, card.title.ko, card.title.es);
  else if (id === 'rent-rebate') bonus(s, p, 80, card.title.ko, card.title.es);
  else if (id === 'travel-cost') s = pay(s, p, 100, 'bank', card.title);
  else if (id === 'maintenance') {
    const houses = Object.values(s.properties).filter(property => property.owner === p).reduce((count, property) => count + property.houses, 0);
    s = pay(s, p, houses * 40, 'bank', card.title);
  } else if (id === 'visit-santo-domingo') {
    const destination = board.findIndex(tile => tile.name.ko === '산토도밍고'); movement = 'visit'; steps = (destination - from + board.length) % board.length;
    moveForward(s, p, destination, board); noteMove(s, p, from, destination, steps, 'card'); s = resolveLanding(s, p, destination, false);
  } else if (id === 'advance-start') {
    movement = 'move'; steps = (board.length - from) % board.length; s.positions[p] = 0; noteMove(s, p, from, 0, steps, 'card'); bonus(s, p, 200, card.title.ko, card.title.es); s.pendingTile = 0;
  } else if (id === 'retreat') {
    movement = 'move'; steps = -3; const to = (from - 3 + board.length) % board.length; s.positions[p] = to; noteMove(s, p, from, to, steps, 'card'); s = resolveLanding(s, p, to, false);
  } else if (id === 'go-to-island') {
    const to = isModern ? 10 : from; movement = 'move'; steps = isModern ? (to - from + board.length) % board.length : 0;
    if (isModern) s.positions[p] = to;
    s.islandTurns ??= { p1: 0, p2: 0 }; s.islandTurns[p] = 3; s.pendingTile = to;
    noteMove(s, p, from, to, steps, 'card'); emit(s, 'island', p, card.title.ko, card.title.es, card.text.ko, card.text.es, { tile: to, cardId: id });
  } else if (id === 'escape-pass') {
    s.escapePasses ??= { p1: 0, p2: 0 }; s.escapePasses[p]++;
    emit(s, 'escape', p, '탈출권 획득', 'Pase de salida recibido', card.text.ko, card.text.es, { cardId: id });
  } else if (id === 'train-ticket') {
    s.pendingTrainFare = 0; s.pendingTrainSource = 'card'; s.phase = 'train-decision';
    emit(s, 'train', p, card.title.ko, card.title.es, card.text.ko, card.text.es, { amount: 0, cardId: id });
  } else if (id === 'city-dividend') {
    bonus(s, p, 30 * Object.values(s.properties).filter(property => property.owner === p).length, card.title.ko, card.title.es);
  } else if (id === 'city-festival' || id === 'blackout') {
    const owner = id === 'city-festival' ? p : otherPlayer(p);
    if (propIndices(board).some(index => s.properties[String(index)]?.owner === owner)) {
      s.pendingEvent = { id, playerId: p }; s.phase = 'event-decision';
    } else {
      card = { ...card, text: { ko: '선택 가능한 도시가 없어 효과가 없습니다.', es: 'No hay ninguna ciudad elegible; la carta no tiene efecto.' } };
      emit(s, 'event-card', p, card.title.ko, card.title.es, card.text.ko, card.text.es, { cardId: id, moneyDelta: { [p]: 0 } });
    }
  } else if (id === 'rent-pass') {
    s.rentPasses ??= { p1: 0, p2: 0 }; s.rentPasses[p] = 1;
    emit(s, 'event-card', p, card.title.ko, card.title.es, card.text.ko, card.text.es, { cardId: id, moneyDelta: { [p]: 0 } });
  } else if (id === 'monopoly-warning') {
    const groups = { p1: completedGroups(s, 'p1'), p2: completedGroups(s, 'p2') };
    const target = groups.p1.length === groups.p2.length ? p : groups.p1.length > groups.p2.length ? 'p1' : 'p2';
    const count = groups[target].length, amount = Math.min(300, count * 100);
    const text = { ko: count ? `${target === p ? '카드를 뽑은 사람' : '상대'}의 완성 도시군 ${count}개: 독점 부담금 ${amount}을 은행에 냅니다.` : '완성한 색상 도시군이 없어 부담금이 없습니다.', es: count ? `${target === p ? 'Quien sacó la carta' : 'La otra persona'} tiene ${count} grupos completos y paga ${amount} al banco.` : 'Nadie tiene un grupo de color completo. No se cobra.' };
    card = { ...card, text };
    emit(s, 'monopoly-warning', target, card.title.ko, card.title.es, text.ko, text.es, { amount, fromAccount: target, toAccount: 'bank', cardId: id, group: groups[target].join(', ') });
    if (amount) s = pay(s, target, amount, 'bank', card.title, 'monopoly-warning');
  }
  const sequence = (s.eventSequence ?? 0) + 1; s.eventSequence = sequence;
  s.lastEvent = { id, sequence, playerId: p, ...card, cashDelta: s.money[p] - beforeCash,
    from: movement ? from : null, to: movement ? s.positions[p] : null, steps };
  return s;
}
function finishTurn(s: MarbleState, p: PlayerId): MarbleState {
  s.active = otherPlayer(p); s.phase = 'roll'; s.pendingTile = null; s.turns++;
  if (s.turns >= 120) {
    const modern = s.boardVersion === 2, board = boardFor(s);
    const p1 = modern ? assetsFor(s, 'p1', board) : s.money.p1, p2 = modern ? assetsFor(s, 'p2', board) : s.money.p2;
    const reason = modern ? 'asset turn limit / límite por patrimonio' : 'turn limit / límite de turnos';
    s.result = p1 === p2 ? { winner: 'draw', reason, scores: { p1, p2 } }
      : { winner: p1 > p2 ? 'p1' : 'p2', reason, scores: { p1, p2 } };
    s.phase = 'finished'; emit(s, 'win', s.result.winner === 'draw' ? p : s.result.winner, '자산 결산', 'Balance final', '120턴을 마쳐 대출을 뺀 순자산으로 결과를 정했습니다.', 'Tras 120 turnos, el resultado se decide por el patrimonio neto, descontando las deudas.'); return s;
  }
  if ((s.islandTurns?.[s.active] ?? 0) > 0) s.phase = 'island';
  else if (s.trainReady?.[s.active]) { s.phase = 'train-decision'; s.pendingTrainFare = 100; s.pendingTrainSource = 'station'; }
  emit(s, 'turn', s.active, '다음 차례', 'Siguiente turno', '현재 플레이어와 행동 단계를 확인하세요.', 'Revisa quién juega y la siguiente acción.');
  return s;
}
function step(s: MarbleState, p: PlayerId, a: GameAction): MarbleState {
  const error = validation(s, p, a); if (error) throw new Error(error);
  let n: MarbleState = { ...s, money: { ...s.money }, positions: { ...s.positions }, properties: { ...s.properties }, lastRoll: [...s.lastRoll],
    eventDeck: s.eventDeck ? [...s.eventDeck] : undefined, islandTurns: s.islandTurns ? { ...s.islandTurns } : undefined,
    escapePasses: s.escapePasses ? { ...s.escapePasses } : undefined, trainReady: s.trainReady ? { ...s.trainReady } : undefined,
    lastEvent: s.lastEvent ? { ...s.lastEvent, title: { ...s.lastEvent.title }, text: { ...s.lastEvent.text } } : s.lastEvent,
    lastMove: s.lastMove ? { ...s.lastMove } : s.lastMove };
  n.debt = { p1: s.debt?.p1 ?? 0, p2: s.debt?.p2 ?? 0 };
  n.pawns = { p1: s.pawns?.p1 ?? 'fox', p2: s.pawns?.p2 ?? 'cat' };
  n.pawnLocked = { p1: s.pawnLocked?.p1 ?? true, p2: s.pawnLocked?.p2 ?? true };
  n.pendingPayment = s.pendingPayment ? { ...s.pendingPayment, reason: { ...s.pendingPayment.reason } } : null;
  n.pendingEvent = s.pendingEvent ? { ...s.pendingEvent } : null;
  n.pendingRent = s.pendingRent ? { ...s.pendingRent, reason: { ...s.pendingRent.reason } } : null;
  n.rentPasses = { p1: s.rentPasses?.p1 ?? 0, p2: s.rentPasses?.p2 ?? 0 };
  n.rentModifiers = Object.fromEntries(Object.entries(s.rentModifiers ?? {}).map(([tile, effects]) => [tile, { ...(effects.festival ? { festival: { ...effects.festival } } : {}), ...(effects.blackout ? { blackout: { ...effects.blackout } } : {}) }]));
  const board = boardFor(n), payload = a.payload ?? {};
  if (a.type === 'choose-event-city') {
    const index = payload.tile as number, id = n.pendingEvent!.id, key = id === 'city-festival' ? 'festival' : 'blackout';
    n.rentModifiers[String(index)] = { ...n.rentModifiers[String(index)], [key]: { source: id, playerId: p, owner: n.properties[String(index)].owner } };
    n.pendingEvent = null; n.phase = 'main';
    const text = { ko: `${board[index].name.ko}: ${id === 'city-festival' ? '다음 상대 착지 1회 통행료 2배' : '다음 내 착지 1회 통행료 절반'}. 대상 착지까지 유지됩니다.`, es: `${board[index].name.es}: ${id === 'city-festival' ? 'alquiler doble en la próxima llegada rival, una vez' : 'mitad del alquiler en tu próxima llegada, una vez'}. Permanece hasta esa llegada.` };
    if (n.lastEvent?.id === id) n.lastEvent = { ...n.lastEvent, text };
    emit(n, 'event-card', p, cards[id].title.ko, cards[id].title.es, text.ko, text.es, { cardId: id, tile: index, moneyDelta: { [p]: 0 } });
    return n;
  }
  if (a.type === 'pay-rent' || a.type === 'use-rent-pass') {
    const pending = n.pendingRent!; n.pendingRent = null; n.phase = 'main';
    if (a.type === 'pay-rent') return pay(n, p, pending.amount, pending.creditor, pending.reason, 'rent');
    n.rentPasses[p] = 0; n.eventDeck ??= [];
    if (!n.eventDeck.includes('rent-pass')) n.eventDeck.push('rent-pass');
    emit(n, 'rent', p, '통행료 면제권 사용', 'Pase de alquiler usado', `${pending.reason.ko} ${pending.amount}을 1회 면제했습니다.`, `Eximiste una vez ${pending.amount} de ${pending.reason.es}.`, { cardId: 'rent-pass', tile: pending.tile, amount: 0, fromAccount: p, toAccount: pending.creditor, moneyDelta: { [p]: 0, [pending.creditor]: 0 } });
    return n;
  }

  if (a.type === 'choose-pawn') {
    n.pawns[p] = payload.pawn as MarblePawnId;
    emit(n, 'pawn', p, '말 선택', 'Figura elegida', '이 말로 도시를 여행합니다.', 'Viajarás por las ciudades con esta figura.');
    return n;
  }
  if (a.type === 'borrow') {
    n.money[p] += 300; n.debt[p] = 330;
    emit(n, 'loan', p, '대출 실행', 'Préstamo recibido', '300을 받고 330의 상환 의무가 생겼습니다. 추가 이자나 만기 없이 전액 상환하며, 미상환액은 최종 자산에서 뺍니다.', 'Recibes 300 y debes devolver 330. No hay intereses adicionales ni plazo; se paga completo y la deuda se resta del patrimonio final.', { amount: 300, debtAfter: 330, fromAccount: 'bank', toAccount: p, moneyDelta: { [p]: 300 } });
    if (n.phase === 'debt' && n.pendingPayment) {
      const pending = n.pendingPayment;
      n = pay(n, p, pending.amount, pending.creditor, pending.reason, pending.type);
      if (!n.result && n.phase !== 'finished') { n.pendingPayment = null; n.phase = pending.resumePhase; n.active = pending.resumeActive; }
    }
    return n;
  }
  if (a.type === 'repay') {
    const amount = n.debt[p]; n.money[p] -= amount; n.debt[p] = 0;
    emit(n, 'repay', p, '대출 상환 완료', 'Préstamo pagado', `${amount}을 상환해 남은 대출이 없습니다.`, `Pagaste ${amount}; ya no tienes deuda.`, { amount, debtAfter: 0, fromAccount: p, toAccount: 'bank', moneyDelta: { [p]: -amount } });
    return n;
  }
  if (a.type === 'declare-bankruptcy') return bankrupt(n, p, otherPlayer(p));
  if (a.type === 'roll' || a.type === 'attempt-doubles') {
    const random = seededRandom(s.rng), d1 = 1 + Math.floor(random() * 6), d2 = 1 + Math.floor(random() * 6);
    n.rng = (s.rng + 2 * 0x6d2b79f5) >>> 0; n.lastRoll = [d1, d2]; n.diceSequence = (s.diceSequence ?? 0) + 1;
    n.pawnLocked[p] = true;
    emit(n, 'roll', p, '주사위 결과', 'Resultado de los dados', `${d1} + ${d2} = ${d1 + d2}칸`, `${d1} + ${d2} = ${d1 + d2} casillas`, { amount: d1 + d2 });
    if (a.type === 'attempt-doubles' && d1 !== d2) {
      n.islandTurns ??= { p1: 0, p2: 0 }; n.islandTurns[p] = Math.max(0, (n.islandTurns[p] ?? 0) - 1); emit(n, 'island', p, '이번에는 쉬어가요', 'Este turno descansas', `쌍이 나오지 않아 이동하지 않습니다. 남은 정지 ${n.islandTurns[p]}턴.`, `No salieron dobles. No te mueves; quedan ${n.islandTurns[p]} turnos en la isla.`); return finishTurn(n, p);
    }
    if (a.type === 'attempt-doubles') { n.islandTurns ??= { p1: 0, p2: 0 }; n.islandTurns[p] = 0; }
    const from = n.positions[p], distance = d1 + d2, to = (from + distance) % board.length;
    if (from + distance >= board.length) bonus(n, p, 200, '출발 보너스', 'Bono de Salida');
    n.positions[p] = to;
    noteMove(n, p, from, to, distance, a.type === 'attempt-doubles' ? 'island' : 'dice');
    return resolveLanding(n, p, to, true);
  }
  if (a.type === 'pay-escape') {
    n = pay(n, p, 100, 'bank', { ko: '무인도 탈출 비용', es: 'Pago para salir de la isla' }); if (!n.result) { n.islandTurns ??= { p1: 0, p2: 0 }; n.islandTurns[p] = 0; n.phase = 'roll'; emit(n, 'escape', p, '무인도 탈출', 'Salida de la isla', '이제 주사위를 굴릴 수 있습니다.', 'Ahora puedes lanzar los dados.'); } return n;
  }
  if (a.type === 'use-escape-pass') {
    n.escapePasses ??= { p1: 0, p2: 0 }; n.escapePasses[p]--;
    if (n.boardVersion === 2) { n.eventDeck ??= []; n.eventDeck.push('escape-pass'); }
    n.islandTurns ??= { p1: 0, p2: 0 }; n.islandTurns[p] = 0; n.phase = 'roll'; emit(n, 'escape', p, '탈출권 사용', 'Pase de salida usado', '탈출권을 사용해 무인도에서 나왔습니다.', 'Usaste el pase para salir de la isla.'); return n;
  }
  if (a.type === 'choose-train') {
    const from = n.positions[p], to = payload.destination as number, fare = n.pendingTrainFare ?? 100;
    n.money[p] -= fare; n.trainReady ??= { p1: false, p2: false }; n.trainReady[p] = false; n.pendingTrainFare = null; n.pendingTrainSource = null;
    emit(n, 'train', p, '열차 출발', 'El tren sale', `${board[to].name.ko}행 · 운임 ${fare}`, `Destino: ${board[to].name.es} · pasaje ${fare}`, { amount: fare, fromAccount: p, toAccount: 'bank', moneyDelta: { [p]: -fare }, from, to });
    const distance = (to - from + board.length) % board.length;
    moveForward(n, p, to, board); noteMove(n, p, from, to, distance, 'train'); n = resolveLanding(n, p, to, false); return n;
  }
  if (a.type === 'skip-train') {
    const fromCard = n.pendingTrainSource === 'card';
    n.trainReady ??= { p1: false, p2: false }; n.trainReady[p] = false; n.pendingTrainFare = null; n.pendingTrainSource = null;
    if (fromCard) n.phase = 'main'; else n.phase = 'roll';
    return n;
  }
  if (a.type === 'buy') {
    const index = n.pendingTile!, price = board[index].price!; n.money[p] -= price; n.properties[String(index)] = { owner: p, houses: 0 }; n.phase = 'main';
    emit(n, 'buy', p, '도시 구매 완료', 'Ciudad comprada', `${board[index].name.ko}을 소유했습니다.`, `Compraste ${board[index].name.es}.`, { tile: index, amount: price, fromAccount: p, toAccount: 'bank', moneyDelta: { [p]: -price } });
    const group = board[index].group!;
    if (completedGroups(n, p).includes(group)) emit(n, 'monopoly-warning', p, '색상 도시군 완성', 'Grupo de color completo', '이 도시군을 모두 소유했습니다. 독점 경고 카드가 나오면 부담금 대상이 될 수 있습니다.', 'Ya tienes todas las ciudades de este color. Una carta de monopolio puede cobrarte un cargo.', { group, tile: index });
  } else if (a.type === 'decline') n.phase = 'main';
  else if (a.type === 'build') {
    const index = payload.tile as number, cost = marbleBuildCost(board[index], n.properties[String(index)].houses, n.economicVersion); n.money[p] -= cost; n.properties[String(index)] = { ...n.properties[String(index)], houses: n.properties[String(index)].houses + 1 };
    const level = n.properties[String(index)].houses;
    emit(n, 'build', p, '건설 완료', 'Construcción terminada', `${board[index].name.ko}: ${level === 3 ? '랜드마크' : level === 2 ? '아파트' : '단독주택'} · 통행료 ${propertyRent(board[index], n.properties[String(index)], n.boardVersion === 2)}`, `${board[index].name.es}: ${level === 3 ? 'monumento' : level === 2 ? 'apartamentos' : 'casa unifamiliar'} · alquiler ${propertyRent(board[index], n.properties[String(index)], n.boardVersion === 2)}`, { tile: index, amount: cost, fromAccount: p, toAccount: 'bank', moneyDelta: { [p]: -cost } });
  } else if (a.type === 'endTurn') return finishTurn(n, p);
  return n;
}

export const marbleEngine: GameEngine<MarbleState> = {
  id: 'marble',
  createInitialState(seed) {
    const rng = seed >>> 0, eventRng = (rng ^ 0xa5a5a5a5) >>> 0;
    return { rng, active: 'p1', positions: { p1: 0, p2: 0 }, money: { p1: 1500, p2: 1500 }, properties: {}, boardVersion: 2, cityRouteVersion: 3,
      phase: 'roll', pendingTile: null, lastRoll: [], turns: 0, result: null, eventRng: (eventRng + (expandedIds.length - 1) * 0x6d2b79f5) >>> 0,
      eventDeck: shuffle(expandedIds, seededRandom(eventRng)), eventSequence: 0, lastEvent: null, fundPool: 0,
      eventVersion: 3, pendingEvent: null, pendingRent: null, rentPasses: { p1: 0, p2: 0 }, rentModifiers: {}, economicVersion: 2, debt: { p1: 0, p2: 0 }, pendingPayment: null, actionLog: [], actionSequence: 0, pawns: { p1: 'fox', p2: 'cat' }, pawnLocked: { p1: false, p2: false },
      islandTurns: { p1: 0, p2: 0 }, escapePasses: { p1: 0, p2: 0 }, trainReady: { p1: false, p2: false }, pendingTrainFare: null, pendingTrainSource: null, lastMove: null, moveSequence: 0, diceSequence: 0 };
  },
  validateAction: validation, applyAction: step, getPlayerView: view, getResult: state => state.result,
};

export const marbleRules = marbleExpandedRules;
