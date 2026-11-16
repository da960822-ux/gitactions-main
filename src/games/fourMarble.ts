import { beginCardResolution, finishCardResolution, cardEventCause } from './marbleCardCause';
import { CLASSIC_ECONOMY_PROFILE, marbleRentBoard, classicEconomyConfig, classicSaleValue, type ClassicEconomyProfile } from './marbleClassicEconomy';
import { classicKoreaBoard, worldIslandsBoardFor, completedPropertyLines, worldOwnershipVictory, isPurchasableMarbleTile, marbleBoardProfileMetadata, marbleProfilePending, type MarbleBoardProfile } from './marbleBoardProfiles';
import { seededRandom, shuffle, type GameAction } from '../core/types';
import { fourSeats, fourTeam, nextFourSeat, localized as l, type FourEngine, type FourSeat, type FourResult, type FourView } from '../core/fourPlayer';
import { marbleEngine, createLegacyMarbleState, marbleBuildCost, marbleBuildToCost, marbleCityValue, marbleTakeoverPrice, marblePawnIds, type MarblePawnId, type MarbleTile, type MarbleEventId } from './marble';
import { constructionOptions, constructionCost, applyConstruction, constructionReady, constructionValue, constructionRent, isLandmark, type MarbleBuildingType } from './marbleConstruction';
import { marbleLoanTerms, marbleColorTollBonus, marbleAiReserve, marbleBaseRent, marbleLandPrice, marblePassStartSalary, marbleRentAmount, marbleStartingCash } from './marbleEconomy';

