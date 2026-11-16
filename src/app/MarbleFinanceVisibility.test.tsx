import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import {marbleEngine} from '../games/marble';
import {fourMarbleEngine} from '../games/fourMarble';
import MarbleBoard from './MarbleBoard';
import MarbleTeamBoard from './MarbleTeamBoard';
for(const team of [false,true])for(const language of ['ko','es'] as const)for(const version of [undefined,2])it(`${team?'4p':'2p'} ${language} persistent loan entry ${version??'saved v52'}`,()=>{
 const engine=team?fourMarbleEngine:marbleEngine;
 for(const phase of ['roll','main','decision','debt','event-decision'])for(const active of ['p1','p2']){
  const s:any=engine.createInitialState(1);if(version===undefined)delete s.loanRulesVersion;s.phase=phase;s.active=active;s.pendingTile=2;s.money.p1=0;
  if(phase==='debt')s.pendingPayment={amount:900,creditor:'bank',resumeActive:'p1',resumePhase:'main',reason:{ko:'비용',es:'Gasto'},type:'tax'};
  const view:any=engine.getPlayerView(s,'p1');
  const html=renderToStaticMarkup(team?createElement(MarbleTeamBoard,{view,language,nickname:'A',runAction:()=>{},onReplay:()=>{},onExit:()=>{},onSelectGame:()=>{}}):createElement(MarbleBoard,{view,language,playerId:'p1',runAction:()=>{}}));
  const entry=html.match(/<div class="mp-finance-entry">(.*?)<\/section><\/div>/s)?.[1];expect(entry).toBeDefined();expect(entry).toContain(version===2?'600':'300');expect(entry).toContain('<button');expect(html).not.toContain('class="mp-loan-options"');expect(html).not.toContain('class="mt-loan"');
  if(active==='p2'||phase==='event-decision')expect(entry).toContain('disabled=""');else expect(entry).not.toContain('disabled=""');
 }
});
