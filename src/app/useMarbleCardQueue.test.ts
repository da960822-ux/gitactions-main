import {it,expect} from 'vitest';import {updateCardQueue,collectCardOutcomes} from './useMarbleCardQueue';
const card=(sequence:number,id='travel-cost')=>({sequence,type:'event-card',cardId:id,actor:'p2'});
const payment=(sequence:number)=>({sequence,type:'tax',amount:100,text:{ko:'p2 → bank · 100'}});
it('retains an unacknowledged AI card after endTurn and unrelated next-turn rent',()=>{
 const first=updateCardQueue([], [card(2),payment(3)],1);
 const after=updateCardQueue(first.queue,[card(2),payment(3),{sequence:4,type:'turn'},{sequence:5,type:'rent',amount:999}],3);
 expect(after.queue).toHaveLength(1);expect(after.queue[0].result.amount).toBe(100);
});
it('queues distinct draws even when their card IDs match',()=>{
 const first=updateCardQueue([],[card(2),payment(3)],1);
 const next=updateCardQueue(first.queue,[{sequence:4,type:'turn'},{sequence:5,type:'roll'},card(6),payment(7),{sequence:8,type:'turn'},card(9,'lottery')],3);
 expect(next.queue.map(x=>x.card.sequence)).toEqual([2,6,9]);expect(next.queue.slice(1).map(x=>x.card.sequence)).toEqual([6,9]);
});
it('does not replay mount/reconnect history and resets a restarted low sequence',()=>{
 expect(updateCardQueue([],[card(2),payment(3)],3).queue).toEqual([]);
 const reset=updateCardQueue([{card:card(90),result:payment(91)}],[],91);expect(reset.queue).toEqual([]);
 expect(updateCardQueue(reset.queue,[card(2),payment(3)],reset.sequence).queue[0].card.sequence).toBe(2);
});
it('coalesces no-target feedback and target application without creating a second draw',()=>{
 const noOp={...card(3,'blackout'),text:{ko:'대상 없음'}};
 expect(updateCardQueue([],[card(2,'blackout'),noOp],1).queue).toEqual([{card:card(2,'blackout'),result:noOp}]);
 const first=updateCardQueue([],[card(2,'city-festival')],1),applied={...card(3,'city-festival'),tile:1};
 expect(updateCardQueue(first.queue,[card(2,'city-festival'),applied],2).queue).toEqual([{card:card(2,'city-festival'),result:applied}]);
});

it('distinguishes same tile/id draw after a separately delivered roll',()=>{const a={...card(2),tile:2};let q=updateCardQueue([],[a,payment(3)],1);q=updateCardQueue(q.queue,[a,payment(3),{sequence:4,type:'turn'},{sequence:5,type:'roll'}],3);q=updateCardQueue(q.queue,[a,payment(3),{sequence:4,type:'turn'},{sequence:5,type:'roll'},{...card(6),tile:2},payment(7)],5);expect(q.queue.map(x=>x.card.sequence)).toEqual([2,6]);});
it('refreshes deferred crisis to payment but not next-turn rent',()=>{const events=[card(2),{sequence:3,type:'crisis'}];let q=updateCardQueue([],events,1);q=updateCardQueue(q.queue,[...events,{sequence:4,type:'sell'},payment(5)],3);expect(q.queue[0].result.type).toBe('tax');q=updateCardQueue(q.queue,[...events,{sequence:4,type:'sell'},payment(5),{sequence:6,type:'turn'},{sequence:7,type:'rent'}],5);expect(q.queue[0].result.sequence).toBe(5);});

it('uses terminal card settlement after informational monopoly warning',()=>{const q=updateCardQueue([],[card(2,'monopoly-warning'),{sequence:3,type:'monopoly-warning',fromAccount:'p2'},{sequence:4,type:'crisis'}],1);expect(q.queue[0].result.type).toBe('crisis');});
it('uses arrival liability after travel salary and does not attribute unrelated repayment',()=>{let q=updateCardQueue([],[card(2,'visit-santo-domingo'),{sequence:3,type:'bonus',amount:300},{sequence:4,type:'rent',amount:700}],1);expect(q.queue[0].result.amount).toBe(700);q=updateCardQueue(q.queue,[card(2,'visit-santo-domingo'),{sequence:3,type:'bonus',amount:300},{sequence:4,type:'rent',amount:700},{sequence:5,type:'repay',amount:330}],4);expect(q.queue[0].result.sequence).toBe(4);});

it('prefers explicit draw correlation and ignores unlinked same-turn transactions',()=>{const draw={...card(2),cardDrawSequence:2};let q=updateCardQueue([],[draw,{...payment(3),cardDrawSequence:2},{sequence:4,type:'bonus',amount:999}],1);expect(q.queue[0].result.sequence).toBe(3);q=updateCardQueue(q.queue,[draw,{sequence:3,type:'crisis',cardDrawSequence:2},{sequence:4,type:'loan',cardDrawSequence:2},{...payment(5),cardDrawSequence:2}],4);expect(q.queue[0].result.sequence).toBe(5);});

it('refreshes correlated debt after original draw leaves the retained log',()=>{const draw={...card(2),cardDrawSequence:2},q=[{card:draw,result:{sequence:3,type:'crisis',cardDrawSequence:2}}];expect(updateCardQueue(q,[{...payment(55),cardDrawSequence:2}],54).queue[0].result.sequence).toBe(55);});

it('does not create a new card from a correlated resolution without its draw',()=>{expect(updateCardQueue([],[{...card(55,'blackout'),cardDrawSequence:2,cardPhase:'resolution',tile:3}],54).queue).toEqual([]);});

it('retains explicit sale and construction card resolution receipts',()=>{
 for(const [cardId,type] of [['forced-sale','sell'],['earthquake','build'],['construction-grant','build']]){
  const draw={sequence:1,type:'event-card',cardId,cardPhase:'draw',cardDrawSequence:1};
  const result={sequence:2,type,cardId,cardPhase:'resolution',cardDrawSequence:1,constructionBefore:{houses:1,buildings:['villa']},constructionAfter:{houses:0,buildings:[]}};
  expect(collectCardOutcomes([draw,result])[0].result).toBe(result);
 }
});