const legacyBoard: MarbleTile[] = marbleEngine.getPlayerView({ ...createLegacyMarbleState(0), economicVersion: 2, boardProfile: undefined, cityRouteVersion: 3 }, 'p1').board.tiles.map((tile: MarbleTile) => ({ name: { ...tile.name }, kind: tile.kind, ...(tile.price !== undefined ? { price: tile.price } : {}), ...(tile.rent !== undefined ? { rent: tile.rent } : {}), ...(tile.group ? { group: tile.group } : {}) }));
const eventIds: MarbleEventId[] = ['festival', 'lottery', 'rent-rebate', 'travel-cost', 'maintenance', 'visit-santo-domingo', 'advance-start', 'retreat', 'go-to-island', 'escape-pass', 'train-ticket', 'city-dividend', 'monopoly-warning', 'city-festival', 'blackout', 'rent-pass'];
const expandedEventIds: MarbleEventId[] = [...eventIds, 'forced-sale', 'earthquake', 'city-shield', 'construction-grant', 'property-hunt', 'birthday', 'takeover-discount-pass'];
const pawnNames: Record<MarblePawnId, ReturnType<typeof l>> = { fox: l('말티푸', 'Maltipoo'), cat: l('랙돌', 'Ragdoll'), penguin: l('판다', 'Panda'), astronaut: l('우주인', 'Astronauta'), robot: l('리스연', 'Lisyeon'), dragon: l('친칠라', 'Chinchilla'), 'sali-suli': l('살리·술리', 'Sali y Suli') };
const eventNames: Record<MarbleEventId, ReturnType<typeof l>> = {
  'takeover-discount-pass': l('인수 할인권 획득', 'Cupón de adquisición recibido'),
  'forced-sale': l('강제 매각', 'Venta forzosa'), earthquake: l('지진', 'Terremoto'), 'city-shield': l('도시 보호막', 'Escudo de ciudad'), 'construction-grant': l('건설 지원', 'Ayuda de construcción'), 'property-hunt': l('빈 도시 탐색', 'Busca una ciudad libre'), birthday: l('생일 축하금', 'Regalo de cumpleaños'),
  festival: l('동네 축제 +150', 'Fiesta del barrio +150'), lottery: l('복권 당첨 +200', 'Lotería +200'), 'rent-rebate': l('임대료 환급 +80', 'Reembolso +80'),
  'travel-cost': l('여행 경비 −100', 'Gastos de viaje −100'), maintenance: l('건물 단계당 수리비 40', 'Mantenimiento: 40 por nivel'),
  'visit-santo-domingo': l('산토도밍고 방문', 'Visita a Santo Domingo'), 'advance-start': l('출발로 이동 +200', 'Ve a Salida +200'), retreat: l('세 칸 뒤로', 'Retrocede tres casillas'),
  'go-to-island': l('무인도로 이동', 'Ve a la isla'), 'escape-pass': l('무인도 탈출권 획득', 'Pase de salida recibido'), 'train-ticket': l('무료 세계여행권', 'Pase gratis para viajar por el mundo'),
  'city-dividend': l('도시당 배당금 30', 'Dividendo de 30 por ciudad'), 'monopoly-warning': l('독점 경고', 'Advertencia de monopolio'),
  'city-festival': l('내 도시 다음 적 착지 통행료 2배', 'Alquiler doble en la próxima llegada rival'), blackout: l('적 도시 다음 내 착지 통행료 절반', 'Mitad del alquiler en tu próxima llegada rival'), 'rent-pass': l('통행료 면제권 획득', 'Pase de alquiler recibido'),
};
type Phase = 'roll' | 'main' | 'decision' | 'island' | 'train-decision' | 'rent-decision' | 'event-decision' | 'debt' | 'finished';
type Property = { owner: FourSeat; houses: number; buildings?: MarbleBuildingType[]; landmark?: boolean };
type Creditor = FourSeat | 'bank' | 'fund';
type FourMarbleEvent = { sequence: number; type: string; actor: FourSeat; title: ReturnType<typeof l>; text: ReturnType<typeof l>; [key: string]: unknown };
export interface FourMarbleState {
  eventVersion?: 3 | 4; cityShields?: Record<FourSeat, number>;
  pendingCardDrawSequence?: number; resolvingCardDrawSequence?: number;
  rng: number; active: FourSeat; phase: Phase; positions: Record<FourSeat, number>; money: Record<FourSeat, number>; debt: Record<FourSeat, number>;
  properties: Record<string, Property>; eliminated: Record<FourSeat, boolean>; islandTurns: Record<FourSeat, number>; trainReady: Record<FourSeat, boolean>;
  takeoverDiscountPasses?: Record<FourSeat, number>;
  escapePasses: Record<FourSeat, number>; rentPasses: Record<FourSeat, number>; eventDeck: MarbleEventId[]; fundPool: number; turns: number; result: FourResult | null;
  pendingTile: number | null; trainFare: number; trainFromCard: boolean; pendingRent: { amount: number; creditor: FourSeat } | null;
  pendingEvent: 'city-festival' | 'blackout' | 'forced-sale' | 'earthquake' | 'construction-grant' | null; pendingEventSource?: 'festival-site'; pendingPayment: { amount: number; creditor: Creditor; resumeActive: FourSeat } | null;
  modifiers: Record<string, { festival?: FourSeat; blackout?: FourSeat }>; lastRoll: number[]; log: ReturnType<typeof l>[];
  actionLog: FourMarbleEvent[]; actionSequence: number; diceSequence: number; moveSequence: number;
  lastMove: { sequence: number; playerId: FourSeat; from: number; to: number; steps: number; source: string } | null;
  propertyRulesVersion?: 1; economicVersion?: 1 | 2 | 3; takeoverTile?: number | null; doublesCount?: number; extraRoll?: boolean;
  pawns: Record<FourSeat, MarblePawnId>; pawnLocked: Record<FourSeat, boolean>;
  landmarkOptions?: number[];
  buildSite?: 'start' | number | null;
  constructionRulesVersion?: 1 | 2;
  loanRulesVersion?: 1 | 2;
  rentRulesVersion?: 1 | 2;
  constructionPriceRulesVersion?: 1 | 2;
  festivalRulesVersion?: 1 | 2;
  boardProfile?: MarbleBoardProfile;
  boardRevision?: 1 | 2 | 3 | 4;
  economyProfile?: ClassicEconomyProfile;
  cityRouteVersion?: 3 | 4 | 5;
  completedLaps?: Record<FourSeat, number>;
}
const boardFor = (s: { boardProfile?: MarbleBoardProfile; boardRevision?: 1 | 2 | 3 | 4; rentRulesVersion?: 1 | 2; constructionPriceRulesVersion?: 1 | 2 }) => marbleRentBoard(s.boardProfile === 'world-islands-32-v1' ? worldIslandsBoardFor(s.boardRevision) : s.boardProfile === 'classic-korea-2015' ? classicKoreaBoard : legacyBoard, s.rentRulesVersion, s.constructionPriceRulesVersion);
export type MarbleView = FourView & { publicBoard: MarbleTile[]; publicState: Omit<FourMarbleState, 'rng' | 'eventDeck'> & { boardSize?: number; takeoverOffer?: { tile:number; owner:FourSeat; price:number|null; couponOnly:boolean; discountPrice:number|null } | null; eventCardCount?: number; profileMetadata?: ReturnType<typeof marbleBoardProfileMetadata> } };
const seatMap = <T>(value: T): Record<FourSeat, T> => Object.fromEntries(fourSeats.map(p => [p, value])) as Record<FourSeat, T>;
const rent = (tile: MarbleTile, prop: Property, s?: Pick<FourMarbleState, 'properties' | 'propertyRulesVersion' | 'economicVersion' | 'constructionRulesVersion' | 'boardProfile' | 'boardRevision' | 'rentRulesVersion' | 'constructionPriceRulesVersion'>) => {
  if (tile.kind === 'tourism') return tile.rent ?? 0;
  const multiplier = s && marbleColorTollBonus(s) && groups(s, prop.owner).includes(tile.group!) ? 2 : 1;
  return s?.constructionRulesVersion === 2 ? constructionRent(tile, prop, s.economicVersion, multiplier) : marbleRentAmount(tile, prop.houses, s?.economicVersion, multiplier);
};
const cityValue = (tile: MarbleTile, prop: Property, s: Pick<FourMarbleState, 'constructionRulesVersion' | 'economicVersion'>) => tile.kind === 'tourism' ? marbleLandPrice(tile, s.economicVersion) : s.constructionRulesVersion === 2 ? constructionValue(tile, prop, s.economicVersion) : marbleCityValue(tile, prop.houses, s.economicVersion ?? 2);
const takeoverPrice = (tile: MarbleTile, prop: Property, s: Pick<FourMarbleState, 'constructionRulesVersion' | 'economicVersion'>) => !['property', 'tourism'].includes(tile.kind) || isLandmark(prop, s.constructionRulesVersion) ? null : tile.kind === 'tourism' ? marbleLandPrice(tile, s.economicVersion) * 2 : s.constructionRulesVersion === 2 ? cityValue(tile, prop, s) * 2 : marbleTakeoverPrice(tile, prop.houses, s.economicVersion ?? 2);
const ready = (prop: Property | undefined, s: FourMarbleState) => !!prop && (s.constructionRulesVersion === 2 ? constructionReady(prop) : prop.houses === 2);
const purchasable = isPurchasableMarbleTile;
const ownedCities = (s: FourMarbleState, p: FourSeat) => owned(s, p).filter(([index]) => boardFor(s)[Number(index)].kind === 'property');
const owned = (s: FourMarbleState, p: FourSeat) => Object.entries(s.properties).filter(([, property]) => property.owner === p);
const groups = (s: Pick<FourMarbleState, 'properties' | 'boardProfile' | 'boardRevision' | 'rentRulesVersion' | 'constructionPriceRulesVersion'>, p: FourSeat) => [...new Set(boardFor(s).filter(t => t.group).map(t => t.group!))].filter(group => boardFor(s).every((t, index) => t.group !== group || s.properties[index]?.owner === p));
const assets = (s: FourMarbleState, p: FourSeat) => s.money[p] - s.debt[p] + owned(s, p).reduce((sum, [index, property]) => sum + cityValue(boardFor(s)[Number(index)], property, s), 0);
const liquidation = (s: FourMarbleState, p: FourSeat) => owned(s, p).map(([index, prop]) => ({ index: Number(index), value: (boardFor(s)[Number(index)].cityEconomy ? classicSaleValue(boardFor(s)[Number(index)].cityEconomy!, prop) : Math.floor(cityValue(boardFor(s)[Number(index)], prop, s) / 2)) }));
const grantBuilding = (s: Pick<FourMarbleState, 'completedLaps'>, p: FourSeat, prop: Property) => constructionOptions(prop, s.completedLaps?.[p] ?? 0, false).find(option => option.buildings?.length === 1)?.buildings?.[0];
function eventCities(s: FourMarbleState, p: FourSeat, id: FourMarbleState['pendingEvent']) {
  return Object.entries(s.properties).filter(([index, prop]) => {
    if (boardFor(s)[Number(index)].kind !== 'property') return false;
    if (id === 'city-festival') return prop.owner === p;
    if (id === 'construction-grant') return prop.owner === p && !isLandmark(prop, s.constructionRulesVersion) && (s.constructionRulesVersion === 2 ? !!grantBuilding(s, p, prop) : prop.houses < 2);
    if (fourTeam(prop.owner) === fourTeam(p) || s.eliminated[prop.owner]) return false;
    return id === 'blackout' || !isLandmark(prop, s.constructionRulesVersion) && (id === 'forced-sale' || id === 'earthquake' && (s.constructionRulesVersion === 2 ? !!prop.buildings?.length : prop.houses > 0));
  });
}
const canRescue = (s: FourMarbleState, p: FourSeat) => s.money[p] + liquidation(s, p).reduce((sum, item) => sum + item.value, 0) + (s.debt[p] === 0 ? marbleLoanTerms(s.loanRulesVersion).amount : 0) >= (s.pendingPayment?.amount ?? Infinity);
const log = (s: FourMarbleState, ko: string, es: string) => { s.log = [...s.log, l(ko, es)].slice(-8); };
function emit(s: FourMarbleState, type: string, actor: FourSeat, title: ReturnType<typeof l>, text = title, extra: Record<string, unknown> = {}) {
  s.actionSequence = (s.actionSequence ?? 0) + 1;
  s.actionLog = [...(s.actionLog ?? []), { sequence: s.actionSequence, type, actor, title, text, ...cardEventCause(s, s.actionSequence, type, extra.moneyDelta as Record<string, unknown> | undefined), ...extra }].slice(-40);
}
function settle(s: FourMarbleState, bankruptcy = false) {
  const scores = { A: assets(s, 'p1') + assets(s, 'p3'), B: assets(s, 'p2') + assets(s, 'p4') };
  const goneA = s.eliminated.p1 && s.eliminated.p3, goneB = s.eliminated.p2 && s.eliminated.p4;
  const winner = bankruptcy ? goneA && goneB ? 'draw' : goneA ? 'B' : 'A' : scores.A === scores.B ? 'draw' : scores.A > scores.B ? 'A' : 'B';
  s.result = { winner, scores, reason: bankruptcy ? l('한 팀의 두 명이 모두 파산했습니다.', 'Los dos integrantes de un equipo quebraron.') : l('120차례 종료 · 두 팀원의 순자산 합계', '120 turnos · suma del patrimonio neto de cada equipo') };
  s.phase = 'finished';
  emit(s, 'win', winner === 'B' ? 'p2' : 'p1', l('팀 자산 결산', 'Balance por equipos'), s.result.reason);
}
function checkOwnershipWin(s: FourMarbleState, p: FourSeat) {
  if (s.boardProfile !== 'world-islands-32-v1' || s.result) return;
  const victoryType = worldOwnershipVictory(boardFor(s), s.properties, p);
  if (!victoryType) return;
  const title = victoryType === 'line-monopoly' ? l('라인 독점 승리', 'Victoria por un lado completo') : victoryType === 'triple-monopoly' ? l('트리플 독점 승리', 'Victoria por tres grupos de color') : l('관광지 독점 승리', 'Victoria por todas las islas');
  const tourismCount = boardFor(s).filter(tile => tile.kind === 'tourism').length;
  const reason = victoryType === 'line-monopoly' ? l('한 플레이어가 한 면의 모든 도시와 섬을 소유했습니다.', 'Una persona posee todas las ciudades e islas de un lado.') : victoryType === 'triple-monopoly' ? l('한 플레이어가 색상 도시군 3개를 완성했습니다.', 'Una persona completó tres grupos de ciudades del mismo color.') : l(`한 플레이어가 관광지 섬 ${tourismCount}개를 모두 소유했습니다.`, `Una persona posee las ${tourismCount} islas turísticas.`);
  s.result = { winner: fourTeam(p), scores: { A: assets(s, 'p1') + assets(s, 'p3'), B: assets(s, 'p2') + assets(s, 'p4') }, reason };
  s.phase = 'finished'; s.extraRoll = false;
  emit(s, 'win', p, title, reason, { victoryType, ...(victoryType === 'line-monopoly' ? { line: completedPropertyLines(boardFor(s), s.properties, p)[0] } : {}) });
}

