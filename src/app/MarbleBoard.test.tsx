import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { marbleEngine } from '../games/marble';
import MarbleBoard from './MarbleBoard';

const render = (view: any, language: 'ko' | 'es' = 'ko', playerId: 'p1' | 'p2' = 'p1') =>
  renderToStaticMarkup(createElement(MarbleBoard, { view, language, playerId, runAction: vi.fn() }));

describe('MarbleBoard', () => {
  it('uses the updated Korean and Spanish figure names for old saved pawn IDs', () => {
    const state = marbleEngine.createInitialState(71);
    state.pawns = { p1: 'fox', p2: 'penguin' };
    const view = marbleEngine.getPlayerView(state, 'p1');
    expect(render(view)).toContain('말티푸');
    expect(render(view)).toContain('판다');
    expect(render(view, 'es')).toContain('Maltipoo');
    expect(render(view, 'es')).toContain('Panda');
    expect(view.actions.some((choice: any) => choice.label.ko.includes('친칠라') && choice.label.es.includes('Chinchilla'))).toBe(true);
  });
  it('shows only a confirmed world-travel arrival as an imagined airline trip', () => {
    const view = marbleEngine.getPlayerView(marbleEngine.createInitialState(12), 'p1');
    expect(render(view)).not.toContain('mp-flight');
    view.board.lastMove = { sequence: 1, from: 30, to: 15, steps: 25, source: 'train', playerId: 'p1' };
    expect(render(view)).toContain('아시아나');
    expect(render(view)).toContain('둘의 상상 여행');
    expect(render(view)).not.toContain('mp-flight is-flying');
    view.board.lastMove.playerId = 'p2';
    expect(render(view, 'es')).toContain('JetBlue');
    expect(render(view, 'es')).toContain('Nuestro viaje imaginado');
    view.board.lastMove.from = 14;
    expect(render(view)).not.toContain('mp-flight');
  });
  it('renders the current forty-space route with Gwangju and Santo Domingo in both languages', () => {
    const state = marbleEngine.createInitialState(733);
    const view = marbleEngine.getPlayerView(state, 'p1');
    const ko = render(view);
    const es = render(view, 'es');
    expect((ko.match(/role="listitem" aria-label=/g) ?? []).length).toBe(40);
    expect(ko).toContain('광주');
    expect(ko).toContain('산토도밍고');
    expect(ko).toContain('주사위 굴리기');
    expect(ko).toContain('어떤 말로 출발할까요?');
    expect(ko).toContain('src="/images/marble/world-map-board.webp"');
    expect(ko).toContain('mp-board-panel');
    expect(ko).toContain('mp-pawn-picker-shell');
    expect(ko.indexOf('mp-pawn-picker-shell')).toBeLessThan(ko.indexOf('mp-turn-panel'));
    expect(ko.indexOf('mp-turn-panel')).toBeLessThan(ko.indexOf('mp-city-detail'));
    expect(ko).toContain('/images/marble/building-stages.svg#land');
    expect(es).toContain('Gwangju');
    expect(es).toContain('Santo Domingo');
    expect(es).toContain('<h2>Marble</h2>');
    expect(es).toContain('Lanzar los dados');
    expect(es).toContain('Patrimonio neto');
  });

  it('uses the same current turn in the map and actions, capped at 120 including final settlement', () => {
    const view = marbleEngine.getPlayerView(marbleEngine.createInitialState(11), 'p1');
    for (const turns of [0, 28, 119, 120]) {
      view.board.turns = turns;
      const html = render(view);
      const current = Math.min(120, turns + 1);
      expect(html).toContain(`<b>${current} / 120</b>`);
      expect(html).toContain(`턴 ${current} / 120`);
      expect(html).not.toContain('턴 121');
    }
    view.result = { winner: 'p1', scores: { p1: 1, p2: 0 } };
    expect(render(view)).toContain('턴 120 / 120');
  });

  it('resolves the same saved-v2 final art in the board and portfolio for Newark and Seoul', () => {
    const view = marbleEngine.getPlayerView({ ...marbleEngine.createInitialState(11), cityRouteVersion: 2 }, 'p1');
    for (const index of [31, 38]) {
      view.board.tiles[index].owner = 'p1';
      view.board.tiles[index].houses = 3;
    }
    const html = render(view);
    const portfolio = html.slice(html.indexOf('<details class="mp-portfolio"'));
    for (const city of ['newark', 'seoul']) {
      expect(portfolio).toContain(`/images/marble/landmarks/${city}.svg`);
      expect(html).not.toContain(`/images/marble/cities/${city}.svg`);
    }
  });

  it('shows the selected arrival with its actual build stage instead of a false landmark preview', () => {
    const view = marbleEngine.getPlayerView({ ...marbleEngine.createInitialState(11), cityRouteVersion: 2 }, 'p1');
    view.board.positions.p1 = 1;
    const html = render(view);
    const arrival = html.slice(html.indexOf('<section class="mp-journey-hud"'), html.indexOf('</section>') + 10);
    expect(arrival).toContain('현재 도착 · 행동 위치');
    expect(arrival).toContain('data-building-level="0"');
    expect(arrival).toContain('현재 미건설');
    expect(arrival).toContain('/images/marble/landmarks/gwangju.svg');
    expect(arrival).toContain('랜드마크 모습 · 미건설');
    expect(arrival).toContain('24개 도시 중 대표 도시 빠른 바로가기');
    expect((arrival.match(/빠른 바로가기/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(html).not.toContain('aria-label="랜드마크"');
  });

  it('keeps the arrival and action location focused on the active seat in the counterpart view', () => {
    const state = marbleEngine.createInitialState(21);
    state.positions.p1 = 8;
    state.active = 'p1';
    const html = render(marbleEngine.getPlayerView(state, 'p2'), 'es', 'p2');
    expect(html).toContain('<h3>Puerto Plata</h3>');
    expect(html).toContain('Llegada actual · ubicación de acción');
    expect(html).toContain('Ubicación de acción</small>');
    expect(html).toContain('Puerto Plata');
  });

  it('shows connected route-v3 landmark attribution and its verified image', () => {
    const view = marbleEngine.getPlayerView(marbleEngine.createInitialState(11), 'p1');
    view.board.positions.p1 = 13;
    view.board.tiles[13].houses = 3;
    expect(render(view, 'es')).toContain('situado en Miami Beach');
    expect(render(view, 'es')).toContain('/images/marble/premium/cities/miami-colony-hotel.webp');
    view.board.positions.p1 = 15;
    expect(render(view)).toContain('디에고 콜론의 거주지');
  });

  it('shows the latest receipt immediately beside actions before animated history', () => {
    const view = marbleEngine.getPlayerView(marbleEngine.createInitialState(12), 'p1');
    view.board.actionLog = [
      { sequence: 1, title: { ko: '옛 탈출', es: 'Salida anterior' }, text: { ko: '100 납부', es: 'Pago 100' } },
      { sequence: 2, title: { ko: '건설 완료', es: 'Construcción lista' }, text: { ko: '빌딩 건설', es: 'Edificio construido' }, moneyDelta: { p1: -60 } },
    ];
    const html = render(view);
    expect(html.indexOf('mp-latest-receipt')).toBeGreaterThan(html.indexOf('mp-turn-panel'));
    expect(html.indexOf('mp-latest-receipt')).toBeLessThan(html.indexOf('mp-event-theater'));
    expect(html).toContain('내 현금 -60');
    view.board.actionLog.push({ sequence: 3, type: 'monopoly-warning', title: { ko: '독점 경고', es: 'Aviso' } });
    expect(render(view)).toContain('건설 완료 · 내 현금 -60');
    view.board.actionLog.push({ sequence: 4, type: 'turn', title: { ko: '다음 차례', es: 'Siguiente turno' } });
    expect(render(view).split('mp-latest-receipt')[1].split('mp-actions')[0]).not.toContain('내 현금 -60');
    expect(html).toContain('<details class="mp-city-detail"');
  });

  it('offers only legal strategic city and rent choices and shows held passes and one-use effects', () => {
    const view = marbleEngine.getPlayerView(marbleEngine.createInitialState(13), 'p1');
    view.phase = 'event-decision';
    view.board.pendingEvent = { id: 'city-festival', playerId: 'p1' };
    view.board.rentPasses = { p1: 1, p2: 0 };
    view.board.tiles[1].rentModifiers = { festival: { playerId: 'p1', owner: 'p1' } };
    view.board.tiles[3].rentModifiers = { blackout: { playerId: 'p1', owner: 'p2' } };
    view.actions = [{ label: { ko: '광주', es: 'Gwangju' }, action: { type: 'choose-event-city', payload: { tile: 1 } } }];
    const html = render(view);
    expect(html).toContain('내 도시 하나를 선택하세요');
    expect(html).toContain('이 도시에 적용');
    expect(html).toContain('통행료 면제권 1장');
    expect(html).toContain('#city-festival-mark');
    expect(html).toContain('#blackout-mark');
    expect(html).toContain('다음 상대 방문 통행료 2배 · 1회');
    expect(html).not.toContain('이곳으로 이동');
    view.phase = 'rent-decision';
    view.board.pendingRent = { amount: 176, reason: { ko: '상대 랜드마크 통행료', es: 'Renta del monumento rival' } };
    view.actions = [
      { label: { ko: '통행료 납부 · 176', es: 'Pagar renta · 176' }, action: { type: 'pay-rent' } },
      { label: { ko: '면제권 사용', es: 'Usar pase' }, action: { type: 'use-rent-pass' } },
    ];
    const rent = render(view, 'es');
    expect(rent).toContain('Renta del monumento rival');
    expect((rent.match(/>Pagar renta · 176/g) ?? []).length).toBe(1);
    expect((rent.match(/>Usar pase/g) ?? []).length).toBe(1);
    view.actions = [];
    expect(render(view, 'es')).not.toContain('>Usar pase');
  });

  it('keeps eighteen-space saved boards renderable and does not invent a roll action', () => {
    const state = marbleEngine.createInitialState(41);
    const view = marbleEngine.getPlayerView(state, 'p1');
    view.board.tiles = view.board.tiles.slice(0, 18);
    view.board.version = 1;
    view.actions = [];
    const html = render(view, 'es');
    expect((html.match(/role="listitem" aria-label=/g) ?? []).length).toBe(18);
    expect(html).toContain('Santo Domingo');
    expect(html).toContain('Efectivo');
    expect(html).not.toContain('Lanzar los dados</button>');
  });

  it('renders only legal purchase controls and describes the current property', () => {
    const state = marbleEngine.createInitialState(5);
    const view = marbleEngine.getPlayerView(state, 'p1');
    view.phase = 'decision';
    view.board.positions.p1 = 15;
    view.actions = [
      { label: { ko: '구매', es: 'Comprar' }, action: { type: 'buy' } },
      { label: { ko: '거절', es: 'Pasar' }, action: { type: 'decline' } },
    ];
    const html = render(view);
    const spanish = render(view, 'es');
    expect(html).toContain('산토도밍고');
    expect(html).toContain('도시 구매 · 120');
    expect(html).toContain('매입 120 · 매입 후 현금 1,380');
    expect(html).toContain('기본 통행료 15');
    expect(html.indexOf('mp-purchase-recap')).toBeLessThan(html.indexOf('mp-actions'));
    expect(html).toContain('구매 120 · 기본 통행료 15');
    expect(html).toContain('구매 후 현금 1,380');
    expect(html).toContain('선택한 칸');
    expect(html).toContain('aria-pressed="true"');
    expect(spanish).toContain('Compra 120 · renta 15');
    expect(html).toContain('구매하지 않고 지나가기');
    expect(html).not.toContain('탈출권 사용');
  });

  it('shows the server-priced build cost, cash after building, and next rent', () => {
    const state = marbleEngine.createInitialState(27);
    const view = marbleEngine.getPlayerView(state, 'p1');
    view.phase = 'main';
    view.board.positions.p1 = 1;
    view.board.money.p1 = 60;
    view.board.tiles[1].owner = 'p1';
    view.board.tiles[1].houses = 1;
    view.board.tiles[1].nextBuildCost = 40;
    view.board.tiles[1].nextRent = 48;
    view.actions = [{ label: { ko: '별장: 광주 (40)', es: 'Villa: Gwangju (40)' }, action: { type: 'build', payload: { tile: 1 } } }];
    const html = render(view);
    expect(html).toContain('건설 후 현금 20');
    expect(html).toContain('통행료 24 → 48 (+24)');
    expect(html).toContain('비용 40');
    expect(html).not.toContain('/images/marble/cities/gwangju.svg');
    expect(html).toContain('/images/marble/ownership-card-frame.svg');
    expect(html).toContain('/images/marble/premium/buildings/stage1-house.webp');
    expect(html).toContain('건설 단계별 통행료');
    expect(html.indexOf('mp-build-shortcut')).toBeLessThan(html.indexOf('mp-city-detail'));
    expect((html.match(/>별장: 광주 \(40\)/g) ?? []).length).toBe(1);
  });

  it('shows the public payment reason and only server-returned loan or bankruptcy actions', () => {
    const state = marbleEngine.createInitialState(19);
    const view = marbleEngine.getPlayerView(state, 'p1');
    view.phase = 'debt';
    view.board.pendingPayment = { amount: 180, creditor: 'p2', reason: { ko: '상대 임대료를 내야 합니다.', es: 'Debes pagar el alquiler rival.' } };
    view.board.debt.p1 = 0;
    view.actions = [
      { label: { ko: '대출 받기 · 300', es: 'Pedir préstamo · 300' }, action: { type: 'borrow' } },
      { label: { ko: '파산 인정', es: 'Declarar quiebra' }, action: { type: 'declare-bankruptcy' } },
    ];
    const ko = render(view);
    const es = render(view, 'es');
    expect(ko).toContain('결제가 필요해요');
    expect(ko).toContain('상대 임대료를 내야 합니다.');
    expect(ko).toContain('파산 선택 검토');
    expect(ko).toContain('나중에 330을 갚아요');
    expect(ko).not.toContain('파산 인정</button>');
    expect(es).toContain('Hay un pago pendiente');
    expect(es).toContain('Debes pagar el alquiler rival.');
    expect(es).toContain('devuelves 330');
    expect(es).not.toContain('Declarar quiebra</button>');
  });

  it('labels debt-adjusted value as net worth and states fixed loan terms before the choice', () => {
    const state = marbleEngine.createInitialState(21);
    const view = marbleEngine.getPlayerView(state, 'p1');
    view.board.economicVersion = 1;
    view.board.debt.p1 = 0;
    view.actions = [{ label: { ko: '대출 받기 · 300 / 상환 330', es: 'Pedir préstamo · 300 / devolver 330' }, action: { type: 'borrow' } }];
    const ko = render(view);
    const es = render(view, 'es');
    expect(ko).toContain('순자산');
    expect(ko).toContain('대출은 300을 받고 나중에 330을 갚아요');
    expect(es).toContain('Patrimonio neto');
    expect(es).toContain('Recibes 300 y luego devuelves 330');
  });

  it('shows each player’s landmark count beside city and debt totals', () => {
    const state = marbleEngine.createInitialState(23);
    const view = marbleEngine.getPlayerView(state, 'p1');
    view.board.tiles[3].owner = 'p1';
    view.board.tiles[3].houses = 3;
    expect(render(view)).toContain('랜드마크 1');
    expect(render(view, 'es')).toContain('Monumentos 1');
  });

  it('labels final economic-version scores as net worth and preserves older asset scoring', () => {
    const state = marbleEngine.createInitialState(24);
    const view = marbleEngine.getPlayerView(state, 'p1');
    view.result = { winner: 'p1', reason: 'asset turn limit', scores: { p1: 1200, p2: 900 } };
    expect(render(view)).toContain('순자산');
    expect(render(view, 'es')).toContain('Patrimonio neto');
    view.board.economicVersion = 0;
    expect(render(view)).toContain('총 자산');
    expect(render(view, 'es')).toContain('Activos totales');
  });

  it('explains remaining island turns, fixed escape cost, and available passes', () => {
    const state = marbleEngine.createInitialState(22);
    const view = marbleEngine.getPlayerView(state, 'p1');
    view.phase = 'island';
    view.board.islandTurns.p1 = 2;
    view.board.escapePasses.p1 = 1;
    view.actions = [
      { label: { ko: '쌍이 나오는지 굴리기', es: 'Intentar sacar dobles' }, action: { type: 'attempt-doubles' } },
      { label: { ko: '100을 내고 탈출', es: 'Pagar 100 para salir' }, action: { type: 'pay-escape' } },
      { label: { ko: '탈출권 사용', es: 'Usar pase de salida' }, action: { type: 'use-escape-pass' } },
    ];
    const ko = render(view);
    const es = render(view, 'es');
    expect(ko).toContain('무인도에 있어요 · 남은 차례 2');
    expect(ko).toContain('탈출권 1장 보유');
    expect(es).toContain('Estás en la isla · 2 turnos pendientes');
    expect(es).toContain('tienes 1');
    expect((ko.match(/>쌍이 나오는지 굴리기/g) ?? []).length).toBe(1);
    expect((ko.match(/>100을 내고 탈출/g) ?? []).length).toBe(1);
    expect((ko.match(/>탈출권 사용/g) ?? []).length).toBe(1);
  });

  it('uses engine-issued train destinations and shows the recent public action log', () => {
    const state = marbleEngine.createInitialState(29);
    const view = marbleEngine.getPlayerView(state, 'p1');
    view.phase = 'train-decision';
    view.board.pendingTrainFare = 100;
    view.actions = [
      { label: { ko: '열차: 광주 (100)', es: 'Tren: Gwangju (100)' }, action: { type: 'choose-train', payload: { destination: 1 } } },
      { label: { ko: '열차: 산토도밍고 (100)', es: 'Tren: Santo Domingo (100)' }, action: { type: 'choose-train', payload: { destination: 3 } } },
    ];
    view.board.actionSequence = 2;
    view.board.actionLog = [
      { sequence: 1, type: 'roll', actor: 'p1', title: { ko: '주사위 결과', es: 'Resultado de los dados' }, text: { ko: '3 + 4 = 7칸', es: '3 + 4 = 7 casillas' }, amount: 7 },
      { sequence: 2, type: 'train', actor: 'p1', title: { ko: '열차 출발', es: 'El tren sale' }, text: { ko: '산토도밍고행', es: 'Destino: Santo Domingo' }, amount: 100 },
    ];
    const html = render(view, 'es');
    expect(html).toContain('Destino');
    expect(html).toContain('Puedes elegir cualquier ciudad');
    expect(html).toContain('Tren: Santo Domingo (100)');
    expect(html).toContain('El tren sale');
    expect(html).toContain('Destino: Santo Domingo');
    expect(html).not.toContain('rng');
    expect(html).not.toContain('eventDeck');

    view.turn = 'p2';
    view.board.turn = 'p2';
    view.actions = [];
    const waiting = render(view, 'es', 'p1');
    expect(waiting).toContain('Tu pareja está eligiendo destino en tren');
    expect(waiting).not.toContain('El pasaje cuesta');
  });
});
