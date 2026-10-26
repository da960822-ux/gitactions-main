import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MarbleCityTile } from './MarbleCityTile';
import { marbleEngine } from '../games/marble';

describe('MarbleCityTile', () => {
  const board = marbleEngine.getPlayerView(marbleEngine.createInitialState(3), 'p1').board;
  const render = (index:number, owner:null|'p1', level:number, language:'ko'|'es'='ko') => {
    const tile = { ...board.tiles[index], owner, houses:level };
    return renderToStaticMarkup(createElement(MarbleCityTile, { tile, index, tileCount:40, position:[1,2], language, routeVersion:3, modern:true, selected:false, pending:false, changed:false, atSeats:[], movingSeat:null, playerId:'p1', pawnForSeat:()=> 'fox' as const, seatLabel:()=>language==='ko'?'나':'Tú', onInspect:vi.fn() }));
  };
  it('keeps title, price, owner, tier and artwork as separate readable data', () => {
    const bare = render(3,null,0);
    expect(bare).toContain('title="뉴욕"');
    expect(bare).toContain('data-marble-price-kind="purchase"');
    expect(bare).toContain('data-building-level="0"');
    expect(bare).not.toContain('premium/cities/new-york');
    const built = render(3,'p1',3,'es');
    expect(built).toContain('title="Nueva York"');
    expect(built).toContain('data-marble-price-kind="rent"');
    expect(built).toContain('data-building-level="3"');
    expect(built).toContain('premium/cities/new-york');
  });
});
