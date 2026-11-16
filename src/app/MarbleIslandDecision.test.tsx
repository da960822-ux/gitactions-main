import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect,vi} from 'vitest';
import {MarbleIslandDecision} from './MarbleIslandDecision';
import {marbleEngine} from '../games/marble';
import {fourMarbleEngine} from '../games/fourMarble';
it.each([2,4])('keeps engine-issued island options together, affordable and localized for %sp',count=>{
 const engine:any=count===2?marbleEngine:fourMarbleEngine;
 for(const language of ['ko','es'] as const)for(const cash of [99,100])for(const passes of [0,1]){
  const state=engine.createInitialState(9);state.phase='island';state.islandTurns.p1=2;state.escapePasses.p1=passes;state.money.p1=cash;
  const choices=engine.getPlayerView(state,'p1').actions;
  const html=renderToStaticMarkup(createElement(MarbleIslandDecision,{choices,turns:2,passes,cash,language,disabled:false,onAction:vi.fn(),id:'primary'}));
  expect(html).toContain('mp-island-options');expect(html).toContain(language==='ko'?'남은 차례 2':'2 turnos pendientes');
  expect(html.includes(language==='ko'?'현금 부족':'Efectivo insuficiente')).toBe(cash<100);
  expect(html.includes('disabled=""')).toBe(cash<100);
  expect(html.includes(language==='ko'?'탈출권 1장 보유':'tienes 1 pase')).toBe(passes>0);
  expect((html.match(/<button/g)??[]).length).toBe(passes?3:2);
 }
});

it('keeps landmark artwork unobstructed without changing shared board dimensions',()=>{
 const css=readFileSync(new URL('./marble-board-readable.css',import.meta.url),'utf8');
 expect(css).toContain('.mp-table-projection .mp-property-art-frame[data-building-level="3"] > .mp-city-owner-flag { display:none; }');
 expect(css).toContain('.mp-tile-owner-layer .mp-ownership-label');
});