function finishTurn(s: FourMarbleState, p: FourSeat) {
  s.landmarkOptions = [];
  s.buildSite = null;
  if (s.propertyRulesVersion === 1 && s.extraRoll && !s.islandTurns[p] && !s.eliminated[p]) {
    s.extraRoll = false; s.phase = 'roll'; s.pendingTile = null; s.takeoverTile = null;
    emit(s, 'turn', p, l('더블 · 추가 굴림', 'Dobles · lanzamiento adicional')); return;
  }
  s.extraRoll = false; s.doublesCount = 0;
  s.turns++; s.pendingTile = null; s.takeoverTile = null; s.pendingRent = null; s.pendingEvent = null; delete s.pendingEventSource; s.pendingPayment = null;
  if ((s.eliminated.p1 && s.eliminated.p3) || (s.eliminated.p2 && s.eliminated.p4)) { settle(s, true); return; }
  if (s.turns >= 120) { settle(s); return; }
  let next = nextFourSeat(p); while (s.eliminated[next]) next = nextFourSeat(next);
  s.active = next;
  s.phase = s.islandTurns[next] ? 'island' : s.trainReady[next] ? 'train-decision' : 'roll';
  s.trainFare = 100; s.trainFromCard = false;
  emit(s, 'turn', next, l('다음 차례', 'Siguiente turno'));
}
function pay(s: FourMarbleState, p: FourSeat, amount: number, creditor: Creditor) {
  if (s.money[p] < amount) {
    s.pendingPayment = { amount, creditor, resumeActive: s.active }; s.active = p; s.phase = 'debt';
    log(s, `${p} · ${amount} 지급에 ${amount - s.money[p]} 부족`, `${p} · faltan ${amount - s.money[p]} para pagar ${amount}`);
    emit(s, 'crisis', p, l('결제가 필요해요', 'Hay un pago pendiente'), l(`${amount} 지급에 ${amount - s.money[p]} 부족`, `Faltan ${amount - s.money[p]} para pagar ${amount}`), { amount, fromAccount: p, toAccount: creditor }); return;
  }
  s.money[p] -= amount;
  if (creditor === 'fund') s.fundPool += amount;
  else if (creditor !== 'bank') s.money[creditor] += amount;
  log(s, `${p} → ${creditor} · ${amount} 지급`, `${p} → ${creditor} · pago de ${amount}`);
  emit(s, fourSeats.includes(creditor as FourSeat) ? 'rent' : 'tax', p, l('비용 지급', 'Pago realizado'), l(`${p} → ${creditor} · ${amount}`, `${p} → ${creditor} · ${amount}`), { amount, tile: s.positions[p], fromAccount: p, toAccount: creditor, moneyDelta: { [p]: -amount, ...(fourSeats.includes(creditor as FourSeat) ? { [creditor]: amount } : {}) } });
}
function award(s: FourMarbleState, p: FourSeat, amount: number, title: ReturnType<typeof l>, source: 'bank' | 'fund' = 'bank') {
  s.money[p] += amount;
  emit(s, 'bonus', p, title, l(`${amount}을 받았습니다.`, `Recibiste ${amount}.`), { amount, fromAccount: source, toAccount: p, moneyDelta: { [p]: amount } });
}
function move(s: FourMarbleState, p: FourSeat, to: number, salary: boolean, source = 'card', steps = (to - s.positions[p] + boardFor(s).length) % boardFor(s).length) {
  const board = boardFor(s);
  const from = s.positions[p];
  if (s.constructionRulesVersion === 2 && source !== 'island' && steps > 0 && from + steps >= board.length) { s.completedLaps ??= seatMap(0); s.completedLaps[p]++; }
  s.moveSequence = (s.moveSequence ?? 0) + 1;
  s.lastMove = { sequence: s.moveSequence, playerId: p, from, to, steps, source };
  emit(s, 'move', p, l('말 이동', 'Movimiento'), l(`${from + 1}번 → ${to + 1}번 칸`, `Casilla ${from + 1} → ${to + 1}`), { from, to, steps, source });
  if (salary && to < s.positions[p]) {
    const amount = marblePassStartSalary(s.economicVersion, s.economyProfile);
    s.money[p] += amount;
    emit(s, 'salary', p, l('출발 급여', 'Bono de salida'), l(`출발을 지나 ${amount}을 받았습니다.`, `Al pasar por Salida recibes ${amount}.`), { amount, fromAccount: 'bank', toAccount: p, moneyDelta: { [p]: amount } });
  }
  s.positions[p] = to;
}
function land(s: FourMarbleState, p: FourSeat, drawEvent: boolean) {
  const board = boardFor(s);
  const index = s.positions[p], tile = board[index]; s.pendingTile = index; s.takeoverTile = null; s.phase = 'main'; s.pendingEvent = null; delete s.pendingEventSource;
  s.buildSite = tile.kind === 'start' ? 'start' : tile.kind === 'property' && (!s.properties[index] || s.properties[index].owner === p) ? index : null;
  s.landmarkOptions = index === 0
    ? ownedCities(s, p).filter(([, property]) => ready(property, s)).map(([tile]) => Number(tile))
    : s.properties[index]?.owner === p && ready(s.properties[index], s) ? [index] : [];
  log(s, `${p} · ${tile.name.ko} 도착`, `${p} · llegada a ${tile.name.es}`);
  emit(s, 'arrival', p, l(`${tile.name.ko} 도착`, `Llegada a ${tile.name.es}`), tile.name, { tile: index });
  if (purchasable(tile)) {
    const property = s.properties[index];
    if (!property) s.phase = 'decision';
    else if (fourTeam(property.owner) !== fourTeam(p)) {
      if (s.propertyRulesVersion === 1 && (tile.kind === 'property' || tile.kind === 'tourism' && (s.takeoverDiscountPasses?.[p] ?? 0) > 0)) s.takeoverTile = index;
      let amount = rent(tile, property, s); const modifier = tile.kind === 'property' ? s.modifiers[index] : undefined;
      if (modifier?.festival === property.owner) { amount *= 2; delete modifier.festival; }
      if (modifier?.blackout === p) { amount = Math.max(1, Math.floor(amount / 2)); delete modifier.blackout; }
      if (s.rentPasses[p]) { s.pendingRent = { amount, creditor: property.owner }; s.phase = 'rent-decision'; }
      else pay(s, p, amount, property.owner);
    }
  } else if (tile.kind === 'tax') pay(s, p, tile.price ?? 0, 'bank');
  else if (tile.kind === 'fund-deposit') pay(s, p, tile.price ?? 150, 'fund');
  else if (tile.kind === 'fund') { award(s, p, s.fundPool, l('사회복지기금 수령', 'Fondo social recibido'), 'fund'); s.fundPool = 0; }
  else if (tile.kind === 'island') { s.islandTurns[p] = 3; s.extraRoll = false; s.doublesCount = 0; }
  else if (tile.kind === 'train') s.trainReady[p] = true;
  else if (tile.kind === 'festival-site') {
    if (ownedCities(s, p).length) {
      s.pendingEvent = 'city-festival'; s.pendingEventSource = 'festival-site'; s.phase = 'event-decision';
      emit(s, 'festival-site', p, tile.name, l('내 도시를 선택하세요. 다음 적 착지 1회 통행료가 2배가 됩니다. 개최 비용은 없습니다.', 'Elige una ciudad propia. El alquiler se duplica una vez en la próxima llegada rival. El festival es gratis.'), { tile: index, cardOutcome: 'pending-choice' });
    } else emit(s, 'festival-site', p, tile.name, l('축제를 열 수 있는 내 도시가 없어 효과가 없습니다.', 'No tienes ninguna ciudad donde celebrar el festival; no hay efecto.'), { tile: index, cardOutcome: 'no-effect' });
  }
  else if (tile.kind === 'event' && drawEvent) resolveEvent(s, p);
}
function resolveEvent(s: FourMarbleState, p: FourSeat) {
  delete s.pendingEventSource;
  const board = boardFor(s);
  const id = s.eventDeck.shift()!; if (id !== 'escape-pass' && id !== 'rent-pass' && id !== 'takeover-discount-pass') s.eventDeck.push(id);
  const eventName = id === 'advance-start' ? l(`출발로 이동 +${marblePassStartSalary(s.economicVersion, s.economyProfile)}`, `Ve a Salida +${marblePassStartSalary(s.economicVersion, s.economyProfile)}`) : eventNames[id];
  log(s, `${p} · ${eventName.ko}`, `${p} · ${eventName.es}`);
  s.resolvingCardDrawSequence = (s.actionSequence ?? 0) + 1;
  emit(s, 'event-card', p, eventName, eventName, { cardId: id, tile: s.positions[p] });
  const cardEvent = s.actionLog.at(-1)!, beforeCash = s.money[p];
  if (id === 'festival') award(s, p, 150, eventName);
  else if (id === 'lottery') award(s, p, 200, eventName);
  else if (id === 'rent-rebate') award(s, p, 80, eventName);
  else if (id === 'travel-cost') pay(s, p, 100, 'bank');
  else if (id === 'maintenance') pay(s, p, ownedCities(s, p).reduce((sum, [, prop]) => sum + (s.constructionRulesVersion === 2 ? (prop.buildings?.length ?? 0) + (prop.landmark ? 1 : 0) : prop.houses) * 40, 0), 'bank');
  else if (id === 'visit-santo-domingo') { const destination = board.findIndex(t => t.name.ko === '산토도밍고'); if (destination < 0) throw new Error('Event destination does not exist in this board profile'); move(s, p, destination, true); land(s, p, false); }
  else if (id === 'advance-start') { move(s, p, 0, false); award(s, p, marblePassStartSalary(s.economicVersion, s.economyProfile), eventName); s.pendingTile = 0; s.buildSite = 'start'; s.landmarkOptions = ownedCities(s, p).filter(([, property]) => ready(property, s)).map(([tile]) => Number(tile)); }
  else if (id === 'retreat') { move(s, p, (s.positions[p] + board.length - 3) % board.length, false, 'card', -3); land(s, p, false); }
  else if (id === 'go-to-island') { move(s, p, board.findIndex(tile => tile.kind === 'island'), false, 'island'); s.islandTurns[p] = 3; s.pendingTile = s.positions[p]; s.extraRoll = false; s.doublesCount = 0; }
  else if (id === 'escape-pass') { s.escapePasses[p]++; emit(s, 'escape', p, eventName, eventName, { cardId: id, cardOutcome: 'applied' }); }
  else if (id === 'takeover-discount-pass') { s.takeoverDiscountPasses ??= seatMap(0); s.takeoverDiscountPasses[p]++; emit(s, 'event-card', p, eventName, eventName, { cardId: id, cardOutcome: 'applied' }); }
  else if (id === 'rent-pass') { s.rentPasses[p]++; emit(s, 'event-card', p, eventName, eventName, { cardId: id, cardOutcome: 'applied' }); }
  else if (id === 'train-ticket') { s.phase = 'train-decision'; s.trainFare = 0; s.trainFromCard = true; emit(s, 'train', p, eventName, eventName, { cardId: id, cardOutcome: 'pending-choice' }); }
  else if (id === 'city-shield') {
    s.cityShields ??= seatMap(0); const already = s.cityShields[p] > 0; s.cityShields[p] = 1;
    emit(s, 'event-card', p, eventName, already ? l('보호막은 최대 1장입니다. 추가 효과가 없습니다.', 'Ya tienes un escudo; máximo uno. No hay efecto adicional.') : l('다음 강제 매각·지진·정전 1회를 자동으로 막습니다.', 'Bloquea automáticamente la próxima venta forzosa, terremoto o apagón.'), { cardId: id, cardOutcome: already ? 'no-effect' : 'applied' });
  } else if (id === 'birthday') {
    const moneyDelta: Partial<Record<FourSeat, number>> = { [p]: 0 }, transfers: { from: FourSeat; to: FourSeat; amount: number }[] = [];
    for (const opponent of fourSeats.filter(seat => !s.eliminated[seat] && fourTeam(seat) !== fourTeam(p))) {
      const amount = Math.min(40, Math.max(0, s.money[opponent])); s.money[opponent] -= amount; s.money[p] += amount;
      moneyDelta[opponent] = -amount; moneyDelta[p]! += amount; transfers.push({ from: opponent, to: p, amount });
    }
    const amount = moneyDelta[p]!, detail = transfers.map(transfer => `${transfer.from} → ${p}: ${transfer.amount}`).join(' · ');
    emit(s, 'event-card', p, eventName, l(`${detail} · 합계 ${amount} · 보유 현금 한도, 대출 없음`, `${detail} · Total ${amount} · limitado al efectivo, sin deuda`), { cardId: id, amount, toAccount: p, moneyDelta, transfers, cardOutcome: amount ? 'paid' : 'no-effect' });
  } else if (id === 'property-hunt') {
    const distance = Array.from({ length: board.length }, (_, i) => i + 1).find(step => { const index = (s.positions[p] + step) % board.length; return board[index].kind === 'property' && !s.properties[index]; });
    if (distance !== undefined) { move(s, p, (s.positions[p] + distance) % board.length, true, 'card', distance); land(s, p, false); }
    else emit(s, 'event-card', p, eventName, l('빈 일반 도시가 없어 효과가 없습니다.', 'No hay ciudades normales libres; no hay efecto.'), { cardId: id, cardOutcome: 'no-effect' });
  }
  else if (id === 'city-dividend') award(s, p, ownedCities(s, p).length * 30, eventName);
  else if (id === 'city-festival' || id === 'blackout' || id === 'forced-sale' || id === 'earthquake' || id === 'construction-grant') {
    if (eventCities(s, p, id).length) { s.pendingEvent = id; s.phase = 'event-decision'; emit(s, 'event-card', p, eventName, eventName, { cardId: id, cardOutcome: 'pending-choice' }); }
    else emit(s, 'event-card', p, eventName, l('선택 가능한 도시가 없어 효과가 없습니다.', 'No hay ninguna ciudad elegible; la carta no tiene efecto.'), { cardId: id, moneyDelta: { [p]: 0 }, cardOutcome: 'no-effect' });
  } else if (id === 'monopoly-warning') {
    const counts = fourSeats.map(seat => ({ seat, count: s.eliminated[seat] ? 0 : groups(s, seat).length }));
    const most = Math.max(...counts.map(item => item.count));
    const target = counts.find(item => item.seat === p && item.count === most) ?? counts.find(item => item.count === most)!;
    if (most) pay(s, target.seat, Math.min(300, most * 100), 'bank');
    else emit(s, 'event-card', p, eventName, l('완성한 색상 도시군이 없어 부담금이 없습니다.', 'Nadie tiene un grupo de color completo. No se cobra.'), { cardId: id, moneyDelta: { [p]: 0 }, cardOutcome: 'no-effect' });
  }
  cardEvent.cashDelta = s.money[p] - beforeCash;
}
function actions(s: FourMarbleState, p: FourSeat): FourView['actions'] {
  const board = boardFor(s);
  if (s.result || s.active !== p || s.eliminated[p] || marbleProfilePending(s.boardProfile)) return [];
  const choices: FourView['actions'] = [];
  const add = (ko: string, es: string, type: string, payload?: Record<string, unknown>) => choices.push({ label: l(ko, es), action: { type, ...(payload ? { payload } : {}) } });
  if (s.phase === 'debt') {
    if (!s.debt[p]) add(`대출 ${marbleLoanTerms(s.loanRulesVersion).amount} 받기 · 상환 ${marbleLoanTerms(s.loanRulesVersion).repayment}`, `Pedir préstamo de ${marbleLoanTerms(s.loanRulesVersion).amount} · devolver ${marbleLoanTerms(s.loanRulesVersion).repayment}`, 'borrow');
    if (s.propertyRulesVersion === 1) for (const item of liquidation(s, p)) add(`${board[item.index].name.ko} 은행 매각 · ${item.value}`, `Vender ${board[item.index].name.es} al banco · ${item.value}`, 'sell-property', { tile: item.index });
    if (s.pendingPayment) add('파산하기', 'Declararse en quiebra', 'declare-bankruptcy', s.propertyRulesVersion === 1 && canRescue(s, p) ? { voluntary: true } : undefined); return choices;
  }
  if (s.phase === 'rent-decision') {
    add(`통행료 ${s.pendingRent!.amount} 지급`, `Pagar alquiler de ${s.pendingRent!.amount}`, 'pay-rent');
    if (s.rentPasses[p] > 0) add('통행료 면제권 사용', 'Usar pase de alquiler', 'use-rent-pass'); return choices;
  }
  if (s.phase === 'event-decision') {
    for (const [index] of eventCities(s, p, s.pendingEvent)) add(`${board[Number(index)].name.ko} 선택`, `Elegir ${board[Number(index)].name.es}`, 'choose-event-city', { tile: Number(index) });
    return choices;
  }
  if (s.phase === 'roll') {
    if (!s.pawnLocked[p]) for (const pawn of marblePawnIds) if (!fourSeats.some(seat => seat !== p && s.pawns[seat] === pawn)) add(`말 선택 · ${pawnNames[pawn].ko}`, `Elegir figura · ${pawnNames[pawn].es}`, 'choose-pawn', { pawn });
    add('주사위 굴리기', 'Lanzar dados', 'roll');
  }
  if (s.phase === 'island') {
    add('쌍으로 탈출 시도', 'Intentar salir con dobles', 'attempt-doubles');
    if (s.money[p] >= 100) add('100을 내고 탈출', 'Pagar 100 para salir', 'pay-escape');
    if (s.escapePasses[p]) add('탈출권 사용', 'Usar pase de salida', 'use-escape-pass');
  }
  if (s.phase === 'train-decision') {
    if (s.money[p] >= s.trainFare) board.forEach((tile, index) => { add(`${tile.name.ko}행 세계여행 · 비용 ${s.trainFare}`, `Viaje por el mundo a ${tile.name.es} · coste ${s.trainFare}`, 'choose-train', { destination: index }); });
    add('세계여행 이용 안 함', 'No viajar por el mundo', 'skip-train');
  }
  if (s.phase === 'decision' && Number.isInteger(s.pendingTile) && s.pendingTile === s.positions[p] && purchasable(board[s.pendingTile!]) && !s.properties[s.pendingTile!]) {
    const price = marbleLandPrice(board[s.pendingTile!], s.economicVersion);
    if (board[s.pendingTile!].kind === 'tourism') {
      if (s.money[p] >= price) { add(`섬 구매 · ${price}`, `Comprar isla · ${price}`, 'buy'); add(`섬 구매 · ${price}`, `Comprar isla · ${price}`, 'buy', { buildings: [] }); }
    } else if (s.constructionRulesVersion === 2) {
      if (s.money[p] >= price) add(`도시 구매 · ${price}`, `Comprar ciudad · ${price}`, 'buy');
      for (const selection of [{ buildings: [] as MarbleBuildingType[] }, ...constructionOptions(undefined, s.completedLaps?.[p] ?? 0, false)]) {
        const total = price + constructionCost(board[s.pendingTile!], selection, s.economicVersion);
        if (s.money[p] >= total) add(`도시·건물 구매 · ${total}`, `Comprar terreno y edificios · ${total}`, 'buy', selection);
      }
    } else {
      if (s.money[p] >= price) add(`도시 구매 · ${price}`, `Comprar ciudad · ${price}`, 'buy');
      if (s.constructionRulesVersion === 1) for (const targetLevel of [0, 1, 2]) {
        const total = price + marbleBuildToCost(board[s.pendingTile!], 0, targetLevel, s.economicVersion ?? 2);
        if (s.money[p] >= total) add(`도시·${targetLevel}단계 구매 · ${total}`, `Comprar ciudad · nivel ${targetLevel} · ${total}`, 'buy', { targetLevel });
      }
    }
    add('구매 안 함', 'No comprar', 'decline');
  }
  if (s.phase === 'main') {
    const index = s.takeoverTile, prop = index == null ? undefined : s.properties[index];
    if (s.propertyRulesVersion === 1 && index === s.positions[p] && prop && fourTeam(prop.owner) !== fourTeam(p)) {
      const cost = takeoverPrice(board[index!], prop, s);
      if (cost != null && board[index!].kind !== 'tourism' && s.money[p] >= cost) add(`도시 인수 · ${cost}`, `Adquirir ciudad · ${cost}`, 'takeover', { tile: index });
      if (cost != null && (s.takeoverDiscountPasses?.[p] ?? 0) > 0 && s.money[p] >= Math.ceil(cost / 2)) add(`할인권 사용하고 인수 · ${Math.ceil(cost / 2)}`, `Adquirir con cupón · ${Math.ceil(cost / 2)}`, 'takeover', { tile: index, useDiscountPass: true });
    }
    for (const [index, prop] of ownedCities(s, p)) {
      const tile = board[Number(index)], cost = marbleBuildCost(tile, prop.houses, s.economicVersion ?? 2);
      if (s.constructionRulesVersion === 2) {
        if (s.buildSite === 'start' || s.buildSite === Number(index)) for (const selection of constructionOptions(prop, s.completedLaps?.[p] ?? 0, !!s.landmarkOptions?.includes(Number(index)))) {
          const total = constructionCost(tile, selection, s.economicVersion);
          if (s.money[p] >= total) add(`${tile.name.ko} ${selection.landmark ? '랜드마크' : '건물'} 건설 · ${total}`, `Construir ${selection.landmark ? 'monumento' : 'edificios'} en ${tile.name.es} · ${total}`, 'build', { tile: Number(index), ...selection });
        }
        continue;
      }
      if (prop.houses < 3 && (s.constructionRulesVersion !== 1 || (s.buildSite === 'start' || s.buildSite === Number(index)) && (prop.houses < 2 || !!s.landmarkOptions?.includes(Number(index)))) && s.money[p] >= cost) add(`${tile.name.ko} ${prop.houses + 1}단계 건설 · ${cost}`, `Construir nivel ${prop.houses + 1} en ${tile.name.es} · ${cost}`, 'build', { tile: Number(index) });
      if (s.constructionRulesVersion === 1 && (s.buildSite === 'start' || s.buildSite === Number(index))) {
        const maxTarget = prop.houses === 2 && s.landmarkOptions?.includes(Number(index)) ? 3 : 2;
        for (let targetLevel = prop.houses + 1; targetLevel <= maxTarget; targetLevel++) {
          const total = marbleBuildToCost(tile, prop.houses, targetLevel, s.economicVersion ?? 2);
          if (s.money[p] >= total) add(`${tile.name.ko} ${targetLevel === 3 ? '랜드마크' : `${targetLevel}단계`} 건설 · ${total}`, `Construir ${targetLevel === 3 ? 'monumento' : `nivel ${targetLevel}`} en ${tile.name.es} · ${total}`, 'build', { tile: Number(index), targetLevel });
        }
      }
    }
    add(s.extraRoll ? '더블 · 한 번 더 굴리기' : '차례 마치기', s.extraRoll ? 'Dobles · lanzar otra vez' : 'Terminar turno', 'endTurn');
  }
  if (!s.debt[p]) add(`대출 받기 · ${marbleLoanTerms(s.loanRulesVersion).amount} / 상환 ${marbleLoanTerms(s.loanRulesVersion).repayment}`, `Pedir préstamo · ${marbleLoanTerms(s.loanRulesVersion).amount} / devolver ${marbleLoanTerms(s.loanRulesVersion).repayment}`, 'borrow');
  else if (s.money[p] >= s.debt[p]) add(`대출 ${s.debt[p]} 상환`, `Pagar deuda de ${s.debt[p]}`, 'repay');
  return choices;
}
function actionPayloadKey(payload: GameAction['payload']) {
  return JSON.stringify(Object.entries(payload ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, key === 'buildings' && Array.isArray(value) ? [...value].sort() : value]));
}
function validation(s: FourMarbleState, p: FourSeat, a: GameAction): string | null {
  if (!fourSeats.includes(p) || !a || typeof a.type !== 'string') return 'Invalid player or action';
  if (a.type === 'declare-bankruptcy' && (s.phase !== 'debt' || !s.pendingPayment)) return 'No compulsory payment';
  return actions(s, p).some(choice => choice.action.type === a.type && actionPayloadKey(choice.action.payload) === actionPayloadKey(a.payload)) ? null : 'Action unavailable';
}
export function createFourLegacyMarbleState(seed: number): FourMarbleState {
  return { eventVersion: 3, propertyRulesVersion: 1, constructionRulesVersion: 1, economicVersion: 3, takeoverTile: null, doublesCount: 0, extraRoll: false, landmarkOptions: [], buildSite: null, rng: seed >>> 0, active: 'p1', phase: 'roll', positions: seatMap(0), money: seatMap(marbleStartingCash(3)), debt: seatMap(0), properties: {}, eliminated: seatMap(false), islandTurns: seatMap(0), trainReady: seatMap(false), escapePasses: seatMap(0), rentPasses: seatMap(0), eventDeck: shuffle(eventIds, seededRandom(seed ^ 0xa5a5a5a5)), fundPool: 0, turns: 0, result: null, pendingTile: null, trainFare: 100, trainFromCard: false, pendingRent: null, pendingEvent: null, pendingPayment: null, modifiers: {}, lastRoll: [], log: [], actionLog: [], actionSequence: 0, diceSequence: 0, moveSequence: 0, lastMove: null, pawns: { p1: 'fox', p2: 'cat', p3: 'penguin', p4: 'astronaut' }, pawnLocked: seatMap(false) };
}
export const fourMarbleEngine: FourEngine = {
  id: 'marble',
  createInitialState(seed): FourMarbleState {
    return { ...createFourLegacyMarbleState(seed), eventVersion: 4, takeoverDiscountPasses: seatMap(0), eventDeck: shuffle(expandedEventIds, seededRandom(seed ^ 0xa5a5a5a5)), cityShields: seatMap(0), loanRulesVersion: 2, rentRulesVersion: 2, constructionPriceRulesVersion: 2, festivalRulesVersion: 2, constructionRulesVersion: 2, boardProfile: 'world-islands-32-v1', boardRevision: 4, cityRouteVersion: 5, economyProfile: CLASSIC_ECONOMY_PROFILE, completedLaps: seatMap(0), money: seatMap(marbleStartingCash(3, CLASSIC_ECONOMY_PROFILE)) };
  },
  validateAction: validation,
  applyAction(state: FourMarbleState, p, a): FourMarbleState {
    const error = validation(state, p, a); if (error) throw new Error(error);
    const s: FourMarbleState = structuredClone(state), x = a.payload ?? {}, board = boardFor(s);
    beginCardResolution(state, s, a);
    if (a.type === 'choose-pawn') {
      s.pawns[p] = x.pawn as MarblePawnId;
      emit(s, 'pawn', p, l('말 선택', 'Figura elegida'), pawnNames[s.pawns[p]]);
    } else if (a.type === 'borrow') {
      const { amount, repayment } = marbleLoanTerms(s.loanRulesVersion);
      s.money[p] += amount; s.debt[p] = repayment; emit(s, 'loan', p, l('대출 실행', 'Préstamo recibido'), l(`${amount} 수령 · 상환 ${repayment}`, `Recibes ${amount} · devuelves ${repayment}`), { amount, debtAfter: repayment, fromAccount: 'bank', toAccount: p, moneyDelta: { [p]: amount } });
      if (s.pendingPayment && s.money[p] >= s.pendingPayment.amount) { const pending = s.pendingPayment; s.pendingPayment = null; s.phase = 'main'; pay(s, p, pending.amount, pending.creditor); s.active = pending.resumeActive; }
    } else if (a.type === 'repay') { const amount = s.debt[p]; s.money[p] -= amount; s.debt[p] = 0; emit(s, 'repay', p, l('대출 상환', 'Préstamo pagado'), undefined, { amount, fromAccount: p, toAccount: 'bank', moneyDelta: { [p]: -amount } }); }
    else if (a.type === 'sell-property') {
      const index = Number(x.tile), price = (board[index].cityEconomy ? classicSaleValue(board[index].cityEconomy!, s.properties[index]) : Math.floor(cityValue(board[index], s.properties[index], s) / 2));
      delete s.properties[index]; delete s.modifiers[index]; s.money[p] += price;
      emit(s, 'sell', p, l('도시 은행 매각', 'Ciudad vendida al banco'), board[index].name, { tile: index, amount: price, fromAccount: 'bank', toAccount: p, moneyDelta: { [p]: price } });
      const pending = s.pendingPayment!;
      if (s.money[p] >= pending.amount) { s.pendingPayment = null; s.phase = 'main'; pay(s, p, pending.amount, pending.creditor); s.active = pending.resumeActive; }
    }
    else if (a.type === 'declare-bankruptcy') {
      const resume = s.pendingPayment!.resumeActive, forfeitedCash = s.money[p];
      s.eliminated[p] = true; if (s.cityShields) s.cityShields[p] = 0; s.money[p] = 0; s.debt[p] = 0; s.islandTurns[p] = 0; s.trainReady[p] = false;
      for (const [index] of owned(s, p)) { delete s.properties[index]; delete s.modifiers[index]; }
      for (const key of ['escape-pass', 'rent-pass', 'takeover-discount-pass'] as const) { const passes = key === 'escape-pass' ? s.escapePasses : key === 'rent-pass' ? s.rentPasses : (s.takeoverDiscountPasses ??= seatMap(0)); if (passes[p]) s.eventDeck.push(key); passes[p] = 0; }
      s.pendingPayment = null;
      log(s, `${p} 파산 · 두 팀원 모두 파산해야 팀 패배`, `${p} quiebra · el equipo pierde cuando quiebran ambos`);
      emit(s, 'bankruptcy', p, l('개인 파산', 'Quiebra individual'), l(`도시와 건물은 은행에 반환되고 남은 현금 ${forfeitedCash}은 소멸합니다. 채권자에게 지급된 금액이 아닙니다. 팀원은 계속 플레이합니다.`, `Las propiedades vuelven al banco y se pierde el efectivo restante: ${forfeitedCash}. No es un pago al acreedor. Tu compañero sigue jugando.`), { moneyDelta: { [p]: -forfeitedCash }, cardOutcome: 'applied' });
      if ((s.eliminated.p1 && s.eliminated.p3) || (s.eliminated.p2 && s.eliminated.p4)) settle(s, true);
      else if (resume === p) finishTurn(s, p); else { s.active = resume; s.phase = 'main'; }
    } else if (a.type === 'roll' || a.type === 'attempt-doubles') {
      s.pawnLocked[p] = true;
      const random = seededRandom(s.rng), d1 = 1 + Math.floor(random() * 6), d2 = 1 + Math.floor(random() * 6); s.rng = (s.rng + 2 * 0x6d2b79f5) >>> 0; s.lastRoll = [d1, d2]; s.diceSequence = (s.diceSequence ?? 0) + 1; emit(s, 'roll', p, l('주사위 결과', 'Resultado de los dados'), l(`${d1} + ${d2} = ${d1+d2}`, `${d1} + ${d2} = ${d1+d2}`));
      if (s.propertyRulesVersion === 1) {
        s.doublesCount = a.type === 'roll' && d1 === d2 ? (s.doublesCount ?? 0) + 1 : 0; s.extraRoll = a.type === 'roll' && d1 === d2;
        if (s.doublesCount === 3) { move(s, p, board.findIndex(tile => tile.kind === 'island'), false, 'island'); s.islandTurns[p] = 3; s.extraRoll = false; s.doublesCount = 0; s.phase = 'main'; s.pendingTile = s.positions[p]; s.takeoverTile = null; emit(s, 'island', p, l('3연속 더블 · 무인도', 'Tres dobles seguidos · a la isla')); return s; }
      }
      if (a.type === 'attempt-doubles' && d1 !== d2) { s.islandTurns[p]--; emit(s, 'island', p, l('이번에는 쉬어가요', 'Este turno descansas'), l(s.islandTurns[p] ? `쌍이 나오지 않아 이동하지 않습니다. 남은 정지 ${s.islandTurns[p]}턴.` : '쌍이 나오지 않았지만 대기 시간이 끝났습니다. 다음 차례부터 자유롭게 이동합니다.', s.islandTurns[p] ? `No salieron dobles. Quedan ${s.islandTurns[p]} turnos en la isla.` : 'Terminó la espera. En tu próximo turno podrás moverte libremente.')); finishTurn(s, p); }
      else { if (a.type === 'attempt-doubles') emit(s, 'escape', p, l('더블 · 무인도 탈출', 'Dobles · salida de la isla')); s.islandTurns[p] = 0; move(s, p, (s.positions[p] + d1 + d2) % board.length, a.type !== 'attempt-doubles', a.type === 'attempt-doubles' ? 'island' : 'dice', d1 + d2); land(s, p, true); }
    } else if (a.type === 'pay-escape' || a.type === 'use-escape-pass') {
      if (a.type === 'pay-escape') { s.money[p] -= 100; emit(s, 'escape', p, l('무인도 탈출', 'Salida de la isla'), undefined, { amount: 100, fromAccount: p, toAccount: 'bank', moneyDelta: { [p]: -100 } }); } else { s.escapePasses[p]--; s.eventDeck.push('escape-pass'); emit(s, 'escape', p, l('탈출권 사용', 'Pase de salida usado'), undefined, { cardId: 'escape-pass' }); }
      s.islandTurns[p] = 0; s.phase = 'roll';
    } else if (a.type === 'choose-train') { s.money[p] -= s.trainFare; s.trainReady[p] = false; emit(s, 'train', p, l('세계여행 출발', 'Comienza el viaje por el mundo'), undefined, { amount: s.trainFare, fromAccount: p, toAccount: 'bank', moneyDelta: { [p]: -s.trainFare }, from: s.positions[p], to: Number(x.destination) }); move(s, p, Number(x.destination), true, 'train'); land(s, p, true); }
    else if (a.type === 'skip-train') { s.trainReady[p] = false; s.phase = s.trainFromCard ? 'main' : 'roll'; }
    else if (a.type === 'buy') { const index = s.pendingTile!, selection = { buildings: (x.buildings ?? []) as MarbleBuildingType[] }, price = marbleLandPrice(board[index], s.economicVersion) + (s.constructionRulesVersion === 2 ? constructionCost(board[index], selection, s.economicVersion) : s.constructionRulesVersion === 1 ? marbleBuildToCost(board[index], 0, (x.targetLevel as number | undefined) ?? 0, s.economicVersion ?? 2) : 0); s.money[p] -= price; s.properties[index] = s.constructionRulesVersion === 2 ? applyConstruction({ owner: p, houses: 0 }, selection) : { owner: p, houses: (x.targetLevel as number | undefined) ?? 0 }; s.phase = 'main'; emit(s, 'buy', p, board[index].kind === 'tourism' ? l('관광섬 구매 완료', 'Isla turística comprada') : l('도시 구매 완료', 'Ciudad comprada'), board[index].name, {tile:index, houses:s.properties[index].houses, landmark:isLandmark(s.properties[index],s.constructionRulesVersion), buildings:[...(s.properties[index].buildings??[])], amount:price, fromAccount:p, toAccount:'bank', moneyDelta:{[p]:-price}}); }
    else if (a.type === 'takeover') {
      const index = Number(x.tile), prop = s.properties[index], owner = prop.owner, cost = x.useDiscountPass === true ? Math.ceil(takeoverPrice(board[index], prop, s)! / 2) : takeoverPrice(board[index], prop, s)!;
      if (x.useDiscountPass === true) { s.takeoverDiscountPasses![p]--; s.eventDeck.push('takeover-discount-pass'); }
      s.money[p] -= cost; s.money[owner] += cost; prop.owner = p; s.takeoverTile = null; s.buildSite = board[index].kind === 'property' ? index : null; s.landmarkOptions = (s.constructionRulesVersion === 2 && constructionReady(prop) || s.constructionRulesVersion === 1 && prop.houses === 2) ? [index] : []; delete s.modifiers[index];
      emit(s, 'takeover', p, x.useDiscountPass ? l('할인권 인수 완료', 'Adquisición con cupón') : l('도시 인수 완료', 'Ciudad adquirida'), l('건설 단계 유지 · 이전 도시 효과 해제', 'Conserva su nivel · se eliminan los efectos anteriores'), { tile: index, amount: cost, fromAccount: p, toAccount: owner, moneyDelta: { [p]: -cost, [owner]: cost } });
    }
    else if (a.type === 'decline') s.phase = 'main';
    else if (a.type === 'build') { let prop = s.properties[Number(x.tile)]; const selection = x as { buildings: MarbleBuildingType[] } | { landmark: true }; const cost = s.constructionRulesVersion === 2 ? constructionCost(board[Number(x.tile)], selection, s.economicVersion) : marbleBuildToCost(board[Number(x.tile)], prop.houses, (x.targetLevel as number | undefined) ?? prop.houses + 1, s.economicVersion ?? 2); s.money[p] -= cost; if (s.constructionRulesVersion === 2) { prop = applyConstruction(prop, selection); s.properties[Number(x.tile)] = prop; } else prop.houses = (x.targetLevel as number | undefined) ?? prop.houses + 1; if (prop.houses === 3) s.landmarkOptions = []; if (s.buildSite === 'start') { s.buildSite = null; s.landmarkOptions = []; } emit(s, 'build', p, l('건설 완료', 'Construcción terminada'), board[Number(x.tile)].name, {tile:Number(x.tile),houses:prop.houses,landmark:isLandmark(prop,s.constructionRulesVersion),buildings:[...(prop.buildings??[])],amount:cost,fromAccount:p,toAccount:'bank',moneyDelta:{[p]:-cost}}); }
    else if (a.type === 'pay-rent' || a.type === 'use-rent-pass') {
      const pending = s.pendingRent!; s.pendingRent = null; s.phase = 'main';
      if (a.type === 'pay-rent') pay(s, p, pending.amount, pending.creditor); else { s.rentPasses[p]--; s.eventDeck.push('rent-pass'); emit(s, 'rent', p, l('통행료 면제권 사용', 'Pase de alquiler usado'), undefined, { tile:s.positions[p], amount:0, cardId:'rent-pass', fromAccount:p, toAccount:pending.creditor, moneyDelta:{[p]:0,[pending.creditor]:0} }); }
    } else if (a.type === 'choose-event-city') {
      const id = s.pendingEvent!, index = Number(x.tile), prop = s.properties[index], site = s.pendingEventSource === 'festival-site', key = id === 'city-festival' ? 'festival' : 'blackout';
      const constructionBefore = structuredClone(prop);
      s.pendingEvent = null; delete s.pendingEventSource; s.phase = 'main';
      if (['forced-sale', 'earthquake', 'blackout'].includes(id) && (s.cityShields?.[prop.owner] ?? 0) > 0) {
        s.cityShields![prop.owner]--;
        emit(s, 'event-card', p, eventNames[id], l('도시 보호막이 공격을 막았습니다. 보호막 1장 소모 · 도시 변화 없음.', 'El escudo bloqueó el ataque. Se consume un escudo; la ciudad no cambia.'), { cardId: id, tile: index, blockedByShield: true, shieldOwner: prop.owner, cardOutcome: 'no-effect', constructionBefore, constructionAfter: structuredClone(prop) });
      } else if (id === 'forced-sale') {
        const owner = prop.owner, amount = liquidation(s, owner).find(item => item.index === index)!.value;
        delete s.properties[index]; delete s.modifiers[index]; s.money[owner] += amount;
        emit(s, 'sell', p, eventNames[id], l(`${board[index].name.ko}: 은행이 소유자 ${owner}에게 ${amount} 지급 · 매각 실행자는 받지 않습니다.`, `${board[index].name.es}: el banco paga ${amount} al propietario ${owner}, no a quien juega la carta.`), { cardId: id, tile: index, amount, fromAccount: 'bank', toAccount: owner, moneyDelta: { [owner]: amount, [p]: 0 }, constructionBefore, constructionAfter: null });
      } else if (id === 'earthquake' || id === 'construction-grant') {
        if (s.constructionRulesVersion === 2) {
          if (id === 'construction-grant') s.properties[index] = applyConstruction(prop, { buildings: [grantBuilding(s, p, prop)!] });
          else { const highest = (['hotel', 'building', 'villa'] as const).find(type => prop.buildings?.includes(type))!; const buildings = prop.buildings!.filter(type => type !== highest); s.properties[index] = { ...prop, buildings, houses: buildings.length === 3 ? 2 : buildings.length ? 1 : 0 }; }
        } else prop.houses += id === 'construction-grant' ? 1 : -1;
        const after = s.properties[index];
        emit(s, 'build', p, eventNames[id], l(id === 'earthquake' ? '가장 높은 일반 건물 1개 철거 · 보상 없음 · 소유권 유지' : '가능한 가장 낮은 미보유 일반 건물 1개 무료 건설', id === 'earthquake' ? 'Se elimina el edificio normal más alto, sin compensación; conservas la propiedad.' : 'Se construye gratis el edificio normal disponible más bajo que falta.'), { cardId: id, tile: index, amount: 0, moneyDelta: { [p]: 0 }, houses: after.houses, buildings: [...(after.buildings ?? [])], landmark: false, constructionBefore, constructionAfter: structuredClone(after), cardOutcome: 'applied' });
      } else {
        if (key === 'festival' && s.festivalRulesVersion === 2) {
          for (const [city, effects] of Object.entries(s.modifiers)) if (effects.festival === p) {
            delete effects.festival;
            if (!effects.blackout) delete s.modifiers[city];
          }
        }
        s.modifiers[index] = { ...s.modifiers[index], [key]: p };
        emit(s, site ? 'festival-site' : 'event-card', p, site ? l('도시 축제 개최', 'Festival en la ciudad') : eventNames[id], id === 'city-festival' ? l(`${board[Number(x.tile)].name.ko}: 다음 상대 방문 통행료 2배 · 1회${s.festivalRulesVersion === 2 ? ' · 플레이어당 축제 1개, 다른 내 도시의 축제 해제' : ''}`, `${board[Number(x.tile)].name.es}: alquiler doble en la próxima visita rival, una vez${s.festivalRulesVersion === 2 ? ' · Un festival por jugador; se elimina el de tu otra ciudad' : ''}`) : board[Number(x.tile)].name, { ...(site ? { cardOutcome: 'applied' } : { cardId: id }), tile: Number(x.tile) });
      }
    }
    else if (a.type === 'endTurn') finishTurn(s, p);
    if (a.type === 'buy' || a.type === 'takeover') checkOwnershipWin(s, p);
    finishCardResolution(s);
    return s;
  },
  getPlayerView(s: FourMarbleState, p): MarbleView {
  const board = boardFor(s);
    const index = s.takeoverTile, prop = index == null ? undefined : s.properties[index], tile = index == null ? undefined : board[index];
    const price = tile && prop ? takeoverPrice(tile, prop, s) : null;
    const takeoverOffer = s.propertyRulesVersion === 1 && s.phase === 'main' && index === s.positions[p] && prop && tile && fourTeam(prop.owner) !== fourTeam(p) && (tile.kind !== 'tourism' || (s.takeoverDiscountPasses?.[p] ?? 0) > 0) ? { tile: index!, owner: prop.owner, price, couponOnly: tile.kind === 'tourism', discountPrice: price != null && (s.takeoverDiscountPasses?.[p] ?? 0) > 0 ? Math.ceil(price / 2) : null } : null;
    const publicState = structuredClone(s) as FourMarbleState; const { rng: _rng, eventDeck: _eventDeck, ...visible } = publicState;
    const cityCards = board.map((tile, index) => {
      const prop = s.properties[index], visitors = fourSeats.filter(seat => !s.eliminated[seat] && s.positions[seat] === index).join(' · ');
      const price = marbleLandPrice(tile, s.economicVersion ?? 2);
      return { id: `tile-${index}`, title: l(`${index + 1}. ${tile.name.ko}`, `${index + 1}. ${tile.name.es}`), detail: l(`${visitors ? `${visitors} · ` : ''}${prop ? `${prop.owner} · ${prop.houses}단계 · 통행료 ${rent(tile, prop, s)}` : price ? `가격 ${price}` : ''}`, `${visitors ? `${visitors} · ` : ''}${prop ? `${prop.owner} · nivel ${prop.houses} · alquiler ${rent(tile, prop, s)}` : price ? `Precio ${price}` : ''}`), color: prop ? fourTeam(prop.owner) === 'A' ? '#28766d' : '#ae4e63' : undefined };
    });
    return { game: 'marble', turn: s.active, phase: s.phase, players: fourSeats.map(seat => ({ id: seat, score: assets(s, seat), count: owned(s, seat).length, eliminated: s.eliminated[seat], detail: l(`현금 ${s.money[seat]} · 대출 ${s.debt[seat]} · ${s.positions[seat] + 1}번 칸`, `Efectivo ${s.money[seat]} · deuda ${s.debt[seat]} · casilla ${s.positions[seat] + 1}`) })), hand: cityCards.filter((_, index) => s.properties[index]?.owner === p), panels: [{ id: 'board', title: l(`도시 여행 · ${s.turns}/120차례 · 기금 ${s.fundPool}${s.lastRoll.length ? ` · 주사위 ${s.lastRoll.join('+')}` : ''}`, `Viaje · ${s.turns}/120 turnos · fondo ${s.fundPool}${s.lastRoll.length ? ` · dados ${s.lastRoll.join('+')}` : ''}`), cards: cityCards }, { id: 'log', title: l('최근 소식', 'Últimas noticias'), cards: s.log.map((item, index) => ({ id: `event-${index}`, title: item })) }], actions: actions(s, p), result: s.result ? structuredClone(s.result) : null, note: s.boardProfile === 'world-islands-32-v1' ? l(`독립 2대2 · 같은 팀 통행료 면제 · 한 사람의 라인·3색상군·섬 ${board.filter(tile => tile.kind === 'tourism').length}개 독점 시 팀 승리 · 팀원 모두 파산 시 패배`, `Variante 2 contra 2 · sin alquiler entre aliados · gana el equipo si una persona completa un lado, tres grupos de color o las ${board.filter(tile => tile.kind === 'tourism').length} islas · pierde si quiebran ambos`) : l('독립 2대2 규칙 · 같은 팀 통행료 면제 · 개인 자금과 자산 · 두 명 모두 파산 시 팀 패배', 'Variante propia 2 contra 2 · sin alquiler entre aliados · fondos individuales · pierde el equipo si quiebran ambos'), publicBoard: board.map((tile, index) => ({ ...structuredClone(tile), ...(tile.price !== undefined ? { price: marbleLandPrice(tile, s.economicVersion ?? 2) } : {}), ...(tile.rent !== undefined ? { rent: marbleBaseRent(tile, s.economicVersion ?? 2) } : {}), monopolyMultiplier: tile.kind === 'property' && marbleColorTollBonus(s) && s.properties[index] && groups(s, s.properties[index].owner).includes(tile.group!) ? 2 : 1 })), publicState: { ...visible, takeoverOffer, eventCardCount: s.eventVersion === 4 ? 23 : 16, takeoverDiscountPasses: structuredClone(s.takeoverDiscountPasses ?? seatMap(0)), cityShields: structuredClone(s.cityShields ?? seatMap(0)), boardSize: board.length, profileMetadata: marbleBoardProfileMetadata(s.boardProfile, s.boardRevision, board) } };
  },
  chooseAiAction(rawView, p, random = Math.random, reserveOverride?: number) {
    const view = rawView as MarbleView, s = view.publicState, board = boardFor(s), choices = view.actions.map(option => option.action).filter(action => action.type !== 'choose-pawn' && !(action.type === 'declare-bankruptcy' && action.payload?.voluntary === true));
    if (!choices.length) return null;
    const exposure = (tileIndex: number) => fourSeats.filter(seat => !s.eliminated[seat] && fourTeam(seat) !== fourTeam(p)).reduce((sum, seat) => { const distance = (tileIndex - s.positions[seat] + board.length) % board.length; return sum + (distance >= 2 && distance <= 12 ? (6 - Math.abs(7 - distance)) / 36 : .025); }, 0);
    const reserve = Math.max(reserveOverride ?? marbleAiReserve(s.economicVersion), ...Object.entries(s.properties).filter(([, prop]) => fourTeam(prop.owner) !== fourTeam(p)).map(([index, prop]) => rent(board[Number(index)], prop, s) * .7));
    const score = (a: GameAction) => {
      const x = a.payload ?? {}, cash = s.money[p];
      if (a.type === 'borrow') return view.phase === 'debt' ? 100 : -100;
      if (a.type === 'declare-bankruptcy') return -1000;
      if (a.type === 'sell-property') { const index = Number(x.tile), prop = s.properties[index]; return -20 - rent(board[index], prop, s) - (groups(s, p).includes(board[index].group!) ? 200 : 0); }
      if (a.type === 'repay') return cash - s.debt[p] > reserve ? 10 : -50;
      if (a.type === 'buy') { const tile = board[s.pendingTile!], price = marbleLandPrice(tile, s.economicVersion ?? 2) + (s.constructionRulesVersion === 2 ? constructionCost(tile, { buildings: (x.buildings ?? []) as MarbleBuildingType[] }, s.economicVersion) : s.constructionRulesVersion === 1 ? marbleBuildToCost(tile, 0, (x.targetLevel as number | undefined) ?? 0, s.economicVersion ?? 2) : 0), alliedGroup = tile.kind !== 'property' ? 0 : Object.entries(s.properties).filter(([index, prop]) => board[Number(index)].group === tile.group && fourTeam(prop.owner) === fourTeam(p)).length; return cash - price >= reserve ? 20 + alliedGroup * 5 + (rent(tile, s.constructionRulesVersion === 2 ? applyConstruction({ owner: p, houses: 0 }, { buildings: (x.buildings ?? []) as MarbleBuildingType[] }) : { owner: p, houses: (x.targetLevel as number | undefined) ?? 0 }, s) / price) * 20 : -1; }
      if (a.type === 'takeover') { const index = Number(x.tile), prop = s.properties[index], cost = x.useDiscountPass === true ? Math.ceil(takeoverPrice(board[index], prop, s)! / 2) : takeoverPrice(board[index], prop, s)!; return cash - cost >= reserve ? 12 + prop.houses * 3 + exposure(index) * 20 : -5; }
      if (a.type === 'build') { const index = Number(x.tile), prop = s.properties[index], cost = s.constructionRulesVersion === 2 ? constructionCost(board[index], x as { buildings: MarbleBuildingType[] } | { landmark: true }, s.economicVersion) : marbleBuildToCost(board[index], prop.houses, (x.targetLevel as number | undefined) ?? prop.houses + 1, s.economicVersion ?? 2); return cash - cost >= reserve ? 5 + (rent(board[index], s.constructionRulesVersion === 2 ? applyConstruction(prop, x as { buildings: MarbleBuildingType[] } | { landmark: true }) : { ...prop, houses: (x.targetLevel as number | undefined) ?? prop.houses + 1 }, s) - rent(board[index], prop, s)) / cost * 8 + exposure(index) * 10 : -5; }
      if (a.type === 'use-escape-pass') return 20;
      if (a.type === 'pay-escape') return cash > reserve + 300 && s.islandTurns[p] > 1 ? 10 : -5;
      if (a.type === 'use-rent-pass') return s.pendingRent!.amount > 80 || cash < s.pendingRent!.amount + reserve ? 20 : -1;
      if (a.type === 'choose-train') { const index = Number(x.destination), tile = board[index]; if (!purchasable(tile)) return 0; const prop = s.properties[index], price = marbleLandPrice(tile, s.economicVersion ?? 2); if (prop && fourTeam(prop.owner) !== fourTeam(p)) return -20; return !prop && cash > s.trainFare + price + reserve ? 10 + marbleBaseRent(tile, s.economicVersion ?? 2) / price + (index < s.positions[p] ? 3 : 0) : (prop && fourTeam(prop.owner) === fourTeam(p) && index < s.positions[p] ? 4 : -1); }
      if (a.type === 'choose-event-city') { const index = Number(x.tile), property = s.properties[index]; if (s.pendingEvent === 'construction-grant') return constructionCost(board[index], { buildings: [grantBuilding(s, p, property)!] }, s.economicVersion); if (['forced-sale', 'earthquake', 'blackout'].includes(s.pendingEvent ?? '') && (s.cityShields?.[property.owner] ?? 0) > 0) return -1; return rent(board[index], property, s) * (s.pendingEvent === 'city-festival' ? exposure(index) : .1 + ((index - s.positions[p] + board.length) % board.length <= 12 ? 1 : 0)); }
      return 0;
    };
    let best = -Infinity, candidates: GameAction[] = [];
    for (const a of choices) { const value = score(a); if (value > best) { best = value; candidates = [a]; } else if (value === best) candidates.push(a); }
    return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
  },
};

/** Internal, non-playable historical route preview, distinct from the approved world route. */
export const createFourClassicKoreaResearchState = (seed = 1): FourMarbleState => ({ ...fourMarbleEngine.createInitialState(seed), rentRulesVersion: 1, constructionPriceRulesVersion: 1, constructionRulesVersion: 2, completedLaps: seatMap(0), boardProfile: 'classic-korea-2015', cityRouteVersion: 4, economyProfile: CLASSIC_ECONOMY_PROFILE, money: seatMap(classicEconomyConfig.startingCash) });
