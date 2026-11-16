import { legacyInitial } from './marble.effectFixtures';
import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { marbleEffectFixture } from './marble.effectFixtures';
import { marbleBuildToCostAtPrice, marbleCityValueAtPrice, marbleRentAtBase } from './marbleEconomy';
import { chooseSimpleAiAction } from './simpleAi';

for (const [name, engine] of [['2p', marbleEngine], ['4p', fourMarbleEngine]] as const) describe(`${name} production v1 atomic construction`, () => {
  const act = (s:any, type:string, payload?:Record<string,unknown>):any => engine.applyAction(s, 'p1', {type,payload});
  const fresh = () => { const s=marbleEffectFixture(engine); s.properties={}; s.phase='decision';s.positions.p1=4;s.pendingTile=4;s.buildSite=4;return s; };
  const tile = (s:any):any => { const view:any=engine.getPlayerView(s,'p1'); return view.board?.tiles[4] ?? { ...view.publicBoard[4], ...s.properties[4] }; };
  for(const targetLevel of [0,1,2]) it(`buys land and target ${targetLevel} with one debit and identical investment`,()=>{
    const s=fresh(), before=structuredClone(s), t=tile(s), total=t.price+marbleBuildToCostAtPrice(t.price,0,targetLevel,s.economicVersion);
    const n=act(s,'buy',{targetLevel});let sequential=act(s,'buy');for(let i=0;i<targetLevel;i++)sequential=act(sequential,'build',{tile:4});
    expect(n.money).toEqual(sequential.money);expect(n.properties).toEqual(sequential.properties);expect(n.phase).toBe('main');expect(n.buildSite).toEqual(sequential.buildSite);expect(n.landmarkOptions).toEqual(sequential.landmarkOptions);expect(s).toEqual(before);
    expect(n.actionLog.filter((e:any)=>e.moneyDelta)).toHaveLength(1);expect(n.actionLog.find((e:any)=>e.type==='buy')).toMatchObject({amount:total,moneyDelta:{p1:-total}});
    expect(n.properties[4]).toEqual({owner:'p1',houses:targetLevel});expect(marbleCityValueAtPrice(t.price,targetLevel,s.economicVersion)).toBe(total);
    expect(engine.validateAction(n,'p1',{type:'buy',payload:{targetLevel}})).toBeTruthy();
  });
  for(const current of [0,1,2]) it(`builds from ${current} to final permitted target once, preserving old action`,()=>{
    const s=act(fresh(),'buy');s.properties[4].houses=current;s.landmarkOptions=current===2?[4]:[];const targetLevel=current===2?3:2;
    const n=act(s,'build',{tile:4,targetLevel});let seq=s;for(let i=current;i<targetLevel;i++)seq=act(seq,'build',{tile:4});
    expect(n.money).toEqual(seq.money);expect(n.properties).toEqual(seq.properties);expect(n.landmarkOptions).toEqual(seq.landmarkOptions);expect(n.turns).toBe(s.turns);
    expect(n.actionLog.filter((e:any)=>e.type==='build')).toHaveLength(1);expect(engine.validateAction(n,'p1',{type:'build',payload:{tile:4,targetLevel}})).toBeTruthy();
  });
  it('rejects forged, fractional, backwards, over-limit, wrong-site, and locked landmark targets',()=>{
    const s=fresh();for(const targetLevel of [-1,3,4,1.5,'2',null,undefined,Infinity,NaN]) expect(engine.validateAction(s,'p1',{type:'buy',payload:{targetLevel}})).toBeTruthy();
    expect(engine.validateAction(s,'p1',{type:'buy',payload:{targetLevel:2,buildings:['villa']}})).toBeTruthy();
    const owned=act(s,'buy');for(const targetLevel of [0,-1,3,4,1.5,'2',null,undefined]) expect(engine.validateAction(owned,'p1',{type:'build',payload:{tile:4,targetLevel}})).toBeTruthy();
    owned.buildSite=5;expect(engine.validateAction(owned,'p1',{type:'build',payload:{tile:4,targetLevel:2}})).toBeTruthy();owned.buildSite=4;
    const top=act(owned,'build',{tile:4,targetLevel:2});expect(engine.validateAction(top,'p1',{type:'build',payload:{tile:4,targetLevel:3}})).toBeTruthy();
  });
  it('checks combined affordability before mutating and enumerates only affordable targets',()=>{
    const s=fresh(), t=tile(s), cost=t.price+marbleBuildToCostAtPrice(t.price,0,2,s.economicVersion);s.money.p1=cost-1;const before=structuredClone(s);
    expect(()=>act(s,'buy',{targetLevel:2})).toThrow();expect(s).toEqual(before);
    expect(engine.getPlayerView(s,'p1').actions.some((x:any)=>x.action.type==='buy'&&x.action.payload?.targetLevel===2)).toBe(false);
    s.money.p1=cost;const n=act(s,'buy',{targetLevel:2});expect(n.money.p1).toBe(0);
    const bare=act(fresh(),'buy'), buildCost=marbleBuildToCostAtPrice(t.price,0,2,s.economicVersion);bare.money.p1=buildCost-1;const prior=structuredClone(bare);expect(()=>act(bare,'build',{tile:4,targetLevel:2})).toThrow();expect(bare).toEqual(prior);
  });
  it('START allows one chosen city batch then consumes its remote permission',()=>{
    const s=act(fresh(),'buy');s.buildSite='start';s.positions.p1=0;s.pendingTile=0;s.properties[5]={owner:'p1',houses:0};
    const n=act(s,'build',{tile:4,targetLevel:2});expect(n.properties[4].houses).toBe(2);expect(n.buildSite).toBeNull();expect(engine.validateAction(n,'p1',{type:'build',payload:{tile:5,targetLevel:1}})).toBeTruthy();
  });
  it('preserves old no-target saves while refusing the new target contract outside v1',()=>{
    for(const version of [undefined,2]) {const s=fresh();s.constructionRulesVersion=version;expect(engine.validateAction(s,'p1',{type:'buy',payload:{targetLevel:1}})).toBeTruthy();const bare=act(s,'buy');expect(bare.properties[4].houses).toBe(0);expect(engine.validateAction(bare,'p1',{type:'build',payload:{tile:4,targetLevel:2}})).toBeTruthy();}
    expect(legacyInitial(engine, 1).constructionRulesVersion).toBe(1);
  });
  it('keeps post-acquisition top-stage landmark permission but not incomplete acquisition',()=>{
    for(const houses of [0,2]) {const s=fresh();s.phase='main';s.properties[4]={owner:'p2',houses};s.takeoverTile=4;let n=act(s,'takeover',{tile:4});if(houses===0)n=act(n,'build',{tile:4,targetLevel:2});expect(engine.validateAction(n,'p1',{type:'build',payload:{tile:4,targetLevel:3}})===null).toBe(houses===2);}
  });
  it('public legal batch actions are server-valid and previews use the resulting toll',()=>{
    const s=fresh();for(const option of engine.getPlayerView(s,'p1').actions)expect(engine.validateAction(s,'p1',option.action)).toBeNull();const n=act(s,'buy',{targetLevel:2}), t=tile(n);expect(t.houses).toBe(2);expect(t.currentRent??marbleRentAtBase(t.rent,2,n.economicVersion)).toBe(marbleRentAtBase(t.rent,2,n.economicVersion));
    for(const option of engine.getPlayerView(act(fresh(),'buy'),'p1').actions)expect(engine.validateAction(act(fresh(),'buy'),'p1',option.action)).toBeNull();
  });
  if(name==='2p') it('AI accounts for full batch costs and does not spend its reserve on an affordable but unsafe batch',()=>{
    const s=fresh();s.money.p1=250;const view=engine.getPlayerView(s,'p1'), action=chooseSimpleAiAction('marble',view,'p1',()=>0,150)!;
    expect(engine.validateAction(s,'p1',action)).toBeNull();if(action.type==='buy'){const n=act(s,action.type,action.payload);expect(n.money.p1).toBeGreaterThanOrEqual(150);}
  });
});
