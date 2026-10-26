import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { fourSplendorEngine } from '../games/fourSplendor';
import SplendorTeamTable from './SplendorTeamTable';

describe('dedicated four-player Splendor table', () => {
  it('renders four independent public wallets, both team totals, five nobles and twelve market cards', () => {
    const state = fourSplendorEngine.createInitialState(17);
    state.hands.p1.blue = 1; state.hands.p2.blue = 2; state.hands.p3.blue = 3; state.hands.p4.blue = 4;
    state.bonuses.p1.red = 1; state.bonuses.p2.red = 2; state.bonuses.p3.red = 3; state.bonuses.p4.red = 4;
    const view = fourSplendorEngine.getPlayerView(state, 'p1');
    const html = renderToStaticMarkup(<SplendorTeamTable view={view} language="ko" nickname="연석" runAction={async () => true}/>);
    expect(html).toContain('data-splendor-seats="4"');
    const top = html.slice(html.indexOf('class="spt-players"'), html.indexOf('class="spt-phase"'));
    expect(top.match(/data-player-seat="p[2-4]"/g)).toHaveLength(3);
    expect(top).not.toContain('data-player-seat="p1"');
    const personal = html.slice(html.indexOf('class="spt-personal-area"'));
    expect(personal).toContain('aria-label="내 보석과 영구 할인"');
    expect(personal).toContain('aria-label="내 보유 토큰"');
    expect(personal).toContain('aria-label="내 영구 할인"');
    expect(personal).toContain('aria-label="파랑 1"');
    expect(personal).toContain('aria-label="빨강 −1"');
    expect(personal.match(/class="sp-treasury-gem"/g)).toHaveLength(6);
    expect(html).toContain('aria-label="상대와 팀원의 공개 자원"');
    expect(html.match(/data-player-seat="p[1-4]"/g)).toHaveLength(4);
    expect(html.match(/data-sp-noble-id=/g)).toHaveLength(5);
    expect(html.match(/data-source-zone="market"/g)).toHaveLength(12);
    expect(html).toContain('연석');
    expect(html).toContain('AI 팀원');
    expect(html).toContain('상대 AI 1');
    expect(html).toContain('상대 AI 2');
    expect(html.match(/\/30<\/small>/g)).toHaveLength(2);
    expect(html).not.toContain('15점');
    expect(html).not.toContain('sp-scorebar');
    expect(html).not.toContain('<select');
    expect(html).toContain('title="파랑"');
    expect(html).toContain('src="/images/splendor-gems/blue.svg"');
    expect(html).toContain('srcSet="/images/game-premium-tokens/splendor/blue.webp"');
  });

  it('shows only the human reservations and includes direct gem and blind-deck controls', () => {
    let state = fourSplendorEngine.createInitialState(17);
    state = fourSplendorEngine.applyAction(state, 'p1', { type: 'reserve', payload: { tier: 3 } });
    state = fourSplendorEngine.applyAction(state, 'p2', { type: 'reserve', payload: { tier: 2 } });
    state = fourSplendorEngine.applyAction(state, 'p3', { type: 'reserve', payload: { tier: 1 } });
    state = fourSplendorEngine.applyAction(state, 'p4', { type: 'reserve', payload: { tier: 3 } });
    const view = fourSplendorEngine.getPlayerView(state, 'p1');
    const html = renderToStaticMarkup(<SplendorTeamTable view={view} language="es" runAction={async () => true}/>);
    expect(html.match(/data-source-zone="reserved"/g)).toHaveLength(1);
    expect(html).toContain(`data-card-id="${state.reserved.p1[0].id}"`);
    for (const seat of ['p2', 'p3', 'p4']) expect(html).not.toContain(`data-card-id="${state.reserved[seat][0].id}"`);
    expect(html).toContain('aria-label="Banco de gemas"');
    expect(html).toContain('aria-label="Azul: 7"');
    expect(html).toContain('aria-label="Elegir 2 gemas Azul"');
    expect(html).toContain('aria-label="Reservar del mazo de nivel 3"');
    expect(html).toContain('aria-label="Tus cartas reservadas"');
  });

  it('adds accessible public opponent detail controls without revealing reserved card identities', () => {
    let state = fourSplendorEngine.createInitialState(27);
    const hidden = state.market[2][0].id;
    state = fourSplendorEngine.applyAction(state, 'p1', { type: 'take', payload: { gems: ['white', 'blue', 'green'] } });
    state = fourSplendorEngine.applyAction(state, 'p2', { type: 'reserve', payload: { tier: 2, index: 0 } });
    const html = renderToStaticMarkup(<SplendorTeamTable view={fourSplendorEngine.getPlayerView(state, 'p1')} language="es" runAction={async () => true}/>);
    expect(html.match(/aria-haspopup="dialog"/g)).toHaveLength(3);
    expect(html).not.toContain(`data-card-id="${hidden}"`);
  });

  it('keeps the same game-specific table for waiting, final equal-turn play and team results', () => {
    const state = fourSplendorEngine.createInitialState(17);
    state.active = 'p3'; state.pendingEnd = true;
    const view = fourSplendorEngine.getPlayerView(state, 'p1');
    const waiting = renderToStaticMarkup(<SplendorTeamTable view={view} language="ko" runAction={async () => true}/>);
    expect(waiting).toContain('AI 팀원 차례');
    expect(waiting).toContain('data-player-seat="p3"');
    view.result = { winner: 'A', scores: { A: 31, B: 26 }, reason: { ko: '팀 합계', es: 'Puntos de equipo' } };
    const finished = renderToStaticMarkup(<SplendorTeamTable view={view} language="ko" runAction={async () => true} onReplay={() => {}} onExit={() => {}}/>);
    expect(finished).toContain('우리 팀 승리');
    expect(finished).toContain('다시 하기');
    expect(finished).toContain('나가기');
    expect(finished).toContain('href="/images/splendor/cards/');
  });
});
