import { describe, expect, it } from 'vitest';
import { fourMarbleEngine as engine, type FourMarbleState, type MarbleView } from './fourMarble';
import { seededRandom, type GameAction } from '../core/types';
import { constructionRent } from './marbleConstruction';
const fresh = () => engine.createInitialState(1) as FourMarbleState;
const step = (s: FourMarbleState, a: GameAction) => engine.applyAction(s,s.active,a) as FourMarbleState;
const travel = (s: FourMarbleState, destination: number) => { s.phase='train-decision'; s.trainFare=0; return step(s,{type:'choose-train',payload:{destination}}); };
const city = (owner: 'p1'|'p2'|'p3'|'p4') => ({owner,houses:0,buildings:[] as []});
const select = (s: FourMarbleState, tile=1) => step(s,{type:'choose-event-city',payload:{tile}});
const view = (s: FourMarbleState) => engine.getPlayerView(s,s.active) as MarbleView;
describe('four-seat festival-site revision2',()=>{
  it('defaults to6 tourism islands but preserves missing/revision1 Ibiza and owned assets',()=>{
    const s=fresh(); expect(s.boardRevision).toBe(4); expect(view(s).publicBoard[16].kind).toBe('festival-site'); expect(view(s).publicBoard.filter(t=>t.kind==='tourism')).toHaveLength(6); expect(view(s).publicState.boardRevision).toBe(4);
    for(const revision of [undefined,1] as const){ const old=fresh(); old.boardRevision=revision; old.rentRulesVersion=1; old.properties[16]=city('p1'); expect(view(old).publicBoard[16]).toMatchObject({kind:'tourism',price:150,rent:120}); expect(view(old).players[0].score).toBe(3150); const n=travel(old,16); expect(n.properties[16]).toEqual(old.properties[16]); expect(n.phase).toBe('main'); expect(n.actionLog.some(e=>e.type==='festival-site')).toBe(false); }
  });
  it('opens a free city choice without drawing a card, changing cash/fund or creating a fake card',()=>{
    const s=fresh(); s.properties[1]=city('p1'); s.fundPool=91; const deck=[...s.eventDeck], money={...s.money}; const n=travel(s,16);
    expect(n.phase).toBe('event-decision'); expect(n.pendingEvent).toBe('city-festival'); expect(n.pendingEventSource).toBe('festival-site'); expect(n.eventDeck).toEqual(deck); expect(n.money).toEqual(money); expect(n.fundPool).toBe(91);
    const receipt=n.actionLog.at(-1)!; expect(receipt).toMatchObject({type:'festival-site',tile:16,cardOutcome:'pending-choice'}); expect(receipt.cardId).toBeUndefined(); expect(receipt.cardDrawSequence).toBeUndefined();
    const applied=select(n); expect(applied.modifiers[1].festival).toBe('p1'); expect(applied.phase).toBe('main'); expect(applied.pendingEventSource).toBeUndefined(); expect(applied.eventDeck).toEqual(deck); expect(applied.actionLog.at(-1)).toMatchObject({type:'festival-site',tile:1,cardOutcome:'applied'}); expect(applied.actionLog.at(-1)?.cardId).toBeUndefined();
  });
  it('includes own landmarks, excludes teammates and islands and has explicit no-city result',()=>{
    const s=fresh(); s.properties[1]={owner:'p1',houses:3,buildings:['villa','building','hotel'],landmark:true}; s.properties[2]=city('p1'); s.properties[3]=city('p3'); const n=travel(s,16);
    expect(view(n).actions.map(c=>c.action.payload?.tile)).toEqual([1]); expect(engine.validateAction(n,'p1',{type:'choose-event-city',payload:{tile:2}})).toBeTruthy(); expect(engine.validateAction(n,'p1',{type:'choose-event-city',payload:{tile:3}})).toBeTruthy(); expect(select(n).modifiers[1].festival).toBe('p1');
    delete s.properties[1]; const noCity=travel(s,16); expect(noCity.phase).toBe('main'); expect(noCity.pendingEventSource).toBeUndefined(); expect(noCity.actionLog.at(-1)).toMatchObject({type:'festival-site',cardOutcome:'no-effect'}); expect(noCity.actionLog.at(-1)?.text.ko).toContain('없어');
  });
  it('overwrites rather than stacks and consumes only on the next enemy visit',()=>{
    let s=fresh(); s.properties[1]=city('p1'); const base=constructionRent(view(s).publicBoard[1],s.properties[1],s.economicVersion);
    s=select(travel(s,16)); s=select(travel(s,16)); s.active='p3'; s=travel(s,1); expect(s.modifiers[1].festival).toBe('p1');
    s.active='p2'; let before=s.money.p1; s=travel(s,1); expect(s.money.p1-before).toBe(base*2); expect(s.modifiers[1].festival).toBeUndefined(); before=s.money.p1; s=travel(s,1); expect(s.money.p1-before).toBe(base);
  });
  it('preserves free-world-travel card causality through the festival-site pending choice',()=>{
    const s=fresh(); s.properties[1]=city('p1'); s.eventDeck=['train-ticket','lottery']; let n=travel(s,12); expect(n.phase).toBe('train-decision'); const draw=n.pendingCardDrawSequence, deck=[...n.eventDeck]; expect(draw).toBeDefined();
    n=step(n,{type:'choose-train',payload:{destination:16}}); expect(n.pendingCardDrawSequence).toBe(draw); expect(n.actionLog.at(-1)).toMatchObject({type:'festival-site',cardDrawSequence:draw,cardPhase:'resolution',cardOutcome:'pending-choice'});
    n=select(n); expect(n.eventDeck).toEqual(deck); expect(n.pendingCardDrawSequence).toBeUndefined(); expect(n.actionLog.at(-1)).toMatchObject({type:'festival-site',cardDrawSequence:draw,cardPhase:'resolution',cardOutcome:'applied'}); expect(n.actionLog.filter(e=>e.cardPhase==='draw')).toHaveLength(1);
  });
  it('resets a stale site source before a normal card and uses the current tourism count in wins',()=>{
    const s=fresh(); s.properties[1]=city('p1'); s.pendingEventSource='festival-site'; s.eventDeck=['city-festival']; let n=travel(s,12); expect(n.pendingEventSource).toBeUndefined(); n=select(n); expect(n.actionLog.at(-1)).toMatchObject({type:'event-card',cardId:'city-festival'});
    let islands=fresh(); for(const index of [2,9,14,18,25])islands.properties[index]=city('p1'); islands=travel(islands,30); islands=step(islands,{type:'buy'}); expect(islands.result?.reason.ko).toContain('6개'); expect(islands.result?.reason.es).toContain('6');
  });
});

it('completes new revision3 AI games without an unresolved festival choice',()=>{
  for(const seed of [1,17,91]){let s=engine.createInitialState(seed) as FourMarbleState;const random=seededRandom(seed);
    for(let turn=0;turn<2500&&!s.result;turn++){const action=engine.chooseAiAction(engine.getPlayerView(s,s.active),s.active,random)!;expect(action).toBeTruthy();expect(engine.validateAction(s,s.active,action)).toBeNull();s=step(s,action);for(const cash of Object.values(s.money))expect(cash).toBeGreaterThanOrEqual(0);}
    expect(s.result).toBeTruthy();expect(s.pendingEventSource).toBeUndefined();
  }
},30000);
