import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MarbleBoard from './MarbleBoard';
import { HwatuCard } from './HwatuCard';
import { SplendorTable } from './SplendorTable';
import DaVinciTable from './DaVinciTable';
import { JaipurBoard } from './JaipurBoard';
import { MinhwatuTable } from './MinhwatuTable';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { engines } from '../core/registry';

describe('public game boards', () => {
  it('keeps local country flags beside all saved route-v2 city names in both locales', () => {
    const engine = engines.marble!;
    const state = { ...(engine.createInitialState(7) as any), cityRouteVersion: 2 };
    const view = engine.getPlayerView(state, 'p1') as any;
    const codes = ['ca','cl','cu','do','es','fr','gb','it','jp','kr','mx','nz','ph','pr','pt','us'];
    for (const language of ['ko', 'es'] as const) {
      const html = renderToStaticMarkup(<MarbleBoard view={view} playerId="p1" language={language} runAction={() => {}}/>);
      for (const code of codes) {
        expect(html).toContain(`/images/marble/flags/${code}.svg`);
        expect(existsSync(resolve('public/images/marble/flags', `${code}.svg`))).toBe(true);
      }
    }
  });

  it('keeps island and train instructions on the active player’s Marble view only', () => {
    const view = { phase: 'island', turn: 'p1', board: { version: 2, turn: 'p1', tiles: [], positions: {p1:10,p2:3}, money: {p1:1000,p2:1000}, islandTurns: {p1:3,p2:0}, escapePasses: {p1:0,p2:0}, trainReady: {p1:false,p2:false} }, actions: [] };
    const active = renderToStaticMarkup(<MarbleBoard view={view} playerId="p1" language="es" runAction={() => {}}/>);
    const opponent = renderToStaticMarkup(<MarbleBoard view={view} playerId="p2" language="es" runAction={() => {}}/>);
    expect(active).toContain('Estás en la isla · 3 turnos');
    expect(opponent).not.toContain('Estás en la isla');
    const train = { ...view, phase: 'train-decision', board: { ...view.board, pendingTrainFare: 100 } };
    expect(renderToStaticMarkup(<MarbleBoard view={train} playerId="p1" language="es" runAction={() => {}}/>)).toContain('El pasaje cuesta 100');
    expect(renderToStaticMarkup(<MarbleBoard view={train} playerId="p2" language="es" runAction={() => {}}/>)).not.toContain('El pasaje cuesta 100');
  });

  it('shows Jaipur remaining bonus counts from the private-safe engine view', () => {
    const engine = engines.jaipur!;
    const view = engine.getPlayerView(engine.createInitialState(7), 'p2') as any;
    const html = renderToStaticMarkup(<JaipurBoard view={view} playerId="p2" language="ko" runAction={() => {}}/>);
    for (const count of [7, 6, 5]) expect(html).toContain(`<strong>${count} <small>남음</small></strong>`);
    expect(html).toContain('상대 · 상대 차례');
    expect(html).toContain('나');
  });

  it('keeps Da Vinci tile colors visible while hiding unrevealed numbers', () => {
    const html = renderToStaticMarkup(<DaVinciTable language="ko" playerId="p1" runAction={() => {}} view={{board:{opponentTiles:[{color:'white',value:11,revealed:false}]},actions:[]}}/>);
    expect(html).toContain('dv-tile-white');
    expect(html).toContain('· ·');
    expect(html).not.toContain('<b>11</b>');
  });

  it('uses a complete 48-face Hwatu deck with a separate image for every engine card', () => {
    const state = engines.minhwatu!.createInitialState(4) as any;
    const cards = [...state.hands.p1, ...state.hands.p2, ...state.table, ...state.deck];
    expect(cards).toHaveLength(48);
    const paths = cards.map(card => `/images/hwatu/${card.id.split('-').map((part: string) => part.padStart(2, '0')).join('-')}.svg`);
    expect(new Set(paths).size).toBe(48);
    const html = renderToStaticMarkup(<>{cards.map(card => <HwatuCard key={card.id} card={card} language="ko"/>)}</>);
    for (const path of paths) {
      expect(html).toContain(`src="${path}"`);
      const file = resolve('public', path.slice(1));
      expect(existsSync(file), path).toBe(true);
      expect(readFileSync(file, 'utf8'), path).toContain('<svg');
    }
    expect(html).not.toContain('gb-hwatu-flower');
  });
});

