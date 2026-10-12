import { afterEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { bindApi, catchmindEnterSubmits, CatchmindChatComposer, GameGuide, Room, RulesDialog, rulesButtonLabel, SameGameReplay, sameGameReplayAvailable, statusLabel } from './PlayApp';
import { getBeginnerGuide } from './beginner-guides';
import { ActionFlightGuard, announcementForContext, cueForAction, GameFeedback, jaipurImmediateCues, publicViewAnnouncement, publicViewCue } from './GameFeedback';
import { gameCatalog } from '../games/catalog';
import { marbleLegacyRules } from '../games/rules';
import { ReactionPanel } from './ReactionPanel';
import { client, isOnlineConfigured } from '../core/client';

vi.mock('./App', () => ({ BrandHeader: () => null }));

afterEach(async () => { if (!isOnlineConfigured) await client.closeRoom(); });

it('announces a settled round instead of an inactive player turn', () => {
  const settled = { phase: 'round-over', turn: 'p2', result: null };
  expect(statusLabel(settled, 'p1', 'ko')).toBe('라운드 정산');
  expect(statusLabel(settled, 'p1', 'es')).toBe('Fin de ronda');
  expect(statusLabel({ ...settled, result: { winner: 'p1' } }, 'p1', 'es')).toBe('Partida terminada');
  expect(statusLabel({ phase: 'play', turn: 'p1' }, 'p1', 'ko')).toBe('내 차례예요');
});

it('does not invent an opponent turn for the independent rhythm player in either locale', () => {
  expect(statusLabel(null, 'p1', 'ko', 'rhythm')).toBe('원작 플레이어');
  expect(statusLabel(null, 'p2', 'es', 'rhythm')).toBe('Juego original');
});

it('keeps Jaipur transfer and reward sounds out of the immediate snapshot channel', () => {
  for (const type of ['take-single', 'exchange', 'take-camels', 'bonus'] as const) {
    expect(jaipurImmediateCues({ sequence: 1, round: 1, type, title: { ko: '', es: '' } })).toEqual([]);
  }
  expect(jaipurImmediateCues({ sequence: 1, round: 1, type: 'sale', title: { ko: '', es: '' } })).toEqual(['sell']);
  expect(jaipurImmediateCues({ sequence: 1, round: 1, type: 'market-refill', title: { ko: '', es: '' } })).toEqual(['draw']);
});

describe('PlayApp client binding', () => {
  it.skipIf(isOnlineConfigured)('keeps prototype methods callable through the loaded API and starts an agreed game', async () => {
    const api = bindApi({ client, isOnlineConfigured });
    const roomId = await api.createRoom('Integration test', 'ko');

    expect(roomId).toBeTruthy();
    expect(api.getSnapshot().roomId).toBe(roomId);
    api.localSeat('p2');
    await api.selectGame('davinci');
    api.localSeat('p1');
    await api.selectGame('davinci');

    expect(api.getSnapshot().gameId).toBe('davinci');
    expect(api.getSnapshot().view).toBeTruthy();
  });

  it.skipIf(isOnlineConfigured)('keeps a terminal Domino result until both seats consent to a fresh game', async () => {
    const api = bindApi({ client, isOnlineConfigured });
    await api.createRoom('Replay consent test', 'ko');
    api.localSeat('p2');
    await api.selectGame('domino');
    api.localSeat('p1');
    await api.selectGame('domino');

    let snapshot = api.getSnapshot();
    for (let step = 0; step < 80 && !snapshot.view?.result; step += 1) {
      const seat = snapshot.view?.turn as 'p1' | 'p2';
      api.localSeat(seat);
      snapshot = api.getSnapshot();
      const action = snapshot.view?.actions?.find((item: any) => ['play', 'pass'].includes(item.action.type))?.action;
      expect(action, `expected a legal Domino action at step ${step}`).toBeTruthy();
      await api.sendAction(action);
      snapshot = api.getSnapshot();
    }

    expect(snapshot.view?.phase).toBe('finished');
    expect(snapshot.view?.result).toBeTruthy();
    const finishedVersion = snapshot.version;
    const previousStorage = globalThis.localStorage;
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
    try {
      const html = renderToStaticMarkup(createElement(Room, { api, roomId: snapshot.roomId! }));
      expect(html.match(/class="button button-dark same-game-replay-button"/g)).toHaveLength(1);
      expect(html).not.toContain('class="match-replay"');
    } finally {
      vi.stubGlobal('localStorage', previousStorage);
    }
    api.localSeat('p1');
    await api.selectGame('domino');
    snapshot = api.getSnapshot();
    expect(snapshot.pendingGame).toBe('domino');
    expect(snapshot.version).toBe(finishedVersion);
    expect(snapshot.view?.result).toBeTruthy();

    api.localSeat('p2');
    await api.selectGame('domino');
    snapshot = api.getSnapshot();
    expect(snapshot.pendingGame).toBeNull();
    expect(snapshot.version).toBe(finishedVersion + 1);
    expect(snapshot.view?.phase).toBe('play');
    expect(snapshot.view?.result).toBeNull();
    expect(snapshot.view?.hand).toHaveLength(7);
    expect(snapshot.view?.board?.revealedHands).toBeUndefined();
  });
});

describe('same-game replay availability', () => {
  it('appears only for finished Domino, Jaipur, and Splendor results', () => {
    for (const gameId of ['domino', 'jaipur', 'splendor'] as const) {
      expect(sameGameReplayAvailable(gameId, { phase: 'finished', status: 'finished', result: { winner: 'p1' } })).toBe(true);
    }
    expect(sameGameReplayAvailable('domino', { phase: 'round-over', status: 'round-over', result: null })).toBe(false);
    expect(sameGameReplayAvailable('domino', { phase: 'finished', status: 'finished', result: null })).toBe(false);
    expect(sameGameReplayAvailable('minhwatu', { phase: 'finished', status: 'finished', result: { winner: 'p1' } })).toBe(false);
    expect(sameGameReplayAvailable('davinci', { phase: 'finished', status: 'finished', result: { winner: 'p1' } })).toBe(false);
  });

  it('keeps a pending replay button available to the consenting seat with localized accessible names', () => {
    const props = { gameId: 'domino' as const, pendingGame: 'domino' as const, onReplay: async () => true };
    const ko = renderToStaticMarkup(createElement(SameGameReplay, { ...props, language: 'ko' }));
    const es = renderToStaticMarkup(createElement(SameGameReplay, { ...props, language: 'es' }));
    expect(ko).toContain('class="button button-dark same-game-replay-button"');
    expect(ko).toContain('aria-label="같은 게임 다시 하기"');
    expect(ko).toContain('새 판 요청이 있어요. 두 사람 모두 동의하면 시작돼요.');
    expect(ko).not.toContain('disabled=""');
    expect(es).toContain('aria-label="Jugar otra vez"');
    expect(es).toContain('Hay una solicitud de nueva partida. Empieza cuando ambas personas acepten.');
  });
});

describe('inline game guide', () => {
  it('uses current assets and economy for a new-game guide while keeping saved rooms versioned', () => {
    for (const language of ['ko', 'es'] as const) {
      const fresh = renderToStaticMarkup(createElement(GameGuide, { gameId: 'marble', language }));
      expect(fresh).toContain('/images/marble/premium/cities/gwangju-chosun-university.webp');
      expect(fresh).toContain(language === 'ko' ? '첫 건설 40' : 'primera mejora 40');
      const saved = renderToStaticMarkup(createElement(GameGuide, { gameId: 'marble', language, marbleVersion: 2 }));
      expect(saved).toContain('/images/marble/landmarks/gwangju.svg');
      expect(saved).toContain(language === 'ko' ? '첫 건설 100' : 'primera mejora 100');
      expect(saved).not.toContain('premium/cities/gwangju');
    }
  });
  it('offers the same concise illustrated introduction before and during the three upgraded games', () => {
    for (const gameId of ['davinci', 'catchmind', 'marble'] as const) for (const language of ['ko', 'es'] as const) {
      const quick = getBeginnerGuide(gameId, language)!;
      const inline = renderToStaticMarkup(createElement(GameGuide, { gameId, language, marbleVersion: 2, marbleEconomyVersion: 2, marbleCityRouteVersion: 3 }));
      const dialog = renderToStaticMarkup(createElement(RulesDialog, { gameId, language, onClose: () => {} }));
      for (const html of [inline, dialog]) {
        expect(html).toContain(quick.goal);
        if (gameId === 'marble') { expect(html).toContain('/images/marble/premium/buildings/stage1-house.webp'); expect(html).toContain('/images/marble/premium/cities/gwangju-chosun-university.webp'); }
        else expect(html).toContain(`/images/guides/${gameId}-${language}.webp`);
        expect(html).toContain(language === 'es' ? 'lang="es-DO"' : 'lang="ko"');
        expect(html).toContain('<details class="guide-details">');
        expect(html).not.toContain('<details open');
      }
    }
  });

  it('leaves the other five games on their existing instructions', () => {
    for (const gameId of ['domino', 'jaipur', 'splendor', 'minhwatu', 'rhythm'] as const) {
      expect(getBeginnerGuide(gameId, 'ko')).toBeNull();
      const html = renderToStaticMarkup(createElement(GameGuide, { gameId, language: 'es' }));
      expect(html).not.toContain('beginner-guide');
      expect(html).not.toContain('/images/guides/');
    }
  });

  it('keeps saved Marble cost and credit rules out of the current tutorial', () => {
    expect(getBeginnerGuide('marble', 'ko', { marbleVersion: 1 })!.tip).toContain('18칸');
    expect(getBeginnerGuide('marble', 'es', { marbleEconomyVersion: 0 })!.tip).toContain('no tiene préstamos');
    expect(getBeginnerGuide('marble', 'ko', { marbleEconomyVersion: 1 })!.tip).toContain('100');
    expect(getBeginnerGuide('marble', 'ko', { marbleEconomyVersion: 1 })!.steps[1].body).toContain('첫 건설 100');
    expect(getBeginnerGuide('marble', 'es', { marbleEconomyVersion: 0 })!.steps[1].body).toContain('construir primero cuesta 100');
    expect(getBeginnerGuide('marble', 'es', { marbleEconomyVersion: 2 })!.tip).toContain('40');
  });

  it('renders complete localized instructions for all eight games', () => {
    for (const game of gameCatalog) {
      const ko = renderToStaticMarkup(createElement(GameGuide, { gameId: game.id, language: 'ko' }));
      const es = renderToStaticMarkup(createElement(GameGuide, { gameId: game.id, language: 'es' }));
      expect(ko).toContain('id="game-guide"');
      expect(ko).toContain(game.title.ko);
      expect(es).toContain(game.title.es);
      for (const markup of [ko, es]) {
        if (game.id === 'minhwatu') {
          expect((markup.match(/<li>/g) ?? []).length).toBe(3);
          expect(markup).toContain('minhwatu-match-grid');
          expect(markup).toContain('/images/hwatu/01-01.svg');
          expect(markup).toContain('minhwatu-guide-details');
        } else expect((markup.match(/<li>/g) ?? []).length).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('labels the manual anchor in Korean and Dominican Spanish', () => {
    expect(rulesButtonLabel('ko')).toBe('게임 방법 ↓');
    expect(rulesButtonLabel('es')).toBe('Cómo jugar ↓');
  });

  it('shows three illustrated steps first and keeps detailed rules collapsed in both languages', () => {
    for (const gameId of ['domino', 'jaipur', 'splendor'] as const) {
      for (const language of ['ko', 'es'] as const) {
        const markup = renderToStaticMarkup(createElement(GameGuide, { gameId, language, dominoRulesVersion: 1 }));
        expect((markup.match(/<figure class="quick-guide-image"/g) ?? []).length).toBe(3);
        expect(markup).toContain('<details class="guide-details">');
        expect(markup.indexOf('quick-guide-steps')).toBeLessThan(markup.indexOf('guide-details'));
      }
    }
  });

  it('uses the localized 18-space Marble guide only for legacy version 1', () => {
    for (const language of ['ko', 'es'] as const) {
      const legacy = renderToStaticMarkup(createElement(GameGuide, { gameId: 'marble', language, marbleVersion: 1 }));
      const current = renderToStaticMarkup(createElement(GameGuide, { gameId: 'marble', language, marbleVersion: 2 }));
      expect(legacy).toContain(marbleLegacyRules[language][0]);
      expect(legacy).not.toContain('40칸');
      expect(current).not.toContain(marbleLegacyRules[language][0]);
    }
  });
});

describe('shared game feedback', () => {
  it('never displays a pending announcement from another game or seat', () => {
    const value = { gameId: 'marble' as const, playerId: 'p1' as const, message: 'La partida terminó.' };
    expect(announcementForContext(value, 'marble', 'p1')).toBe('La partida terminó.');
    expect(announcementForContext(value, 'jaipur', 'p1')).toBe('');
    expect(announcementForContext(value, 'marble', 'p2')).toBe('');
    expect(announcementForContext(null, 'marble', 'p1')).toBe('');
  });

  it('blocks an identical in-flight action while allowing the next distinct choice', () => {
    const guard = new ActionFlightGuard();
    const first = { type: 'play', payload: { index: 2, side: 'left' } };
    expect(guard.begin(first)).toBe(true);
    expect(guard.begin(first)).toBe(false);
    expect(guard.begin({ type: 'play', payload: { index: 2, side: 'right' } })).toBe(true);
    expect(guard.size).toBe(2);
    guard.finish(first);
    expect(guard.size).toBe(1);
    expect(guard.begin(first)).toBe(true);
  });

  it('maps confirmed actions to contextual cues and leaves drawings and guesses quiet', () => {
    expect(cueForAction('catchmind', { type: 'draw', payload: { strokes: [] } })).toBeNull();
    expect(cueForAction('catchmind', { type: 'guess', payload: { text: 'answer' } })).toBeNull();
    expect(cueForAction('davinci', { type: 'draw' })).toBeNull();
    expect(cueForAction('davinci', { type: 'skip-draw' })).toBeNull();
    expect(cueForAction('davinci', { type: 'guess', payload: { index: 1, value: 4 } })).toBeNull();
    expect(cueForAction('davinci', { type: 'stop' })).toBeNull();
    expect(cueForAction('domino', { type: 'play', payload: { index: 0, side: 'left' } })).toBeNull();
    expect(cueForAction('domino', { type: 'pass' })).toBeNull();
    expect(cueForAction('marble', { type: 'attempt-doubles' })).toBeNull();
    expect(cueForAction('marble', { type: 'choose-train', payload: { destination: 4 } })).toBeNull();
    expect(cueForAction('marble', { type: 'roll' })).toBeNull();
    expect(cueForAction('jaipur', { type: 'take', payload: { mode: 'single' } })).toBeNull();
    expect(cueForAction('splendor', { type: 'takeTwo', payload: { gem: 'blue' } })).toBe('select');
    expect(cueForAction('splendor', { type: 'chooseNoble', payload: { id: 'n1' } })).toBeNull();
    expect(cueForAction('minhwatu', { type: 'play', payload: { index: 0 } })).toBeNull();
    expect(cueForAction('minhwatu', { type: 'capture', payload: { index: 0 } })).toBeNull();
    expect(cueForAction('rhythm', { type: 'play' })).toBeNull();
  });

  it('uses only new authoritative Da Vinci events for draw, guess result, stop, and turn cues', () => {
    const empty = { turn: 'p1', hand: [{ revealed: false }], board: { opponentTiles: [{ revealed: false }], lastEvent: null } };
    const event = (sequence: number, type: string, actor = 'p1', extra = {}) => ({ sequence, type, actor, ...extra });
    const correct = { ...empty, board: { ...empty.board, opponentTiles: [{ revealed: true }], lastEvent: event(1, 'correct-guess', 'p1', { targetIndex: 0, guess: 4 }) } };
    const wrong = { ...empty, turn: 'p2', board: { ...empty.board, lastEvent: event(1, 'wrong-guess', 'p1', { guess: 2 }) } };
    const revealedWrong = { ...wrong, hand: [{ revealed: true }], board: { ...wrong.board, lastEvent: event(1, 'wrong-guess', 'p1', { guess: 2, revealedOwnIndex: 0 }) } };
    const draw = { ...empty, board: { ...empty.board, lastEvent: event(1, 'draw') } };
    const stop = { ...empty, turn: 'p2', board: { ...empty.board, lastEvent: event(1, 'stop') } };
    const skipped = { ...empty, board: { ...empty.board, lastEvent: event(1, 'skip-draw') } };
    const arranged = { ...empty, board: { ...empty.board, lastEvent: event(2, 'arrange', 'p1') } };
    const ready = { ...empty, board: { ...empty.board, lastEvent: event(3, 'ready') } };
    expect(publicViewCue('davinci', null, correct, 'p1')).toBeNull();
    expect(publicViewCue('davinci', empty, correct, 'p1')).toBe('correct');
    expect(publicViewCue('davinci', empty, wrong, 'p1')).toBe('error');
    expect(publicViewCue('davinci', empty, revealedWrong, 'p1')).toBe('error');
    expect(publicViewCue('davinci', empty, draw, 'p1')).toBe('draw');
    expect(publicViewCue('davinci', empty, stop, 'p1')).toBe('turn');
    expect(publicViewCue('davinci', empty, skipped, 'p1')).toBeNull();
    expect(publicViewCue('davinci', empty, arranged, 'p1')).toBe('place');
    expect(publicViewCue('davinci', arranged, ready, 'p1')).toBeNull();
    expect(publicViewAnnouncement('davinci', empty, arranged, 'p1', 'ko')?.message).toBe('타일을 정렬했어요.');
    expect(publicViewCue('davinci', correct, { ...correct, turn: 'p2' }, 'p1')).toBeNull();
    expect(publicViewCue('davinci', empty, { ...wrong, result: { winner: 'p2', reason: 'all revealed' } }, 'p1')).toBe('lose');
    expect(cueForAction('davinci', { type: 'place-joker' })).toBeNull();
    expect(cueForAction('davinci', { type: 'finish-setup' })).toBeNull();
    expect(publicViewAnnouncement('davinci', empty, wrong, 'p1', 'ko')?.message).toBe('이번 추측은 틀렸어요.');
    expect(publicViewAnnouncement('davinci', empty, revealedWrong, 'p1', 'es')?.message).toBe('Fallaste y se reveló una ficha tuya.');
    expect(publicViewCue('catchmind', { board: { scores: { p1: 0, p2: 0 } } }, { board: { scores: { p1: 1, p2: 2 } } }, 'p1')).toBe('correct');
    expect(publicViewCue('catchmind', { board: { scores: { p1: 0, p2: 0 } } }, { board: { scores: { p1: 0, p2: 0 } }, phase: 'drawing' }, 'p1')).toBeNull();
    expect(publicViewCue('catchmind', { board: { scores: { p1: 2, p2: 1 } } }, { board: { scores: { p1: 1, p2: 0 } } }, 'p1')).toBeNull();
    expect(publicViewCue('marble', { board: { lastEvent: null } }, { board: { lastEvent: { sequence: 1, id: 'festival', effect: 'cash', title: { ko: '축제' }, text: { ko: '보너스' } } } }, 'p1')).toBe('event');
    const marbleBefore = { turn: 'p1', board: { actionLog: [{ sequence: 7, type: 'turn' }] } };
    const marbleBatch = { turn: 'p2', board: { actionLog: [{ sequence: 9, type: 'rent', title: { ko: '임대료', es: 'Alquiler' }, text: { ko: '120을 받았습니다.', es: 'Recibiste 120.' } }, { sequence: 8, type: 'move' }] } };
    expect(publicViewCue('marble', null, marbleBatch, 'p1')).toBeNull();
    expect(publicViewCue('marble', marbleBefore, marbleBatch, 'p1')).toBe('toll');
    expect(publicViewAnnouncement('marble', marbleBefore, marbleBatch, 'p1', 'es')?.message).toBe('Alquiler · Recibiste 120.');
    expect(publicViewCue('marble', marbleBefore, { ...marbleBatch, result: { winner: 'p1', reason: 'complete' } }, 'p1')).toBe('win');
    const previousMarble = { board: { lastEvent: { sequence: 4, title: { ko: '카드', es: 'Tarjeta' }, text: { ko: '이동', es: 'Avanza' } } } };
    const marbleDraw = { ...previousMarble, board: { lastEvent: { sequence: 5, title: { ko: '이전 카드', es: 'Tarjeta anterior' }, text: { ko: '이전 이동', es: 'Avance anterior' } } }, result: { winner: 'draw', reason: 'asset limit' } };
    expect(publicViewAnnouncement('marble', previousMarble, marbleDraw, 'p1', 'ko')?.message).toBe('무승부로 게임이 끝났어요.');
    const teamWin = { board: { teams: { p1: ['p1', 'p2'], p2: ['b1', 'b2'] } }, result: { winner: 'p1', reason: 'empty team' } };
    expect(publicViewCue('domino', { turn: 'p1' }, teamWin, 'p2')).toBe('win');
    expect(publicViewAnnouncement('domino', { turn: 'p1' }, teamWin, 'p2', 'es')?.message).toBe('Ganaste la partida.');
    expect(publicViewCue('jaipur', { turn: 'p2' }, { turn: 'p1' }, 'p1')).toBe('turn');
    expect(publicViewCue('jaipur', { turn: 'p1' }, { turn: 'p1', result: { winner: 'p1', reason: 'complete' } }, 'p1')).toBe('win');
    const jaipurBefore = { turn: 'p1', log: [{ sequence: 2, type: 'turn' }] };
    const jaipurTake = { turn: 'p2', log: [{ sequence: 3, type: 'take-single', title: { ko: '가져오기', es: 'Mercancía tomada' }, text: { ko: '금 1장을 가져왔어요.', es: 'Tomaste oro.' } }, ...jaipurBefore.log] };
    expect(publicViewCue('jaipur', null, jaipurTake, 'p1')).toBeNull();
    expect(publicViewCue('jaipur', jaipurBefore, jaipurTake, 'p1')).toBe('place');
    expect(publicViewAnnouncement('jaipur', jaipurBefore, jaipurTake, 'p1', 'es')?.message).toBe('Mercancía tomada · Tomaste oro.');
    expect(publicViewCue('jaipur', jaipurBefore, { ...jaipurTake, result: { winner: 'p1', reason: 'won two rounds' } }, 'p1')).toBe('win');
  });

  it('uses only new public Minhwatu events for card, capture, special, turn, and final cues', () => {
    const prior = { turn: 'p1', result: null, log: [{ sequence: 4, type: 'play', actor: 'p1', title: { ko: '패를 냈어요', es: 'Carta jugada' } }] };
    const next = { ...prior, turn: 'p2', log: [
      { sequence: 6, type: 'special', actor: 'p1', title: { ko: '족보 완성', es: 'Combinación' }, yaku: { id: 'three-brights', label: { ko: '삼광', es: 'Tres brillantes' }, bonus: 3 } },
      { sequence: 5, type: 'capture', actor: 'p1', title: { ko: '패를 가져왔어요', es: 'Cartas capturadas' } },
      prior.log[0],
    ] };
    expect(publicViewCue('minhwatu', null, next, 'p1')).toBeNull();
    expect(publicViewCue('minhwatu', prior, next, 'p1')).toBe('special');
    expect(publicViewAnnouncement('minhwatu', prior, next, 'p1', 'es')?.message).toBe('Combinación · Tres brillantes');
    const godori = { ...prior, log: [{ sequence: 5, type: 'special', title: { ko: '고도리', es: 'Godori' }, yaku: { id: 'godori', label: { ko: '고도리', es: 'Godori' }, bonus: 0 } }, prior.log[0]] };
    expect(publicViewCue('minhwatu', prior, godori, 'p1')).toBeNull();
    expect(publicViewCue('minhwatu', prior, { ...prior, log: [{ sequence: 5, type: 'turn', title: { ko: '상대 차례', es: 'Turno rival' } }, prior.log[0]] }, 'p1')).toBe('turn');
    expect(publicViewCue('minhwatu', prior, { ...prior, result: { winner: 'p2' }, log: [{ sequence: 5, type: 'win', winner: 'p2', title: { ko: '상대 승리', es: 'Victoria rival' } }, prior.log[0]] }, 'p1')).toBe('lose');
    expect(publicViewCue('minhwatu', { turn: 'p1', log: [] }, { turn: 'p1', log: [{ sequence: 1, type: 'deal', title: { ko: '패 배치', es: 'Cartas listas' } }] }, 'p1')).toBe('deal');
  });

  it('plays committed Domino events in sequence and distinguishes round scoring from match results', () => {
    const before = { turn: 'p1', result: null, log: [{ sequence: 12, type: 'turn', title: { ko: '차례', es: 'Turno' } }], board: { teams: { p1: ['p1', 'p2'], p2: ['b1', 'b2'] }, settings: { targetScore: 100 }, roundResult: null } };
    const roundEnd = { turn: 'p1', result: null, log: [
      { sequence: 14, type: 'score', title: { ko: '누적 점수', es: 'Puntuación acumulada' }, points: 20 },
      { sequence: 13, type: 'round-end', title: { ko: '라운드 종료', es: 'Fin de ronda' }, points: 20 },
    ], board: { ...before.board, roundResult: { winner: 'p1' } } };
    expect(publicViewCue('domino', null, before, 'p1')).toBeNull();
    expect(publicViewCue('domino', before, roundEnd, 'p1')).toBe('score');
    expect(publicViewAnnouncement('domino', before, roundEnd, 'p1', 'es')?.message).toBe('Puntuación acumulada');
    const match = { ...roundEnd, result: { winner: 'p1', reason: 'Match target reached' }, board: { ...roundEnd.board, settings: { targetScore: 100 } }, log: [...roundEnd.log, { sequence: 15, type: 'win', team: 'p1', title: { ko: '매치 종료', es: 'Fin del partido' } }] };
    expect(publicViewCue('domino', before, match, 'p2')).toBe('win');
    expect(publicViewAnnouncement('domino', before, match, 'p2', 'es')?.message).toBe('Ganaste la partida.');
    const singleRoundWin = { ...roundEnd, result: { winner: 'p1', reason: 'Single round finished' }, board: { ...roundEnd.board, settings: { targetScore: 0 } } };
    expect(publicViewCue('domino', before, singleRoundWin, 'p2')).toBe('win');
    expect(publicViewAnnouncement('domino', before, singleRoundWin, 'p2', 'es')?.message).toBe('Ganaste la partida.');
    const singleRoundLoss = { ...singleRoundWin, board: { ...singleRoundWin.board, teams: { p1: ['p1'], p2: ['p2'] } } };
    expect(publicViewCue('domino', before, singleRoundLoss, 'p2')).toBe('lose');
    const reset = { ...before, log: [{ sequence: 1, type: 'play', title: { ko: '새 라운드', es: 'Nueva ronda' } }] };
    expect(publicViewCue('domino', before, reset, 'p1')).toBe('place');
  });

  it('plays one Splendor noble cue from public ownership changes, before turn and after result priority', () => {
    const before = { turn: 'p1', board: { ownedNobles: { p1: 0, p2: 0 } } };
    const ownAward = { turn: 'p2', board: { ownedNobles: { p1: 3, p2: 0 } } };
    const rivalAward = { turn: 'p1', board: { ownedNobles: { p1: 0, p2: 3 } } };
    expect(publicViewCue('splendor', null, before, 'p1')).toBeNull();
    expect(publicViewCue('splendor', before, ownAward, 'p1')).toBe('noble');
    expect(publicViewCue('splendor', before, rivalAward, 'p1')).toBe('noble');
    expect(publicViewCue('splendor', before, { ...before, turn: 'p2' }, 'p1')).toBe('turn');
    expect(publicViewCue('splendor', ownAward, { turn: 'p2', board: { ownedNobles: { p1: 0, p2: 0 } } }, 'p1')).toBeNull();
    expect(publicViewCue('splendor', before, { ...ownAward, result: { winner: 'p1', reason: 'complete' } }, 'p1')).toBe('win');
    expect(publicViewAnnouncement('splendor', before, ownAward, 'p1', 'ko')?.message).toBe('귀족을 얻었어요.');
    expect(publicViewAnnouncement('splendor', before, rivalAward, 'p1', 'es')?.message).toBe('La otra persona recibió un noble.');
    expect(cueForAction('splendor', { type: 'chooseNoble', payload: { id: 'n1' } })).toBeNull();
  });

  it('renders pending confirmation and localized sound settings controls', () => {
    const ko = renderToStaticMarkup(createElement(GameFeedback, { language: 'ko', gameId: 'jaipur', playerId: 'p1', view: { turn: 'p1' }, pending: true }));
    const es = renderToStaticMarkup(createElement(GameFeedback, { language: 'es', gameId: 'rhythm', playerId: 'p2', view: { turn: 'p2' } }));
    expect(ko).toContain('처리 중…');
    expect(ko).toContain('게임 효과음');
    expect(ko).toContain('id="game-sound-settings"');
    expect(ko).toContain('hidden=""');
    expect(ko).not.toContain('배경음');
    expect(es).toContain('Efectos del juego');
    expect(es).toContain('aria-expanded="false"');
  });
});

describe('room communication UI', () => {
  it('shows reaction-only UI for the lobby and every game except Catchmind', () => {
    const previousStorage = globalThis.localStorage;
    const previousDocument = globalThis.document;
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'dos-language' ? 'ko' : null, setItem: () => {}, removeItem: () => {} });
    vi.stubGlobal('document', { fullscreenEnabled: false });
    const messages = [
      { id: 'old-chat', playerId: 'p2' as const, text: 'private old text', translation: 'texto traducido', status: 'translated', createdAt: '2026-10-10T12:00:00.000Z' },
      { id: 'reaction', playerId: 'p2' as const, text: '❤️', status: 'original', createdAt: '2026-10-10T12:01:00.000Z' },
    ];
    const snapshot = (gameId: any) => ({ roomId: 'room', mode: 'demo' as const, playerId: 'p1' as const, players: [{ id: 'p1' as const, nickname: 'Luna', language: 'ko' as const, ready: true }, { id: 'p2' as const, nickname: 'Sol', language: 'es' as const, ready: true }], gameId, version: 1, view: null, messages, pendingGame: null, error: null });
    const api = { getSnapshot: () => snapshot(null), isOnlineConfigured: false } as any;
    try {
      for (const game of [null, ...gameCatalog.filter(game => game.id !== 'catchmind').map(game => game.id)]) {
        api.getSnapshot = () => snapshot(game);
        const html = renderToStaticMarkup(createElement(Room, { api, roomId: 'room' }));
        expect(html).toContain('표정 보내기');
        expect(html).toContain('aria-label="좋아요"');
        expect(html).not.toContain('room-message');
        expect(html).not.toContain('chat-compose');
        expect(html).not.toContain('chat-language-note');
        expect(html).not.toContain('private old text');
        expect(html).not.toContain('texto traducido');
      }
    } finally {
      vi.stubGlobal('localStorage', previousStorage);
      vi.stubGlobal('document', previousDocument);
    }
  });

  it('keeps Catchmind chat and translation while hiding reaction tokens as text', () => {
    const html = renderToStaticMarkup(createElement(CatchmindChatComposer, { language: 'es', chat: '', setChat: () => {}, sending: false, onSend: () => {}, onLanguageChange: () => {} }));
    expect(html).toContain('id="room-message"');
    expect(html).toContain('chat-language-note');
    expect(html).toContain('Los mensajes se traducen');
    expect(html).toContain('Cambiar idioma');
    const panel = renderToStaticMarkup(createElement(ReactionPanel, { language: 'es', playerId: 'p1', players: [{ id: 'p2', nickname: 'Sol' }], messages: [{ id: '1', playerId: 'p2', text: '❤️', createdAt: '2026-10-10T12:00:00.000Z' }, { id: '2', playerId: 'p2', text: 'texto privado legado', createdAt: '2026-10-10T12:01:00.000Z' }], sending: false, error: '', onSend: () => {} }));
    expect(panel).not.toContain('<textarea');
    expect(panel).not.toContain('<form');
    expect(panel).not.toContain('chat-language-note');
    expect(panel).not.toContain('texto privado legado');
    expect(panel).toContain('Reacciones recientes');
  });

  it('does not show reactions from earlier games as Catchmind answers', () => {
    const messages = [{ id: 'reaction', playerId: 'p2' as const, text: '❤️', status: 'original', createdAt: '2026-10-10T12:00:00.000Z' }];
    const api = { getSnapshot: () => ({ roomId: 'room', mode: 'demo', playerId: 'p1', players: [{ id: 'p1', nickname: 'Luna', language: 'ko', ready: true }, { id: 'p2', nickname: 'Sol', language: 'es', ready: true }], gameId: 'catchmind', version: 1, view: null, messages, pendingGame: null, error: null }), isOnlineConfigured: false } as any;
    const previousStorage = globalThis.localStorage;
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'dos-language' ? 'ko' : null, setItem: () => {}, removeItem: () => {} });
    try {
      const html = renderToStaticMarkup(createElement(Room, { api, roomId: 'room' }));
      expect(html).toContain('id="room-message"');
      expect(html).toContain('chat-language-note');
      expect(html).not.toContain('❤️');
    } finally {
      vi.stubGlobal('localStorage', previousStorage);
    }
  });
});


describe('Catchmind composing Enter', () => {
  it('submits only a deliberate Enter after composition and blocks repeated pending sends', () => {
    const enter = { key: 'Enter', shiftKey: false, isComposing: false, keyCode: 13 };
    expect(catchmindEnterSubmits(enter, false)).toBe(true);
    expect(catchmindEnterSubmits({ ...enter, isComposing: true }, false)).toBe(false);
    expect(catchmindEnterSubmits({ ...enter, keyCode: 229 }, false)).toBe(false);
    expect(catchmindEnterSubmits({ ...enter, shiftKey: true }, false)).toBe(false);
    expect(catchmindEnterSubmits(enter, true)).toBe(false);
  });
});

it('shows 16 keys for new rooms and retains 13-key instructions for saved rooms', () => {
  for (const language of ['ko', 'es'] as const) {
    const render = (marbleEventVersion?: number) => renderToStaticMarkup(createElement(GameGuide, { gameId: 'marble', language, marbleVersion: 2, marbleEconomyVersion: 2, marbleEventVersion }));
    expect(render(3)).toContain(language === 'ko' ? '16종' : '16 cartas');
    expect(render()).toContain(language === 'ko' ? '13종' : '13 cartas');
    expect(render()).not.toContain(language === 'ko' ? '도시 재생' : 'renovación');
  }
});
