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
    expect(ko).toMatch(/mp-board-center[^\"]*has-pawn-picker/);
    expect(ko.indexOf('marble-pawn-picker')).toBeLessThan(ko.indexOf('mp-dashboard'));
    expect((ko.match(/class="mp-group-dot /g) ?? []).length).toBe(12);
    expect(ko).toContain('aria-valuemax="120"');
    expect(es).toContain('Gwangju');
    expect(es).toContain('Santo Domingo');
    expect(es).toContain('<h2>Marble</h2>');
    expect(es).toContain('Lanzar los dados');
    expect(es).toContain('Patrimonio neto');
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
    view.board.positions.p1 = 3;
    view.actions = [
      { label: { ko: '구매', es: 'Comprar' }, action: { type: 'buy' } },
      { label: { ko: '거절', es: 'Pasar' }, action: { type: 'decline' } },
    ];
    const html = render(view);
    const spanish = render(view, 'es');
    expect(html).toContain('산토도밍고');
    expect(html).toContain('도시 구매 · 120');
    expect(html).toContain('구매 120 · 기본 통행료 15');
    expect(spanish).toContain('Compra 120 · renta 15');
    expect(html).toContain('구매하지 않고 지나가기');
    expect(html).not.toContain('탈출권 사용');
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
