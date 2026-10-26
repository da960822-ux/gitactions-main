import { seededRandom, shuffle, type GameAction } from '../core/types';
import { fourSeats, fourTeam, nextFourSeat, localized as l, type FourEngine, type FourSeat, type FourResult, type FourView } from '../core/fourPlayer';
import { marbleEngine, marbleBuildCost, marbleCityValue, marbleRentMultipliers, marbleTakeoverPrice, marblePawnIds, type MarblePawnId, type MarbleTile, type MarbleEventId } from './marble';
import { marbleRentAtStage } from './marble-economy';
import { classicMarbleAssetValue, classicMarbleAvailableStructures, classicMarbleCityToll, classicMarbleConstructionCost, classicMarbleReferenceProfile, classicMarbleSaleValue, type ClassicMarbleBuildings, type ClassicMarbleStructure } from './marble-reference-profile';
import { classicMarbleIslandCount, classicMarbleTourismRent } from './marble-tourism-selector';
import { classicOlympicToll, classicOlympicsMultiplier, type ClassicOlympics } from './marble-classic-specials';

const freshMarbleState = marbleEngine.createInitialState(0);
const board: MarbleTile[] = marbleEngine.getPlayerView(freshMarbleState, 'p1').board.tiles.map((tile: MarbleTile) => ({ ...tile, name: { ...tile.name }, rentMultipliers: marbleRentMultipliers }));
const legacyState = { ...freshMarbleState, referenceProfileId: undefined, cityRouteVersion: 3 as const, economicVersion: 3 as const };
const legacyBoard: MarbleTile[] = marbleEngine.getPlayerView(legacyState, 'p1').board.tiles.map((tile: MarbleTile) => ({ ...tile, name: { ...tile.name }, rentMultipliers: marbleRentMultipliers }));
const boardFor = (s: Pick<FourMarbleState, 'referenceProfileId'>) => s.referenceProfileId === classicMarbleReferenceProfile.id ? board : legacyBoard;
const islandIndexFor = (s: Pick<FourMarbleState, 'referenceProfileId'>) => s.referenceProfileId === classicMarbleReferenceProfile.id ? boardFor(s).findIndex(tile => tile.kind === 'island') : 10;
const eventIds: MarbleEventId[] = ['festival', 'lottery', 'rent-rebate', 'travel-cost', 'maintenance', 'visit-santo-domingo', 'advance-start', 'retreat', 'go-to-island', 'escape-pass', 'train-ticket', 'city-dividend', 'monopoly-warning', 'city-festival', 'blackout', 'rent-pass'];
const pawnNames: Record<MarblePawnId, ReturnType<typeof l>> = { fox: l('말티푸', 'Maltipoo'), cat: l('랙돌', 'Ragdoll'), penguin: l('판다', 'Panda'), astronaut: l('우주인', 'Astronauta'), robot: l('리스연', 'Lisyeon'), dragon: l('친칠라', 'Chinchilla'), 'sali-suli': l('살리·술리', 'Sali y Suli') };
const eventNames: Record<MarbleEventId, ReturnType<typeof l>> = {
  festival: l('동네 축제 +150', 'Fiesta del barrio +150'), lottery: l('복권 당첨 +200', 'Lotería +200'), 'rent-rebate': l('임대료 환급 +80', 'Reembolso +80'),
  'travel-cost': l('여행 경비 −100', 'Gastos de viaje −100'), maintenance: l('건물 단계당 수리비 40', 'Mantenimiento: 40 por nivel'),
  'visit-santo-domingo': l('산토도밍고 방문', 'Visita a Santo Domingo'), 'advance-start': l('출발로 이동 +200', 'Ve a Salida +200'), retreat: l('세 칸 뒤로', 'Retrocede tres casillas'),
  'go-to-island': l('무인도로 이동', 'Ve a la isla'), 'escape-pass': l('무인도 탈출권 획득', 'Pase de salida recibido'), 'train-ticket': l('무료 열차표', 'Boleto de tren gratis'),
  'city-dividend': l('도시당 배당금 30', 'Dividendo de 30 por ciudad'), 'monopoly-warning': l('독점 경고', 'Advertencia de monopolio'),
  'city-festival': l('내 도시 다음 적 착지 통행료 2배', 'Alquiler doble en la próxima llegada rival'), blackout: l('적 도시 다음 내 착지 통행료 절반', 'Mitad del alquiler en tu próxima llegada rival'), 'rent-pass': l('통행료 면제권 획득', 'Pase de alquiler recibido'),
};
type Phase = 'roll' | 'main' | 'decision' | 'island' | 'train-decision' | 'rent-decision' | 'event-decision' | 'olympic-decision' | 'debt' | 'finished';
type Property = { owner: FourSeat; houses: number; buildings?: ClassicMarbleBuildings };
type Creditor = FourSeat | 'bank' | 'fund';
type FourMarbleEvent = { sequence: number; type: string; actor: FourSeat; title: ReturnType<typeof l>; text: ReturnType<typeof l>; [key: string]: unknown };
export interface FourMarbleState {
  rng: number; active: FourSeat; phase: Phase; positions: Record<FourSeat, number>; money: Record<FourSeat, number>; debt: Record<FourSeat, number>;
  properties: Record<string, Property>; eliminated: Record<FourSeat, boolean>; islandTurns: Record<FourSeat, number>; trainReady: Record<FourSeat, boolean>;
  escapePasses: Record<FourSeat, number>; rentPasses: Record<FourSeat, number>; eventDeck: MarbleEventId[]; fundPool: number; turns: number; result: FourResult | null;
  pendingTile: number | null; trainFare: number; trainFromCard: boolean; pendingRent: { amount: number; creditor: FourSeat } | null;
  pendingEvent: 'city-festival' | 'blackout' | null; pendingPayment: { amount: number; creditor: Creditor; resumeActive: FourSeat; beachAdvanceTile?: number } | null;
  modifiers: Record<string, { festival?: FourSeat; blackout?: FourSeat }>; lastRoll: number[]; log: ReturnType<typeof l>[];
  actionLog: FourMarbleEvent[]; actionSequence: number; diceSequence: number; moveSequence: number;
  lastMove: { sequence: number; playerId: FourSeat; from: number; to: number; steps: number; source: string } | null;
  propertyRulesVersion?: 1; takeoverTile?: number | null; doublesCount?: number; extraRoll?: boolean;
  referenceProfileId?: string; cityRouteVersion?: 4; economicVersion?: 4; completedLaps?: Record<FourSeat, number>; salaryAmount?: number; salaryStatus?: 'verified' | 'inferred'; buildArrivalTile?: number | null; tourismVisitStages?: Record<string, number>;
  activeOlympics?: ClassicOlympics; olympicHostings?: number;
  pawns: Record<FourSeat, MarblePawnId>; pawnLocked: Record<FourSeat, boolean>;
}
type TeamMarbleTileView = MarbleTile & { owner: FourSeat | null; houses: number; buildings: ClassicMarbleBuildings; currentToll: number | null; nextBuildOptions: { structure: ClassicMarbleStructure; cost: number | null; tollAfter: number | null }[]; monopolyMultiplier: number; olympicMultiplier: number };
export type MarbleView = FourView & { publicBoard: TeamMarbleTileView[]; publicState: Omit<FourMarbleState, 'rng' | 'eventDeck'> };
const seatMap = <T>(value: T): Record<FourSeat, T> => Object.fromEntries(fourSeats.map(p => [p, value])) as Record<FourSeat, T>;
const rent = (tile: MarbleTile, prop: Property, s?: Pick<FourMarbleState, 'properties' | 'propertyRulesVersion' | 'referenceProfileId' | 'tourismVisitStages' | 'activeOlympics'>) => {
  const spaces = s ? boardFor(s) : board, index = spaces.findIndex(space => space.name.ko === tile.name.ko);
  const base = tile.referenceProfileId === classicMarbleReferenceProfile.id && tile.kind === 'property'
    ? classicMarbleCityToll(tile.referenceCity ?? tile.name.ko, prop.buildings) ?? 0
    : tile.referenceProfileId === classicMarbleReferenceProfile.id && tile.kind === 'tourism'
      ? classicMarbleTourismRent(tile.name.ko, { ownerTourismCount: s ? classicMarbleIslandCount(Object.entries(s.properties).filter(([ownedIndex, item]) => item.owner === prop.owner && spaces[Number(ownedIndex)].kind === 'tourism').map(([ownedIndex]) => spaces[Number(ownedIndex)].name.ko)) : 1, beachVisitStage: s?.tourismVisitStages?.[String(index)] ?? 1, visitorPosition: 0, landingIndex: index }).amount ?? 0
      : marbleRentAtStage(tile.rent ?? 0, prop.houses, 3, true, tile.rentMultipliers ?? marbleRentMultipliers, s?.propertyRulesVersion === 1 && groups(s, prop.owner).includes(tile.group!) ? 2 : 1);
  return classicOlympicToll(s?.activeOlympics, index, base);
};
const owned = (s: FourMarbleState, p: FourSeat) => Object.entries(s.properties).filter(([, property]) => property.owner === p);
const groups = (s: Pick<FourMarbleState, 'properties' | 'referenceProfileId'>, p: FourSeat) => { const spaces = boardFor(s); return [...new Set(spaces.filter(t => t.group).map(t => t.group!))].filter(group => spaces.every((t, index) => t.group !== group || s.properties[index]?.owner === p)); };
const propertyAssetValue = (tile: MarbleTile, property: Property) => tile?.kind === 'tourism' && tile?.referenceProfileId === classicMarbleReferenceProfile.id
  ? classicMarbleReferenceProfile.rules.tourismBankPurchasePrice
  : tile?.referenceProfileId === classicMarbleReferenceProfile.id && tile?.referenceCity
    ? classicMarbleAssetValue(tile.referenceCity, property.buildings) ?? 0
    : (tile?.price ?? 0) + Array.from({ length: property.houses }, (_, level) => marbleBuildCost(tile, level, 3)).reduce((a, b) => a + b, 0);
