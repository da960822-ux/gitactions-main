import { describe, expect, it } from 'vitest';
import { marbleEngine, type MarbleEventId } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { marbleBrowserScenario, marbleDrawFixture, marbleEffectFixture, marbleRuleSnapshot, marbleScenarioDice } from './marble.effectFixtures';
import baseline from './marble.baselineEffects.json';
const ids: MarbleEventId[]=['festival','lottery','rent-rebate','travel-cost','maintenance','visit-santo-domingo','advance-start','retreat','go-to-island','escape-pass','train-ticket','city-dividend','monopoly-warning','city-festival','blackout','rent-pass'];
const engines=[['marbleEngine',marbleEngine,false],['fourMarbleEngine',fourMarbleEngine,true]] as const;
for(const [name,engine,four] of engines) describe(`${name} configured rules, not claimed original32`,()=>{
  const act=(s:any,type:string,payload?:Record<string,unknown>)=>engine.applyAction(s,s.active,{type,payload}) as any;
  const arrive=(s:any,p:string,tile:number)=>act({...s,active:p,phase:'roll',positions:{...s.positions,[p]:(tile+37)%40},rng:marbleScenarioDice(1,2),doublesCount:0,extraRoll:false},'roll');
  const effects=(s:any,tile:number)=>four?s.modifiers[tile]:s.rentModifiers[tile];
  const rentPaid=(s:any,sequence:number)=>s.actionLog.filter((e:any)=>e.sequence>sequence&&e.type==='rent').at(-1)?.amount;
  for(const id of ids) it(`production ${id} state matches source24eaea9 baseline`,()=>{
    const state=act(marbleDrawFixture(engine,id),'roll');
    expect(marbleRuleSnapshot(state)).toEqual((baseline.cases as any)[`${name}:${id}`]);
  });
  it('paid rent and acquisition state match source baseline for an ordinary unfinished city',()=>{
    const landed=marbleBrowserScenario(engine,'takeover');
    expect(marbleRuleSnapshot(landed)).toEqual((baseline.cases as any)[`${name}:takeover-before`]);
    expect(marbleRuleSnapshot(act(landed,'takeover',{tile:4}))).toEqual((baseline.cases as any)[`${name}:takeover-after`]);
  });
  for(const version of [1,2] as const) describe(`construction${version}`,()=>{
    for(const id of ids) it(`${id} applies its configured state effect, not just a receipt`,()=>{
      const s=marbleDrawFixture(engine,id,version),n=act(s,'roll');
      const deltas:Partial<Record<MarbleEventId,number>>={festival:150,lottery:200,'rent-rebate':80,'travel-cost':-100,maintenance:-40,'city-dividend':30,'advance-start':300,'visit-santo-domingo':-30};
      expect(n.money.p1).toBe(10000+(deltas[id]??0));
      expect(n.money.p2).toBe(id==='monopoly-warning'?9900:id==='visit-santo-domingo'?10030:10000);
      expect(n.positions.p1).toBe(id==='advance-start'?0:id==='visit-santo-domingo'?15:id==='retreat'?39:id==='go-to-island'?10:2);
      expect(n.phase).toBe(id==='train-ticket'?'train-decision':id==='city-festival'||id==='blackout'?'event-decision':'main');
      expect(n.properties).toEqual(s.properties);
      if(id==='go-to-island'){expect(n.islandTurns.p1).toBe(3);expect(n.extraRoll).toBe(false);expect(n.doublesCount).toBe(0);}
      if(id==='advance-start')expect(n.buildSite).toBe('start');
      if(id==='escape-pass'){expect(n.escapePasses.p1).toBe(1);expect(n.eventDeck).not.toContain(id);}
      if(id==='rent-pass'){expect(n.rentPasses.p1).toBe(1);expect(n.eventDeck).not.toContain(id);}
      if(id==='train-ticket')expect(four?n.trainFare:n.pendingTrainFare).toBe(0);
      if(id!=='escape-pass'&&id!=='rent-pass')expect(n.eventDeck.filter((c:string)=>c===id)).toHaveLength(1);
    });
    it('festival persists until an opposing landing, doubles exactly once and replaces rather than stacks',()=>{
      let s=act(marbleDrawFixture(engine,'city-festival',version),'roll');
      expect(engine.validateAction(s,'p1',{type:'choose-event-city',payload:{tile:4}})).toBeTruthy();
      s=act(s,'choose-event-city',{tile:1});
      const before=s.money.p1;s=arrive(s,'p1',1);expect(effects(s,1)?.festival).toBeTruthy();expect(s.money.p1).toBe(before+300);
      if(four){s=arrive(s,'p3',1);expect(effects(s,1)?.festival).toBeTruthy();}
      let seq=s.actionSequence;s=arrive(s,'p2',1);expect(rentPaid(s,seq)).toBe(version===1?80:60);expect(effects(s,1)?.festival).toBeUndefined();
      seq=s.actionSequence;s=arrive(s,'p2',1);expect(rentPaid(s,seq)).toBe(version===1?40:30);
    });
    it('blackout waits for the drawing visitor, halves one rent and can be consumed by a rent pass',()=>{
      let s=act(marbleDrawFixture(engine,'blackout',version),'roll');
      expect(engine.validateAction(s,'p1',{type:'choose-event-city',payload:{tile:1}})).toBeTruthy();
      s=act(s,'choose-event-city',{tile:4});
      if(four){const seq=s.actionSequence;s=arrive(s,'p3',4);expect(rentPaid(s,seq)).toBe(version===1?120:90);expect(effects(s,4)?.blackout).toBeTruthy();}
      s.rentPasses.p1=1;s.eventDeck=s.eventDeck.filter((id:string)=>id!=='rent-pass');
      s=arrive(s,'p1',4);expect(s.phase).toBe('rent-decision');expect(s.pendingRent.amount).toBe(version===1?60:45);expect(effects(s,4)?.blackout).toBeUndefined();
      const cash=s.money.p1;s=act(s,'use-rent-pass');expect(s.money.p1).toBe(cash);expect(s.rentPasses.p1).toBe(0);expect(s.eventDeck.filter((id:string)=>id==='rent-pass')).toHaveLength(1);
      const seq=s.actionSequence;s=arrive(s,'p1',4);expect(rentPaid(s,seq)).toBe(version===1?120:90);
    });
    it('takeover follows rent, keeps buildings, pays actual owner, breaks their group and clears city effects',()=>{
      let s=marbleEffectFixture(engine,version);s=arrive(s,'p1',4);
      const property=structuredClone(s.properties[4]),cash1=s.money.p1,cash2=s.money.p2;
      const view:any=engine.getPlayerView(s,'p1');const price=four?Number(view.actions.find((c:any)=>c.action.type==='takeover').label.ko.match(/\d+$/)?.[0]):view.board.takeoverOffer.price;
      expect(engine.validateAction(s,'p1',{type:'takeover',payload:{tile:4}})).toBeNull();
      if(four)s.modifiers[4]={festival:'p2',blackout:'p1'};else s.rentModifiers[4]={festival:{source:'city-festival',owner:'p2',playerId:'p2'},blackout:{source:'blackout',owner:'p2',playerId:'p1'}};
      s=act(s,'takeover',{tile:4});expect(s.properties[4]).toEqual({...property,owner:'p1'});expect(s.money.p1).toBe(cash1-price);expect(s.money.p2).toBe(cash2+price);expect(effects(s,4)).toBeUndefined();
      const board:any=four?(engine.getPlayerView(s,'p1') as any).publicBoard:(engine.getPlayerView(s,'p1') as any).board.tiles;
      expect(board[5].monopolyMultiplier).toBe(1);expect(board[4].monopolyMultiplier).toBe(1);expect(s.buildSite).toBe(4);
      expect(engine.validateAction(s,'p1',{type:'takeover',payload:{tile:4}})).toBeTruthy();
    });
    it('resolves rent debt by loan then offers takeover, without a second toll',()=>{
      let s=marbleEffectFixture(engine,version);s.money.p1=0;s=arrive(s,'p1',4);expect(s.phase).toBe('debt');
      const amount=s.pendingPayment.amount,creditorCash=s.money.p2;s=act(s,'borrow');expect(s.money.p2).toBe(creditorCash+amount);expect(s.pendingPayment).toBeNull();expect(s.phase).toBe('main');expect(s.takeoverTile).toBe(4);
      // The fixed loan may cover rent but not acquisition. Having a takeover target never grants free credit.
      s.money.p1=10000;const ownerCash=s.money.p2;s=act(s,'takeover',{tile:4});expect(s.money.p2-ownerCash).toBe(s.actionLog.at(-1).amount);
    });
    it('no-target festival/blackout does nothing; landmarks accept blackout but not takeover and allies remain protected',()=>{
      for(const id of ['city-festival','blackout'] as const){const s=marbleDrawFixture(engine,id,version);s.properties={};const n=act(s,'roll');expect(n.phase).toBe('main');expect(n.pendingEvent).toBeNull();expect(n.money.p1).toBe(10000);}
      let s=marbleDrawFixture(engine,'blackout',version);s.properties={4:{owner:'p2',houses:3,...(version===2?{buildings:['villa','building','hotel'],landmark:true}:{})}};
      s=act(s,'roll');expect(s.phase).toBe('event-decision');s=act(s,'choose-event-city',{tile:4});s=arrive(s,'p1',4);expect(engine.validateAction(s,'p1',{type:'takeover',payload:{tile:4}})).toBeTruthy();
      if(four){s=marbleDrawFixture(engine,'blackout',version);s.properties={4:{owner:'p3',houses:0,...(version===2?{buildings:[],landmark:false}:{})}};s=act(s,'roll');expect(s.phase).toBe('main');s=arrive(s,'p1',4);expect(s.money.p1).toBe(10000);expect(engine.validateAction(s,'p1',{type:'takeover',payload:{tile:4}})).toBeTruthy();}
    });
    it('a monopoly-warning debtor sells in stages, pays once, and resumes the original drawer',()=>{
      let s=marbleDrawFixture(engine,'monopoly-warning',version);s.money.p2=0;s.debt.p2=330;
      s=act(s,'roll');expect(s.active).toBe('p2');expect(s.phase).toBe('debt');expect(s.pendingPayment).toMatchObject({amount:100,creditor:'bank',resumeActive:'p1'});
      expect(engine.validateAction(s,'p1',{type:'endTurn'})).toBeTruthy();expect(engine.validateAction(s,'p2',{type:'declare-bankruptcy'})).toBeTruthy();
      const seq=s.actionSequence;s=act(s,'sell-property',{tile:15});expect(s.active).toBe('p2');expect(s.phase).toBe('debt');expect(s.money.p2).toBe(50);expect(s.properties[15]).toBeUndefined();
      s=act(s,'sell-property',{tile:4});expect(s.active).toBe('p1');expect(s.phase).toBe('main');expect(s.pendingPayment).toBeNull();expect(s.properties[4]).toBeUndefined();expect(s.money.p2).toBe(25);
      const payments=s.actionLog.filter((e:any)=>e.sequence>seq&&e.moneyDelta?.p2===-100&&e.toAccount==='bank');expect(payments).toHaveLength(1);
      expect(s.eventDeck.filter((id:string)=>id==='monopoly-warning')).toHaveLength(1);
    });
    it('unrescuable warning debt ends2p or eliminates4p debtor, returns passes and resumes drawer',()=>{
      let s=marbleDrawFixture(engine,'monopoly-warning',version);const empty=(owner:string)=>({owner,houses:0,...(version===2?{buildings:[],landmark:false}:{})});
      s.properties={1:empty('p2'),15:empty('p2')};s.money.p2=0;s.debt.p2=330;s.escapePasses.p2=1;s.rentPasses.p2=1;
      s=act(s,'roll');expect(s.pendingPayment.amount).toBe(100);expect(s.active).toBe('p2');expect(engine.validateAction(s,'p2',{type:'declare-bankruptcy'})).toBeNull();
      s=act(s,'declare-bankruptcy');
      if(four){expect(s.eliminated.p2).toBe(true);expect(s.result).toBeNull();expect(s.properties).toEqual({});expect(s.active).toBe('p1');expect(s.phase).toBe('main');expect(s.escapePasses.p2).toBe(0);expect(s.rentPasses.p2).toBe(0);for(const pass of ['escape-pass','rent-pass'])expect(s.eventDeck.filter((id:string)=>id===pass)).toHaveLength(1);}
      else{expect(s.phase).toBe('finished');expect(s.result.winner).toBe('p1');}
    });
    it('same city effect overwrites, complementary effects combine, and sale removes both',()=>{
      let s=act(marbleDrawFixture(engine,'city-festival',version),'roll');s=act(s,'choose-event-city',{tile:1});
      s={...s,active:'p1',phase:'roll',positions:{...s.positions,p1:0},rng:marbleScenarioDice(),doublesCount:0,eventDeck:['city-festival']};s=act(s,'roll');s=act(s,'choose-event-city',{tile:1});
      if(four)s.modifiers[1].blackout='p2';else s.rentModifiers[1].blackout={source:'blackout',owner:'p1',playerId:'p2'};
      const seq=s.actionSequence;s=arrive(s,'p2',1);expect(rentPaid(s,seq)).toBe(version===1?40:30);expect(effects(s,1)?.festival).toBeUndefined();expect(effects(s,1)?.blackout).toBeUndefined();
      // Compulsory liquidation returns the city to the bank with no retained transient effect.
      s.active='p1';s.phase='debt';s.money.p1=0;s.debt.p1=330;s.pendingPayment={amount:1000,creditor:'bank',resumeActive:'p1',...(four?{}:{reason:{ko:'세금',es:'Impuesto'},resumePhase:'main',type:'tax'})};
      if(four)s.modifiers[1]={festival:'p1',blackout:'p2'};else s.rentModifiers[1]={festival:{source:'city-festival',owner:'p1',playerId:'p1'},blackout:{source:'blackout',owner:'p1',playerId:'p2'}};
      s=act(s,'sell-property',{tile:1});expect(s.properties[1]).toBeUndefined();expect(effects(s,1)).toBeUndefined();
    });
    it('held escape pass leaves deck, returns once on use and changes island state without rolling',()=>{
      let s=act(marbleDrawFixture(engine,'escape-pass',version),'roll');expect(s.eventDeck).not.toContain('escape-pass');
      s.phase='island';s.islandTurns.p1=3;const pos=s.positions.p1;s=act(s,'use-escape-pass');expect(s.escapePasses.p1).toBe(0);expect(s.islandTurns.p1).toBe(0);expect(s.phase).toBe('roll');expect(s.positions.p1).toBe(pos);expect(s.eventDeck.filter((id:string)=>id==='escape-pass')).toHaveLength(1);
      expect(engine.validateAction(s,'p1',{type:'use-escape-pass'})).toBeTruthy();
    });
  });
});
