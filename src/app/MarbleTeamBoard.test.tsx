import { savedFourMarbleState } from './marble-legacy-test-fixture';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { fourMarbleEngine, type FourMarbleState } from '../games/fourMarble';
import { marbleMovementPath, marblePresentationFrames } from './marble-motion';
import MarbleTeamBoard from './MarbleTeamBoard';
const state=()=>savedFourMarbleState(71) as FourMarbleState;
const render=(s:FourMarbleState,language:'ko'|'es'='ko')=>renderToStaticMarkup(createElement(MarbleTeamBoard,{view:fourMarbleEngine.getPlayerView(s,'p1'),language,nickname:'연석',runAction:vi.fn(),onReplay:vi.fn(),onExit:vi.fn(),onSelectGame:vi.fn()}));
describe('native four-player Marble screen',()=>{
 it('puts the legal phase action ahead of optional loans in the central dice stage',()=>{
  const html=render(state());
  const center=html.slice(html.indexOf('class="mp-center-stage mt-center-stage'),html.indexOf('</section>',html.indexOf('class="mp-center-stage mt-center-stage')));
  expect(center).toContain('주사위 굴리기');expect(center).toContain('class="mt-dice mp-stage-dice');expect(center).not.toContain('대출 받기');
 });
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
  expect(purchase).toContain('구매 100');expect(purchase).toContain('통행료 20');expect(purchase).toContain('구매 후 현금 1,400');
  expect(purchase).toContain('도시 구매 · 100');expect(purchase).toContain('이번에는 지나가기');
  expect(purchase).toContain('300을 받고 330을 갚습니다.');
 });
 it('retains mandatory debt controls and all player-specific bankruptcy rules',()=>{
  const s=state();s.phase='debt';s.money.p1=30;s.pendingPayment={amount:120,creditor:'p4',resumeActive:'p1'};
  const html=render(s);
  expect(html).toContain('지급 필요 120');expect(html).toContain('대출 300으로 지급 해결');
  expect(html).toContain('받기 300 · 상환 330');expect(html).not.toContain('파산 검토');
  expect(html).not.toContain('class="mt-loan"');
 });
 it('uses the selected property offer for the team debt-stage central action',()=>{
  const s=state();s.phase='debt';s.money.p1=0;s.debt.p1=300;s.pendingPayment={amount:500,creditor:'bank',resumeActive:'p1'};
  const view=fourMarbleEngine.getPlayerView(s,'p1');
  view.actions=[1,7].map(tile=>({label:{ko:`도시 ${tile} 은행 매각`,es:`Vender ciudad ${tile} al banco`},action:{type:'sell-property',payload:{tile}}})) as any;
  const html=renderToStaticMarkup(createElement(MarbleTeamBoard,{view,language:'ko',nickname:'연석',runAction:vi.fn(),onReplay:vi.fn(),onExit:vi.fn(),onSelectGame:vi.fn()}));
  expect(html).toContain('>도시 1 은행 매각</button>');
  expect(html).toContain('도시 7 은행 매각');
 });
 it('keeps actual history, team settlement, and owned-city building available',()=>{
  const s=state();s.phase='main';s.properties[1]={owner:'p1',houses:1};s.actionLog=[{sequence:1,type:'event-card',actor:'p4',title:{ko:'정전',es:'Apagón'},text:{ko:'도시 선택',es:'Elegir ciudad'},cardId:'blackout'}];s.actionSequence=1;
  const html=render(s);
  expect(html).toContain('건설 가능한 도시 1곳');expect(html).toContain('내 도시 1');expect(html).toContain('정전');
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

it('shows acquisition price, available funds and complete stage costs while keeping only one finished replay control',()=>{
 const s=state();s.phase='main';s.positions.p1=4;s.pendingTile=4;s.takeoverTile=4;s.properties[4]={owner:'p4',houses:2};
 const html=render(s);
 expect(html).toContain('도시 인수 · 560');expect(html).toContain('인수 후 현금 940');expect(html).toContain('단계별 금액');expect(html).toContain('추가비');expect(html).toContain('누적');expect(html).toContain('불가');
 s.result={winner:'A',scores:{A:3000,B:2000},reason:{ko:'정산',es:'Balance'}};s.phase='finished';
 const done=render(s);expect(done).not.toContain('>새 판</button>');expect((done.match(/>다시 여행하기<\/button>/g)??[])).toHaveLength(1);
});

it('opens the illustrated new rules only for versioned team matches and preserves saved help',()=>{
 const s=state();const current=render(s);expect(current).toContain('marble-rule-guide');expect(current).toContain('marble-rule-stages');
 s.propertyRulesVersion=undefined;expect(render(s)).not.toContain('marble-rule-guide');expect(render(s)).toContain('두 팀의 세계 여행');
 const es=render(state(),'es');expect(es).toContain('Costo extra');expect(es).toContain('Terreno');expect(es).toContain('Protegido');
});

it('keeps each owner number, shared pawn/bank color key and approved property images in both languages',()=>{
 const s=state();s.properties={1:{owner:'p1',houses:0},3:{owner:'p2',houses:1},4:{owner:'p3',houses:2},5:{owner:'p4',houses:3}};
 for(const language of ['ko','es'] as const){
  const html=render(s,language);
  expect((html.match(/class="mp-property-tile-art mp-property-art-frame"/g)??[])).toHaveLength(24);
  for(const seat of ['p1','p2','p3','p4']){expect(html).toContain(`data-marble-owner="${seat}"`);expect(html).toContain(`data-marble-pawn-seat="${seat}"`);}
  expect(html).toContain('data-marble-owner="bank"');expect(html).toContain('mp-building-plinth');
  expect(html).toContain(language==='ko'?'aria-label="단독주택">1</span>':'aria-label="Casa unifamiliar">1</span>');expect(html).toContain(language==='ko'?'aria-label="아파트">2</span>':'aria-label="Apartamentos">2</span>');
  expect(html).toContain('data-marble-price-kind="rent" title="'+(language==='ko'?'현재 통행료 20':'Alquiler actual 20')+'">20</b>');
  expect(html).toContain('data-marble-price-kind="purchase"');
 }
});
