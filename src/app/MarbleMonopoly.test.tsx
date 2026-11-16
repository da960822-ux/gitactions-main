import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { marbleEngine } from '../games/marble';
import { fourMarbleEngine } from '../games/fourMarble';
import { MarbleMonopolyStatus, marbleMonopolyGroups, marbleMonopolyThreats, marbleOwnershipProgress } from './MarbleMonopoly';

for (const [name, engine, four] of [['2p', marbleEngine, false], ['4p', fourMarbleEngine, true]] as const) describe(`${name} monopoly presentation from engine public facts`, () => {
  const read = (s: any) => { const v = engine.getPlayerView(s, 'p1') as any; return four ? v.publicBoard.map((tile: any, i: number) => ({...tile,owner:v.publicState.properties[i]?.owner??null})) : v.board.tiles; };
  const fixture = () => { const s = engine.createInitialState(1) as any; const tiles = read(s); const group = tiles.find((t:any)=>t.kind==='property').group; const ids = tiles.flatMap((t:any,i:number)=>t.kind==='property'&&t.group===group?[i]:[]); return {s,ids,group}; };
  it('warns one city before an opponent monopoly and shows actual completed multiplier', () => {
    const {s,ids,group}=fixture(); ids.slice(0,-1).forEach((i:number)=>s.properties[i]={owner:'p2',houses:0});
    const near=marbleMonopolyGroups(read(s),true).find(x=>x.group===group)!;
    expect(near.remaining).toEqual([ids.at(-1)]); expect(near.complete).toBe(false); expect(near.multiplier).toBeNull();
    expect(marbleMonopolyThreats([near],'p1',four?'p3':null)).toHaveLength(1);
    s.properties[ids.at(-1)!]={owner:'p2',houses:0};
    const done=marbleMonopolyGroups(read(s),true).find(x=>x.group===group)!;
    expect(done.complete).toBe(true); expect(done.multiplier).toBe(1);
    s.boardRevision=2;expect(marbleMonopolyGroups(read(s),true).find(x=>x.group===group)!.multiplier).toBe(2);
  });
  it('clears completion on sale/takeover and reconstructs identically after save/load', () => {
    const {s,ids}=fixture();ids.forEach((i:number)=>s.properties[i]={owner:'p1',houses:0});
    const before=marbleMonopolyGroups(read(s),true);
    expect(marbleMonopolyGroups(read(JSON.parse(JSON.stringify(s))),true)).toEqual(before);
    delete s.properties[ids[0]];expect(marbleMonopolyGroups(read(s),true).some(x=>x.complete)).toBe(false);
    s.properties[ids[0]]={owner:'p2',houses:0};expect(marbleMonopolyGroups(read(s),true).some(x=>x.complete)).toBe(false);
  });
  it('does not change rendered notifications on unrelated turns', () => {
    const {s,ids}=fixture();ids.slice(0,-1).forEach((i:number)=>s.properties[i]={owner:'p2',houses:0});
    const render=()=>renderToStaticMarkup(createElement(MarbleMonopolyStatus,{groups:marbleMonopolyGroups(read(s),true),playerId:'p1',language:'ko',seatLabel:(seat:string)=>seat}));
    const before=render();s.turns+=1;s.actionSequence+=1;expect(render()).toBe(before);
  });
});
it('does not aggregate allied ownership or call an ally a threat',()=>{
  const tiles=[{kind:'property',group:'red',owner:'p1',monopolyMultiplier:1},{kind:'property',group:'red',owner:'p3',monopolyMultiplier:1}];
  const groups=marbleMonopolyGroups(tiles,true);expect(groups.every(g=>!g.complete)).toBe(true);expect(marbleMonopolyThreats(groups,'p1','p3')).toEqual([]);
  expect(marbleMonopolyGroups(tiles,false)).toEqual([]);
});
it('does not invent a missing multiplier and keeps reduced-motion status static',()=>{
  const groups=marbleMonopolyGroups([{kind:'property',group:'red',owner:'p1'},{kind:'property',group:'red',owner:'p1'}],true);
  expect(groups[0].multiplier).toBeNull();
  const html=renderToStaticMarkup(createElement(MarbleMonopolyStatus,{groups,playerId:'p1',language:'ko',seatLabel:(s:string)=>s}));expect(html).not.toContain('×2');
  const css=readFileSync(new URL('./marble-monopoly.css',import.meta.url),'utf8');expect(css).toContain('prefers-reduced-motion:reduce');expect(css).toContain('animation:none!important');expect(css).not.toContain('@keyframes');
});

it('excludes all eight tourism islands from color groups even with an accidental group field',()=>{const islands=Array.from({length:8},()=>({kind:'tourism',group:'world-g1',owner:'p1',monopolyMultiplier:1}));expect(marbleMonopolyGroups(islands,true)).toEqual([]);});

