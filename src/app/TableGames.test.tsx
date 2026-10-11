import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import splendorArt from '../../public/images/splendor/card-map.json';
import { deriveSplendorVisualEvent, splendorCardAction, splendorCardArtSrc, splendorCardCostPlan, splendorCardPaymentRows, splendorNobleArtSrc, splendorRequiredReturns, splendorReserveChoices, splendorTakeAction, splendorTotalAfterTake, TableGames } from './TableGames';
import { jaipurSalePreview } from './JaipurBoard';
import { splendorEngine } from '../games/splendor';

const render = (game: 'jaipur' | 'splendor' | 'davinci', view: any, language: 'ko' | 'es' = 'ko', playerId: 'p1' | 'p2' = 'p1') => renderToStaticMarkup(createElement(TableGames, { game, view, language, playerId, runAction: () => {} }));

describe('TableGames public-state interaction guidance', () => {
  it('counts a gold token once in the visible post-take total', () => {
    expect(splendorTotalAfterTake({ white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 1 }, 3, {})).toBe(4);
  });

  it('only requires a return tray when a take exceeds the ten-token cap', () => {
    expect(splendorRequiredReturns({ white: 8 }, 2)).toBe(0);
    expect(splendorRequiredReturns({ white: 9 }, 2)).toBe(1);
    expect(splendorRequiredReturns({ white: 10 }, 3)).toBe(3);
  });

  it('rebinds selected cards by stable ID and only uses exact legal take return plans', () => {
    const action = { label: { ko: '구매', es: 'Comprar' }, action: { type: 'buy', payload: { source: 'market', tier: 1, index: 1 } } };
    expect(splendorCardAction([action], 'market', 'selected', [{ id: 'other' }, { id: 'selected' }], 1)).toBe(action);
    expect(splendorCardAction([action], 'market', 'selected', [{ id: 'selected' }, { id: 'other' }], 1)).toBeUndefined();
    expect(splendorCardAction([action], 'market', 'gone', [{ id: 'other' }, { id: 'selected' }], 1)).toBeUndefined();

    const takeActions = [
      { label: { ko: '가져오기', es: 'Tomar' }, action: { type: 'take', payload: { gems: ['white', 'blue', 'green'], returnTokens: { white: 2 } } } },
      { label: { ko: '가져오기', es: 'Tomar' }, action: { type: 'take', payload: { gems: ['white', 'blue', 'green'], returnTokens: { blue: 2 } } } },
    ];
    expect(splendorTakeAction(takeActions, ['green', 'white', 'blue'], { blue: 2 })).toBe(takeActions[1]);
    expect(splendorTakeAction(takeActions, ['green', 'white', 'blue'], { red: 2 })).toBeUndefined();
  });

  it('previews each color discount and allocates gold in the engine payment order', () => {
    expect(splendorCardCostPlan({ cost: { white: 3, blue: 2 } }, { white: 1, blue: 0, gold: 2 }, { white: 1 })).toMatchObject({
      due: { white: 2, blue: 2 }, colored: { white: 1, blue: 0 }, gold: 3, goldByGem: { white: 1, blue: 1 }, deficit: 1,
    });
    expect(splendorCardPaymentRows({ cost: { white: 3, red: 2, blue: 0 } }, { white: 1, gold: 2 }, { white: 1 })).toEqual([
      { gem: 'white', cost: 3, discount: 1, paid: 1, gold: 1, short: 0 },
      { gem: 'red', cost: 2, discount: 0, paid: 0, gold: 1, short: 1 },
    ]);
  });

  it('keeps 10-token take plans, empty gold-bank reservations, slot limits, and rival turns on current legal actions', () => {
    const base = splendorEngine.createInitialState(91);
    const atTen = { ...base, hands: { ...base.hands, p1: { ...base.hands.p1, white: 10 } } };
    const tenActions = splendorEngine.getPlayerView(atTen, 'p1').actions;
    const take = tenActions.find((choice: any) => choice.action.type === 'take' && choice.action.payload.gems.length === 3);
    expect(take).toBeDefined();
    expect(splendorTakeAction(tenActions, take.action.payload.gems, { white: 3 })).toBeDefined();
    expect(splendorTakeAction(tenActions, take.action.payload.gems, { white: 2 })).toBeUndefined();

    const noGold = { ...base, bank: { ...base.bank, gold: 0 }, hands: { ...base.hands, p1: { ...base.hands.p1, white: 10 } } };
    const noGoldReservations = splendorEngine.getPlayerView(noGold, 'p1').actions.filter((choice: any) => choice.action.type === 'reserve');
    expect(noGoldReservations.length).toBeGreaterThan(0);
    expect(noGoldReservations.every((choice: any) => !choice.action.payload.returnTokens)).toBe(true);

    const goldReserveAtTen = { ...base, hands: { ...base.hands, p1: { ...base.hands.p1, white: 10 } } };
    const goldReserveActions = splendorEngine.getPlayerView(goldReserveAtTen, 'p1').actions.filter((choice: any) => choice.action.type === 'reserve');
    expect(goldReserveActions.length).toBeGreaterThan(0);
    expect(goldReserveActions.every((choice: any) => Object.values(choice.action.payload.returnTokens ?? {}).reduce((sum: number, count: any) => sum + Number(count), 0) === 1)).toBe(true);

    const fullReserve = { ...base, reserved: { ...base.reserved, p1: [...base.market[1].slice(0, 3)] } };
    const fullSlotActions = splendorEngine.getPlayerView(fullReserve, 'p1').actions;
    expect(fullSlotActions.some((choice: any) => choice.action.type === 'reserve')).toBe(false);
    expect(splendorReserveChoices(fullSlotActions, 3)).toEqual([]);
    expect(splendorTakeAction(splendorEngine.getPlayerView(base, 'p2').actions, ['white', 'blue', 'green'], {})).toBeUndefined();
    expect(splendorReserveChoices(splendorEngine.getPlayerView(base, 'p2').actions, 0)).toEqual([]);
  });

  it('keeps the classic table regions and every legal bank action in the rendered view', () => {
    const nobles = Object.fromEntries(['n0', 'n1', 'n2'].map((id, index) => [id, { points: 3, requirement: { white: index + 3 } }]));
    const html = render('splendor', {
      turn: 'p1', phase: 'action', ownHand: { tokens: {}, bonuses: {}, reserved: [], points: 0, nobles: 0 },
      board: {
        bank: { white: 4, blue: 4, green: 4, red: 4, black: 4, gold: 5 }, score: { p1: 0, p2: 0 },
        market: { 1: Array.from({ length: 4 }, (_, index) => ({ id: `m${index}`, tier: 1, bonus: 'blue', points: 0, cost: {} })), 2: [], 3: [] },
        nobles, reservedOpponentCount: 0,
      },
      actions: [
        { label: { ko: '보석', es: 'Gemas' }, action: { type: 'take', payload: { gems: ['white', 'blue', 'green'] } } },
        { label: { ko: '두 개', es: 'Dos' }, action: { type: 'takeTwo', payload: { gem: 'blue', returnTokens: {} } } },
        { label: { ko: '예약', es: 'Reservar' }, action: { type: 'reserve', payload: { tier: 1, index: undefined } } },
      ],
    }, 'es');

    expect(html).toContain('class="sp-nobles');
    expect(html).toContain('class="sp-gem-piles"');
    expect(html).toContain('class="sp-gem-pile sp-color-gold"');
    expect(html).toContain('aria-label="Tomar 2 gemas del mismo color: Azul"');
    expect(html).toContain('data-card-id="m0"');
    expect(html).toContain('data-source-zone="market"');
    expect(html).toContain('data-viewer="p1"');
    expect(html).toContain('data-version="0"');
    expect(html).not.toContain('sp-card-actions');
    expect(html).not.toContain('sp-button-buy');
    expect(html).toContain('class="sp-treasury"');
    expect(html).toContain('class="sp-reserved"');
  });

  it('labels private reserved faces, exposes only the rival public token total, and explains an empty bank', () => {
    const html = render('splendor', {
      turn: 'p1', ownHand: { tokens: {}, bonuses: {}, reserved: [{ id: 't1-01', tier: 1, bonus: 'white', points: 1, cost: { green: 4 } }], points: 0, nobles: 0 },
      board: { bank: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 }, score: { p1: 0, p2: 0 }, market: { 1: [], 2: [], 3: [] }, nobles: {}, reservedOpponentCount: 2 },
      opponentCount: 7, actions: [],
    }, 'es');

    expect(html).toContain('aria-label="Carta reservada de nivel 1');
    expect(html).toContain('class="sp-reserved-art" aria-hidden="true"');
    expect(html).toContain('Fichas rivales: 7');
    expect(html).toContain('No hay colores disponibles para elegir');
  });

  it('maps all 90 engine cards and 10 nobles to distinct original faces and renders by engine ID', () => {
    expect(splendorArt.cards).toHaveLength(90);
    expect(new Set(splendorArt.cards.map(card => card.engineId)).size).toBe(90);
    expect(new Set(splendorArt.cards.map(card => card.src)).size).toBe(90);
    expect(splendorArt.nobles).toHaveLength(10);
    expect(new Set(splendorArt.nobles.map(noble => noble.engineId)).size).toBe(10);
    expect(new Set(splendorArt.nobles.map(noble => noble.src)).size).toBe(10);
    expect(splendorArt.cards.every(card => existsSync(resolve(process.cwd(), 'public/images/splendor', card.src)))).toBe(true);
    expect(splendorArt.nobles.every(noble => existsSync(resolve(process.cwd(), 'public/images/splendor', noble.src)))).toBe(true);
    expect(splendorCardArtSrc('t1-01')).toBe('/images/splendor/cards/01.jpg');
    expect(splendorNobleArtSrc('n0')).toBe('/images/splendor/nobles/20001.jpg');

    const html = render('splendor', {
      turn: 'p1', ownHand: { tokens: {}, bonuses: {}, reserved: [], points: 0, nobles: 0 },
      board: {
        bank: {}, score: { p1: 0, p2: 0 }, market: { 1: [{ id: 't1-01', tier: 1, bonus: 'white', points: 1, cost: { green: 4 } }], 2: [], 3: [] },
        nobles: { n0: { points: 3, requirement: { white: 4 } } }, reservedOpponentCount: 0,
      }, actions: [],
    });
    expect(html).toContain('data-art-src="/images/splendor/cards/01.jpg"');
    expect(html).toContain('src="/images/splendor/cards/01.jpg"');
    expect(html).toContain('src="/images/splendor/nobles/20001.jpg"');
  });

  it('Jaipur previews only the face-up reward and shows the sale bonus reveal', () => {
    const html = render('jaipur', {
      turn: 'p1', ownHand: ['gold', 'gold', 'gold'],
      board: {
        round: 2, market: ['camel'], deckCount: 12,
        piles: { diamond: [], gold: [5, 999], silver: [], cloth: [], spice: [], leather: [] },
        tokens: { p1: 7, p2: 4 }, herdCounts: { p1: 2, p2: 1 }, roundsWon: { p1: 1, p2: 0 }, bonusTileCounts: { 3: 1, 4: 1, 5: 1 },
      },
      actions: [{ label: { ko: '판매', es: 'Vender' }, action: { type: 'sell', payload: { good: 'gold', count: 3 } } }],
    });

    expect(jaipurSalePreview('ko', 3, 5, true)).toContain('첫 토큰 5점');
    expect(jaipurSalePreview('ko', 3, 5, true)).toContain('보너스 타일 가치는 비공개');
    expect(html).not.toContain('999');
    expect(html).toContain('라운드 승리');
    expect(html).toContain('game-value');
  });

  it('Splendor shows illustrated market structure, exact deficit, one gold token, and the public final turn', () => {
    const html = render('splendor', {
      turn: 'p2', phase: 'action', ownHand: { tokens: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 1 }, bonuses: {}, reserved: [], points: 0, nobles: 0 },
      board: {
        bank: { white: 4, blue: 4, green: 4, red: 4, black: 4, gold: 5 },
        score: { p1: 15, p2: 8 }, turns: { p1: 9, p2: 8 }, opponentReserved: [{ id: 'opponent-secret-card-face' }],
        market: { 1: [{ id: 'card-a', bonus: 'red', points: 1, cost: { blue: 2 }, tier: 1 }], 2: [], 3: [] }, nobles: {}, reservedOpponentCount: 2,
      },
      actions: [],
    }, 'es');

    expect(html).toContain('Se alcanzaron 15 puntos. La otra persona tiene su último turno.');
    expect(html).toContain('costo 2 Azul');
    expect(html).toContain('Elige 3 colores distintos');
    expect(html).toContain('class="sp-card-art sp-color-red"');
    expect(html).toContain('>1</b> / 10');
    expect(html).toContain('>2 / 3</b>');
    expect(html).not.toContain('opponent-secret-card-face');
    expect(html).toContain('disabled=""');

    const choosingNoble = render('splendor', {
      turn: 'p1', phase: 'chooseNoble', ownHand: { tokens: {}, bonuses: {}, reserved: [], points: 0, nobles: 0 },
      board: { bank: {}, market: { 1: [], 2: [], 3: [] }, score: { p1: 2, p2: 0 }, nobles: { noble1: { points: 3, requirement: {} } } },
      actions: [{ label: { ko: '귀족 선택', es: 'Elegir noble' }, action: { type: 'chooseNoble', payload: { id: 'noble1' } } }],
    });
    expect(choosingNoble).toContain('class="sp-nobles is-choosing ');
    expect(choosingNoble).toContain('귀족을 선택하세요');
  });

  it('derives purchase, token, noble, turn and result feedback only from confirmed public snapshots', () => {
    const initial = {
      turn: 'p1', phase: 'action', result: null,
      board: {
        market: { 1: [{ id: 'm1', bonus: 'blue', points: 0, tier: 1 }], 2: [], 3: [] },
        nobles: { n0: { points: 3 }, n1: { points: 3 } },
        ownedNobles: { p1: 0, p2: 0 },
      },
      ownHand: { tokens: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 }, bonuses: {}, reserved: [], nobles: 0 },
    };
    const previous = { viewer: 'p1', view: initial };
    expect(deriveSplendorVisualEvent(null, initial, 'p1')).toBeNull();
    expect(deriveSplendorVisualEvent(previous, initial, 'p2')).toBeNull();

    const bought = {
      ...initial,
      board: { ...initial.board, market: { 1: [{ id: 'm2' }], 2: [], 3: [] } },
      ownHand: { ...initial.ownHand, bonuses: { blue: 1 } },
    };
    expect(deriveSplendorVisualEvent(previous, bought, 'p1')).toMatchObject({ kind: 'purchase', bonusGem: 'blue', marketArrivals: ['m2'], purchasedCard: { id: 'm1', bonus: 'blue', points: 0, tier: 1 } });
    const unmatchedBonus = { ...initial, ownHand: { ...initial.ownHand, bonuses: { blue: 1 } } };
    expect(deriveSplendorVisualEvent(previous, unmatchedBonus, 'p1')).not.toHaveProperty('purchasedCard');

    const tookGems = { ...initial, ownHand: { ...initial.ownHand, tokens: { ...initial.ownHand.tokens, gold: 1, blue: 2 } } };
    expect(deriveSplendorVisualEvent(previous, tookGems, 'p1')).toMatchObject({ kind: 'tokens', incomingTokens: ['blue', 'gold'], incomingCounts: { blue: 2, gold: 1 } });

    const tenWithGold = { ...initial, board: { ...initial.board, bank: { gold: 4 } }, ownHand: { ...initial.ownHand, tokens: { ...initial.ownHand.tokens, white: 9, gold: 1 } } };
    const goldReserved = { ...tenWithGold, ownHand: { ...tenWithGold.ownHand, reserved: [{ id: 'r1' }] } };
    expect(deriveSplendorVisualEvent({ viewer: 'p1', view: tenWithGold }, goldReserved, 'p1')).toMatchObject({
      kind: 'reserve', reserveGoldCount: 1, incomingCounts: { gold: 0 }, outgoingCounts: { gold: 1 },
    });
    const noGoldReserved = { ...goldReserved, board: { ...goldReserved.board, bank: { gold: 0 } } };
    expect(deriveSplendorVisualEvent({ viewer: 'p1', view: { ...tenWithGold, board: { ...tenWithGold.board, bank: { gold: 0 } } } }, noGoldReserved, 'p1')).not.toHaveProperty('reserveGoldCount');

    const nobleVisited = {
      ...initial,
      board: { ...initial.board, nobles: { n1: { points: 3 } } },
      ownHand: { ...initial.ownHand, nobles: 3 },
    };
    expect(deriveSplendorVisualEvent(previous, nobleVisited, 'p1')).toMatchObject({ kind: 'noble', nobleAwarded: true, nobleRecipient: 'you', nobleId: 'n0', noblePoints: 3 });

    const rivalNoble = { ...nobleVisited, ownHand: initial.ownHand, board: { ...nobleVisited.board, ownedNobles: { p1: 0, p2: 3 } } };
    expect(deriveSplendorVisualEvent(previous, rivalNoble, 'p1')).toMatchObject({ kind: 'noble', nobleRecipient: 'rival' });

    expect(deriveSplendorVisualEvent(previous, { ...initial, turn: 'p2' }, 'p1')).toMatchObject({ kind: 'turn', turnChanged: true });
    expect(deriveSplendorVisualEvent(previous, { ...initial, result: { winner: 'p1' } }, 'p1')).toMatchObject({ kind: 'result', result: 'win' });
  });

  it('announces the player whose move actually remains during a pending noble selection', () => {
    const view = {
      turn: 'p2', phase: 'chooseNoble', ownHand: { tokens: {}, bonuses: {}, reserved: [], points: 12, nobles: 3 },
      board: { bank: {}, market: { 1: [], 2: [], 3: [] }, score: { p1: 15, p2: 15 }, turns: { p1: 4, p2: 3 }, nobles: { n0: { points: 3, requirement: {} } } },
      actions: [{ label: { ko: '선택', es: 'Elegir' }, action: { type: 'chooseNoble', payload: { id: 'n0' } } }],
    };
    const html = render('splendor', view, 'es', 'p2');
    expect(html).toContain('Se alcanzaron 15 puntos. Este es el último turno.');
  });

  it('Da Vinci hides unrevealed values and keeps the guess button tied to a legal action', () => {
    const html = render('davinci', {
      turn: 'p1', phase: 'guess', hand: [{ color: 'white', value: 5, revealed: true }],
      board: { opponentTiles: [{ color: 'black', value: 11, revealed: false }, { color: 'white', value: 2, revealed: true }] },
      actions: [
        { label: { ko: '추측', es: 'Adivinar' }, action: { type: 'guess', payload: { index: 0, value: 4 } } },
        { label: { ko: '차례 마치기', es: 'Terminar turno' }, action: { type: 'stop' } },
      ],
    }, 'ko');

    expect(html).toContain('1번째 검정 타일 · 0 추측');
    expect(html).toContain('더미가 비었어요. 틀려도 새로 공개될 내 타일은 없고 차례가 끝나요.');
    expect(html).not.toContain('<b>11</b>');
    expect(html).toContain('dv-own-tile dv-tile-white is-revealed');
    expect(html).toContain('disabled=""');
  });

  it('marks each game result with an explicit outcome for its themed entrance', () => {
    const cases = [
      { game: 'jaipur' as const, winner: 'p1', outcome: 'win' },
      { game: 'splendor' as const, winner: 'p2', outcome: 'lose' },
      { game: 'davinci' as const, winner: 'draw', outcome: 'draw' },
    ];
    for (const item of cases) {
      const html = render(item.game, { turn: 'p1', board: {}, actions: [], result: { winner: item.winner, scores: { p1: 1, p2: 0 } } });
      expect(html).toContain(`data-game="${item.game}" data-outcome="${item.outcome}"`);
    }
  });
});