const assets = (s: FourMarbleState, p: FourSeat) => { const spaces = boardFor(s); return s.money[p] - s.debt[p] + owned(s, p).reduce((sum, [index, property]) => sum + propertyAssetValue(spaces[Number(index)], property), 0); };
const liquidation = (s: FourMarbleState, p: FourSeat) => { const spaces = boardFor(s); return owned(s, p).filter(([index]) => spaces[Number(index)].kind !== 'tourism').map(([index, prop]) => ({ index: Number(index), value: spaces[Number(index)].referenceProfileId === classicMarbleReferenceProfile.id ? classicMarbleSaleValue(spaces[Number(index)].referenceCity ?? spaces[Number(index)].name.ko, prop.buildings) ?? 0 : Math.floor(marbleCityValue(spaces[Number(index)], prop.houses, 3) / 2) })); };
const canRescue = (s: FourMarbleState, p: FourSeat) => s.money[p] + liquidation(s, p).reduce((sum, item) => sum + item.value, 0) + (s.referenceProfileId === classicMarbleReferenceProfile.id ? 0 : s.debt[p] === 0 ? 300 : 0) >= (s.pendingPayment?.amount ?? Infinity);
const log = (s: FourMarbleState, ko: string, es: string) => { s.log = [...s.log, l(ko, es)].slice(-8); };
function emit(s: FourMarbleState, type: string, actor: FourSeat, title: ReturnType<typeof l>, text = title, extra: Record<string, unknown> = {}) {
  s.actionSequence = (s.actionSequence ?? 0) + 1;
  s.actionLog = [...(s.actionLog ?? []), { sequence: s.actionSequence, type, actor, title, text, ...extra }].slice(-40);
}
function bonus(s: FourMarbleState, p: FourSeat, amount: number, title: ReturnType<typeof l>, source: 'bank' | 'fund' = 'bank') {
  if (!amount) return;
  s.money[p] += amount;
  emit(s, 'bonus', p, title, l(`${amount} 받음`, `Recibes ${amount}`), { amount, fromAccount: source, toAccount: p, moneyDelta: { [p]: amount } });
}
function settle(s: FourMarbleState, bankruptcy = false) {
  const scores = { A: assets(s, 'p1') + assets(s, 'p3'), B: assets(s, 'p2') + assets(s, 'p4') };
  const goneA = s.eliminated.p1 && s.eliminated.p3, goneB = s.eliminated.p2 && s.eliminated.p4;
  const winner = bankruptcy ? goneA && goneB ? 'draw' : goneA ? 'B' : 'A' : scores.A === scores.B ? 'draw' : scores.A > scores.B ? 'A' : 'B';
  s.result = { winner, scores, reason: bankruptcy ? l('한 팀의 두 명이 모두 파산했습니다.', 'Los dos integrantes de un equipo quebraron.') : l('120차례 종료 · 두 팀원의 순자산 합계', '120 turnos · suma del patrimonio neto de cada equipo') };
  s.phase = 'finished';
  emit(s, 'win', winner === 'B' ? 'p2' : 'p1', l('팀 자산 결산', 'Balance por equipos'), s.result.reason);
}
function checkTourismVictory(s: FourMarbleState, p: FourSeat) {
  const spaces = boardFor(s), sites = spaces.flatMap((tile, index) => tile.kind === 'tourism' ? [index] : []);
  if (sites.length !== 5 || !sites.every(index => s.properties[index]?.owner === p)) return false;
  s.result = { winner: fourTeam(p), scores: { A: assets(s, 'p1') + assets(s, 'p3'), B: assets(s, 'p2') + assets(s, 'p4') }, reason: l('관광지 5곳 독점 · 팀전에서는 한 플레이어가 모두 소유', 'Cinco destinos turísticos · en equipos, una persona debe poseerlos todos') };
  s.phase = 'finished'; emit(s, 'win', p, l('관광지 독점 승리', 'Victoria por destinos turísticos'), s.result.reason); return true;
}
function finishTurn(s: FourMarbleState, p: FourSeat) {
  if (s.propertyRulesVersion === 1 && s.extraRoll && !s.islandTurns[p] && !s.eliminated[p]) {
    s.extraRoll = false; s.phase = 'roll'; s.pendingTile = null; s.takeoverTile = null;
    emit(s, 'turn', p, l('더블 · 추가 굴림', 'Dobles · lanzamiento adicional')); return;
  }
  s.extraRoll = false; s.doublesCount = 0;
  s.turns++; s.pendingTile = null; s.takeoverTile = null; s.pendingRent = null; s.pendingEvent = null; s.pendingPayment = null;
  if (s.referenceProfileId === classicMarbleReferenceProfile.id) s.buildArrivalTile = null;
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
function move(s: FourMarbleState, p: FourSeat, to: number, salary: boolean, source = 'card', steps = (to - s.positions[p] + boardFor(s).length) % boardFor(s).length) {
  const from = s.positions[p];
  if (salary && to < s.positions[p]) {
    if (s.referenceProfileId === classicMarbleReferenceProfile.id) {
      s.completedLaps ??= seatMap(0); s.completedLaps[p]++;
      const amount = s.salaryAmount ?? classicMarbleReferenceProfile.salaryReference.amount;
      bonus(s, p, amount, l('출발 월급 · 추정값', 'Salario de salida · estimado'));
      const last = s.actionLog.at(-1); if (last) last.title = l('출발 월급 · 추정값', 'Salario de salida · estimado');
    } else bonus(s, p, 200, l('출발 보너스', 'Bono de Salida'));
  }
  s.positions[p] = to;
  s.moveSequence = (s.moveSequence ?? 0) + 1;
  s.lastMove = { sequence: s.moveSequence, playerId: p, from, to, steps, source };
  emit(s, 'move', p, l('말 이동', 'Movimiento'), l(`${from + 1}번 → ${to + 1}번 칸`, `Casilla ${from + 1} → ${to + 1}`), { from, to, steps });
}
function land(s: FourMarbleState, p: FourSeat, drawEvent: boolean) {
  const spaces = boardFor(s), index = s.positions[p], tile = spaces[index]; s.pendingTile = index; s.takeoverTile = null; s.phase = 'main';
  if (s.referenceProfileId === classicMarbleReferenceProfile.id) s.buildArrivalTile = null;
  log(s, `${p} · ${tile.name.ko} 도착`, `${p} · llegada a ${tile.name.es}`);
  emit(s, 'arrival', p, l(`${tile.name.ko} 도착`, `Llegada a ${tile.name.es}`), tile.name, { tile: index });
  if (tile.referenceEffect === 'olympic') {
    s.phase = 'olympic-decision';
    emit(s, 'event-card', p, l('올림픽 개최지 선택', 'Elige la sede olímpica'), l('내 도시나 관광지 한 곳을 개최지로 지정합니다. 개최 배수는 2배부터 5배까지 순차 상승합니다.', 'Elige una ciudad o destino propio. El multiplicador de sede avanza de ×2 a ×5.'), { tile: index });
    return;
  }
  if (tile.kind === 'property' || tile.kind === 'tourism') {
    const property = s.properties[index];
    const tourism = tile.kind === 'tourism' ? classicMarbleReferenceProfile.tourism.find(site => site.name === tile.name.ko) : undefined;
    const visitStage = s.tourismVisitStages?.[String(index)] ?? 1;
    const advanceBeach = () => { if (tourism?.rentMode === 'visit-stage') { s.tourismVisitStages ??= {}; s.tourismVisitStages[String(index)] = Math.min(3, visitStage + 1); } };
    if (!property) {
      if (s.referenceProfileId === classicMarbleReferenceProfile.id) s.buildArrivalTile = index;
      s.phase = 'decision'; advanceBeach();
    } else if (property.owner !== p && fourTeam(property.owner) !== fourTeam(p) && tile.kind === 'tourism') {
      const ownerTourismCount = classicMarbleIslandCount(owned(s, property.owner).filter(([ownedIndex]) => spaces[Number(ownedIndex)].kind === 'tourism').map(([ownedIndex]) => spaces[Number(ownedIndex)].name.ko));
      const rawToll = classicMarbleTourismRent(tile.name.ko, { ownerTourismCount, beachVisitStage: visitStage, visitorPosition: s.positions[p], landingIndex: index });
      const toll = rawToll.amount === null ? rawToll : { ...rawToll, amount: classicOlympicToll(s.activeOlympics, index, rawToll.amount) };
      if (toll.amount !== null) {
        const paymentPending = s.money[p] < toll.amount;
        pay(s, p, toll.amount, property.owner);
        if (paymentPending && s.pendingPayment) s.pendingPayment.beachAdvanceTile = index;
        else advanceBeach();
      }
    } else if (property.owner !== p && fourTeam(property.owner) !== fourTeam(p)) {
      if (s.propertyRulesVersion === 1 && tile.kind !== 'tourism') s.takeoverTile = index;
      let amount = rent(tile, property, s); const modifier = s.modifiers[index];
      if (modifier?.festival === property.owner) { amount *= 2; delete modifier.festival; }
      if (modifier?.blackout === p) { amount = Math.max(1, Math.floor(amount / 2)); delete modifier.blackout; }
      if (s.rentPasses[p]) { s.pendingRent = { amount, creditor: property.owner }; s.phase = 'rent-decision'; }
      else pay(s, p, amount, property.owner);
      advanceBeach();
    } else {
      if (s.referenceProfileId === classicMarbleReferenceProfile.id && tile.kind === 'property' && property.owner === p) s.buildArrivalTile = index;
      advanceBeach();
    }
  } else if (tile.kind === 'tax') {
    if (tile.unresolvedRule && s.referenceProfileId === classicMarbleReferenceProfile.id) emit(s, 'reference-pending', p, l('효과 미확인', 'Efecto pendiente'), tile.name, { tile: index, moneyDelta: { [p]: 0 } });
    else pay(s, p, tile.price ?? 0, 'bank');
  }
  else if (tile.kind === 'fund-deposit') pay(s, p, tile.price ?? 150, 'fund');
  else if (tile.kind === 'fund') { bonus(s, p, s.fundPool, l('공동 기금 수령', 'Fondo común recibido'), 'fund'); s.fundPool = 0; }
  else if (tile.kind === 'island') { s.islandTurns[p] = 3; s.extraRoll = false; s.doublesCount = 0; }
  else if (tile.kind === 'train') {
    if (tile.unresolvedRule && s.referenceProfileId === classicMarbleReferenceProfile.id) emit(s, 'reference-pending', p, l('효과 미확인', 'Efecto pendiente'), tile.name, { tile: index, moneyDelta: { [p]: 0 } });
    else s.trainReady[p] = true;
  }
  else if (tile.kind === 'event' && drawEvent) {
    if (tile.unresolvedRule && s.referenceProfileId === classicMarbleReferenceProfile.id) emit(s, 'reference-pending', p, l('효과 미확인', 'Efecto pendiente'), tile.name, { tile: index, moneyDelta: { [p]: 0 } });
    else resolveEvent(s, p);
  }
}
function resolveEvent(s: FourMarbleState, p: FourSeat) {
  const board = boardFor(s);
  const id = s.eventDeck.shift()!; if (id !== 'escape-pass' && id !== 'rent-pass') s.eventDeck.push(id);
  log(s, `${p} · ${eventNames[id].ko}`, `${p} · ${eventNames[id].es}`);
  emit(s, 'event-card', p, eventNames[id], eventNames[id], { cardId: id, tile: s.positions[p] });
  const cardEvent = s.actionLog.at(-1)!, beforeCash = s.money[p];
  if (id === 'festival') bonus(s, p, 150, l('동네 축제 상금', 'Premio de la fiesta'));
  else if (id === 'lottery') bonus(s, p, 200, l('복권 당첨', 'Premio de lotería'));
  else if (id === 'rent-rebate') bonus(s, p, 80, l('임대료 환급', 'Reembolso de alquiler'));
  else if (id === 'travel-cost') pay(s, p, 100, 'bank');
  else if (id === 'maintenance') pay(s, p, owned(s, p).reduce((sum, [, prop]) => sum + prop.houses * 40, 0), 'bank');
  else if (id === 'visit-santo-domingo') { move(s, p, board.findIndex(t => t.name.ko === '산토도밍고'), true); land(s, p, false); }
  else if (id === 'advance-start') { move(s, p, 0, false); bonus(s, p, 200, l('출발 이동 보너스', 'Bono por ir a Salida')); s.pendingTile = 0; }
  else if (id === 'retreat') { move(s, p, (s.positions[p] + board.length - 3) % board.length, false, 'card', -3); land(s, p, false); }
  else if (id === 'go-to-island') { const target = s.referenceProfileId === classicMarbleReferenceProfile.id ? board.findIndex(tile => tile.kind === 'island') : 10; move(s, p, target, false, 'island'); s.islandTurns[p] = 3; s.pendingTile = target; s.extraRoll = false; s.doublesCount = 0; }
  else if (id === 'escape-pass') s.escapePasses[p]++;
  else if (id === 'rent-pass') s.rentPasses[p]++;
  else if (id === 'train-ticket') { s.phase = 'train-decision'; s.trainFare = 0; s.trainFromCard = true; }
  else if (id === 'city-dividend') bonus(s, p, owned(s, p).length * 30, l('도시 배당금', 'Dividendo de ciudades'));
  else if (id === 'city-festival' || id === 'blackout') {
    if (Object.values(s.properties).some(prop => id === 'city-festival' ? prop.owner === p : fourTeam(prop.owner) !== fourTeam(p) && !(s.propertyRulesVersion === 1 && prop.houses === 3))) { s.pendingEvent = id; s.phase = 'event-decision'; }
  } else if (id === 'monopoly-warning') {
    const counts = fourSeats.map(seat => ({ seat, count: s.eliminated[seat] ? 0 : groups(s, seat).length }));
    const most = Math.max(...counts.map(item => item.count));
    const target = counts.find(item => item.seat === p && item.count === most) ?? counts.find(item => item.count === most)!;
    if (most) pay(s, target.seat, Math.min(300, most * 100), 'bank');
  }
  cardEvent.cashDelta = s.money[p] - beforeCash;
}
function actions(s: FourMarbleState, p: FourSeat): FourView['actions'] {
  const board = boardFor(s);
  if (s.result || s.active !== p || s.eliminated[p]) return [];
  const choices: FourView['actions'] = [];
  const add = (ko: string, es: string, type: string, payload?: Record<string, unknown>) => choices.push({ label: l(ko, es), action: { type, ...(payload ? { payload } : {}) } });
  if (s.phase === 'debt') {
    if (s.referenceProfileId !== classicMarbleReferenceProfile.id && !s.debt[p] && s.money[p] + 300 >= s.pendingPayment!.amount) add('대출 300으로 지급 해결 · 상환 330', 'Resolver pago con préstamo de 300 · devolver 330', 'borrow');
    if (s.propertyRulesVersion === 1) for (const item of liquidation(s, p)) add(`${board[item.index].name.ko} 은행 매각 · ${item.value}`, `Vender ${board[item.index].name.es} al banco · ${item.value}`, 'sell-property', { tile: item.index });
    if (s.propertyRulesVersion !== 1 || !canRescue(s, p)) add('파산 인정 · 내 자산은 은행에 반환', 'Declarar quiebra · devolver propiedades al banco', 'declare-bankruptcy'); return choices;
  }
  if (s.phase === 'rent-decision') {
    add(`통행료 ${s.pendingRent!.amount} 지급`, `Pagar alquiler de ${s.pendingRent!.amount}`, 'pay-rent');
    add('통행료 면제권 사용', 'Usar pase de alquiler', 'use-rent-pass'); return choices;
  }
  if (s.phase === 'olympic-decision') {
    for (const [index] of owned(s, p)) if (board[Number(index)]?.kind === 'property' || board[Number(index)]?.kind === 'tourism') add(`${board[Number(index)].name.ko} 개최`, `Celebrar en ${board[Number(index)].name.es}`, 'choose-olympic-target', { tile: Number(index) });
    add('올림픽 개최 건너뛰기', 'Pasar los Juegos Olímpicos', 'skip-olympics');
    return choices;
  }
  if (s.phase === 'event-decision') {
    for (const [index, prop] of Object.entries(s.properties)) if (s.pendingEvent === 'city-festival' ? prop.owner === p : fourTeam(prop.owner) !== fourTeam(p) && !(s.propertyRulesVersion === 1 && prop.houses === 3)) add(`${board[Number(index)].name.ko} 선택`, `Elegir ${board[Number(index)].name.es}`, 'choose-event-city', { tile: Number(index) });
    return choices;
  }
  if (s.phase === 'roll') {
    if (!s.pawnLocked[p]) for (const pawn of marblePawnIds) if (!fourSeats.some(seat => seat !== p && s.pawns[seat] === pawn)) add(`말 선택 · ${pawnNames[pawn].ko}`, `Elegir figura · ${pawnNames[pawn].es}`, 'choose-pawn', { pawn });
    add('주사위 굴리기', 'Lanzar dados', 'roll');
  }
  if (s.phase === 'island') {
    add('쌍으로 탈출 시도', 'Intentar salir con dobles', 'attempt-doubles');
    const escapeFee = s.referenceProfileId === classicMarbleReferenceProfile.id ? classicMarbleReferenceProfile.rules.islandEscapeFee : { amount: 100, status: 'verified' };
    if (escapeFee.status === 'verified' && s.money[p] >= escapeFee.amount) add(`탈출 비용 ${escapeFee.amount}`, `Pagar ${escapeFee.amount} para salir`, 'pay-escape');
    if (s.escapePasses[p]) add('탈출권 사용', 'Usar pase de salida', 'use-escape-pass');
  }
  if (s.phase === 'train-decision') {
    if (s.money[p] >= s.trainFare) board.forEach((tile, index) => { if (tile.kind === 'property') add(`${tile.name.ko}행 열차 · 운임 ${s.trainFare}`, `Tren a ${tile.name.es} · pasaje ${s.trainFare}`, 'choose-train', { destination: index }); });
    add('열차 이용 안 함', 'No tomar el tren', 'skip-train');
  }
  if (s.phase === 'decision') {
    if (s.money[p] >= board[s.pendingTile!].price!) add(`${board[s.pendingTile!].kind === 'tourism' ? '관광지' : '도시'} 구매 · ${board[s.pendingTile!].price}`, `Comprar ${board[s.pendingTile!].kind === 'tourism' ? 'destino' : 'ciudad'} · ${board[s.pendingTile!].price}`, 'buy');
    add('구매 안 함', 'No comprar', 'decline');
  }
  if (s.phase === 'main') {
    const index = s.takeoverTile, prop = index == null ? undefined : s.properties[index];
    if (s.propertyRulesVersion === 1 && index === s.positions[p] && prop && fourTeam(prop.owner) !== fourTeam(p)) {
      const cost = marbleTakeoverPrice(board[index!], prop.houses, s.economicVersion ?? 3, prop.buildings);
      if (cost != null && s.money[p] >= cost) add(`도시 인수 · ${cost}`, `Adquirir ciudad · ${cost}`, 'takeover', { tile: index });
    }
    if (s.referenceProfileId === classicMarbleReferenceProfile.id) {
      const index = s.buildArrivalTile, prop = index == null ? undefined : s.properties[index], tile = index == null ? undefined : board[index];
      if (index != null && tile?.kind === 'property' && prop?.owner === p) for (const structure of classicMarbleAvailableStructures(prop.buildings ?? {}, s.completedLaps?.[p] ?? 0, true)) {
        const cost = classicMarbleConstructionCost(tile.referenceCity ?? tile.name.ko, structure)!;
        if (s.money[p] >= cost) add(`${tile.name.ko} ${structure} 건설 · ${cost}`, `Construir ${structure} en ${tile.name.es} · ${cost}`, 'build', { tile: index, structure });
      }
    }
    for (const [index, prop] of owned(s, p)) {
      if (s.referenceProfileId === classicMarbleReferenceProfile.id) continue;
      const tile = board[Number(index)], cost = marbleBuildCost(tile, prop.houses, 3);
      if (prop.houses < 3 && s.money[p] >= cost) add(`${tile.name.ko} ${prop.houses + 1}단계 건설 · ${cost}`, `Construir nivel ${prop.houses + 1} en ${tile.name.es} · ${cost}`, 'build', { tile: Number(index) });
    }
    add(s.extraRoll ? '더블 · 한 번 더 굴리기' : '차례 마치기', s.extraRoll ? 'Dobles · lanzar otra vez' : 'Terminar turno', 'endTurn');
  }
  if (s.referenceProfileId !== classicMarbleReferenceProfile.id) {
    if (!s.debt[p]) add('대출 받기 · 300 / 상환 330', 'Pedir préstamo · 300 / devolver 330', 'borrow');
    else if (s.money[p] >= s.debt[p]) add(`대출 ${s.debt[p]} 상환`, `Pagar deuda de ${s.debt[p]}`, 'repay');
  }
  return choices;
}
function validation(s: FourMarbleState, p: FourSeat, a: GameAction): string | null {
  if (!fourSeats.includes(p) || !a || typeof a.type !== 'string') return 'Invalid player or action';
  return actions(s, p).some(choice => choice.action.type === a.type && JSON.stringify(choice.action.payload ?? {}) === JSON.stringify(a.payload ?? {})) ? null : 'Action unavailable';
}
export const fourMarbleEngine: FourEngine = {
  id: 'marble',
  createInitialState(seed): FourMarbleState {
    return { propertyRulesVersion: 1, takeoverTile: null, doublesCount: 0, extraRoll: false, rng: seed >>> 0, active: 'p1', phase: 'roll', positions: seatMap(0), money: seatMap(classicMarbleReferenceProfile.startingCash.amount), debt: seatMap(0), properties: {}, eliminated: seatMap(false), islandTurns: seatMap(0), trainReady: seatMap(false), escapePasses: seatMap(0), rentPasses: seatMap(0), eventDeck: shuffle(eventIds, seededRandom(seed ^ 0xa5a5a5a5)), fundPool: 0, turns: 0, result: null, pendingTile: null, trainFare: 100, trainFromCard: false, pendingRent: null, pendingEvent: null, pendingPayment: null, modifiers: {}, lastRoll: [], log: [], actionLog: [], actionSequence: 0, diceSequence: 0, moveSequence: 0, lastMove: null, pawns: { p1: 'fox', p2: 'cat', p3: 'penguin', p4: 'astronaut' }, pawnLocked: seatMap(false), referenceProfileId: classicMarbleReferenceProfile.id, cityRouteVersion: 4, economicVersion: 4, completedLaps: seatMap(0), salaryAmount: classicMarbleReferenceProfile.salaryReference.amount, salaryStatus: 'inferred', buildArrivalTile: null, tourismVisitStages: Object.fromEntries(board.flatMap((tile, index) => tile.kind === 'tourism' ? [[index, 1]] : [])), activeOlympics: null, olympicHostings: 0 };
  },
  validateAction: validation,
  applyAction(state: FourMarbleState, p, a): FourMarbleState {
    const error = validation(state, p, a); if (error) throw new Error(error);
    const board = boardFor(state);
    const s: FourMarbleState = structuredClone(state), x = a.payload ?? {};
    if (a.type === 'choose-olympic-target') { const index = Number(x.tile), multiplier = classicOlympicsMultiplier(s.olympicHostings ?? 0); s.activeOlympics = { tile: index, multiplier, host: p }; s.olympicHostings = (s.olympicHostings ?? 0) + 1; s.phase = 'main'; emit(s, 'event-card', p, l('올림픽 개최', 'Juegos Olímpicos'), l(`${board[index].name.ko} · 통행료 ${multiplier}배`, `${board[index].name.es} · alquiler ×${multiplier}`), { tile: index, amount: multiplier }); }
    else if (a.type === 'skip-olympics') s.phase = 'main';
    else if (a.type === 'choose-pawn') {
      s.pawns[p] = x.pawn as MarblePawnId;
      emit(s, 'pawn', p, l('말 선택', 'Figura elegida'), pawnNames[s.pawns[p]]);
    } else if (a.type === 'borrow') {
      s.money[p] += 300; s.debt[p] = 330; emit(s, 'loan', p, l('대출 실행', 'Préstamo recibido'), l('300 수령 · 상환 330', 'Recibes 300 · devuelves 330'), { amount: 300, fromAccount: 'bank', toAccount: p, moneyDelta: { [p]: 300 } });
      if (s.pendingPayment) { const pending = s.pendingPayment; s.pendingPayment = null; s.phase = 'main'; pay(s, p, pending.amount, pending.creditor); s.active = pending.resumeActive; }
    } else if (a.type === 'repay') { const amount = s.debt[p]; s.money[p] -= amount; s.debt[p] = 0; emit(s, 'repay', p, l('대출 상환', 'Préstamo pagado'), undefined, { amount, fromAccount: p, toAccount: 'bank', moneyDelta: { [p]: -amount } }); }
    else if (a.type === 'sell-property') {
      const index = Number(x.tile), property = s.properties[index], price = board[index].referenceProfileId === classicMarbleReferenceProfile.id ? classicMarbleSaleValue(board[index].referenceCity ?? board[index].name.ko, property.buildings) ?? 0 : Math.floor(marbleCityValue(board[index], property.houses, 3) / 2);
      delete s.properties[index]; delete s.modifiers[index]; s.money[p] += price;
      emit(s, 'sell', p, l('도시 은행 매각', 'Ciudad vendida al banco'), board[index].name, { tile: index, amount: price, fromAccount: 'bank', toAccount: p, moneyDelta: { [p]: price } });
      const pending = s.pendingPayment!;
      if (s.money[p] >= pending.amount) { s.pendingPayment = null; s.phase = 'main'; pay(s, p, pending.amount, pending.creditor); s.active = pending.resumeActive; if (pending.beachAdvanceTile !== undefined) { s.tourismVisitStages ??= {}; const key = String(pending.beachAdvanceTile); s.tourismVisitStages[key] = Math.min(3, (s.tourismVisitStages[key] ?? 1) + 1); } }
    }
    else if (a.type === 'declare-bankruptcy') {
      const resume = s.pendingPayment!.resumeActive;
      s.eliminated[p] = true; s.money[p] = 0; s.debt[p] = 0; s.islandTurns[p] = 0; s.trainReady[p] = false;
      for (const [index] of owned(s, p)) { delete s.properties[index]; delete s.modifiers[index]; }
      for (const key of ['escape-pass', 'rent-pass'] as const) { const passes = key === 'escape-pass' ? s.escapePasses : s.rentPasses; if (passes[p]) s.eventDeck.push(key); passes[p] = 0; }
      s.pendingPayment = null;
      log(s, `${p} 파산 · 두 팀원 모두 파산해야 팀 패배`, `${p} quiebra · el equipo pierde cuando quiebran ambos`);
      emit(s, 'bankruptcy', p, l('개인 파산', 'Quiebra individual'), l('도시와 건물은 은행에 반환됩니다. 팀원은 계속 플레이합니다.', 'Las propiedades vuelven al banco. Tu compañero sigue jugando.'));
      if ((s.eliminated.p1 && s.eliminated.p3) || (s.eliminated.p2 && s.eliminated.p4)) settle(s, true);
      else if (resume === p) finishTurn(s, p); else { s.active = resume; s.phase = 'main'; }
    } else if (a.type === 'roll' || a.type === 'attempt-doubles') {
      s.pawnLocked[p] = true;
      const random = seededRandom(s.rng), d1 = 1 + Math.floor(random() * 6), d2 = 1 + Math.floor(random() * 6); s.rng = (s.rng + 2 * 0x6d2b79f5) >>> 0; s.lastRoll = [d1, d2]; s.diceSequence = (s.diceSequence ?? 0) + 1; emit(s, 'roll', p, l('주사위 결과', 'Resultado de los dados'), l(`${d1} + ${d2} = ${d1+d2}`, `${d1} + ${d2} = ${d1+d2}`));
      if (s.propertyRulesVersion === 1) {
        s.doublesCount = a.type === 'roll' && d1 === d2 ? (s.doublesCount ?? 0) + 1 : 0; s.extraRoll = a.type === 'roll' && d1 === d2;
        if (s.doublesCount === 3) { const target = islandIndexFor(s); move(s, p, target, false, 'island'); s.islandTurns[p] = 3; s.extraRoll = false; s.doublesCount = 0; s.phase = 'main'; s.pendingTile = target; s.takeoverTile = null; emit(s, 'island', p, l('3연속 더블 · 무인도', 'Tres dobles seguidos · a la isla')); return s; }
      }
      if (a.type === 'attempt-doubles' && d1 !== d2) { s.islandTurns[p]--; finishTurn(s, p); }
      else { s.islandTurns[p] = 0; move(s, p, (s.positions[p] + d1 + d2) % board.length, true, a.type === 'attempt-doubles' ? 'island' : 'dice', d1 + d2); land(s, p, true); }
    } else if (a.type === 'pay-escape' || a.type === 'use-escape-pass') {
      if (a.type === 'pay-escape') s.money[p] -= s.referenceProfileId === classicMarbleReferenceProfile.id ? classicMarbleReferenceProfile.rules.islandEscapeFee.amount : 100; else { s.escapePasses[p]--; s.eventDeck.push('escape-pass'); }
      s.islandTurns[p] = 0; s.phase = 'roll';
    } else if (a.type === 'choose-train') { s.money[p] -= s.trainFare; s.trainReady[p] = false; emit(s, 'train', p, l('열차 출발', 'El tren sale')); move(s, p, Number(x.destination), true, 'train'); land(s, p, false); }
    else if (a.type === 'skip-train') { s.trainReady[p] = false; s.phase = s.trainFromCard ? 'main' : 'roll'; }
    else if (a.type === 'buy') { const index = s.pendingTile!; s.money[p] -= board[index].price!; s.properties[index] = { owner: p, houses: 0, ...(s.referenceProfileId === classicMarbleReferenceProfile.id && board[index].kind === 'property' ? { buildings: {} } : {}) }; s.phase = 'main'; emit(s, 'buy', p, l(board[index].kind === 'tourism' ? '관광지 구매 완료' : '도시 구매 완료', board[index].kind === 'tourism' ? 'Destino turístico comprado' : 'Ciudad comprada'), board[index].name, {tile:index, amount:board[index].price, fromAccount:p, toAccount:'bank', moneyDelta:{[p]:-board[index].price!}}); if (checkTourismVictory(s, p)) return s; }
    else if (a.type === 'takeover') {
      const index = Number(x.tile), prop = s.properties[index], owner = prop.owner, cost = marbleTakeoverPrice(board[index], prop.houses, s.economicVersion ?? 3, prop.buildings)!;
      s.money[p] -= cost; s.money[owner] += cost; prop.owner = p; s.takeoverTile = null; delete s.modifiers[index];
      emit(s, 'takeover', p, l('도시 인수 완료', 'Ciudad adquirida'), l('건설 단계 유지 · 이전 도시 효과 해제', 'Conserva su nivel · se eliminan los efectos anteriores'), { tile: index, amount: cost, fromAccount: p, toAccount: owner, moneyDelta: { [p]: -cost, [owner]: cost } });
    }
    else if (a.type === 'decline') s.phase = 'main';
    else if (a.type === 'build') { const index = Number(x.tile), prop = s.properties[index], tile = board[index], structure = s.referenceProfileId === classicMarbleReferenceProfile.id ? x.structure as ClassicMarbleStructure : undefined, cost = structure ? classicMarbleConstructionCost(tile.referenceCity ?? tile.name.ko, structure)! : marbleBuildCost(tile, prop.houses, 3); s.money[p] -= cost;
      if (structure) { prop.buildings = { ...(prop.buildings ?? {}), [structure]: true }; prop.houses = (['villa', 'building', 'hotel'] as const).filter(item => prop.buildings?.[item]).length; } else prop.houses++;
      if (s.propertyRulesVersion === 1 && prop.houses === 3 && s.modifiers[index]) delete s.modifiers[index].blackout;
      emit(s, 'build', p, l('건설 완료', 'Construcción terminada'), l(`${tile.name.ko} · ${structure ?? `${prop.houses}단계`} · 통행료 ${rent(tile, prop, s)}`, `${tile.name.es} · ${structure ?? `nivel ${prop.houses}`} · alquiler ${rent(tile, prop, s)}`), {tile:index,amount:cost,fromAccount:p,toAccount:'bank',moneyDelta:{[p]:-cost}}); }
    else if (a.type === 'pay-rent' || a.type === 'use-rent-pass') {
      const pending = s.pendingRent!; s.pendingRent = null; s.phase = 'main';
      if (a.type === 'pay-rent') pay(s, p, pending.amount, pending.creditor); else { s.rentPasses[p]--; s.eventDeck.push('rent-pass'); emit(s, 'rent', p, l('통행료 면제권 사용', 'Pase de alquiler usado'), undefined, { tile:s.positions[p], amount:0, cardId:'rent-pass', fromAccount:p, toAccount:pending.creditor, moneyDelta:{[p]:0,[pending.creditor]:0} }); }
    } else if (a.type === 'choose-event-city') { const id = s.pendingEvent!, key = id === 'city-festival' ? 'festival' : 'blackout'; s.modifiers[Number(x.tile)] = { ...s.modifiers[Number(x.tile)], [key]: p }; s.pendingEvent = null; s.phase = 'main'; emit(s, 'event-card', p, eventNames[id], board[Number(x.tile)].name, { cardId: id, tile: Number(x.tile) }); }
    else if (a.type === 'endTurn') finishTurn(s, p);
    return s;
  },
  getPlayerView(s: FourMarbleState, p): MarbleView {
    const board = boardFor(s);
    const publicState = structuredClone(s) as FourMarbleState; const { rng: _rng, eventDeck: _eventDeck, ...visible } = publicState;
    const cityCards = board.map((tile, index) => {
      const prop = s.properties[index], visitors = fourSeats.filter(seat => !s.eliminated[seat] && s.positions[seat] === index).join(' · ');
      return { id: `tile-${index}`, title: l(`${index + 1}. ${tile.name.ko}`, `${index + 1}. ${tile.name.es}`), detail: l(`${visitors ? `${visitors} · ` : ''}${prop ? `${prop.owner} · ${prop.houses}단계 · 통행료 ${rent(tile, prop, s)}` : tile.price ? `가격 ${tile.price}` : ''}`, `${visitors ? `${visitors} · ` : ''}${prop ? `${prop.owner} · nivel ${prop.houses} · alquiler ${rent(tile, prop, s)}` : tile.price ? `Precio ${tile.price}` : ''}`), color: prop ? fourTeam(prop.owner) === 'A' ? '#28766d' : '#ae4e63' : undefined };
    });
    return { game: 'marble', turn: s.active, phase: s.phase, players: fourSeats.map(seat => ({ id: seat, score: assets(s, seat), count: owned(s, seat).length, eliminated: s.eliminated[seat], detail: l(`현금 ${s.money[seat]} · 대출 ${s.debt[seat]} · ${s.positions[seat] + 1}번 칸`, `Efectivo ${s.money[seat]} · deuda ${s.debt[seat]} · casilla ${s.positions[seat] + 1}`) })), hand: cityCards.filter((_, index) => s.properties[index]?.owner === p), panels: [{ id: 'board', title: l(`도시 여행 · ${s.turns}/120차례 · 기금 ${s.fundPool}${s.lastRoll.length ? ` · 주사위 ${s.lastRoll.join('+')}` : ''}`, `Viaje · ${s.turns}/120 turnos · fondo ${s.fundPool}${s.lastRoll.length ? ` · dados ${s.lastRoll.join('+')}` : ''}`), cards: cityCards }, { id: 'log', title: l('최근 소식', 'Últimas noticias'), cards: s.log.map((item, index) => ({ id: `event-${index}`, title: item })) }], actions: actions(s, p), result: s.result ? structuredClone(s.result) : null, note: l('독립 2대2 규칙 · 같은 팀 통행료 면제 · 개인 자금과 자산 · 두 명 모두 파산 시 팀 패배', 'Variante propia 2 contra 2 · sin alquiler entre aliados · fondos individuales · pierde el equipo si quiebran ambos'), publicBoard: board.map((tile, index) => {
      const property = s.properties[index], tourismCount = property ? classicMarbleIslandCount(owned(s, property.owner).filter(([ownedIndex]) => board[Number(ownedIndex)].kind === 'tourism').map(([ownedIndex]) => board[Number(ownedIndex)].name.ko)) : 0;
      const currentToll = !property ? tile.rent ?? null : tile.kind === 'tourism'
        ? classicMarbleTourismRent(tile.name.ko, { ownerTourismCount: tourismCount, beachVisitStage: s.tourismVisitStages?.[String(index)] ?? 1, visitorPosition: s.positions[p], landingIndex: index }).amount
        : rent(tile, property, s);
      const nextBuildOptions = property?.owner === p && tile.kind === 'property' && s.referenceProfileId === classicMarbleReferenceProfile.id
        ? classicMarbleAvailableStructures(property.buildings ?? {}, s.completedLaps?.[p] ?? 0, s.buildArrivalTile === index).map(structure => ({ structure, cost: classicMarbleConstructionCost(tile.referenceCity ?? tile.name.ko, structure), tollAfter: classicOlympicToll(s.activeOlympics, index, classicMarbleCityToll(tile.referenceCity ?? tile.name.ko, { ...(property.buildings ?? {}), [structure]: true }) ?? 0) }))
        : [];
      return { ...structuredClone(tile), owner: property?.owner ?? null, houses: property?.houses ?? 0, buildings: property?.buildings ?? {}, currentToll, nextBuildOptions, monopolyMultiplier: s.propertyRulesVersion === 1 && property && tile.group && groups(s, property.owner).includes(tile.group) ? 2 : 1, olympicMultiplier: s.activeOlympics?.tile === index ? s.activeOlympics.multiplier : 1 };
    }), publicState: visible };
  },
  chooseAiAction(rawView, p, random = Math.random) {
    const view = rawView as MarbleView, s = view.publicState, board = boardFor(s), choices = view.actions.map(option => option.action).filter(action => action.type !== 'choose-pawn');
    if (!choices.length) return null;
    const exposure = (tileIndex: number) => fourSeats.filter(seat => !s.eliminated[seat] && fourTeam(seat) !== fourTeam(p)).reduce((sum, seat) => { const distance = (tileIndex - s.positions[seat] + board.length) % board.length; return sum + (distance >= 2 && distance <= 12 ? (6 - Math.abs(7 - distance)) / 36 : .025); }, 0);
    const reserve = Math.max(200, ...Object.entries(s.properties).filter(([, prop]) => fourTeam(prop.owner) !== fourTeam(p)).map(([index, prop]) => rent(board[Number(index)], prop, s) * .7));
    const score = (a: GameAction) => {
      const x = a.payload ?? {}, cash = s.money[p];
      if (a.type === 'borrow') return view.phase === 'debt' ? 100 : -100;
      if (a.type === 'declare-bankruptcy') return -1000;
      if (a.type === 'sell-property') { const index = Number(x.tile), prop = s.properties[index]; return -20 - rent(board[index], prop, s) - (groups(s, p).includes(board[index].group!) ? 200 : 0); }
      if (a.type === 'repay') return cash - s.debt[p] > reserve ? 10 : -50;
      if (a.type === 'buy') { const tile = board[s.pendingTile!], alliedGroup = Object.entries(s.properties).filter(([index, prop]) => board[Number(index)].group === tile.group && fourTeam(prop.owner) === fourTeam(p)).length; const projectedRent = tile.kind === 'tourism' ? classicMarbleTourismRent(tile.name.ko, { ownerTourismCount: classicMarbleIslandCount(Object.entries(s.properties).filter(([index, prop]) => prop.owner === p && board[Number(index)].kind === 'tourism').map(([index]) => board[Number(index)].name.ko)) + 1, beachVisitStage: s.tourismVisitStages?.[String(s.pendingTile)] ?? 1, visitorPosition: 0, landingIndex: s.pendingTile! }).amount ?? 0 : tile.referenceProfileId === classicMarbleReferenceProfile.id ? classicMarbleCityToll(tile.referenceCity ?? tile.name.ko) ?? 0 : tile.rent ?? 0; return cash - tile.price! >= reserve ? 20 + alliedGroup * 5 + (projectedRent / tile.price!) * 20 : -1; }
      if (a.type === 'takeover') { const index = Number(x.tile), prop = s.properties[index], cost = marbleTakeoverPrice(board[index], prop.houses, s.economicVersion ?? 3, prop.buildings)!; return cash - cost >= reserve ? 12 + prop.houses * 3 + exposure(index) * 20 : -5; }
      if (a.type === 'build') { const index = Number(x.tile), prop = s.properties[index], tile = board[index];
        if (s.referenceProfileId === classicMarbleReferenceProfile.id) { const structure = x.structure as ClassicMarbleStructure, cost = classicMarbleConstructionCost(tile.referenceCity ?? tile.name.ko, structure) ?? Infinity, before = classicMarbleCityToll(tile.referenceCity ?? tile.name.ko, prop.buildings) ?? 0, after = classicMarbleCityToll(tile.referenceCity ?? tile.name.ko, { ...(prop.buildings ?? {}), [structure]: true }) ?? before; return cash - cost >= reserve ? 5 + (after - before) / cost * 8 + exposure(index) * 10 : -5; }
        const cost = marbleBuildCost(tile, prop.houses, 3); return cash - cost >= reserve ? 5 + (rent(tile, { ...prop, houses: prop.houses + 1 }, s) - rent(tile, prop, s)) / cost * 8 + exposure(index) * 10 : -5; }
      if (a.type === 'use-escape-pass') return 20;
      if (a.type === 'pay-escape') return cash > reserve + 300 && s.islandTurns[p] > 1 ? 10 : -5;
      if (a.type === 'choose-olympic-target') { const index = Number(x.tile), prop = s.properties[index], currentMultiplier = s.activeOlympics?.tile === index ? s.activeOlympics.multiplier : 1; return rent(board[index], prop, s) / currentMultiplier * classicOlympicsMultiplier(s.olympicHostings ?? 0) * exposure(index); }
      if (a.type === 'use-rent-pass') return s.pendingRent!.amount > 80 || cash < s.pendingRent!.amount + reserve ? 20 : -1;
      if (a.type === 'choose-train') { const index = Number(x.destination), tile = board[index], prop = s.properties[index]; if (prop && fourTeam(prop.owner) !== fourTeam(p)) return -20; return !prop && cash > s.trainFare + tile.price! + reserve ? 10 + (tile.rent ?? 0) / tile.price! + (index < s.positions[p] ? 3 : 0) : (prop && fourTeam(prop.owner) === fourTeam(p) && index < s.positions[p] ? 4 : -1); }
      if (a.type === 'choose-event-city') { const index = Number(x.tile), property = s.properties[index]; return rent(board[index], property, s) * (s.pendingEvent === 'city-festival' ? exposure(index) : .1 + ((index - s.positions[p] + board.length) % board.length <= 12 ? 1 : 0)); }
      return 0;
    };
    let best = -Infinity, candidates: GameAction[] = [];
    for (const a of choices) { const value = score(a); if (value > best) { best = value; candidates = [a]; } else if (value === best) candidates.push(a); }
    return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
  },
};
