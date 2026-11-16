import { marbleDestinationImage } from './marble-destination-art';
import { marbleRuntimeImage } from './marble-runtime-images';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MarbleCityTile } from './MarbleCityTile';
import { MarbleBoardShell } from './MarbleBoardShell';
import { marbleEngine } from '../games/marble';
import dioramas from '../../public/images/marble/dioramas/manifest.json';

describe('MarbleCityTile', () => {
  const board = marbleEngine.getPlayerView({...marbleEngine.createInitialState(3),boardProfile:undefined,cityRouteVersion:3}, 'p1').board;
  const render = (index:number, owner:null|'p1', level:number, language:'ko'|'es'='ko') => {
    const tile = { ...board.tiles[index], owner, houses:level, buildings: level === 1 ? ['villa'] : level === 2 ? ['villa','building','hotel'] : [], landmark:level === 3 };
    return renderToStaticMarkup(createElement(MarbleCityTile, { tile, index, tileCount:40, position:[1,2], language, routeVersion:3, modern:true, selected:false, pending:false, changed:false, atSeats:[], movingSeat:null, playerId:'p1', pawnForSeat:()=> 'fox' as const, seatLabel:()=>language==='ko'?'나':'Tú', onInspect:vi.fn() }));
  };
  it('keeps title, price, owner, tier and artwork as separate readable data', () => {
    const bare = render(3,null,0);
    expect(bare).toContain('title="뉴욕"');
    expect(bare).toContain('data-marble-price-kind="purchase"');
    expect(bare).toContain('data-building-level="0"');
    expect(bare).not.toContain(marbleRuntimeImage('new-york-statue-of-liberty-v2.png'));
    const built = render(3,'p1',3,'es');
    expect(built).toContain('title="Nueva York"');
    expect(built).toContain('data-marble-price-kind="rent"');
    expect(built).toContain('data-building-level="3"');
    expect(built).toContain(marbleRuntimeImage('new-york-statue-of-liberty-v2.png'));
  });
  it('uses the same house and apartment assets as the enlarged city card', () => {
    expect(render(3,'p1',1)).toContain(dioramas.commonStages.house.path!);
    const cluster=render(3,'p1',2);
    expect(cluster).toContain(dioramas.commonStages.apartment.path!);
    expect(cluster).toContain('빌라 + 빌딩 + 호텔');
    expect(cluster).not.toContain('2단계');
    expect(cluster).toContain('>P1</span>');
  });
});

describe('Korea research city and settled arrival',()=>{
 it('uses a generic building family, no foreign landmark, and names ownership without a stage number',()=>{
 const html=renderToStaticMarkup(createElement(MarbleCityTile,{tile:{kind:'property',name:{ko:'강릉',es:'Gangneung'},group:'korea-g1',owner:'p1',houses:2,buildings:['villa','building','hotel'],landmark:false},index:1,tileCount:32,position:[8,9],language:'ko',routeVersion:4,modern:true,selected:false,pending:false,changed:false,arrivalSeat:'p1',atSeats:['p1'],movingSeat:null,playerId:'p1',pawnForSeat:()=> 'fox' as const,seatLabel:()=> '나',onInspect:vi.fn()}));
 expect(html).toContain('data-mp-edge="bottom"');
 expect(html).toContain('data-arrival-ownership="mine"');
 expect(html).toContain('내 땅');
 expect(html).toContain('조사 중');
 expect(html).toContain('data-building-kind="hotel"');
 expect(html).not.toContain('/premium/cities/');
 expect(html).not.toContain('2단계');
 });
});

it('projects both 32 and 40-cell shells without changing their cell counts',()=>{
 const draw=(tileCount:number)=>renderToStaticMarkup(createElement(MarbleBoardShell,{tileCount,language:'ko',children:null}));
 expect(draw(32)).toContain('mp-table-projection');
 expect(draw(32)).toContain('mp-board-grid--32');
 expect(draw(40)).toContain('mp-table-projection');
 expect(draw(40)).toContain('mp-board-grid--40');
});

it('keeps landmark ownership explicit and updates when acquired or teammate-owned',()=>{
 const draw=(owner:'p1'|'p2'|'p3')=>renderToStaticMarkup(createElement(MarbleCityTile,{tile:{kind:'property',name:{ko:'뉴욕',es:'Nueva York'},owner,buildings:[],landmark:true},index:3,tileCount:40,position:[8,11],language:'ko',routeVersion:3,modern:true,selected:false,pending:false,changed:false,atSeats:[],movingSeat:null,playerId:'p1',teammateSeat:'p3',pawnForSeat:()=> 'fox' as const,seatLabel:s=>s,onInspect:vi.fn()}));
 expect(draw('p1')).toContain('내 땅 · P1');
 expect(draw('p2')).toContain('상대 · P2');
 expect(draw('p3')).toContain('우리 팀 · P3');
 expect(draw('p1')).toContain('mp-owner-floor');
 expect(draw('p1')).toContain(marbleRuntimeImage('new-york-statue-of-liberty-v2.png'));
 expect(draw('p2')).not.toContain('내 땅');
});

