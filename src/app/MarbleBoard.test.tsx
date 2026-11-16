import { marbleRuntimeImage } from './marble-runtime-images';
import {createLegacyMarbleState} from '../games/marble';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { marbleEngine } from '../games/marble';
import MarbleBoard, { focusMarbleAction } from './MarbleBoard';

const render = (view: any, language: 'ko' | 'es' = 'ko', playerId: 'p1' | 'p2' = 'p1') =>
  renderToStaticMarkup(createElement(MarbleBoard, { view, language, playerId, runAction: vi.fn() }));
const legacyState = (seed: number) => {
  const state = createLegacyMarbleState(seed);
  state.economicVersion = 2;
  state.constructionRulesVersion = 1;
  state.money = { p1: 1500, p2: 1500 };
  return state;
};

describe('MarbleBoard', () => {
  it('puts the legal phase action ahead of optional loans in the central dice stage', () => {
    const html = render(marbleEngine.getPlayerView(createLegacyMarbleState(71), 'p1'));
    const center = html.slice(html.indexOf('class="mp-center-stage'), html.indexOf('</section>', html.indexOf('class="mp-center-stage')));
    expect(center).toContain('주사위 굴리기');
    expect(center).not.toContain('대출 받기');
  });

  it('offers the action shortcut before all forty city controls in both languages', () => {
    const state = createLegacyMarbleState(71);
    for (const language of ['ko', 'es'] as const) for (const playerId of ['p1', 'p2'] as const) {
      const html = render(marbleEngine.getPlayerView(state, playerId), language, playerId);
      expect(html.indexOf('class="mp-action-skip"')).toBeLessThan(html.indexOf('class="mp-tile-select"'));
      expect(html).toContain('href="#marble-current-action"');
      expect(html).toContain('id="marble-current-action" tabindex="-1"');
      expect(html).toContain(language === 'ko' ? '현재 행동으로 이동' : 'Ir a la acción actual');
      expect((html.match(/class="mp-tile-select"/g) ?? []).length).toBe(40);
    }
  });

  it('focuses an enabled primary action, another enabled control, or the waiting panel', () => {
    const primary = { focus: vi.fn() }, secondary = { focus: vi.fn() }, focus = vi.fn();
    const panel = (first: typeof primary | null, second: typeof secondary | null) => ({ focus, querySelector: (selector: string) => selector.startsWith('.mp-action-primary') ? first : second }) as unknown as HTMLElement;
    focusMarbleAction(panel(primary, secondary));
    expect(primary.focus).toHaveBeenCalledOnce();
    expect(secondary.focus).not.toHaveBeenCalled();
    focusMarbleAction(panel(null, secondary));
    expect(secondary.focus).toHaveBeenCalledOnce();
    focusMarbleAction(panel(null, null));
    expect(focus).toHaveBeenCalledOnce();
    expect(() => focusMarbleAction(null)).not.toThrow();
  });

  it('uses the updated Korean and Spanish figure names for old saved pawn IDs', () => {
    const state = createLegacyMarbleState(71);
    state.pawns = { p1: 'fox', p2: 'penguin' };
    const view = marbleEngine.getPlayerView(state, 'p1');
    expect(render(view)).toContain('말티푸');
    expect(render(view)).toContain('판다');
    expect(render(view, 'es')).toContain('Maltipoo');
    expect(render(view, 'es')).toContain('Panda');
    expect(view.actions.some((choice: any) => choice.label.ko.includes('친칠라') && choice.label.es.includes('Chinchilla'))).toBe(true);
  });
  it('does not keep an aircraft overlay after travel and a later construction', () => {
    const view=marbleEngine.getPlayerView(createLegacyMarbleState(12),'p1');
    view.board.lastMove={sequence:1,from:30,to:15,steps:25,source:'train',playerId:'p1'};
    view.phase='main';
    expect(render(view)).not.toContain('class="mp-flight');
    expect(render(view,'es')).not.toContain('class="mp-flight');
  });
  it('renders the current forty-space route with Gwangju and Santo Domingo in both languages', () => {
    const state = createLegacyMarbleState(733);
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
    expect(ko.indexOf('mp-turn-panel')).toBeLessThan(ko.indexOf('<details class="mp-city-detail"'));
    expect(ko).toContain('<details class="mp-pawn-picker-shell mp-city-detail"><summary>말 선택</summary>');
    expect(ko).toContain('viewBox="0 34 128 80"');
    expect(ko).not.toContain('/images/marble/premium/cities/gwangju-chosun-university.webp');
    expect(ko).toContain('data-building-level="0"');
    expect(ko).not.toContain('class="mp-building-badge" data-building-level="0"');
    expect(es).toContain('Gwangju');
    expect(es).toContain('Santo Domingo');
    expect(es).toContain('<h2>Marble</h2>');
    expect(es).toContain('Lanzar los dados');
    expect(es).toContain('Patrimonio neto');
  });

  it('preserves full Spanish city names for visual wrapping and hover inspection', () => {
    const view = marbleEngine.getPlayerView(createLegacyMarbleState(733), 'p1');
    const es = render(view, 'es');
    for (const name of ['Ciudad de México', 'Barcelona', 'Santo Domingo']) {
      expect(es).toContain(`title="${name}"`);
      expect(es).toContain(`aria-label="${name},`);
    }
    expect(es).not.toContain('Acceso rápido a');
    expect(es).toContain('<strong class="mp-tile-name" title="Ciudad de México">Ciudad de México</strong>');
  });

  it('uses the same current turn in the map and actions, capped at 120 including final settlement', () => {
    const view = marbleEngine.getPlayerView(createLegacyMarbleState(11), 'p1');
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
    const view = marbleEngine.getPlayerView({ ...createLegacyMarbleState(11), cityRouteVersion: 2, constructionRulesVersion: 1 }, 'p1');
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

  it('shows one compact inspector with actual build stage and no arbitrary shortcuts', () => {
    const view = marbleEngine.getPlayerView({ ...createLegacyMarbleState(11), cityRouteVersion: 2, constructionRulesVersion: 1 }, 'p1');
    view.board.positions.p1 = 1;
    const html = render(view);
    const start = html.indexOf('<details class="mp-city-detail"');
    const detail = html.slice(start, html.indexOf('</details>', start));
    expect(detail).toContain('현재 행동 위치');
    expect(detail).toContain('data-building-level="0"');
    expect(detail).toContain('mp-inspector-summary');
    expect(detail).toContain('marble-property-ledger');
    expect(detail).not.toContain('mp-property-card');
    expect(detail).not.toContain('ownership-card-frame');
    expect(detail).not.toContain('빠른 바로가기');
    expect(detail).not.toContain('mp-journey-stops');
  });

  it('shows one special-tile title and one accurate effect line in the journey panel', () => {
    const state = createLegacyMarbleState(31);
    const view = marbleEngine.getPlayerView(state, 'p1');
    const journey = () => {
      const html = render(view);
      const start = html.indexOf('<details class="mp-city-detail"');
      return html.slice(start, html.indexOf('</details>', start) + 10);
    };
    expect(journey()).toContain('출발');
    expect(journey()).toContain('통과할 때 300을 받아요.');
    view.board.positions.p1 = 23;
    expect(journey()).toContain('추가 비용이 없어요.');
    view.board.positions.p1 = 10;
    expect(journey()).toContain('최대 세 차례 쉬어요 · 다음 차례에 탈출 방법을 선택해요.');
    view.board.positions.p1 = 14;
    expect(journey()).toContain('다음 차례에 목적지를 골라요 · 운임 100.');
  });

  it('keeps the arrival and action location focused on the active seat in the counterpart view', () => {
    const state = legacyState(21);
    state.positions.p1 = 8;
    state.active = 'p1';
    const html = render(marbleEngine.getPlayerView(state, 'p2'), 'es', 'p2');
    expect(html).toContain('<h3>Guiza</h3>');
    expect(html).toContain('Ubicación de acción');
    expect(html).toContain('Compra 180 · renta 26');
    expect(html).toContain('Guiza');
  });

  it('shows connected route-v3 landmark attribution and its verified image', () => {
    const view = marbleEngine.getPlayerView(createLegacyMarbleState(11), 'p1');
    view.board.positions.p1 = 13;
    view.board.tiles[13].houses = 3;view.board.tiles[13].buildings=['villa','building','hotel'];view.board.tiles[13].landmark=true;
    expect(render(view, 'es')).toContain('Marina Bay Sands · Singapur');
    expect(render(view, 'es')).toContain(marbleRuntimeImage('singapore-marina-bay-sands-v1.png'));
    view.board.positions.p1 = 15;
    expect(render(view)).toContain('디에고 콜론의 거주지');
  });

  it('retains exact financial receipts in the closed history without repeating the current action panel', () => {
    const view = marbleEngine.getPlayerView(createLegacyMarbleState(12), 'p1');
    view.board.actionLog = [
      { sequence: 1, title: { ko: '옛 탈출', es: 'Salida anterior' }, text: { ko: '100 납부', es: 'Pago 100' } },
      { sequence: 2, title: { ko: '건설 완료', es: 'Construcción lista' }, text: { ko: '빌딩 건설', es: 'Edificio construido' }, moneyDelta: { p1: -60 } },
    ];
    const html = render(view);
    expect(html.indexOf('mp-latest-receipt')).toBeGreaterThan(html.indexOf('mp-turn-panel'));
    expect(html.indexOf('mp-latest-receipt')).toBeGreaterThan(html.indexOf('<details class="mp-history"'));
    expect(html.indexOf('mp-latest-receipt')).toBeGreaterThan(html.indexOf('mp-event-theater'));
    expect(html).toContain('내 현금 -60');
    view.board.actionLog.push({ sequence: 3, type: 'monopoly-warning', title: { ko: '독점 경고', es: 'Aviso' } });
    expect(render(view)).toContain('건설 완료 · 내 현금 −60');
    view.board.actionLog.push({ sequence: 4, type: 'turn', title: { ko: '다음 차례', es: 'Siguiente turno' } });
    expect(render(view).split('mp-latest-receipt')[1].split('mp-actions')[0]).not.toContain('내 현금 −60');
    expect(html).toContain('<details class="mp-city-detail"');
  });

  it('offers only legal strategic city and rent choices and shows held passes and one-use effects', () => {
    const view = marbleEngine.getPlayerView(createLegacyMarbleState(13), 'p1');
    view.phase = 'event-decision';
    view.board.pendingEvent = { id: 'city-festival', playerId: 'p1' };
    view.board.rentPasses = { p1: 1, p2: 0 };
    view.board.tiles[1].rentModifiers = { festival: { playerId: 'p1', owner: 'p1' } };
    view.board.tiles[3].rentModifiers = { blackout: { playerId: 'p1', owner: 'p2' } };
    view.actions = [{ label: { ko: '광주', es: 'Gwangju' }, action: { type: 'choose-event-city', payload: { tile: 1 } } }];
    const html = render(view);
    expect(html).toContain('선택 가능한 도시');
    expect(html).toContain('강조된 도시 타일을 눌러 주세요.');expect(html).not.toContain('<select id="mp-travel-destination"');
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
    const state = createLegacyMarbleState(41);
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
    const state = legacyState(5);
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
    expect(html).toContain('구매 확정 · 120');
    expect(html).toContain('구매 120 · 기본 통행료 15');
    expect(html.indexOf('mp-construction-summary')).toBeLessThan(html.indexOf('mp-construction-footer'));
    expect(html).toContain('mp-legacy-construction');
    expect(html).toContain('구매 120 · 기본 통행료 15');
    expect(html).toContain('남는 현금');
    expect(html).toContain('>1,380</b>');
    expect(html).toContain('선택한 칸');
    expect(html).toContain('aria-pressed="true"');
    expect(spanish).toContain('Compra 120 · renta 15');
    expect(html).toContain('건너뛰기');
    expect(html).not.toContain('탈출권 사용');
  });

  it('shows the new economy values in a fresh purchase decision', () => {
    const state = createLegacyMarbleState(73);
    state.positions.p1 = 1;
    state.pendingTile = 1;
    state.phase = 'decision';
    const html = render(marbleEngine.getPlayerView(state, 'p1'));
    expect(html).toContain('구매 80 · 기본 통행료 20');
    expect(html).toContain('남는 현금');expect(html).toContain('>2,920</b>');
  });

  it('shows the server-priced build cost, cash after building, and next rent', () => {
    const state = legacyState(27);
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
    expect(html).toContain('남는 현금');
    expect(html).toContain('>20</b>');
    expect(html).toContain('통행료 <b>48</b>');
    expect(html).toContain('임대 24');
    expect(html).toContain('건설 확정 · 40');
    expect(html).not.toContain('/images/marble/cities/gwangju.svg');
    expect(html).not.toContain('/images/marble/ownership-card-frame.svg');
    expect(html).toContain('/images/marble/premium/buildings/stage1-house.webp');
    expect(html).toContain('단계별 금액');
    expect(html.indexOf('mp-construction-footer')).toBeLessThan(html.indexOf('mp-city-detail'));
    expect(html).toContain('건설 확정 · 40');
  });

  it('shows the public payment reason and only server-returned loan or bankruptcy actions', () => {
    const state = createLegacyMarbleState(19);
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
    expect(ko).toContain('파산하기');
    expect(ko).toContain('상환 330');
    expect(ko).not.toContain('파산 인정</button>');
    expect(ko).not.toContain('class="mp-loan-options"');
    expect(es).toContain('Hay un pago pendiente');
    expect(es).toContain('Debes pagar el alquiler rival.');
    expect(es).toContain('devuelves 330');
    expect(es).not.toContain('Declarar quiebra</button>');
  });

  it('keeps legacy 18-cell roll, buy, and end-turn controls outside the modern center stage', () => {
    const legacy = { ...createLegacyMarbleState(3), boardVersion: undefined, cityRouteVersion: undefined, economicVersion: undefined, propertyRulesVersion: undefined } as ReturnType<typeof marbleEngine.createInitialState>;
    const roll = marbleEngine.getPlayerView(legacy, 'p1');
    expect(roll.board.tiles).toHaveLength(18);
    expect(render(roll)).toContain('주사위 굴리기<span aria-hidden="true">↗</span></button>');
    legacy.positions.p1 = 1; legacy.pendingTile = 1; legacy.phase = 'decision';
    expect(render(marbleEngine.getPlayerView(legacy, 'p1'))).toContain('구매 · 100');
    legacy.properties[1] = { owner: 'p1', houses: 0 }; legacy.phase = 'main';
    expect(render(marbleEngine.getPlayerView(legacy, 'p1'))).toContain('차례 마치기');
  });

  it('shows each legal property sale in debt without a fixed first-city primary action', () => {
    const state = createLegacyMarbleState(7);
    state.phase = 'debt'; state.money.p1 = 0; state.debt!.p1 = 330;
    state.properties[1] = { owner: 'p1', houses: 1 }; state.properties[3] = { owner: 'p1', houses: 0 };
    state.pendingPayment = { amount: 120, creditor: 'bank', reason: { ko: '도시세', es: 'Impuesto' }, type: 'tax', tile: 5, resumePhase: 'main', resumeActive: 'p1' };
    const html = render(marbleEngine.getPlayerView(state, 'p1'));
    expect(html).toContain('marble-property-sale');
    expect((html.match(/<option value="(?:1|3)"/g)??[])).toHaveLength(2);
    expect(html).not.toContain('id="mp-action-primary"');
  });

  it('labels debt-adjusted value as net worth and states fixed loan terms before the choice', () => {
    const state = createLegacyMarbleState(21);
    const view = marbleEngine.getPlayerView(state, 'p1');
    view.board.economicVersion = 1;
    view.board.debt.p1 = 0;
    view.actions = [{ label: { ko: '대출 받기 · 300 / 상환 330', es: 'Pedir préstamo · 300 / devolver 330' }, action: { type: 'borrow' } }];
    const ko = render(view);
    const es = render(view, 'es');
    expect(ko).toContain('순자산');
    expect(ko).toContain('받기 300 · 상환 330');
    expect(es).toContain('Patrimonio neto');
    expect(es).toContain('Recibes 300 y devuelves 330');
    expect(ko).toContain('<div class="mp-finance-entry">');expect(ko).not.toContain('class="mp-loan-options"');
  });

  it('shows each player’s landmark count beside city and debt totals', () => {
    const state = createLegacyMarbleState(23);
    const view = marbleEngine.getPlayerView(state, 'p1');
    view.board.tiles[3].owner = 'p1';
    view.board.tiles[3].houses = 3;
    expect(render(view)).toContain('랜드마크 1');
    expect(render(view, 'es')).toContain('Monumentos 1');
  });

  it('labels final economic-version scores as net worth and preserves older asset scoring', () => {
    const state = createLegacyMarbleState(24);
    const view = marbleEngine.getPlayerView(state, 'p1');
    view.result = { winner: 'p1', reason: 'asset turn limit', scores: { p1: 1200, p2: 900 } };
    expect(render(view)).toContain('순자산');
    expect(render(view, 'es')).toContain('Patrimonio neto');
    view.board.economicVersion = 0;
    expect(render(view)).toContain('총 자산');
    expect(render(view, 'es')).toContain('Activos totales');
  });

  it('explains remaining island turns, fixed escape cost, and available passes', () => {
    const state = createLegacyMarbleState(22);
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
    const state = createLegacyMarbleState(29);
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
    expect(html).toContain('Pulsa una casilla del tablero');
    expect(html.match(/is-travel-selectable/g)).toHaveLength(2);expect(html).not.toContain('<select id="mp-travel-destination"');expect(html).toContain('Pulsa una casilla del tablero');
    expect(html).toContain('El tren sale');
    expect(html).toContain('Destino: Santo Domingo');
    expect(html).not.toContain('rng');
    expect(html).not.toContain('eventDeck');

    view.turn = 'p2';
    view.board.turn = 'p2';
    view.actions = [];
    const waiting = render(view, 'es', 'p1');
    expect(waiting).toContain('Tu pareja está eligiendo destino de viaje');
    expect(waiting).not.toContain('El pasaje cuesta');
  });
});

it('renders a legal post-rent acquisition with complete stage costs on the two-player screen',()=>{
 const s=legacyState(5);s.phase='main';s.positions.p1=4;s.pendingTile=4;s.takeoverTile=4;s.properties[4]={owner:'p2',houses:2};
 const html=render(marbleEngine.getPlayerView(s,'p1'));
 expect(html).toContain('인수하기 · 560');expect(html).toContain('>940</b>');expect(html).toContain('인수하지 않고 차례 마치기');expect(html.match(/인수하지 않고 차례 마치기/g)).toHaveLength(1);expect(html).not.toContain('>차례 마치기<');expect(html).toContain('단계별 금액');expect(html).toContain('추가비');expect(html).toContain('누적');expect(html).toContain('불가');
});

it('preserves player ownership and images in Spanish and legacy two-player views',()=>{
 const state=createLegacyMarbleState(1);state.properties={1:{owner:'p1',houses:1},3:{owner:'p2',houses:2}};
 for(const language of ['ko','es'] as const){
  const html=render(marbleEngine.getPlayerView(state,'p1'),language);
  expect((html.match(/class="mp-property-tile-art mp-property-art-frame/g)??[])).toHaveLength(24);
  expect(html).toContain('data-marble-seat="p1"');expect(html).toContain('data-marble-seat="p2"');expect(html).toContain('data-marble-owner="bank"');
  expect(html).toContain('data-marble-price-kind="rent"');expect(html).toContain('mp-property-art-image');
 }
 const legacy={...state,boardVersion:undefined,cityRouteVersion:undefined,economicVersion:undefined,propertyRulesVersion:undefined} as typeof state;
 expect(render(marbleEngine.getPlayerView(legacy,'p1'))).toContain('data-marble-owner="p1"');
});

it('offers independent construction checkboxes, an atomic purchase, hotel lock and no center portfolio',()=>{
 const s=createLegacyMarbleState(88);s.constructionRulesVersion=2;s.phase='decision';s.positions.p1=1;s.pendingTile=1;
 const html=render(marbleEngine.getPlayerView(s,'p1'));
 expect(html).toContain('mp-construction-picker');expect(html).toContain('토지 80 포함');expect(html).toContain('빌라');expect(html).toContain('빌딩');expect(html).toContain('호텔');expect(html).toContain('출발 1회 통과 후');expect(html).toContain('구매 확정 · 80');expect(html).toContain('총 결제');expect(html).not.toContain('mp-city-portfolio');
});
it('shows travel destination cash consequences and stale-card completion copy',()=>{
 const s=createLegacyMarbleState(88);s.phase='train-decision';s.positions.p1=30;s.pendingTrainFare=0;s.properties[1]={owner:'p2',houses:0,buildings:[]};
 const html=render(marbleEngine.getPlayerView(s,'p1'));expect(html).toContain('보드에서 도착할 칸');expect(html.match(/is-travel-selectable/g)).toHaveLength(40);
 s.phase='main';s.positions.p1=2;const done=render(marbleEngine.getPlayerView(s,'p1'));expect(done).toContain('카드 효과 처리가 끝났어요.');
});

it.each([1,2] as const)('offers each START construction city once with one compact confirmation in version %s',version=>{
 const s=createLegacyMarbleState(91);s.constructionRulesVersion=version;s.phase='main';s.buildSite='start';s.positions.p1=0;s.pendingTile=0;
 s.properties[1]={owner:'p1',houses:0,...(version===2?{buildings:[]}: {})};s.properties[3]={owner:'p1',houses:0,...(version===2?{buildings:[]}: {})};
 const html=render(marbleEngine.getPlayerView(s,'p1'));
 const stage=html.split('class="mp-construction-stage"')[1]?.split('</fieldset>')[0]??'';
 const site=stage.match(/<label class="mp-construction-site">(.*?)<\/label>/)?.[1]??'';
 expect(site).toContain('건설 도시');expect(site.match(/<option /g)).toHaveLength(2);expect(site).toContain('value="1"');expect(site).toContain('value="3"');expect(site).toContain('광주');expect(site).toContain('뉴욕');
 expect(stage.match(/id="mp-action-primary"/g)).toHaveLength(1);expect(stage).toContain('mp-construction-footer');expect(stage).toContain('건너뛰기');
 expect(stage).not.toContain('mp-stage-preview');expect(stage).not.toContain('첫 구매는');expect(stage).not.toContain('건설은 구매한 도시');
});