for (const [name, engine, four] of [['2p', marbleEngine, false], ['4p', fourMarbleEngine, true]] as const) describe(`${name} three ownership victory goals`, () => {
  const read=(s:any)=>{const v=engine.getPlayerView(s,'p1') as any;return four?v.publicBoard.map((tile:any,i:number)=>({...tile,owner:s.properties[i]?.owner??null})):v.board.tiles;};
  it('derives island-inclusive line, three-color and all-tourism counts; clears after sale',()=>{
    const s=engine.createInitialState(1) as any;
    let tiles=read(s);const required=tiles.flatMap((t:any,i:number)=>i<8&&['property','tourism'].includes(t.kind)?[i]:[]);
    required.filter((i:number)=>tiles[i].kind!=='tourism').forEach((i:number)=>s.properties[i]={owner:'p2',houses:0});
    let p=marbleOwnershipProgress(read(s),['p1','p2'],'world-islands-32-v1')[1];expect(p.closestLine.missing).toEqual(required.filter((i:number)=>tiles[i].kind==='tourism'));
    required.forEach((i:number)=>s.properties[i]={owner:'p2',houses:0});p=marbleOwnershipProgress(read(s),['p2'],'world-islands-32-v1')[0];expect(p.closestLine.missing).toEqual([]);
    delete s.properties[2];expect(marbleOwnershipProgress(read(s),['p2'],'world-islands-32-v1')[0].closestLine.missing).toEqual([2]);
    tiles.forEach((t:any,i:number)=>{if(t.kind==='tourism'||['world-g1','world-g3','world-g4'].includes(t.group))s.properties[i]={owner:'p2',houses:0};});
    p=marbleOwnershipProgress(read(s),['p2'],'world-islands-32-v1')[0];expect(p.completedColors).toBeGreaterThanOrEqual(3);expect(p.colorMissing).toEqual([]);expect(p.touristMissing).toEqual([]);expect(p.tourismRequired).toBe(tiles.filter((t:any)=>t.kind==='tourism').length);
    expect(marbleOwnershipProgress(read(JSON.parse(JSON.stringify(s))),['p2'],'world-islands-32-v1')[0]).toEqual(p);
  });
});
it('gates legacy profiles, never combines allies, derives a changed tourism roster and localizes goals',()=>{
 const tiles=Array.from({length:32},(_,i)=>({kind:i===2||i===16?'tourism':'event',name:{ko:`칸${i}`,es:`Casilla${i}`},owner:i===2?'p1':'p3'}));
 expect(marbleOwnershipProgress(tiles,['p1'],'legacy40')).toEqual([]);
 const p=marbleOwnershipProgress(tiles,['p1','p3'],'world-islands-32-v1');expect(p[0].tourismRequired).toBe(2);expect(p[0].touristMissing).toEqual([16]);expect(p[1].touristMissing).toEqual([2]);
 const html=renderToStaticMarkup(createElement(MarbleMonopolyStatus,{groups:[],tiles,seats:['p1','p3'],boardProfile:'world-islands-32-v1',playerId:'p1',teammateSeat:'p3',language:'es',seatLabel:(s:string)=>s}));expect(html).toContain('Islas');expect(html).toContain('Línea');expect(html).not.toContain('Riesgo de victoria');
});
it('warns an opponent one acquisition before each victory goal and clears on ownership loss',()=>{
 const s=marbleEngine.createInitialState(1) as any;
 const read=()=> (marbleEngine.getPlayerView(s,'p1') as any).board.tiles;
 const render=()=>renderToStaticMarkup(createElement(MarbleMonopolyStatus,{groups:[],tiles:read(),seats:['p1','p2'],boardProfile:s.boardProfile,playerId:'p1',language:'ko',seatLabel:(seat:string)=>seat}));
 const tiles=read();
 const own=(indices:number[])=>{s.properties=Object.fromEntries(indices.map(i=>[i,{owner:'p2',houses:0}]));};
 const islands=tiles.flatMap((t:any,i:number)=>t.kind==='tourism'?[i]:[]);own(islands.slice(0,-1));expect(render()).toContain('승리 위험');expect(render()).toContain('p2 · 관광지');delete s.properties[islands[0]];expect(render()).not.toContain('p2 · 관광지');
 const line=tiles.flatMap((t:any,i:number)=>i<8&&['property','tourism'].includes(t.kind)?[i]:[]);own(line.slice(0,-1));expect(render()).toContain('p2 · 라인');delete s.properties[line[0]];expect(render()).not.toContain('p2 · 라인');
 const cities=tiles.flatMap((t:any,i:number)=>['world-g1','world-g3','world-g4'].includes(t.group)?[i]:[]);own(cities.slice(0,-1));expect(render()).toContain('p2 · 컬러 3군');delete s.properties[cities[0]];expect(render()).not.toContain('p2 · 컬러 3군');
});

for(const language of ['ko','es'] as const) it(`shows color ownership without a toll bonus for revision3 ${language}`,()=>{
 const tiles=[{kind:'property',group:'world-g1',owner:'p1',monopolyMultiplier:1},{kind:'property',group:'world-g1',owner:'p1',monopolyMultiplier:1}];
 const groups=marbleMonopolyGroups(tiles,true);expect(groups[0].complete).toBe(true);
 const html=renderToStaticMarkup(createElement(MarbleMonopolyStatus,{groups,playerId:'p1',language,boardRevision:3,seatLabel:(s:string)=>s}));
 expect(html).not.toContain('×1');expect(html).not.toContain('×2');expect(html).toContain(language==='ko'?'독점':'completo');
});
