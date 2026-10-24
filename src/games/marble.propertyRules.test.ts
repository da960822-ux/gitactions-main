import { describe, expect, it } from 'vitest';
import { chooseSimpleAiAction } from './simpleAi';
import { seededRandom } from '../core/types';
import { marbleEngine, marbleCityValue, marbleTakeoverPrice } from './marble';
import { fourMarbleEngine } from './fourMarble';

function dice(a: number, b: number) {
  for (let seed=0;seed<10000;seed++) { const r=seededRandom(seed); if(1+Math.floor(r()*6)===a&&1+Math.floor(r()*6)===b)return seed; }
  throw new Error('Missing dice seed');
}
for (const [name, engine, four] of [['1v1', marbleEngine, false], ['2v2', fourMarbleEngine, true]] as const) describe(`Marble property rules v1 · ${name}`, () => {
  const fresh=()=>engine.createInitialState(1) as any;
  const act=(s:any,type:string,payload?:Record<string,unknown>)=>engine.applyAction(s,s.active,{type,payload}) as any;
  const view=(s:any)=>engine.getPlayerView(s,s.active) as any;
  const choices=(s:any)=>view(s).actions.map((x:any)=>x.action);
  const board=(s:any)=>four?view(s).publicBoard:view(s).board.tiles;
  const land=(s:any)=>act({...s,rng:dice(1,2),phase:'roll',positions:{...s.positions,p1:1}},'roll');
  it('pays rent once before acquisition, preserves buildings and pays the actual owner',()=>{
    const s=fresh(),owner=four?'p4':'p2';s.properties[4]={owner,houses:2};
    let n=land(s);expect(n.money.p1).toBe(1428);expect(n.money[owner]).toBe(1572);
    expect(choices(n)).toContainEqual({type:'takeover',payload:{tile:4}});
    expect(engine.validateAction(n,'p1',{type:'takeover',payload:{tile:5}})).toBeTruthy();
    n=four?{...n,modifiers:{4:{festival:owner,blackout:'p1'}}}:{...n,rentModifiers:{4:{festival:{owner,playerId:owner,source:'city-festival'}}}};
    n=act(n,'takeover',{tile:4});expect(n.properties[4]).toEqual({owner:'p1',houses:2});expect(n.money.p1).toBe(868);expect(n.money[owner]).toBe(2132);
    expect((four?n.modifiers:n.rentModifiers)[4]).toBeUndefined();expect(n.takeoverTile).toBeNull();
    expect(engine.validateAction(n,'p1',{type:'takeover',payload:{tile:4}})).toBeTruthy();
    expect(s.properties[4].owner).toBe(owner);
  });
  it('does not offer an unaffordable or landmark takeover; rent-pass decision cannot bypass rent',()=>{
    const s=fresh();s.properties[4]={owner:'p2',houses:3};let n=land(s);
    expect(choices(n).some((a:any)=>a.type==='takeover')).toBe(false);
    s.properties[4].houses=2;s.money.p1=100; n=land(s);expect(n.phase).toBe('main');expect(choices(n).some((a:any)=>a.type==='takeover')).toBe(false);
    s.money.p1=1500;s.rentPasses.p1=1;n=land(s);expect(n.phase).toBe('rent-decision');expect(engine.validateAction(n,'p1',{type:'takeover',payload:{tile:4}})).toBeTruthy();
    n=act(n,'use-rent-pass');expect(n.money.p1).toBe(1500);n=act(n,'takeover',{tile:4});expect(n.money.p1).toBe(940);
  });
  it('doubles personal complete-group rent and updates it immediately after selling or acquisition',()=>{
    const s=fresh();s.properties[4]={owner:'p2',houses:0};s.properties[5]={owner:'p2',houses:0};
    let n=land(s);expect(n.money.p1).toBe(1464);expect(board(n)[4].monopolyMultiplier).toBe(2);
    n=act(n,'takeover',{tile:4});expect(board(n)[5].monopolyMultiplier).toBe(1);expect(board(n)[4].monopolyMultiplier).toBe(1);
    if(four){const allied=fresh();allied.properties[4]={owner:'p3',houses:3};allied.properties[5]={owner:'p3',houses:0};const a=land(allied);expect(a.money.p1).toBe(1500);expect(choices(a).some((x:any)=>x.type==='takeover')).toBe(false);}
  });
  it('requires rescue before bankruptcy and settles the original creditor exactly once after a half-value sale',()=>{
    const s=fresh();s.money.p1=30;s.debt.p1=330;s.properties[4]={owner:'p2',houses:2};s.properties[1]={owner:'p1',houses:1};
    let n=land(s);expect(n.phase).toBe('debt');expect(choices(n)).toContainEqual({type:'sell-property',payload:{tile:1}});expect(choices(n).some((a:any)=>a.type==='declare-bankruptcy')).toBe(false);
    expect(engine.validateAction(n,'p1',{type:'sell-property',payload:{tile:4}})).toBeTruthy();
    n=act(n,'sell-property',{tile:1});expect(n.phase).toBe('main');expect(n.money.p1).toBe(28);expect(n.money.p2).toBe(1572);expect(n.pendingPayment).toBeNull();expect(n.properties[1]).toBeUndefined();
    expect(engine.validateAction(n,'p1',{type:'sell-property',payload:{tile:1}})).toBeTruthy();
    expect(n.actionLog.filter((e:any)=>e.type==='rent')).toHaveLength(1);
  });
  it('keeps unresolved debt after a partial sale and permits bankruptcy only when all rescue is insufficient',()=>{
    const s=fresh();s.money.p1=0;s.debt.p1=330;s.properties[4]={owner:'p2',houses:3};s.properties[1]={owner:'p1',houses:0};
    let n=land(s);expect(n.phase).toBe('debt');expect(choices(n).some((a:any)=>a.type==='declare-bankruptcy')).toBe(true);
    n=act(n,'sell-property',{tile:1});expect(n.phase).toBe('debt');expect(n.money.p1).toBe(50);expect(n.money.p2).toBe(1500);
  });
  it('finishes each double landing before another roll and sends a third double to the island without salary',()=>{
    let n=fresh();
    for(let i=1;i<=2;i++){n=act({...n,phase:'roll',rng:dice(1,1),positions:{...n.positions,p1:21}},'roll');expect(n.extraRoll).toBe(true);expect(n.doublesCount).toBe(i);expect(n.phase).toBe('main');n=act(n,'endTurn');expect(n.active).toBe('p1');expect(n.phase).toBe('roll');expect(n.turns).toBe(0);}
    const cash=n.money.p1;n=act({...n,rng:dice(1,1),positions:{...n.positions,p1:39}},'roll');expect(n.positions.p1).toBe(10);expect(n.money.p1).toBe(cash);expect(n.islandTurns.p1).toBe(3);expect(n.extraRoll).toBe(false);expect(n.doublesCount).toBe(0);n=act(n,'endTurn');expect(n.active).toBe('p2');expect(n.turns).toBe(1);
  });
  it('preserves an earned extra roll through a golden-card debt and loan resolution',()=>{
    const s=fresh();s.rng=dice(1,1);s.eventDeck=['travel-cost'];s.money.p1=50;
    let n=act(s,'roll');expect(n.phase).toBe('debt');expect(n.extraRoll).toBe(true);n=act(n,'borrow');expect(n.money.p1).toBe(250);expect(n.phase).toBe('main');n=act(n,'endTurn');expect(n.active).toBe('p1');expect(n.phase).toBe('roll');
  });
  it('protects landmarks from blackout targeting while keeping normal taxes and maintenance',()=>{
    const s=fresh();s.rng=dice(1,1);s.eventDeck=['blackout'];s.properties[4]={owner:'p2',houses:3};s.properties[5]={owner:'p2',houses:0};
    let n=act(s,'roll');expect(n.phase).toBe('event-decision');expect(choices(n)).toContainEqual({type:'choose-event-city',payload:{tile:5}});expect(engine.validateAction(n,'p1',{type:'choose-event-city',payload:{tile:4}})).toBeTruthy();
    delete s.properties[5];n=act(s,'roll');expect(n.phase).toBe('main');
  });
  it('restores the original drawer and its extra roll after a different player sells cities for an event debt',()=>{
    const s=fresh();s.rng=dice(1,1);s.eventDeck=['monopoly-warning'];s.money.p2=0;s.debt.p2=330;s.properties[1]={owner:'p2',houses:0};s.properties[15]={owner:'p2',houses:0};
    let n=act(s,'roll');expect(n.active).toBe('p2');expect(n.phase).toBe('debt');expect(n.extraRoll).toBe(true);
    n=act(n,'sell-property',{tile:1});expect(n.active).toBe('p2');expect(n.phase).toBe('debt');
    n=act(n,'sell-property',{tile:15});expect(n.active).toBe('p1');expect(n.phase).toBe('main');expect(n.money.p2).toBe(10);expect(n.pendingPayment).toBeNull();
    n=act(n,'endTurn');expect(n.active).toBe('p1');expect(n.phase).toBe('roll');
  });
  it('removes a previously applied blackout when upgrading its city into a landmark',()=>{
    const s=fresh();s.phase='main';s.properties[4]={owner:'p1',houses:2};
    if(four)s.modifiers[4]={blackout:'p2'};else s.rentModifiers[4]={blackout:{owner:'p1',playerId:'p2',source:'blackout'}};
    const n=act(s,'build',{tile:4});expect(n.properties[4].houses).toBe(3);expect((four?n.modifiers:n.rentModifiers)[4]?.blackout).toBeUndefined();
  });
  it('completes new-version AI matches without illegal actions, negative cash or unbounded extra rolls',()=>{
    for(const seed of [7,29,71]){
      let n=engine.createInitialState(seed) as any;
      for(let moves=0;!n.result&&moves<4000;moves++){
        const v=view(n),p=n.active;
        const action=four?fourMarbleEngine.chooseAiAction(v,p,()=>.5):chooseSimpleAiAction('marble',v,p,()=>.5);
        expect(action).toBeTruthy();expect(engine.validateAction(n,p,action!)).toBeNull();n=engine.applyAction(n,p,action!) as any;
        expect(Object.values(n.money).every(cash=>Number(cash)>=0)).toBe(true);
        expect(Object.values(n.properties).every((prop:any)=>prop.houses>=0&&prop.houses<=3)).toBe(true);
      }
      expect(n.result).toBeTruthy();expect(n.turns).toBeLessThanOrEqual(120);
    }
  });
  it('leaves saved games without the version flag on their original rent and turn rules',()=>{
    const s=fresh();delete s.propertyRulesVersion;s.properties[4]={owner:'p2',houses:0};s.properties[5]={owner:'p2',houses:0};
    let n=land(s);expect(n.money.p1).toBe(1482);expect(choices(n).some((a:any)=>a.type==='takeover')).toBe(false);
    n=act({...s,positions:{...s.positions,p1:21},rng:dice(1,1)},'roll');expect(n.extraRoll).not.toBe(true);n=act(n,'endTurn');expect(n.active).toBe('p2');
  });
});
it('uses actual additional stage prices, cumulative city values and no landmark acquisition price',()=>{
  const tile={kind:'property' as const,name:{ko:'테스트',es:'Prueba'},price:140,rent:18};
  expect([0,1,2,3].map(level=>marbleCityValue(tile,level,2))).toEqual([140,200,280,390]);
  expect([0,1,2,3].map(level=>marbleTakeoverPrice(tile,level,2))).toEqual([280,400,560,null]);
});