it('keeps world tourism artwork and ownership without building stages or Korean park marks',()=>{
 const html=renderToStaticMarkup(createElement(MarbleCityTile,{tile:{kind:'tourism',name:{ko:'몰디브',es:'Maldivas'},price:150,rent:120,owner:'p1'},index:2,tileCount:32,position:[7,9],language:'ko',routeVersion:5,modern:true,selected:false,pending:false,changed:false,atSeats:[],movingSeat:null,playerId:'p1',pawnForSeat:()=> 'fox' as const,seatLabel:s=>s,onInspect:vi.fn()}));
 expect(html).toContain(marbleDestinationImage('몰디브'));
 expect(html).toContain('내 땅 · P1');
 expect(html).toContain('data-marble-owner="p1"');
 expect(html).not.toContain('mp-korea-mark');
 expect(html).not.toContain('data-building-kind');
});

it.each(['ko','es'] as const)('keeps every world city/island name stable through purchase and takeover (%s)',language=>{
 const view=marbleEngine.getPlayerView(marbleEngine.createInitialState(71),'p1');
 for(const [index,tile] of view.board.tiles.entries()){
  if(!['property','tourism'].includes(tile.kind))continue;
  const draw=(owner:null|'p1'|'p2')=>renderToStaticMarkup(createElement(MarbleCityTile,{tile:{...tile,owner,buildings:['villa'],landmark:false},index,tileCount:32,position:[8,9],language,routeVersion:5,modern:true,selected:false,pending:false,changed:false,atSeats:[],movingSeat:null,playerId:'p1',pawnForSeat:()=> 'fox' as const,seatLabel:s=>s,onInspect:vi.fn()}));
  const title=(html:string)=>html.match(/class="mp-tile-name" title="([^"]+)"/)?.[1];
  expect(title(draw('p1'))).toBe(title(draw(null)));
  expect(title(draw('p2'))).toBe(title(draw(null)));
  for(const owner of ['p1','p2'] as const){
   const html=draw(owner),nameLane=html.slice(html.indexOf('<div class="mp-property-tile-copy">'),html.indexOf('<small class="mp-tile-economy">'));
   expect(nameLane).not.toContain('mp-ownership-label');
   expect(html).toContain('class="mp-tile-owner-layer"');
  }
 }
});

it('renders festival corner as a semantic event without tourism art, price or ownership',()=>{
 const html=renderToStaticMarkup(createElement(MarbleCityTile,{tile:{kind:'festival-site',name:{ko:'축제 개최',es:'Celebrar un festival'},owner:'p1'},index:16,tileCount:32,position:[1,1],language:'es',routeVersion:5,modern:true,selected:false,pending:false,changed:false,atSeats:[],movingSeat:null,playerId:'p1',pawnForSeat:()=> 'fox' as const,seatLabel:s=>s,onInspect:vi.fn()}));
 expect(html).toContain(marbleDestinationImage('festival-site'));
 expect(html).toContain('Celebrar un festival');
 expect(html).not.toContain('tropical-island');
 expect(html).not.toContain('mp-island-price');
 expect(html).not.toContain('mp-tile-owner-layer');
});

it('marks a complete color without a fake toll multiplier in revision3',()=>{
 const tile={kind:'property',name:{ko:'광주',es:'Gwangju'},owner:'p1',group:'world-g1',price:35,rent:6};
 for(const multiplier of [1,2]) {
 const html=renderToStaticMarkup(createElement(MarbleCityTile,{tile,index:1,tileCount:32,position:[1,2],language:'es',routeVersion:5,modern:true,selected:false,pending:false,changed:false,atSeats:[],movingSeat:null,playerId:'p1',pawnForSeat:()=> 'fox' as const,seatLabel:()=> 'Tú',onInspect:()=>{},monopoly:{group:'world-g1',owner:'p1',tiles:[1,3],remaining:[],complete:true,multiplier}}));
 expect(html).toContain('mp-monopoly-badge');expect(html).toContain('monopolio');expect(html).not.toContain('×1');expect(html.includes('×2')).toBe(multiplier===2);
 }
});
