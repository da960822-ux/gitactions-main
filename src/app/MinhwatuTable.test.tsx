import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { GameAction, GameResult, PlayerId } from '../core/types';
import { minhwatuEngine, scoreMinhwatuMatch, type MinhwatuCard } from '../games/minhwatu';
import { MinhwatuTable, minhwatuTargetAction, runWithActionLock } from './MinhwatuTable';

type PublicView = {
  ownHand: MinhwatuCard[];
  opponentCount: number;
  board: { table: MinhwatuCard[]; captures: Record<PlayerId, MinhwatuCard[]>; scores: Record<PlayerId, number>; deckCount: number; pendingCard: MinhwatuCard | null };
  result: GameResult | null;
  actions: Array<{ action: GameAction; label?: Record<'ko' | 'es', string> }>;
};

function markup(state: ReturnType<typeof minhwatuEngine.createInitialState>, playerId: 'p1' | 'p2' = 'p1') {
  const view = minhwatuEngine.getPlayerView(state, playerId) as PublicView;
  return { view, html: renderToStaticMarkup(createElement(MinhwatuTable, { view, playerId, language: 'ko', runAction: vi.fn() })) };
}

describe('MinhwatuTable public view', () => {
  it('shows one actionable cue and marks capturable cards with a symbol as well as color', () => {
    const state = minhwatuEngine.createInitialState(76), { html } = markup(state);
    expect(html.match(/>패를 고르세요</g)).toHaveLength(1);
    expect(html).not.toContain('내 차례');
    expect(html).not.toContain('금색 테두리 패는');
    const capturable = state.hands.p1.filter(card => state.table.some(other => other.month === card.month));
    expect(capturable.length).toBeGreaterThan(0);
    expect(html.match(/class="hwatu-hand-capture-marker"/g)).toHaveLength(capturable.length);
    expect(html).toContain('가져올 수 있음');
    const ownRack = html.slice(html.indexOf('aria-label="내가 모은 패'), html.indexOf('class="hwatu-hand-section'));
    expect(ownRack.match(/<li /g)).toHaveLength(8);
    for (const label of ['홍단', '청단', '초단', '고도리', '11월 완성', '5월 완성', '10월 완성', '12월 완성']) expect(ownRack).toContain(label);
  });

  it('blocks a second distinct click while an action is pending and releases the lock for retry', async () => {
    const lock = { current: false };
    const calls: string[] = [];
    let finishFirst!: (accepted: boolean) => void;
    const first = runWithActionLock(lock, () => {
      calls.push('play');
      return new Promise<boolean>(resolve => { finishFirst = resolve; });
    });
    const overlappingDifferentAction = runWithActionLock(lock, () => {
      calls.push('capture');
      return true;
    });

    expect(first).toBeDefined();
    expect(overlappingDifferentAction).toBeUndefined();
    expect(lock.current).toBe(true);
    await Promise.resolve();
    expect(calls).toEqual(['play']);

    finishFirst(false);
    await expect(first).resolves.toBe(false);
    expect(lock.current).toBe(false);

    const retry = runWithActionLock(lock, () => {
      calls.push('retry');
      return true;
    });
    expect(retry).toBeDefined();
    await expect(retry).resolves.toBe(true);
    expect(calls).toEqual(['play', 'retry']);
    expect(lock.current).toBe(false);
  });

  it('releases the action lock after synchronous throws and rejected promises', async () => {
    const lock = { current: false };
    const syncFailure = runWithActionLock(lock, () => { throw new Error('sync failure'); });
    expect(syncFailure).toBeDefined();
    await expect(syncFailure).rejects.toThrow('sync failure');
    expect(lock.current).toBe(false);

    const asyncFailure = runWithActionLock(lock, () => Promise.reject(new Error('async failure')));
    expect(asyncFailure).toBeDefined();
    await expect(asyncFailure).rejects.toThrow('async failure');
    expect(lock.current).toBe(false);

    const retry = runWithActionLock(lock, () => 'retried');
    expect(retry).toBeDefined();
    await expect(retry).resolves.toBe('retried');
    expect(lock.current).toBe(false);
  });

  it('shows the caller hand, auto-highlights capturable cards, and keeps opponent values private', () => {
    const state = minhwatuEngine.createInitialState(76);
    const opponentCard = state.hands.p2[0];
    const { view, html } = markup(state);
    const ownCard = state.hands.p1[0];

    expect(view.ownHand.map(card => card.id)).toContain(ownCard.id);
    expect(view.ownHand.map(card => card.id)).not.toContain(opponentCard.id);
    expect(view.opponentCount).toBe(state.hands.p2.length);
    expect(html).toContain('내 손패');
    expect(html).toContain('hwatu-opponent-fan');
    expect(html).toContain('data-hwatu-zone="opponent-hand"');
    expect(html).toContain('data-hwatu-zone="table"');
    expect(html).toContain('data-hwatu-zone="deck"');
    expect(html).toContain('hwatu-deck-back');
    expect(html).not.toContain('game-value-number');
    expect(html).toContain(`data-hwatu-card-id="${ownCard.id}"`);
    const capturableIds = state.hands.p1.filter(card => state.table.some(tableCard => tableCard.month === card.month)).map(card => card.id);
    for (const id of capturableIds) {
      const button = html.match(new RegExp(`<button[^>]*data-hwatu-card-id="${id}"[^>]*>`))?.[0];
      expect(button).toContain('is-capturable');
    }
    expect(html).not.toContain('hwatu-hand-choice is-match');
    expect(html).not.toContain('바닥 짝');
    expect(html).not.toContain('짝 선택');
    expect(html).not.toContain('class="gb-hwatu-table"');
    expect(html).not.toContain(`/images/hwatu/${opponentCard.id.split('-').map(part => part.padStart(2, '0')).join('-')}.svg`);
  });

  it('shows the real yaku score breakdown and public final result scores', () => {
    const state = minhwatuEngine.createInitialState(21);
    const november = [...state.hands.p1, ...state.hands.p2, ...state.table, ...state.deck].filter(card => card.month === 11);
    state.captures = { p1: november, p2: [] };
    state.phase = 'finished';
    state.result = { winner: 'p1', reason: 'test', scores: scoreMinhwatuMatch(state.captures) };
    const { view, html } = markup(state);

    expect(view.board.scores).toEqual({ p1: 100, p2: -40 });
    expect(view.result?.scores).toEqual({ p1: 100, p2: -40 });
    expect(html).toContain('기본 20 + 내 족보 40 × 2 − 상대 족보 0 = 100');
    expect(html).toContain('고도리');
    expect(html).toContain('<details class="hwatu-scoring"');
    expect(html).toContain('<span>고도리</span><b>0/3장</b>');
    expect(html).toContain('홍단');
    expect(html).toContain('나 100 : -40 상대');
    expect(html).toContain('이겼어요!');
  });

  it('places the completed result beside the scoreboard and removes empty-play hints', () => {
    const state = minhwatuEngine.createInitialState(91);
    const cards = [...state.hands.p1, ...state.hands.p2, ...state.table, ...state.deck];
    state.hands = { p1: [], p2: [] };
    state.table = [];
    state.deck = [];
    state.captures = { p1: cards.slice(0, 24), p2: cards.slice(24) };
    state.phase = 'finished';
    state.result = { winner: 'draw', reason: 'test', scores: scoreMinhwatuMatch(state.captures) };
    const { html } = markup(state);

    expect(html).toContain('정산 완료');
    expect(html).toContain('data-outcome="draw"');
    expect(html.indexOf('class="hwatu-seat-strip"')).toBeLessThan(html.indexOf('class="hwatu-result"'));
    expect(html.indexOf('class="hwatu-result"')).toBeLessThan(html.indexOf('class="hwatu-opponent-bar"'));
    expect(html).not.toContain('바닥이 비었어요. 손에서 한 장 내면 새 짝이 놓여요.');
    expect(html).not.toContain('차례가 끝나면 더미에서 한 장을 공개해요.');
    expect(html).not.toContain('data-hwatu-zone="draw"');
  });

  it('keeps available public actions and card art in history while filtering generic turn entries', () => {
    const state = minhwatuEngine.createInitialState(93);
    state.events = Array.from({ length: 8 }, (_, index) => ({
      sequence: index + 1,
      type: 'capture' as const,
      actor: index % 2 === 0 ? 'p1' as const : 'p2' as const,
      title: { ko: `공개 행동 ${index + 1}`, es: `Acción pública ${index + 1}` },
      cards: [state.table[index]],
      scoreChanges: { p1: index === 7 ? 5 : 0, p2: index === 7 ? -5 : 0 },
    }));
    state.events.push({ sequence: 9, type: 'turn', actor: 'p1', title: { ko: '다음 차례', es: 'Siguiente turno' } });
    const { html } = markup(state);

    expect(html).toContain('최근 행동 · 8');
    expect(html).toContain('공개 행동 8');
    expect(html).toContain('공개 행동 3');
    expect(html).toContain('공개 행동 2');
    const log = html.slice(html.indexOf('<details class="hwatu-action-log"'), html.indexOf('<details class="hwatu-scoring"'));
    expect(log).not.toContain('다음 차례');
    expect(log).toContain('hwatu-log-cards');
    expect(log).toContain('상대 획득: 공개 행동 8');
    for (const card of state.table) expect(log).toContain(`/images/hwatu/${card.id.split('-').map(part => part.padStart(2, '0')).join('-')}.svg`);
    for (const card of state.hands.p2) expect(log).not.toContain(`/images/hwatu/${card.id.split('-').map(part => part.padStart(2, '0')).join('-')}.svg`);
    expect(html).toContain('상대 -5');
  });

  it('marks the last capture of each seat and offers focusable inspection without exposing private hands', () => {
    const state = minhwatuEngine.createInitialState(98);
    const own = state.table.splice(0, 2), rival = state.table.splice(0, 2);
    state.captures = { p1: own, p2: rival };
    state.events = [
      { sequence: 1, type: 'capture', actor: 'p1', cards: own, title: { ko: '내 획득', es: 'Tu captura' } },
      { sequence: 2, type: 'capture', actor: 'p2', cards: rival, title: { ko: '상대 획득', es: 'Captura rival' } },
    ];
    for (const playerId of ['p1', 'p2'] as const) for (const language of ['ko', 'es'] as const) {
      const html = renderToStaticMarkup(createElement(MinhwatuTable, { view: minhwatuEngine.getPlayerView(state, playerId), playerId, language, runAction: vi.fn() }));
      const stage = html.slice(html.indexOf('class="hwatu-tabletop-stage"'), html.indexOf('<details class="hwatu-action-log"'));
      for (const card of [...own, ...rival]) {
        const button = stage.match(new RegExp(`<button[^>]*data-hwatu-card-id="${card.id}"[^>]*>`))?.[0];
        expect(button).toContain('hwatu-captured-card is-recent');
        expect(button).toContain(language === 'ko' ? '최근 획득' : 'Captura reciente');
        expect(button).toContain(language === 'ko' ? '크게 보기' : 'Ver más grande');
      }
      const other = playerId === 'p1' ? 'p2' : 'p1';
      for (const card of state.hands[other]) expect(html).not.toContain(`/images/hwatu/${card.id.split('-').map(part => part.padStart(2, '0')).join('-')}.svg`);
    }
  });

  it('keeps plain captures in ten-card rows at the 10, 11, 20, 21 and 24 boundaries', () => {
    for (const count of [10, 11, 20, 21, 24]) {
      const state = minhwatuEngine.createInitialState(104);
      const all = [...state.hands.p1, ...state.hands.p2, ...state.table, ...state.deck];
      const captured = all.filter(card => card.kind === 'plain').slice(0, count);
      const rest = all.filter(card => !captured.some(item => item.id === card.id));
      state.captures = { p1: captured, p2: [] };
      state.hands = { p1: rest.slice(0, 10), p2: rest.slice(10, 20) };
      state.table = rest.slice(20, 24); state.deck = rest.slice(24);
      for (const language of ['ko', 'es'] as const) {
        const html = renderToStaticMarkup(createElement(MinhwatuTable, { view: minhwatuEngine.getPlayerView(state, 'p1'), playerId: 'p1', language, runAction: vi.fn() }));
        const start = html.indexOf('data-hwatu-zone="captures-p1-plain"');
        const section = html.slice(start, html.indexOf('</section>', start));
        const rows = section.split('<div class="hwatu-capture-row">').slice(1).map(row => [...row.matchAll(/data-hwatu-card-id="([^"]+)"/g)].map(match => match[1]));
        expect(rows.map(row => row.length)).toEqual(Array.from({ length: Math.ceil(count / 10) }, (_, index) => Math.min(10, count - index * 10)));
        expect(rows.flat()).toEqual(captured.sort((a, b) => a.month - b.month || a.id.localeCompare(b.id)).map(card => card.id));
        expect(new Set(rows.flat()).size).toBe(count);
      }
    }
  });

  it('offers pending-draw captures only to the active player and does not leak their legal actions', () => {
    const state = minhwatuEngine.createInitialState(101);
    const month = 6;
    const cards = [...state.deck, ...state.table, ...state.hands.p1, ...state.hands.p2].filter(card => card.month === month);
    state.pending = { card: cards[0] };
    state.table = cards.slice(1, 3);
    state.phase = 'capture-draw';
    state.turn = 'p1';

    const active = markup(state, 'p1');
    const waiting = markup(state, 'p2');
    expect(active.view.actions.map(option => option.action)).toEqual([
      { type: 'capture', payload: { targetIndex: 0 } },
      { type: 'capture', payload: { targetIndex: 1 } },
    ]);
    expect(active.html).toContain('hwatu-table-card is-legal is-target');
    expect(active.html.match(/class="hwatu-table-card is-legal is-target"/g)).toHaveLength(2);
    expect(active.html.match(/>바닥 패를 고르세요</g)).toHaveLength(1);
    expect(active.html).not.toContain('바닥에서 같은 달 패를 선택하세요.');
    expect(active.html).not.toContain('is-match');
    expect(waiting.view.actions).toEqual([]);
    expect(waiting.html).toContain('상대 차례');
    expect(waiting.html).not.toContain('hwatu-table-card is-legal');
    expect(waiting.html).toContain('disabled=""');
    expect(minhwatuTargetAction(active.view.actions, 0, -1, true)?.action).toEqual({ type: 'capture', payload: { targetIndex: 0 } });
    expect(minhwatuTargetAction(waiting.view.actions, 0, -1, true)).toBeUndefined();
  });

  it('keeps table cards in engine order without month groups, shows capture counts, and hides the stock face', () => {
    const state = minhwatuEngine.createInitialState(302);
    state.captures.p1 = state.deck.slice(0, 3);
    state.deck = state.deck.slice(3);
    const { html } = markup(state);

    expect(html).toContain('바닥 패');
    const tableMarkup = html.slice(html.indexOf('data-hwatu-zone="table"'), html.indexOf('data-hwatu-zone="draw"'));
    const tableIds = [...tableMarkup.matchAll(/data-hwatu-card-id="([^"]+)"/g)].map(match => match[1]);
    expect(tableIds).toEqual(state.table.map(card => card.id));
    expect(html).not.toContain('hwatu-month-group');
    expect(html).not.toContain('hwatu-month-tab');
    expect(html).toContain('data-hwatu-zone="captures-p1-bright"');
    expect(html).toContain('data-hwatu-zone="captures-p2-plain"');
    expect(html).toContain('hwatu-category-pile kind-bright');
    expect(html).toContain('hwatu-category-pile kind-animal');
    expect(html).toContain('hwatu-category-pile kind-ribbon');
    expect(html).toContain('hwatu-category-pile kind-plain');
    expect(html).toContain('hwatu-captured-card');
    expect(html).not.toContain('hwatu-capture-landing');
    expect(html).not.toContain('hwatu-category-summary');
    expect(html).not.toContain('hwatu-capture-inspection');
    for (const card of state.captures.p1) expect(html.match(new RegExp(`data-hwatu-card-id="${card.id}"`, 'g'))).toHaveLength(1);
    expect(html).not.toContain('tabindex="0"');
    expect(html).toContain('class="hwatu-deck-back"');
    expect(html).not.toContain(`/images/hwatu/${state.deck[0].id.split('-').map(part => part.padStart(2, '0')).join('-')}.svg`);
  });

  it('binds duplicate-month table targets to the engine-provided play action', () => {
    let found: { view: PublicView; action: GameAction } | undefined;
    for (let seed = 1; seed <= 80 && !found; seed++) {
      const state = minhwatuEngine.createInitialState(seed);
      const view = minhwatuEngine.getPlayerView(state, 'p1') as PublicView;
      const action = view.actions.find(option => option.action.type === 'play' && option.action.payload?.targetIndex !== undefined)?.action;
      if (action) found = { view, action };
    }
    expect(found).toBeTruthy();
    const payload = found!.action.payload!;
    const mapped = minhwatuTargetAction(found!.view.actions, Number(payload.targetIndex), Number(payload.index), false);
    expect(mapped?.action).toEqual(found!.action);
    expect(minhwatuTargetAction(found!.view.actions, Number(payload.targetIndex) + 20, Number(payload.index), false)).toBeUndefined();
  });

  it('renders the authoritative public event stage and both yaku breakdowns', () => {
    let state = minhwatuEngine.createInitialState(83);
    const initial = minhwatuEngine.getPlayerView(state, 'p1');
    const action = initial.actions[0].action;
    state = minhwatuEngine.applyAction(state, 'p1', action);
    const view = minhwatuEngine.getPlayerView(state, 'p1');
    const html = renderToStaticMarkup(createElement(MinhwatuTable, { view, playerId: 'p1', language: 'es', runAction: vi.fn() }));
    expect(view.board.actionLog.length).toBeGreaterThan(0);
    expect(html).toContain('data-hwatu-motion');
    expect(html).toContain(view.log.at(-1).title.es);
    expect(html).toContain('data-hwatu-zone="score-p1"');
    expect(html).toContain('data-hwatu-zone="score-p2"');
    expect(html).toContain('× 2');
    expect(html).toContain('Godori');
  });

  it('shows Godori progress and the 50-point completion bonus', () => {
    const state = minhwatuEngine.createInitialState(87);
    const all = [...state.hands.p1, ...state.hands.p2, ...state.table, ...state.deck];
    const birds = ['2-1', '4-1', '8-2'].map(id => all.find(card => card.id === id)!);
    state.captures = { p1: birds.slice(0, 2), p2: [] };
    const partial = markup(state).html;
    expect(partial).toContain('<span>고도리</span><b>2/3장</b>');
    expect(partial).not.toContain('3장 완성 · 추가 점수 없음');
    state.captures.p1 = birds;
    const complete = markup(state).html;
    expect(complete).toContain('<span>고도리</span><b>+50 점</b>');
    expect(complete).toContain('고도리 3장을 모으면 50점 보너스예요.');
  });

  it('describes the rival score formula from the viewer’s perspective in Spanish', () => {
    const state = minhwatuEngine.createInitialState(89);
    const all = [...state.hands.p1, ...state.hands.p2, ...state.table, ...state.deck];
    state.captures = { p1: ['1-2', '2-2', '3-2'].map(id => all.find(card => card.id === id)!), p2: [] };
    const view = minhwatuEngine.getPlayerView(state, 'p1');
    const html = renderToStaticMarkup(createElement(MinhwatuTable, { view, playerId: 'p1', language: 'es', runAction: vi.fn() }));
    expect(html).toContain('Base rival 0 + yakus del rival 0 × 2 − tus yakus 30 = -30');
  });

  it('shows the named final formula from p2 perspective and the two-person replay wait state', () => {
    const state = minhwatuEngine.createInitialState(89);
    const all = [...state.hands.p1, ...state.hands.p2, ...state.table, ...state.deck];
    state.captures = { p1: ['1-2', '2-2', '3-2'].map(id => all.find(card => card.id === id)!), p2: [] };
    state.phase = 'finished';
    state.result = { winner: 'p1', reason: 'test', scores: scoreMinhwatuMatch(state.captures) };
    const view = minhwatuEngine.getPlayerView(state, 'p2');
    const html = renderToStaticMarkup(createElement(MinhwatuTable, { view, playerId: 'p2', language: 'es', playerNames: { p1: 'Luz', p2: 'Sol' }, runAction: vi.fn(), onReplay: vi.fn(), replayPending: true }));
    expect(html).toContain('Sol -30 : 75 Luz');
    expect(html).toContain('Tus puntos 0 + tus yakus 0 × 2 − yakus rivales 30 = -30');
    expect(html).toContain('Aceptar y jugar otra');
    expect(html).toContain('La otra persona propone otra partida.');
  });
  it('offers a direct AI rematch without another player consent copy', () => {
    const state = minhwatuEngine.createInitialState(89);
    state.phase = 'finished';state.result = { winner: 'p1', reason: 'test', scores: { p1: 10, p2: 5 } };
    const view = minhwatuEngine.getPlayerView(state, 'p1');
    const html = renderToStaticMarkup(createElement(MinhwatuTable, { view, playerId: 'p1', language: 'ko', runAction: vi.fn(), onReplay: vi.fn(), requiresAgreement: false }));
    expect(html).toContain('>다시 하기</button>');
    expect(html).not.toContain('한 판 더 요청');
    expect(html).not.toContain('동의 대기');
  });

  it('keeps every captured face visible in its category bank with all combination counters for either viewer and language', () => {
    const state = minhwatuEngine.createInitialState(174);
    state.captures = { p1: state.deck.slice(0, 5), p2: state.deck.slice(5, 10) };
    state.deck = state.deck.slice(10);
    for (const playerId of ['p1', 'p2'] as const) for (const language of ['ko', 'es'] as const) {
      const view = minhwatuEngine.getPlayerView(state, playerId);
      const html = renderToStaticMarkup(createElement(MinhwatuTable, { view, playerId, language, playerNames: { p1: '연석', p2: 'Lisbeth' }, runAction: vi.fn() }));
      const stage = html.slice(html.indexOf('class="hwatu-tabletop-stage"'), html.indexOf('<details class="hwatu-action-log"'));
      expect(stage).toContain('data-seat="p1"');
      expect(stage).toContain('data-seat="p2"');
      expect(stage.match(/class="hwatu-rail-progress"/g)).toHaveLength(2);
      expect(stage.match(/class="hwatu-player-name"/g)).toHaveLength(2);
      expect(stage).toContain('연석');
      expect(stage).toContain('Lisbeth');
      for (const seat of ['p1', 'p2'] as const) {
        for (const yaku of view.board.breakdown[seat].yakus) expect(stage).toContain(yaku.label[language]);
      }
      expect(stage.match(/class="hwatu-category-heading"/g)).toHaveLength(8);
      expect(stage).not.toContain('hwatu-capture-landing');
      expect(stage).not.toContain('hwatu-category-summary');
      expect(stage).not.toContain('hwatu-capture-inspection');
      for (const seat of ['p1', 'p2'] as const) {
        const rackStart = stage.indexOf(`data-seat="${seat}"`);
        const rackEnd = stage.indexOf('</aside>', rackStart);
        const rack = stage.slice(rackStart, rackEnd);
        for (const card of state.captures[seat]) {
          expect(rack.match(new RegExp(`data-hwatu-card-id="${card.id}"`, 'g'))).toHaveLength(1);
          expect(rack).toContain(`/images/hwatu/${card.id.split('-').map(part => part.padStart(2, '0')).join('-')}.svg`);
          const categoryStart = stage.indexOf(`data-hwatu-zone="captures-${seat}-${card.kind}"`);
          const categoryEnd = stage.indexOf('</section>', categoryStart);
          const category = stage.slice(categoryStart, categoryEnd);
          expect(category.match(new RegExp(`data-hwatu-card-id="${card.id}"`, 'g'))).toHaveLength(1);
        }
        for (const kind of ['bright', 'animal', 'ribbon', 'plain'] as const) {
          const categoryStart = stage.indexOf(`data-hwatu-zone="captures-${seat}-${kind}"`);
          const categoryEnd = stage.indexOf('</section>', categoryStart);
          const category = stage.slice(categoryStart, categoryEnd);
          const ids = [...category.matchAll(/data-hwatu-card-id="([^"]+)"/g)].map(match => match[1]);
          const expected = state.captures[seat].filter(card => card.kind === kind).sort((a, b) => a.month - b.month || a.id.localeCompare(b.id)).map(card => card.id);
          expect(ids).toEqual(expected);
        }
      }
      const rivalRack = stage.indexOf(`data-seat="${playerId === 'p1' ? 'p2' : 'p1'}"`);
      const center = stage.indexOf('class="hwatu-play-center"');
      const ownRack = stage.indexOf(`data-seat="${playerId}"`, center);
      const handPosition = stage.indexOf('class="hwatu-hand-section');
      expect(rivalRack).toBeLessThan(center);
      expect(center).toBeLessThan(ownRack);
      expect(ownRack).toBeLessThan(handPosition);
      const hand = stage.slice(stage.indexOf('data-hwatu-zone="hand"'), stage.indexOf('class="hwatu-hand-actions"'));
      const ids = [...hand.matchAll(/data-hwatu-card-id="([^"]+)"/g)].map(match => match[1]);
      expect(ids).toEqual(state.hands[playerId].map(card => card.id));
      expect(stage).toContain('class="hwatu-event-overlay"');
      expect(stage).toContain('class="hwatu-hand-actions"');
    }
  });

  it('allocates compact two-row geometry for fourteen public cards and bounded geometry for a dense field without regrouping identities', () => {
    const state = minhwatuEngine.createInitialState(94);
    const all = [...state.hands.p1, ...state.hands.p2, ...state.table, ...state.deck];
    for (const [count, columns, width] of [[8, 4, 58], [14, 7, 56], [18, 6, 42], [36, 12, 42], [48, 12, 36]]) {
      // These larger public views stress layout; they do not introduce another game rule.
      const view = { ...minhwatuEngine.getPlayerView(state, 'p1'), board: { ...minhwatuEngine.getPlayerView(state, 'p1').board, table: all.slice(0, count) } };
      const html = renderToStaticMarkup(createElement(MinhwatuTable, { view, playerId: 'p1', language: 'es', runAction: vi.fn() }));
      expect(html).toContain(`--hw-field-columns:${columns}`);
      expect(html).toContain(`--hw-field-card-width:${width}px`);
      const field = html.slice(html.indexOf('data-hwatu-zone="table"'), html.indexOf('data-hwatu-zone="draw"'));
      const ids = [...field.matchAll(/data-hwatu-card-id="([^"]+)"/g)].map(match => match[1]);
      expect(ids).toEqual(all.slice(0, count).map(card => card.id));
      const opponent = html.slice(html.indexOf('class="hwatu-opponent-bar"'), html.indexOf('class="hwatu-felt"'));
      expect(opponent).toContain('class="hwatu-event-overlay"');
      expect(field).not.toContain('data-hwatu-motion');
    }
  });

});
