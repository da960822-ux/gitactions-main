import { describe, expect, it } from 'vitest';
import { marbleEngine, type MarbleEventId } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { marbleDrawFixture, marbleScenarioDice } from './marble.effectFixtures';
const ids:MarbleEventId[]=['festival','lottery','rent-rebate','travel-cost','maintenance','visit-santo-domingo','advance-start','retreat','go-to-island','escape-pass','train-ticket','city-dividend','monopoly-warning','city-festival','blackout','rent-pass'];
for(const [name,engine] of [['2p',marbleEngine],['4p',fourMarbleEngine]] as const) describe(`${name} canonical card causes`,()=>{
  const act=(s:any,type:string,payload?:Record<string,unknown>)=>engine.applyAction(s,s.active,{type,payload}) as any;
  const draw=(s:any)=>s.actionLog.filter((e:any)=>e.cardPhase==='draw').at(-1);
  for(const id of ids) it(`${id}: one draw identifier links every synchronous actual result`,()=>{
    const n=act(marbleDrawFixture(engine,id),'roll'),card=draw(n);
    expect(card).toMatchObject({type:'event-card',cardId:id,cardPhase:'draw',cardOutcome:'information',cardDrawSequence:card.sequence});
    expect(n.actionLog.filter((e:any)=>e.cardPhase==='draw')).toHaveLength(1);
    for(const event of n.actionLog.filter((e:any)=>e.sequence>card.sequence))expect(event).toMatchObject({cardDrawSequence:card.sequence,cardPhase:'resolution'});
    expect(n.resolvingCardDrawSequence).toBeUndefined();
  });
  it('deferred other-player debt retains original card ID through borrow and final payment',()=>{
    const s=marbleDrawFixture(engine,'monopoly-warning');s.money.p2=0;
    const pending=act(s,'roll'),card=draw(pending);expect(pending.active).toBe('p2');expect(pending.pendingCardDrawSequence).toBe(card.sequence);
    expect(pending.actionLog.at(-1)).toMatchObject({type:'crisis',cardDrawSequence:card.sequence,cardOutcome:'pending-payment'});
    const paid=act(pending,'borrow');expect(paid.active).toBe('p1');expect(paid.pendingCardDrawSequence).toBeUndefined();
    expect(paid.actionLog.at(-1)).toMatchObject({actor:'p2',amount:100,moneyDelta:{p2:-100},cardDrawSequence:card.sequence,cardPhase:'resolution',cardOutcome:'paid'});
  });
  it('target selection is a resolution, not a repeated draw',()=>{
    const pending=act(marbleDrawFixture(engine,'city-festival'),'roll'),card=draw(pending);
    expect(pending.pendingCardDrawSequence).toBe(card.sequence);expect(pending.actionLog.at(-1).cardOutcome).toBe('pending-choice');
    const selected=act(pending,'choose-event-city',{tile:1});expect(selected.actionLog.at(-1)).toMatchObject({cardDrawSequence:card.sequence,cardPhase:'resolution',cardOutcome:'applied'});
    expect(selected.actionLog.filter((e:any)=>e.cardPhase==='draw')).toHaveLength(1);expect(selected.pendingCardDrawSequence).toBeUndefined();
  });
  it('no-target result is explicitly no-effect, and manual repayment after held pass is unrelated',()=>{
    let s=marbleDrawFixture(engine,'blackout');s.properties={};s=act(s,'roll');expect(s.actionLog.at(-1).cardOutcome).toBe('no-effect');
    s=marbleDrawFixture(engine,'rent-pass');s.debt.p1=330;s=act(s,'roll');const card=draw(s);expect(s.pendingCardDrawSequence).toBeUndefined();
    s=act(s,'repay');expect(s.actionLog.at(-1).type).toBe('repay');expect(s.actionLog.at(-1).cardDrawSequence).toBeUndefined();expect(draw(s).sequence).toBe(card.sequence);
  });
  it('free travel retains cause past unrelated loan/repayment and links destination rent',()=>{
    let s=act(marbleDrawFixture(engine,'train-ticket'),'roll');const card=draw(s);
    s=act(s,'borrow');expect(s.actionLog.at(-1).cardDrawSequence).toBeUndefined();s=act(s,'repay');expect(s.actionLog.at(-1).cardDrawSequence).toBeUndefined();
    expect(s.pendingCardDrawSequence).toBe(card.sequence);s=act(s,'choose-train',{destination:15});
    expect(s.actionLog.at(-1)).toMatchObject({type:'rent',amount:30,cardDrawSequence:card.sequence,cardOutcome:'paid'});expect(s.pendingCardDrawSequence).toBeUndefined();
  });
  it('movement card crossing Start links salary and then final rent, not just the first bonus',()=>{
    const s=marbleDrawFixture(engine,'visit-santo-domingo');s.positions.p1=32;s.rng=marbleScenarioDice();
    const n=act(s,'roll'),card=draw(n),paid=n.actionLog.filter((e:any)=>e.cardDrawSequence===card.sequence&&e.cardOutcome==='paid');
    expect(paid.map((e:any)=>e.moneyDelta.p1)).toEqual([300,-30]);expect(paid.at(-1).type).toBe('rent');expect(n.money.p1).toBe(10270);
  });
  for(const action of ['use-rent-pass','pay-rent']) it(`card arrival deferred ${action} retains cause and takeover opportunity`,()=>{
    const state=marbleDrawFixture(engine,'visit-santo-domingo');state.rentPasses.p1=1;
    let s=act(state,'roll');const card=draw(s);expect(s.phase).toBe('rent-decision');expect(s.pendingCardDrawSequence).toBe(card.sequence);
    const before=s.money.p1;s=act(s,action);expect(s.money.p1).toBe(before-(action==='pay-rent'?30:0));
    expect(s.actionLog.at(-1)).toMatchObject({cardDrawSequence:card.sequence,cardPhase:'resolution',cardOutcome:action==='pay-rent'?'paid':'applied'});
    expect(s.pendingCardDrawSequence).toBeUndefined();expect(s.takeoverTile).toBe(15);
    expect(engine.validateAction(s,'p1',{type:'takeover',payload:{tile:15}})).toBeNull();
  });
  it('same ID drawn later starts a distinct cause and never reuses first draw',()=>{
    let s=act(marbleDrawFixture(engine,'lottery'),'roll');const first=draw(s).sequence;
    s={...s,active:'p1',phase:'roll',positions:{...s.positions,p1:0},rng:marbleScenarioDice(),doublesCount:0,eventDeck:['lottery']};s=act(s,'roll');
    const second=draw(s).sequence;expect(second).toBeGreaterThan(first);expect(s.actionLog.at(-1).cardDrawSequence).toBe(second);expect(s.money.p1).toBe(10400);
  });
});

