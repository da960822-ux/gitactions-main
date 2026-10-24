import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { fourMarbleEngine, type FourMarbleState } from '../games/fourMarble';
import { marbleMovementPath, marblePresentationFrames } from './marble-motion';
import MarbleTeamBoard from './MarbleTeamBoard';
const state=()=>fourMarbleEngine.createInitialState(71) as FourMarbleState;
const render=(s:FourMarbleState,language:'ko'|'es'='ko')=>renderToStaticMarkup(createElement(MarbleTeamBoard,{view:fourMarbleEngine.getPlayerView(s,'p1'),language,nickname:'연석',runAction:vi.fn(),onReplay:vi.fn(),onExit:vi.fn(),onSelectGame:vi.fn()}));
describe('native four-player Marble screen',()=>{
 it('owns its four-seat banks and controls without mounting the two-player board',()=>{
  for(const language of ['ko','es'] as const){
   const html=render(state(),language);
   expect(html).toContain('data-marble-player-count="4"');
   expect(html).not.toContain('class="marble-premium');
   expect(html).not.toContain('mp-scoreboard');
   expect((html.match(/data-marble-seat=/g)??[]).length).toBe(4);
   expect((html.match(/class="mp-tile-select"/g)??[]).length).toBe(40);
   expect(html).toContain('/images/marble/world-map-board.webp');
   expect(html).toContain('href="#marble-team-action"');
   for(const seat of [1,2,3,4])expect(html).toContain(`data-seat-number="${seat}"`);
   for(const pawn of ['fox','cat','penguin','astronaut'])expect(html).toContain(`marble-pawn--${pawn}`);
   expect(html).toContain(language==='ko'?'순자산':'Patrimonio');
  }
 });
 it('renders actual third/fourth ownership and positions without giving the human their controls',()=>{
  const s=state();s.properties[1]={owner:'p3',houses:2};s.properties[3]={owner:'p4',houses:3};s.positions={p1:0,p2:10,p3:1,p4:3};s.active='p4';s.phase='main';
  const html=render(s);
  expect(html).toContain('is-owned-p3');expect(html).toContain('is-owned-p4');
  expect(html).toContain('팀원 AI');expect(html).toContain('상대 2');
  expect(html).not.toContain('>차례 마치기</button>');
  expect(html).not.toContain('mt-pawn-picker');
 });
 it('keeps exact purchase decisions, own loans, and seven-skin selection',()=>{
  let s=state();const initial=render(s);
  expect(initial).toContain('내 말 선택');expect(initial).toContain('네 명은 서로 다른 말을 사용해요.');
  expect((initial.match(/사용 중<\/span>/g)??[]).length).toBe(3);
  expect(initial).toContain('살리·술리');
  s=fourMarbleEngine.applyAction(s,'p1',{type:'choose-pawn',payload:{pawn:'dragon'}});
  expect(render(s)).toContain('marble-pawn--dragon');
  s.positions.p1=1;s.pendingTile=1;s.phase='decision';
  const purchase=render(s);
  expect(purchase).toContain('매입 100 · 통행료 12');expect(purchase).toContain('구매 후 현금 1,400');
  expect(purchase).toContain('도시 구매 · 100');expect(purchase).toContain('구매 안 함');
  expect(purchase).toContain('300을 받고 330을 갚습니다.');
 });
 it('retains mandatory debt controls and all player-specific bankruptcy rules',()=>{
  const s=state();s.phase='debt';s.money.p1=30;s.pendingPayment={amount:120,creditor:'p4',resumeActive:'p1'};
  const html=render(s);
  expect(html).toContain('지급 필요 120');expect(html).toContain('대출 300으로 지급 해결');
  expect(html).toContain('받기 300 · 상환 330');expect(html).toContain('파산 검토');
  expect(html).not.toContain('class="mt-loan"');
 });
 it('keeps actual history, team settlement, and owned-city building available',()=>{
  const s=state();s.phase='main';s.properties[1]={owner:'p1',houses:1};s.actionLog=[{sequence:1,type:'event-card',actor:'p4',title:{ko:'정전',es:'Apagón'},text:{ko:'도시 선택',es:'Elegir ciudad'},cardId:'blackout'}];s.actionSequence=1;
  const html=render(s);
  expect(html).toContain('건설 1곳');expect(html).toContain('내 도시 1');expect(html).toContain('정전');
  s.result={winner:'A',scores:{A:4000,B:3000},reason:{ko:'팀 정산',es:'Balance por equipos'}};s.phase='finished';
  const finished=render(s);
  expect(finished).toContain('우리 팀 승리');expect(finished).toContain('4000');expect(finished).toContain('다시 여행하기');
 });
 it('animates actual third/fourth seats including backwards card movement',()=>{
  const from={p1:0,p2:4,p3:12,p4:31},to={p1:0,p2:4,p3:9,p4:33};
  const events=[{sequence:1,type:'move',actor:'p3',from:12,to:9,steps:-3},{sequence:2,type:'move',actor:'p4',from:31,to:33,steps:2}];
  const frames=marblePresentationFrames(events,from,to,40);
  expect(frames.filter(frame=>frame.traveler?.seat==='p3').map(frame=>frame.traveler!.tile)).toEqual([11,10,9]);
  expect(frames.filter(frame=>frame.traveler?.seat==='p4').map(frame=>frame.traveler!.tile)).toEqual([32,33]);
  expect(frames.at(-1)?.positions).toEqual(to);
  expect(marbleMovementPath(12,9,0,{sequence:1,playerId:'p3',effect:'roll',from:12,to:9,steps:-3},true,'p3',40)).toEqual([11,10,9]);
 });
});
