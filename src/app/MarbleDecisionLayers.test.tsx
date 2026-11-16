import { marbleRuntimeImage } from './marble-runtime-images';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync, existsSync} from 'node:fs';
import {describe,it,expect,vi} from 'vitest';
import {marbleEngine} from '../games/marble';
import {fourMarbleEngine} from '../games/fourMarble';
import {worldIslandsBoardFor} from '../games/marbleWorldIslands';
import MarbleBoard from './MarbleBoard';
import MarbleTeamBoard from './MarbleTeamBoard';
const css=readFileSync(new URL('./marble-board-readable.css',import.meta.url),'utf8');
const constructionCss=readFileSync(new URL('./marble-construction.css',import.meta.url),'utf8');
const layers=css.slice(css.indexOf('/* Keep the opaque board floor below ownership;'));
const city=worldIslandsBoardFor(2).findIndex(tile=>tile.name.ko==='뉴욕');
describe('ownership and active decision layer contract',()=>{
 it('contains the takeover hotel inside its art slot without shrinking board hotels',()=>{
  expect(constructionCss).toMatch(/\.mp-ownership-decision \.mp-ownership-choice-art\.mp-building-cluster \.mp-cluster-hotel\s*\{\s*height:100%;\s*bottom:0;/);
  expect(css).toMatch(/\.mp-table-projection \.mp-building-cluster \.mp-cluster-hotel\s*\{[^}]*height:110%;[^}]*bottom:18%;/);
 });
 it('keeps ribbons above passive center and below all active decision kinds',()=>{
  expect(css).toMatch(/\.mp-tile-owner-layer\s*\{[^}]*z-index:100/);
  expect(layers).toContain('.mp-board-center { z-index:auto; }');
  expect(layers).toContain('.mp-board-center > .mp-center-stage:is(');
  expect(layers).toContain('z-index:110!important');
  for(const file of ['marble-construction.css','marble-card-decision.css','marble-finance.css'])expect(readFileSync(new URL(`./${file}`,import.meta.url),'utf8')).not.toMatch(/\.mp-board-center:has\([^{}]+\)\s*\{[^{}]*z-index/);
  for(const name of ['construction-stage','ownership-decision','debt-decision','travel-decision','card-decision','card-selection','center-receipt','stage--rent-decision','stage--island','stage--decision'])expect(layers).toContain(`.mp-${name}`);
  expect(layers).not.toContain('.mp-stage--roll');expect(layers).not.toContain('.mp-stage--main');
 });
 for(const count of [2,4])for(const language of ['ko','es'] as const)for(const scenario of ['landmark','takeover','passive','debt','travel'])it(`${count}p ${language} ${scenario} retains ownership and the intended decision surface`,()=>{
  const engine:any=count===2?marbleEngine:fourMarbleEngine,s=engine.createInitialState(9);
  s.boardRevision=2;s.phase=scenario==='passive'?'roll':'main';s.money.p1=10000;s.positions.p1=city;s.pendingTile=city;s.buildSite=city;s.landmarkOptions=[city];s.completedLaps.p1=2;
  s.properties[city]={owner:scenario==='takeover'?'p2':'p1',houses:2,buildings:['villa','building','hotel'],landmark:false};s.takeoverTile=scenario==='takeover'?city:null;
  if(scenario==='debt'){s.phase='debt';s.money.p1=0;s.pendingPayment={amount:500,creditor:'bank',reason:{ko:'세금',es:'Impuesto'}};}
  if(scenario==='travel')s.phase='train-decision';
  const view=engine.getPlayerView(s,'p1');
  const html=renderToStaticMarkup(count===2?createElement(MarbleBoard,{view,language,playerId:'p1',runAction:vi.fn()}):createElement(MarbleTeamBoard,{view,language,nickname:'연석',runAction:vi.fn(),onReplay:vi.fn(),onExit:vi.fn(),onSelectGame:vi.fn()}));
  expect(html).toContain('mp-tile-owner-layer');
  if(scenario==='takeover'){expect(html).toContain('mp-ownership-decision');expect(html).toContain('mp-construction-cancel');}
  if(scenario==='landmark'){
   expect(html).toContain('mp-construction-stage');expect(html).toContain('is-landmark-choice');
   const image=marbleRuntimeImage('new-york-statue-of-liberty-v2.png');
   expect(html).toContain(image);expect(existsSync(`public${image}`)).toBe(true);
   expect(html).toContain(language==='ko'?'랜드마크':'Monumento');
  }
  if(scenario==='debt')expect(html).toContain('mp-debt-decision');
  if(scenario==='travel')expect(html).toContain('mp-travel-decision');
  if(scenario==='passive'){expect(html).toContain('mp-stage--roll');expect(html).not.toContain('mp-ownership-decision');expect(html).not.toContain('mp-construction-stage');}
 });
});
