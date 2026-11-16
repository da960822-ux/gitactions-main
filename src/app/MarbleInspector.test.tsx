import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {marbleEngine} from '../games/marble';
import {fourMarbleEngine} from '../games/fourMarble';
import MarbleBoard from './MarbleBoard';
import MarbleTeamBoard from './MarbleTeamBoard';

for(const four of [false,true]) for(const language of ['ko','es'] as const) it(`${four?'4p':'2p'} ${language}: one live revision-3 New York inspector, exact cost and no debug shortcuts`,()=>{
 const engine:any=four?fourMarbleEngine:marbleEngine,state=engine.createInitialState(23);
 state.positions.p1=10;state.properties[10]={owner:'p1',houses:1,buildings:['villa']};
 const view=engine.getPlayerView(state,'p1');
 const html=renderToStaticMarkup(four?createElement(MarbleTeamBoard,{view,language,runAction:()=>{},onReplay:()=>{},onExit:()=>{},onSelectGame:()=>{}}):createElement(MarbleBoard,{view,language,playerId:'p1',runAction:()=>{}}));
 const start=html.indexOf(`<details class="${four?'mt-city-sheet':'mp-city-detail'}"`),detail=html.slice(start,html.indexOf('</details>',start));
 expect(start).toBeGreaterThan(0);
 expect(detail).toContain(language==='ko'?'뉴욕':'Nueva York');
 expect(detail).toContain(language==='ko'?'현재 통행료':'Alquiler actual');
 expect(detail).toContain(language==='ko'?'빌라':'Villa');
 expect(detail.match(/class="mp-inspector-summary"/g)).toHaveLength(1);
 expect(detail.match(/class="marble-property-ledger"/g)).toHaveLength(1);
 expect(detail).toContain('<td>108</td>');
 expect(detail).not.toMatch(/mp-journey-stops|ownership-card-frame|mp-property-card|world-g3|선택 예시|Ejemplos/);
});
