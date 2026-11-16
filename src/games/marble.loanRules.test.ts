import {describe,it,expect} from 'vitest';
import {chooseSimpleAiAction} from './simpleAi';
import {marbleEngine} from './marble';
import {fourMarbleEngine} from './fourMarble';

for (const engine of [marbleEngine,fourMarbleEngine]) describe(`${engine===marbleEngine?'2p':'4p'} loan contract`,()=>{
 const act=(s:any,type:string,payload?:any):any=>engine.applyAction(s,'p1',{type,payload});
 const crisis=(s:any,amount:number)=>{s.phase='debt';s.money.p1=0;s.pendingPayment={amount,creditor:'p2',resumeActive:'p1',resumePhase:'main',reason:{ko:'통행료',es:'Alquiler'},type:'rent'};return s;};
 for(const version of [undefined,1,2]) it(`preserves ${version??'unversioned'} terms through serialization, receipts and reborrowing`,()=>{
  let s:any=engine.createInitialState(1);if(version===undefined)delete s.loanRulesVersion;else s.loanRulesVersion=version;
  s=JSON.parse(JSON.stringify(s));const amount=version===2?600:300,debt=version===2?660:330,before=s.money.p1;
  s=act(s,'borrow');expect(s.money.p1).toBe(before+amount);expect(s.debt.p1).toBe(debt);
  const view:any=engine.getPlayerView(s,'p1');expect(engine===marbleEngine?view.board.assets.p1:view.players.find((p:any)=>p.id==='p1').score).toBe(before+amount-debt);
  expect(s.actionLog.at(-1)).toMatchObject({type:'loan',amount,debtAfter:debt,moneyDelta:{p1:amount}});
  expect(engine.validateAction(s,'p1',{type:'borrow'})).toBeTruthy();
  s=act(s,'repay');expect(s.money.p1).toBe(before+amount-debt);expect(s.debt.p1).toBe(0);s=act(s,'borrow');expect(s.debt.p1).toBe(debt);
 });
 it('new games resolve a 600 crisis once and withhold bankruptcy; old saves cannot',()=>{
  let s:any=crisis(engine.createInitialState(1),600);expect(s.loanRulesVersion).toBe(2);
  expect(engine.validateAction(s,'p1',{type:'declare-bankruptcy'})).toBeTruthy();
  const old=structuredClone(s);delete old.loanRulesVersion;expect(engine.validateAction(old,'p1',{type:'borrow'})).toBeNull();expect(engine.validateAction(old,'p1',{type:'declare-bankruptcy'})).toBeNull();
  const view=engine.getPlayerView(s,'p1');expect(engine===marbleEngine?chooseSimpleAiAction('marble',view,'p1'):fourMarbleEngine.chooseAiAction(view,'p1')).toMatchObject({type:'borrow'});
  const before=s.money.p2;s=act(s,'borrow');expect(s).toMatchObject({phase:'main',pendingPayment:null,money:{p1:0,p2:before+600},debt:{p1:660}});expect(s.actionLog.filter((e:any)=>e.moneyDelta?.p2===600)).toHaveLength(1);
 });
 it('existing 330 debts are neither rewritten nor increased, even with an explicit new flag',()=>{
  let s:any=engine.createInitialState(1);s.debt.p1=330;s.money.p1=330;s=act(JSON.parse(JSON.stringify(s)),'repay');expect(s.money.p1).toBe(0);expect(s.debt.p1).toBe(0);expect(s.actionLog.at(-1).amount).toBe(330);
  s=crisis(engine.createInitialState(1),400);s.debt.p1=330;expect(engine.validateAction(s,'p1',{type:'borrow'})).toBeTruthy();expect(engine.validateAction(s,'p1',{type:'declare-bankruptcy'})).toBeNull();expect(s.debt.p1).toBe(330);
 });
 for(const version of [undefined,2]) it(`allows partial credit before sales, preserves the payment and pays once (${version??'v52 saved'})`,()=>{
  let s:any=engine.createInitialState(1);if(version===undefined)delete s.loanRulesVersion;
  const amount=version===2?600:300;s=crisis(s,amount+50);s.properties[2]={owner:'p1',houses:0,buildings:[]};
  const payment=structuredClone(s.pendingPayment),creditorCash=s.money.p2;s=act(s,'borrow');
  expect(s.phase).toBe('debt');expect(s.pendingPayment).toEqual(payment);expect(s.money.p1).toBe(amount);expect(s.money.p2).toBe(creditorCash);
  expect(engine.validateAction(s,'p1',{type:'borrow'})).toBeTruthy();expect(engine.validateAction(s,'p1',{type:'endTurn'})).toBeTruthy();
  s=act(s,'sell-property',{tile:2});expect(s.phase).toBe('main');expect(s.pendingPayment).toBeNull();expect(s.money.p2).toBe(creditorCash+amount+50);expect(s.actionLog.filter((e:any)=>e.moneyDelta?.p2===amount+50)).toHaveLength(1);
 });
 for(const phase of ['roll','main','decision'])it(`offers borrowing during ${phase} and rejects opponents`,()=>{const s:any=engine.createInitialState(1);s.phase=phase;s.pendingTile=2;expect(engine.getPlayerView(s,'p1').actions.some((a:any)=>a.action.type==='borrow')).toBe(true);expect(engine.validateAction(s,'p2',{type:'borrow'})).toBeTruthy();});
 it('counts sales plus versioned credit before allowing bankruptcy',()=>{
  let s:any=crisis(engine.createInitialState(1),650);s.properties[2]={owner:'p1',houses:0,buildings:[]};
  expect(engine.validateAction(s,'p1',{type:'borrow'})).toBeNull();expect(engine.validateAction(s,'p1',{type:'declare-bankruptcy'})).toBeTruthy();
  s=act(s,'sell-property',{tile:2});expect(s.phase).toBe('debt');s=act(s,'borrow');expect(s.pendingPayment).toBeNull();expect(s.debt.p1).toBe(660);
 });
});