it('four-seat bankruptcy records residual cash forfeiture without claiming a creditor payment',()=>{
  let s:any=marbleDrawFixture(fourMarbleEngine,'monopoly-warning');s.properties={1:{owner:'p2',houses:0},15:{owner:'p2',houses:0}};s.money.p2=1;s.debt.p2=330;
  s=fourMarbleEngine.applyAction(s,'p1',{type:'roll'});expect(s.active).toBe('p2');expect(s.pendingPayment.amount).toBe(100);
  const before=s,source=s.pendingCardDrawSequence;
  const n:any=fourMarbleEngine.applyAction(s,'p2',{type:'declare-bankruptcy'}),event=n.actionLog.filter((e:any)=>e.type==='bankruptcy').at(-1);
  expect(n.money.p2).toBe(0);expect(before.money.p2).toBe(1);expect(n.money.p1).toBe(before.money.p1);
  expect(event).toMatchObject({type:'bankruptcy',moneyDelta:{p2:-1},cardDrawSequence:source,cardOutcome:'applied'});
  expect(event.fromAccount).toBeUndefined();expect(event.toAccount).toBeUndefined();expect(event.amount).toBeUndefined();
  expect(event.text.ko).toContain('소멸');expect(event.text.ko).toContain('지급된 금액이 아닙니다');expect(n.eliminated.p2).toBe(true);expect(n.active).toBe('p1');
});
