import { savedMarbleState } from './marble-legacy-test-fixture';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MarbleCityTile } from './MarbleCityTile';
import { marbleEngine } from '../games/marble';

describe('MarbleCityTile', () => {
  const board = marbleEngine.getPlayerView(savedMarbleState(3), 'p1').board;
  const render = (index:number, owner:null|'p1', level:number, language:'ko'|'es'='ko', tileCount=40) => {
    const tile = { ...board.tiles[index], owner, houses:level };
    return renderToStaticMarkup(createElement(MarbleCityTile, { tile, index, tileCount, position:[1,2], language, routeVersion:3, modern:true, selected:false, pending:false, changed:false, atSeats:[], movingSeat:null, playerId:'p1', pawnForSeat:()=> 'fox' as const, seatLabel:()=>language==='ko'?'나':'Tú', onInspect:vi.fn() }));
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
  it('uses the same edge zones for the 32 cell route',()=>{
    expect(render(3,null,0,'ko',32)).toContain('mp-tile--west');
    expect(render(3,null,0,'ko',32)).toContain('data-mp-edge="left"');
  });
  it('marks a bank-purchasable tourism tile without a building level',()=>{
    const tile={kind:'tourism',name:{ko:'독도',es:'Dokdo'},price:250000,rent:200000,owner:null,houses:0};
    const html=renderToStaticMarkup(createElement(MarbleCityTile,{tile,index:4,tileCount:32,position:[5,9],language:'ko',routeVersion:4,modern:true,selected:false,pending:false,changed:false,atSeats:[],movingSeat:null,playerId:'p1',pawnForSeat:()=> 'fox' as const,seatLabel:()=> '나',onInspect:vi.fn()}));
    expect(html).toContain('data-tourism-label="관광"');
    expect(html).toContain('은행에서 구매 가능, 상대에게 인수 불가');
    expect(html).toContain('25만');
    expect(html).not.toContain('mp-building-badge');
  });
});
