import { describe, expect, it } from 'vitest';
import { minhwatuEngine, minhwatuScoreBreakdown, minhwatuYakuProgress, scoreMinhwatuCards, scoreMinhwatuMatch, type MinhwatuCard, type MinhwatuEvent, type MinhwatuState } from './minhwatu';

function cardsIn(s:MinhwatuState):MinhwatuCard[]{return [...s.hands.p1,...s.hands.p2,...s.table,...s.deck,...s.captures.p1,...s.captures.p2,...(s.pending?[s.pending.card]:[])];}
function expectCardConservation(s:MinhwatuState,expectedIds?:string[]){
  const cards=cardsIn(s),ids=cards.map(card=>card.id);
  expect(cards).toHaveLength(48);expect(new Set(ids).size).toBe(48);
  if(expectedIds)expect([...ids].sort()).toEqual([...expectedIds].sort());
}
function stateWithMonth(s:MinhwatuState,tableSameMonth:number,drawSameMonth=false):MinhwatuState {
  const all=cardsIn(s),monthCards=all.filter(c=>c.month===1),handCard=monthCards[0],tableMatches=monthCards.slice(1,1+tableSameMonth),drawCard=drawSameMonth?monthCards[3]:null;
  const available=all.filter(c=>c!==handCard&&!tableMatches.includes(c)&&c!==drawCard);
  const hand=[handCard,...available.splice(0,9)],table=[...tableMatches];
  while(table.length<8){const index=available.findIndex(c=>c.month!==1);table.push(available.splice(index,1)[0]);}
  const deck=[...(drawCard?[drawCard]:[]),...available.splice(0,20-(drawCard?1:0))],p2=available.splice(0,10);
  return {...s,hands:{p1:hand,p2},table,deck,captures:{p1:[],p2:available},turn:'p1',phase:'play',pending:null,result:null};
}
describe('minhwatuEngine',()=>{
  it('uses both starting seats across independent seed values without changing the 48-card deal',()=>{
    for(const [seed,starter] of [[0,'p1'],[0x80000000,'p2']] as const){
      const state=minhwatuEngine.createInitialState(seed);
      expect(state.turn).toBe(starter);expectCardConservation(state);
      expect(minhwatuEngine.getPlayerView(state,starter).actions.length).toBeGreaterThan(0);
    }
  });
  it('deals all 48 standard Korean hwatu cards as 10/10/8/20 and hides stock and seed',()=>{
    const s=minhwatuEngine.createInitialState(7),again=minhwatuEngine.createInitialState(7),view=minhwatuEngine.getPlayerView(s,'p1'),all=cardsIn(s);
    expect(again).toEqual(s);expect(s.hands.p1).toHaveLength(10);expect(s.hands.p2).toHaveLength(10);expect(s.table).toHaveLength(8);expect(s.deck).toHaveLength(20);
    expectCardConservation(s);
    expect(Array.from({length:12},(_,i)=>all.filter(c=>c.month===i+1).length)).toEqual(Array(12).fill(4));
    expect(['bright','animal','ribbon','plain'].map(kind=>all.filter(c=>c.kind===kind).length)).toEqual([5,9,10,24]);
    expect(all.reduce((sum,c)=>sum+c.points,0)).toBe(240);
    expect(view.ownHand).toHaveLength(10);expect(view.opponentCount).toBe(10);expect(view).not.toHaveProperty('seed');expect(view).not.toHaveProperty('deck');
    expect(s.events?.[0]).toMatchObject({sequence:1,type:'deal'});
    expect(s.events?.[0]?.cards?.map(card=>card.id)).toEqual(s.table.map(card=>card.id));
    const initialEventIds=s.events?.flatMap(event=>event.cards?.map(card=>card.id)??[])??[];
    expect(initialEventIds).toHaveLength(8);
    for(const card of [...s.hands.p1,...s.hands.p2,...s.deck])expect(initialEventIds).not.toContain(card.id);
    expect(view.log).toEqual(s.events);
    expect(view.ownHand[0]).toMatchObject({month:expect.any(Number),flower:{ko:expect.any(String),es:expect.any(String)},kind:expect.any(String),points:expect.any(Number),badge:{ko:expect.any(String),es:expect.any(String)}});
  });

  it('captures all three table cards when the fourth card of that month is played',()=>{
    const s=stateWithMonth(minhwatuEngine.createInitialState(20),3),played=s.hands.p1[0];const action={type:'play',payload:{index:0}};
    expect(minhwatuEngine.validateAction(s,'p1',action)).toBeNull();const next=minhwatuEngine.applyAction(s,'p1',action);
    expect(next.captures.p1.filter(c=>c.month===played.month)).toHaveLength(4);expect(next.table.filter(c=>c.month===played.month)).toHaveLength(0);expect(s.hands.p1).toHaveLength(10);expectCardConservation(next);
  });

  it('offers each duplicate table target and rejects an omitted or unrelated target',()=>{
    const s=stateWithMonth(minhwatuEngine.createInitialState(21),2),card=s.hands.p1[0];
    expect(minhwatuEngine.validateAction(s,'p1',{type:'play',payload:{index:0}})).toBeTruthy();
    const actions=minhwatuEngine.getPlayerView(s,'p1').actions.filter((a:any)=>a.action.type==='play'&&a.action.payload.index===0);
    expect(actions.map((a:any)=>a.action.payload.targetIndex)).toEqual([0,1]);
    expect(minhwatuEngine.validateAction(s,'p1',{type:'play',payload:{index:0,targetIndex:7}})).toBeTruthy();
    const next=minhwatuEngine.applyAction(s,'p1',actions[1].action);
    expect(next.captures.p1.filter(c=>c.month===card.month)).toHaveLength(2);expect(next.table.filter(c=>c.month===card.month)).toHaveLength(1);expectCardConservation(next);
  });

  it('makes a duplicate stock draw a separate choice and captures the chosen pair',()=>{
    const base=minhwatuEngine.createInitialState(22),all=cardsIn(base),handCard=all.find(c=>c.month===1)!,matching=all.filter(c=>c.month===2),rest=all.filter(c=>c.id!==handCard.id&&!matching.includes(c));const s:MinhwatuState={...base,hands:{p1:[handCard,...rest.slice(0,9)],p2:rest.slice(15,25)},table:[...matching.slice(0,2),...rest.slice(9,15)],deck:[matching[2],...rest.slice(25,44)],captures:{p1:[],p2:[matching[3]]},turn:'p1',phase:'play',pending:null,result:null};
    const next=minhwatuEngine.applyAction(s,'p1',{type:'play',payload:{index:0}});
    expect(next.phase).toBe('capture-draw');expect(next.pending?.card.month).toBe(2);
    const choices=minhwatuEngine.getPlayerView(next,'p1').actions;expect(choices).toHaveLength(2);
    const resolved=minhwatuEngine.applyAction(next,'p1',choices[0].action);
    expect(resolved.phase).toBe('play');expect(resolved.captures.p1.filter(c=>c.month===next.pending?.card.month)).toHaveLength(2);expect(resolved.captures.p1.some(c=>c.id===handCard.id)).toBe(false);expectCardConservation(resolved);
  });

  it('resolves a unique match and leaves a nonmatching play on the table before drawing',()=>{
    const unique=stateWithMonth(minhwatuEngine.createInitialState(24),1),month=unique.hands.p1[0].month;
    const uniqueDrawIndex=unique.deck.findIndex(card=>card.month!==month);[unique.deck[0],unique.deck[uniqueDrawIndex]]=[unique.deck[uniqueDrawIndex],unique.deck[0]];
    const afterPair=minhwatuEngine.applyAction(unique,'p1',{type:'play',payload:{index:0}});
    expect(afterPair.captures.p1.filter(c=>c.month===month)).toHaveLength(2);
    expect(afterPair.table.filter(c=>c.month===month)).toHaveLength(0);expectCardConservation(afterPair);
    const miss=stateWithMonth(minhwatuEngine.createInitialState(30),0),missIndex=miss.hands.p1.findIndex(card=>!miss.table.some(tableCard=>tableCard.month===card.month));
    const missCard=miss.hands.p1[missIndex],drawIndex=miss.deck.findIndex(card=>card.month!==missCard.month&&!miss.table.some(tableCard=>tableCard.month===card.month));
    [miss.deck[0],miss.deck[drawIndex]]=[miss.deck[drawIndex],miss.deck[0]];
    const afterMiss=minhwatuEngine.applyAction(miss,'p1',{type:'play',payload:{index:missIndex}});
    expect(afterMiss.table.some(c=>c.id===missCard.id)).toBe(true);expectCardConservation(afterMiss);
  });

  it('requires the acting seat, phase and legal targets for play and pending capture',()=>{
    const base=minhwatuEngine.createInitialState(25),duplicate=stateWithMonth(base,2,true),wrong= {type:'play',payload:{index:0}};
    expect(minhwatuEngine.validateAction(duplicate,'p2',wrong)).toBe('Not your turn');
    expect(minhwatuEngine.validateAction(duplicate,'p1',{type:'play',payload:{index:-1}})).toBe('Invalid hand index');
    expect(minhwatuEngine.validateAction(duplicate,'p1',{type:'play',payload:{index:99}})).toBe('Invalid hand index');
    expect(minhwatuEngine.validateAction(duplicate,'p1',{type:'play',payload:{index:0,targetIndex:7}})).toBeTruthy();
    const pendingPlayIndex=duplicate.hands.p1.findIndex(card=>!duplicate.table.some(tableCard=>tableCard.month===card.month));
    expect(pendingPlayIndex).toBeGreaterThanOrEqual(0);
    const pending=minhwatuEngine.applyAction(duplicate,'p1',{type:'play',payload:{index:pendingPlayIndex}});
    expect(pending.phase).toBe('capture-draw');
    expect(minhwatuEngine.validateAction(pending,'p2',{type:'capture',payload:{targetIndex:0}})).toBe('Not your turn');
    expect(minhwatuEngine.validateAction(pending,'p1',{type:'play',payload:{index:0}})).toBe('Resolve the current capture first');
    expect(minhwatuEngine.validateAction(pending,'p1',{type:'capture',payload:{targetIndex:99}})).toBe('Choose one matching table card');
    expect(minhwatuEngine.validateAction(pending,'p1',{type:'capture',payload:{targetIndex:0}})).toBeNull();
    const captured=minhwatuEngine.applyAction(pending,'p1',{type:'capture',payload:{targetIndex:0}});
    expect(captured.phase).toBe('play');expect(captured.pending).toBeNull();expect(captured.turn).toBe('p2');expectCardConservation(captured);
  });

  it('scores the selected Korean month and ribbon bonuses separately from Go-Stop',()=>{
    const all=minhwatuEngine.createInitialState(23),deck=cardsIn(all);
    const score=(test:(c:MinhwatuCard)=>boolean)=>scoreMinhwatuCards(deck.filter(test));
    expect(score(c=>c.month===11)).toBe(60); // 20-point bright plus the 40-point paulownia set
    expect(score(c=>c.month===5)).toBe(35); // 10 + 5 + 20
    expect(score(c=>c.ribbonSet==='red')).toBe(45); // three 5-point ribbons plus 30
    expect(score(c=>c.ribbonSet==='blue')).toBe(45);
    expect(score(c=>c.ribbonSet==='grass')).toBe(45);
    expect(score(c=>c.month===12)).toBe(55); // 20 + 10 + 5 + 20
    const redSet=deck.filter(c=>c.ribbonSet==='red'),bright=deck.find(c=>c.kind==='bright')!;expect(scoreMinhwatuMatch({p1:redSet,p2:[bright]})).toEqual({p1:75,p2:-10});
  });

  it('awards only complete yakus, including multiple independent sets, and keeps match penalties unbounded below zero',()=>{
    const cards=cardsIn(minhwatuEngine.createInitialState(27));
    const month=(n:number)=>cards.filter(c=>c.month===n);
    const red=cards.filter(c=>c.ribbonSet==='red'),blue=cards.filter(c=>c.ribbonSet==='blue'),grass=cards.filter(c=>c.ribbonSet==='grass');
    expect(scoreMinhwatuCards(month(11).slice(0,3))).toBe(20); // no 11-month collection bonus until all four cards are captured
    expect(scoreMinhwatuCards(month(5).slice(0,3))).toBe(15);
    expect(scoreMinhwatuCards(red.slice(0,2))).toBe(10);
    const combined=[...new Map([...month(11),...month(5),...red,...blue,...grass].map(card=>[card.id,card])).values()];
    expect(scoreMinhwatuCards(combined)).toBe(225);
    expect(scoreMinhwatuMatch({p1:red,p2:month(11)})).toEqual({p1:35,p2:70});
    const negative=scoreMinhwatuMatch({p1:[],p2:[...month(11),...month(5),...month(10),...month(12),...red,...blue,...grass]});
    expect(negative.p1).toBeLessThan(0);
  });

  it('awards Godori only for the exact three bird cards and applies the existing bonus transfer',()=>{
    const all=cardsIn(minhwatuEngine.createInitialState(31)),godori=['2-1','4-1','8-2'].map(id=>all.find(card=>card.id===id)!);
    const progress=minhwatuYakuProgress(godori),godoriYaku=progress.find(yaku=>yaku.id==='godori')!;
    expect(godoriYaku).toMatchObject({have:3,need:3,complete:true,bonus:50,cardIds:['2-1','4-1','8-2']});
    expect(progress.filter(yaku=>yaku.complete&&yaku.bonus>0)).toHaveLength(1);
    expect(scoreMinhwatuCards(godori)).toBe(80);
    expect(scoreMinhwatuCards(godori.slice(0,2))).toBe(20);
    expect(scoreMinhwatuMatch({p1:godori,p2:[]})).toEqual({p1:130,p2:-50});
    expect(minhwatuYakuProgress([godori[0],godori[1],all.find(c=>c.id==='8-1')!]).find(yaku=>yaku.id==='godori')).toMatchObject({have:2,complete:false});
  });

  it('connects a newly completed Godori to capture deltas, one special event, and the final winner',()=>{
    const base=minhwatuEngine.createInitialState(55),all=cardsIn(base),byId=(id:string)=>all.find(c=>c.id===id)!;
    const state:MinhwatuState={...base,hands:{p1:[byId('8-2')],p2:[]},deck:[],table:[byId('8-3')],captures:{p1:[byId('2-1'),byId('4-1')],p2:[byId('1-1')]},events:[]};
    const next=minhwatuEngine.applyAction(state,'p1',{type:'play',payload:{index:0}});
    expect(next.events?.find(event=>event.type==='capture')?.scoreChanges).toEqual({p1:110,p2:-50});
    expect(next.events?.filter(event=>event.type==='special')).toHaveLength(1);
    expect(next.events?.find(event=>event.type==='special')?.yaku).toMatchObject({id:'godori',bonus:50});
    expect(next.result).toMatchObject({winner:'p1',scores:{p1:130,p2:-30}});
    for(const player of ['p1','p2'] as const){
      const view=minhwatuEngine.getPlayerView(next,player);
      expect(view.board.scores).toEqual(next.result!.scores);
      expect(view.log).toEqual(next.events);
      expect(view.board.breakdown.p1.yakus.find((yaku: any)=>yaku.id==='godori')).toMatchObject({complete:true,bonus:50});
    }
  });

  it('preserves settled pre-Godori games while ongoing legacy games adopt the new rule',()=>{
    const base=minhwatuEngine.createInitialState(56),all=cardsIn(base),birds=['2-1','4-1','8-2'].map(id=>all.find(card=>card.id===id)!);
    const legacy:MinhwatuState={...base,rulesVersion:undefined,captures:{p1:birds,p2:[]},phase:'finished',result:{winner:'p1',reason:'legacy',scores:{p1:30,p2:0}}};
    const completed=minhwatuEngine.getPlayerView(legacy,'p1');
    expect(completed.board.rulesVersion).toBe(1);
    expect(completed.board.scores).toEqual({p1:30,p2:0});
    expect(completed.result).toEqual(legacy.result);
    const ongoing=minhwatuEngine.getPlayerView({...legacy,result:null,phase:'play'},'p1');
    expect(ongoing.board.rulesVersion).toBe(2);
    expect(ongoing.board.scores).toEqual({p1:130,p2:-50});
  });

  it('exposes all yaku thresholds while preserving base, own-yaku and opponent-yaku score components',()=>{
    const all=cardsIn(minhwatuEngine.createInitialState(32));
    const p1=['1-2','2-2','3-2'].map(id=>all.find(card=>card.id===id)!);
    const p2=['11-1','11-2','11-3','11-4'].map(id=>all.find(card=>card.id===id)!);
    const breakdown=minhwatuScoreBreakdown({p1,p2});
    expect(breakdown.p1).toMatchObject({counts:{bright:0,animal:0,ribbon:3,plain:0},basePoints:15,ownYakuPoints:30,opponentYakuPoints:40,finalScore:35});
    expect(breakdown.p2).toMatchObject({counts:{bright:1,animal:0,ribbon:0,plain:3},basePoints:20,ownYakuPoints:40,opponentYakuPoints:30,finalScore:70});
    expect(breakdown.p1.yakus.find(yaku=>yaku.id==='hongdan')).toMatchObject({have:3,need:3,complete:true,bonus:30});
    expect(breakdown.p1.yakus.find(yaku=>yaku.id==='cheongdan')).toMatchObject({have:0,need:3,complete:false,bonus:30});
    expect(breakdown.p2.yakus.find(yaku=>yaku.id==='month-11')).toMatchObject({have:4,need:4,complete:true,bonus:40});
    expect(breakdown.p2.yakus.find(yaku=>yaku.id==='month-5')).toMatchObject({have:0,need:4,complete:false,bonus:20});
    expect(scoreMinhwatuMatch({p1,p2})).toEqual({p1:breakdown.p1.finalScore,p2:breakdown.p2.finalScore});
    breakdown.p1.yakus[0].cardIds.push('mutated');
    expect(minhwatuYakuProgress(p1)[0].cardIds).not.toContain('mutated');
  });

  it('emits sequenced public capture and special events with exact score changes and card origins',()=>{
    const base=minhwatuEngine.createInitialState(33),all=cardsIn(base),byId=(id:string)=>all.find(card=>card.id===id)!;
    const alreadyCaptured=[byId('1-2'),byId('2-2')],played=byId('3-2'),tableMatch=byId('3-1');
    const excluded=new Set([...alreadyCaptured,played,tableMatch].map(card=>card.id));
    const rest=all.filter(card=>!excluded.has(card.id));
    const hand1=[played,...rest.slice(0,9)],hand2=rest.slice(9,19),table=[tableMatch,...rest.slice(19,26)];
    const deck=rest.slice(26);const drawIndex=deck.findIndex(card=>card.month!==3);[deck[0],deck[drawIndex]]=[deck[drawIndex],deck[0]];
    const s:MinhwatuState={...base,hands:{p1:hand1,p2:hand2},table,deck,captures:{p1:alreadyCaptured,p2:[]},turn:'p1',phase:'play',pending:null,result:null,events:[]};
    expectCardConservation(s);
    const next=minhwatuEngine.applyAction(s,'p1',{type:'play',payload:{index:0}}),events=next.events!;
    expect(s.events).toEqual([]);
    expect(events.map(event=>event.sequence)).toEqual(events.map((_,i)=>i+1));
    expect(events.map(event=>event.type)).toEqual(['play','capture','special','draw','turn']);
    const capture=events.find(event=>event.type==='capture')!;
    expect(capture.actor).toBe('p1');expect(capture.cards?.map(card=>card.id)).toEqual(['3-1','3-2']);
    expect(capture.origins).toEqual({'3-1':'table','3-2':'table'});
    expect(capture.scoreChanges).toEqual({p1:85,p2:-30});
    expect(events.find(event=>event.type==='special')).toMatchObject({yaku:{id:'hongdan',bonus:30}});
    expectCardConservation(next);
  });

  it('records a duplicate-month stock draw as public pending state before its capture choice',()=>{
    const s=stateWithMonth(minhwatuEngine.createInitialState(34),2,true);
    const playIndex=s.hands.p1.findIndex(card=>!s.table.some(tableCard=>tableCard.month===card.month));
    const next=minhwatuEngine.applyAction(s,'p1',{type:'play',payload:{index:playIndex}});
    expect(next.phase).toBe('capture-draw');expect(next.pending?.card.id).toBe(s.deck[0].id);
    expect(next.events?.map(event=>event.type)).toEqual(['deal','play','draw']);
    expectCardConservation(next);
    for(const player of ['p1','p2'] as const){
      const view=minhwatuEngine.getPlayerView(next,player);
      expect(view.board.pendingCard?.id).toBe(s.deck[0].id);
      expect(view.board.actionLog.map((event:MinhwatuEvent)=>event.type)).toEqual(['deal','play','draw']);
    }
    const resolved=minhwatuEngine.applyAction(next,'p1',{type:'capture',payload:{targetIndex:0}});
    expect(resolved.events?.map(event=>event.type)).toContain('capture');expectCardConservation(resolved);
  });

  it('keeps public event logs bounded, immutable and free of unrevealed hand/deck IDs',()=>{
    const initial=minhwatuEngine.createInitialState(35),original=structuredClone(initial);
    const first=minhwatuEngine.applyAction(initial,'p1',minhwatuEngine.getPlayerView(initial,'p1').actions[0].action);
    expect(initial).toEqual(original);
    const publicIds=(first.events??[]).flatMap(event=>event.cards?.map(card=>card.id)??[]);
    for(const card of first.hands.p1.slice(0))expect(publicIds).not.toContain(card.id);
    for(const card of first.hands.p2)expect(publicIds).not.toContain(card.id);
    for(const card of first.deck)expect(publicIds).not.toContain(card.id);
    for(const player of ['p1','p2'] as const){
      const view=minhwatuEngine.getPlayerView(first,player);
      expect(view.log).toEqual(first.events);expect(view.board.actionLog).toEqual(first.events);
      expect(view.log).not.toBe(first.events);expect(view.board.actionLog).not.toBe(first.events);
      expect(view).not.toHaveProperty('seed');expect(view).not.toHaveProperty('deck');
      if(view.log[0]?.cards?.[0])view.log[0].cards[0].badge.ko='변경';
      expect(first.events?.[0]?.cards?.[0]?.badge.ko).not.toBe('변경');
      for(const card of first.hands[player==='p1'?'p2':'p1'])expect(view.log.flatMap((event:MinhwatuEvent)=>event.cards?.map((c:MinhwatuCard)=>c.id)??[])).not.toContain(card.id);
    }
    const legacy={...first};delete legacy.events;
    expect(minhwatuEngine.getPlayerView(legacy,'p1').log).toEqual([]);
    expect(minhwatuEngine.getPlayerView(legacy,'p1').board.breakdown).toEqual(minhwatuScoreBreakdown(legacy.captures));
  });

  it('keeps caller state and captured cards immutable while returning detached public views',()=>{
    const s=minhwatuEngine.createInitialState(28),before=structuredClone(s);
    const view=minhwatuEngine.getPlayerView(s,'p1');
    (view.ownHand[0] as MinhwatuCard).badge.ko='변경';
    (view.board.table[0] as MinhwatuCard).flower.es='cambio';
    expect(s).toEqual(before);
    const next=minhwatuEngine.applyAction(s,'p1',{type:'play',payload:{index:0}});
    expect(s).toEqual(before);expect(next).not.toBe(s);expectCardConservation(next,before.hands.p1.concat(before.hands.p2,before.table,before.deck).map(c=>c.id));
  });

  it('does not expose opponent cards, stock identities, or the seed in either player view',()=>{
    const s=minhwatuEngine.createInitialState(29);
    for(const player of ['p1','p2'] as const){
      const other=player==='p1'?'p2':'p1',view=minhwatuEngine.getPlayerView(s,player),json=JSON.stringify(view);
      expect(view.ownHand.map((c:MinhwatuCard)=>c.id)).toEqual(s.hands[player].map(c=>c.id));
      expect(view.opponentCount).toBe(10);expect(view.board.deckCount).toBe(20);
      expect(view).not.toHaveProperty('seed');expect(view).not.toHaveProperty('deck');
      const visibleIds=[...json.matchAll(/"id":"([^"]+)"/g)].map(match=>match[1]);
      for(const card of s.hands[other])expect(visibleIds).not.toContain(card.id);
      for(const card of s.deck)expect(visibleIds).not.toContain(card.id);
    }
  });

  it('plays the full stock and both hands to a scored result without losing or duplicating cards',()=>{
    let s=minhwatuEngine.createInitialState(53),steps=0;
    while(!s.result&&steps++<100){
      const view=minhwatuEngine.getPlayerView(s,s.turn),action=view.actions[0]?.action;expect(action).toBeTruthy();
      const next=minhwatuEngine.applyAction(s,s.turn,action);expect(next).not.toBe(s);s=next;
    }
    expect(steps).toBeLessThan(100);expect(s.phase).toBe('finished');expect(s.deck).toHaveLength(0);expect(s.hands.p1).toHaveLength(0);expect(s.hands.p2).toHaveLength(0);
    expect([...s.captures.p1,...s.captures.p2,...s.table]).toHaveLength(48);expectCardConservation(s);expect(s.result?.scores).toEqual(scoreMinhwatuMatch(s.captures));
    expect(s.events?.length).toBeLessThanOrEqual(48);expect(s.events?.at(-1)?.type).toBe('win');
    expect(s.events?.every((event,index,events)=>index===0||event.sequence===events[index-1].sequence+1)).toBe(true);
    const finalView=minhwatuEngine.getPlayerView(s,'p1');
    expect(finalView.board.breakdown).toEqual(minhwatuScoreBreakdown(s.captures));
    expect(finalView.result?.scores).toEqual({p1:finalView.board.breakdown.p1.finalScore,p2:finalView.board.breakdown.p2.finalScore});
  });

  it('settles a tied final score as a draw and reports it in the final public event',()=>{
    const base=minhwatuEngine.createInitialState(54),all=cardsIn(base),p1Card=all.find(card=>card.id==='1-1')!,tableCard=all.find(card=>card.id==='1-3')!,p2Bright=all.find(card=>card.id==='3-1')!;
    const tie:MinhwatuState={...base,hands:{p1:[p1Card],p2:[]},table:[tableCard],deck:[],captures:{p1:[],p2:[p2Bright]},turn:'p1',phase:'play',pending:null,result:null,events:[]};
    const final=minhwatuEngine.applyAction(tie,'p1',{type:'play',payload:{index:0}});
    expect(final.phase).toBe('finished');expect(final.result).toMatchObject({winner:'draw',scores:{p1:20,p2:20}});
    expect(final.events?.at(-1)).toMatchObject({type:'win',winner:'draw'});
  });
});