describe('card controls', () => {
  it('only exposes legal Hwatu plays on the matching hand card', () => {
    const state = engines.minhwatu!.createInitialState(4) as any;
    const view = engines.minhwatu!.getPlayerView(state, 'p1') as any;
    const firstChoice = view.actions.find((choice: any) => choice.action.type === 'play');
    const singleChoice = { ...view, actions: [firstChoice] };
    const html = renderToStaticMarkup(<MinhwatuTable view={singleChoice} playerId="p1" language="ko" runAction={() => {}}/>);
    expect(html.match(/class="hwatu-hand-choice [^"]*is-playable/g)).toHaveLength(1);
    const waiting = engines.minhwatu!.getPlayerView(state, 'p2') as any;
    const hiddenControls = renderToStaticMarkup(<MinhwatuTable view={waiting} playerId="p2" language="ko" runAction={() => {}}/>);
    expect(hiddenControls).not.toContain('is-playable');
  });
});

describe('original Splendor faces', () => {
  it('matches all 90 faces to the engine tier, bonus, points and five-color costs', async () => {
    const art = (await import('../../public/images/splendor/card-map.json')).default;
    const { canonicalCards } = await import('../games/splendorCards');
    expect(art.cards).toHaveLength(90);
    const offsets = {1:0,2:0,3:0};
    for (const card of canonicalCards) {
      const id = `t${card.tier}-${String(++offsets[card.tier]).padStart(2,'0')}`;
      const face = art.cards.find(item => item.engineId === id)!;
      expect(face.signature.tier).toBe(card.tier);
      expect(face.signature.bonus).toBe(card.bonus);
      expect(face.signature.points).toBe(card.points);
      for(const gem of ['white','blue','green','red','black'] as const) expect((face.signature.cost as Partial<Record<string,number>>)[gem] ?? 0).toBe(card.cost[gem] ?? 0);
      expect(existsSync(resolve('public/images/splendor',face.src))).toBe(true);
      const html = renderToStaticMarkup(<SplendorTable view={{ownHand:{tokens:{},reserved:[{...card,id}]},board:{market:{[card.tier]:[{...card,id}]}},actions:[]}} language="ko" playerId="p1" runAction={() => {}}/>);
      expect(html).toContain(`/images/splendor/${face.src}`);
      expect(html).toContain('data-artwork-only="card"');
      expect(html).toContain('viewBox="85 90 165 260"');
      expect(html).not.toContain(`<img src="/images/splendor/${face.src}`);
      expect(html).toContain(`class="sp-card-prestige">${card.points} 점</b>`);
      for (const [gem, amount] of Object.entries(card.cost)) {
        const value = html.match(new RegExp(`class="sp-card-cost-chip sp-color-${gem}"[\\s\\S]*?<b>(\\d+)</b>`));
        expect(Number(value?.[1])).toBe(amount);
        const reservedValue = html.match(new RegExp(`class="sp-reserved-cost-chip sp-color-${gem}"[\\s\\S]*?<b>(\\d+)</b>`));
        expect(Number(reservedValue?.[1])).toBe(amount);
      }
    }
    expect(new Set(art.cards.map(item=>item.src)).size).toBe(90);
    expect(art.nobles).toHaveLength(10);
    for(const noble of art.nobles) expect(existsSync(resolve('public/images/splendor',noble.src))).toBe(true);
  });
});


describe('Splendor equal-score result explanation', () => {
  it('explains the existing fewer-card tiebreak in both players’ languages only when it determines the winner', () => {
    for (const playerId of ['p1', 'p2'] as const) for (const language of ['ko', 'es'] as const) {
      const expected = language === 'ko' ? '같은 점수라 개발 카드가 적은 쪽이 이겼어요.' : 'Con los mismos puntos, ganó quien tiene menos cartas de desarrollo.';
      const view = { board: {}, ownHand: {}, actions: [], result: { winner: 'p1', scores: { p1: 15, p2: 15 } } };
      const render = (result: typeof view.result) => renderToStaticMarkup(<SplendorTable view={{ ...view, result }} playerId={playerId} language={language} runAction={() => {}}/>);
      expect(render(view.result)).toContain(expected);
      expect(render({ winner: 'draw', scores: { p1: 15, p2: 15 } })).not.toContain(expected);
      expect(render({ winner: 'p1', scores: { p1: 16, p2: 15 } })).not.toContain(expected);
    }
  });
});
