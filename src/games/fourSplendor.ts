import { fourSeats, fourTeam, localized, nextFourSeat, type FourCard, type FourEngine, type FourResult, type FourSeat, type FourView } from '../core/fourPlayer';
import { seededRandom, shuffle, type GameAction } from '../core/types';
import { splendorEngine, splendorNobles, type Gem, type SplendorCard, type SplendorState } from './splendor';
import { chooseSimpleAiAction } from './simpleAi';
import art from '../../public/images/splendor/card-map.json';

const colors: Gem[] = ['white', 'blue', 'green', 'red', 'black'];
const colorNames = { white: localized('흰색', 'Blanco'), blue: localized('파랑', 'Azul'), green: localized('초록', 'Verde'), red: localized('빨강', 'Rojo'), black: localized('검정', 'Negro'), gold: localized('금', 'Oro') };
const walletFields = ['hands', 'bonuses', 'reserved', 'nobles', 'turns', 'cardPoints'] as const;
const cardArt = new Map(art.cards.map(card => [card.engineId, `/images/splendor/${card.src}`]));
const nobleArt = new Map(art.nobles.map(noble => [noble.engineId, `/images/splendor/${noble.src}`]));
type WalletField = typeof walletFields[number];
type FourWallets = { [K in WalletField]: Record<FourSeat, SplendorState[K]['p1']> };
export type FourSplendorState = Omit<SplendorState, WalletField | 'active' | 'result'> & FourWallets & { active: FourSeat; result: FourResult | null };
export type FourSplendorView = FourView & { economy: ReturnType<typeof splendorEngine.getPlayerView> };
const points = (s: FourSplendorState, p: FourSeat) => s.cardPoints[p] + s.nobles[p];
const teamScore = (s: FourSplendorState, team: 'A' | 'B') => fourSeats.filter(p => fourTeam(p) === team).reduce((n, p) => n + points(s, p), 0);

// Reuse the existing engine's single-turn rules; four-player rotation and team scoring stay here.
function project(s: FourSplendorState, p: FourSeat): SplendorState {
  const next = nextFourSeat(p);
  const records = Object.fromEntries(walletFields.map(key => [key, { p1: s[key][p], p2: s[key][next] }])) as Pick<SplendorState, WalletField>;
  return { ...s, ...records, active: s.active === p ? 'p1' : 'p2', result: null, pendingEnd: false };
}
function valid(s: FourSplendorState, p: FourSeat, action: GameAction) {
  if (!fourSeats.includes(p)) return 'Invalid player';
  if (s.result) return 'Game is finished';
  if (s.active !== p) return 'Not your turn';
  if (!action || typeof action.type !== 'string') return 'Invalid action';
  return splendorEngine.validateAction(project(s, p), 'p1', action);
}
function finish(s: FourSplendorState): FourSplendorState {
  if (!s.pendingEnd || s.pendingNobles.length || !fourSeats.every(p => s.turns[p] === s.turns.p1)) return s;
  const scores = { A: teamScore(s, 'A'), B: teamScore(s, 'B') };
  const count = (team: 'A' | 'B') => fourSeats.filter(p => fourTeam(p) === team).reduce((n, p) => n + colors.reduce((m, g) => m + s.bonuses[p][g], 0), 0);
  const winner = scores.A !== scores.B ? scores.A > scores.B ? 'A' : 'B' : count('A') !== count('B') ? count('A') < count('B') ? 'A' : 'B' : 'draw';
  return { ...s, result: { winner, scores, reason: localized('모두 같은 횟수의 차례를 마친 뒤 팀 점수로 정산합니다. 동점이면 구매 카드가 적은 팀이 승리합니다.', 'Tras igualar los turnos, gana la mayor puntuación de equipo. En empate gana quien compró menos cartas.') } };
}
function apply(s: FourSplendorState, p: FourSeat, action: GameAction): FourSplendorState {
  const error = valid(s, p, action); if (error) throw new Error(error);
  const after = splendorEngine.applyAction(project(s, p), 'p1', action);
  const records = Object.fromEntries(walletFields.map(key => [key, { ...s[key], [p]: after[key].p1 }])) as FourWallets;
  let next: FourSplendorState = { ...s, ...records, bank: after.bank, market: after.market, decks: after.decks, availableNobles: after.availableNobles, pendingNobles: after.pendingNobles, active: after.active === 'p1' ? p : nextFourSeat(p), result: null };
  // A still-eligible noble can visit after any action, including a later take/reserve turn.
  if (action.type !== 'chooseNoble' && !next.pendingNobles.length && next.nobles[p] === s.nobles[p]) {
    const eligible = Object.entries(next.availableNobles).filter(([, noble]) => colors.every(g => next.bonuses[p][g] >= (noble.requirement[g] ?? 0))).map(([id]) => id);
    if (eligible.length === 1) {
      const id = eligible[0];
      next = { ...next, nobles: { ...next.nobles, [p]: next.nobles[p] + next.availableNobles[id].points }, availableNobles: { ...next.availableNobles } };
      delete next.availableNobles[id];
    } else if (eligible.length > 1) next = { ...next, active: p, pendingNobles: eligible, turns: { ...next.turns, [p]: s.turns[p] } };
  }
  next.pendingEnd = s.pendingEnd || teamScore(next, 'A') >= 30 || teamScore(next, 'B') >= 30;
  return finish(next);
}
const gemText = (counts: Partial<Record<Gem | 'gold', number>>, locale: 'ko' | 'es') => Object.entries(counts).filter(([, count]) => count).map(([gem, count]) => `${colorNames[gem as Gem | 'gold'][locale]} ${count}`).join(' · ') || '0';
function cardView(card: SplendorCard): FourCard {
  return { id: card.id, title: localized(`${card.tier}단계 · ${card.points}점 · ${colorNames[card.bonus].ko}`, `Nivel ${card.tier} · ${card.points} pts · ${colorNames[card.bonus].es}`), detail: localized(`비용 ${gemText(card.cost, 'ko')}`, `Coste ${gemText(card.cost, 'es')}`), color: card.bonus, image: cardArt.get(card.id) };
}
function view(s: FourSplendorState, p: FourSeat): FourSplendorView {
  const economy = splendorEngine.getPlayerView(project(s, p), 'p1');
  const actions = economy.actions.map((choice: { label: ReturnType<typeof localized>; action: GameAction }) => {
    const { type, payload: x = {} } = choice.action;
    const returned = x.returnTokens as Partial<Record<Gem | 'gold', number>> | undefined;
    const returnLabel = localized(returned ? ` · 반환 ${gemText(returned, 'ko')}` : '', returned ? ` · Devolver ${gemText(returned, 'es')}` : '');
    if (type === 'take' || type === 'takeTwo') {
      const gained = type === 'take' ? Object.fromEntries((x.gems as Gem[]).map(gem => [gem, 1])) : { [String(x.gem)]: 2 };
      return { action: choice.action, label: localized(`보석 가져오기 · ${gemText(gained, 'ko')}${returnLabel.ko}`, `Tomar gemas · ${gemText(gained, 'es')}${returnLabel.es}`) };
    }
    if (type === 'reserve' && x.index === undefined) return { action: choice.action, label: localized(`${x.tier}단계 덱에서 비공개 예약${returnLabel.ko}`, `Reserva oculta del mazo de nivel ${x.tier}${returnLabel.es}`) };
    if ((type === 'buy' || type === 'reserve') && x.index !== undefined) {
      const card: SplendorCard = x.source === 'reserved' ? s.reserved[p][Number(x.index)] : s.market[Number(x.tier) as 1 | 2 | 3][Number(x.index)];
      const summary = cardView(card).title;
      return { action: choice.action, label: localized(`${type === 'buy' ? '구매' : '예약'} · ${summary.ko} · ${card.id}${x.returnTokens ? ` · 반환 ${gemText(x.returnTokens as Partial<Record<Gem | 'gold', number>>, 'ko')}` : ''}`, `${type === 'buy' ? 'Comprar' : 'Reservar'} · ${summary.es} · ${card.id}${x.returnTokens ? ` · Devolver ${gemText(x.returnTokens as Partial<Record<Gem | 'gold', number>>, 'es')}` : ''}`) };
    }
    if (type === 'chooseNoble') {
      const noble = s.availableNobles[String(x.id)];
      return { action: choice.action, label: localized(`귀족 선택 · ${gemText(noble.requirement, 'ko')}`, `Elegir noble · ${gemText(noble.requirement, 'es')}`) };
    }
    return choice;
  });
  const players = fourSeats.map(id => ({ id, score: points(s, id), count: s.reserved[id].length, tokens: { ...s.hands[id] }, bonuses: { ...s.bonuses[id] }, detail: localized(`보석 ${gemText(s.hands[id], 'ko')} / 보너스 ${gemText(s.bonuses[id], 'ko')} / 차례 ${s.turns[id]}`, `Gemas ${gemText(s.hands[id], 'es')} / Bonos ${gemText(s.bonuses[id], 'es')} / Turnos ${s.turns[id]}`) }));
  return { game: 'splendor', turn: s.active, phase: s.result ? 'finished' : s.pendingNobles.length ? 'chooseNoble' : 'action', players, hand: s.reserved[p].map(cardView), panels: [
    { id: 'bank', title: localized('공용 보석 은행', 'Reserva de gemas'), cards: Object.entries(s.bank).map(([gem, count]) => ({ id: gem, title: localized(`${colorNames[gem as Gem | 'gold'].ko} ${count}`, `${colorNames[gem as Gem | 'gold'].es} ${count}`), color: gem })) },
    ...([1, 2, 3] as const).map(tier => ({ id: `tier-${tier}`, title: localized(`${tier}단계 · 더미 ${s.decks[tier].length}장`, `Nivel ${tier} · Mazo ${s.decks[tier].length}`), cards: s.market[tier].map(cardView) })),
    { id: 'nobles', title: localized('공개 귀족', 'Nobles disponibles'), cards: Object.entries(s.availableNobles).map(([id, noble]) => ({ id, title: localized(`귀족 · ${noble.points}점`, `Noble · ${noble.points} pts`), detail: localized(`보너스 ${gemText(noble.requirement, 'ko')}`, `Bonos ${gemText(noble.requirement, 'es')}`), image: nobleArt.get(id) })) },
  ], actions: s.result ? [] : actions, result: s.result ? structuredClone(s.result) : null, economy,
    note: localized(`4인 기본 규칙 + 자체 2대2 팀 규칙: 개인 자원은 공유하지 않습니다. 팀 합계 30점 후 동일 차례 수로 종료합니다.${s.pendingEnd ? ' 마지막 한 바퀴입니다.' : ''}`, `Reglas de 4 jugadores + variante propia 2 contra 2: sin compartir recursos. Al llegar un equipo a 30 puntos se igualan los turnos.${s.pendingEnd ? ' Última ronda.' : ''}`),
  };
}
export const fourSplendorEngine: FourEngine = {
  id: 'splendor',
  createInitialState(seed): FourSplendorState {
    const base = splendorEngine.createInitialState(seed);
    const records = Object.fromEntries(walletFields.map(key => [key, Object.fromEntries(fourSeats.map(p => [p, structuredClone(base[key].p1)]))])) as FourWallets;
    const nobles = shuffle(splendorNobles.map((n, i) => ({ id: `n${i}`, ...n })), seededRandom(seed ^ 0x731f)).slice(0, 5);
    return { ...base, ...records, active: 'p1', bank: { white: 7, blue: 7, green: 7, red: 7, black: 7, gold: 5 }, availableNobles: Object.fromEntries(nobles.map(n => [n.id, { points: n.points, requirement: { ...n.requirement } }])), result: null };
  },
  validateAction: valid, applyAction: apply, getPlayerView: view,
  chooseAiAction(rawView, _player, random = Math.random) {
    if (rawView.result || !rawView.actions.length) return null;
    return chooseSimpleAiAction('splendor', (rawView as FourSplendorView).economy, 'p1', random);
  },
};
