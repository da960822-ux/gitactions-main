import {describe,it,expect} from 'vitest';
import {marbleEngine,createLegacyMarbleState} from './marble';
import {fourMarbleEngine,createFourLegacyMarbleState} from './fourMarble';
const pass='takeover-discount-pass';
for(const [name,e] of [['2p',marbleEngine],['4p',fourMarbleEngine]] as const)describe(`${name} stored takeover coupon`,()=>{
 const engine:any=e;
 const fresh=()=>{const s:any=engine.createInitialState(17);s.takeoverDiscountPasses.p1=1;s.eventDeck=s.eventDeck.filter((id:string)=>id!==pass);return s;};
 const act=(s:any,type:string,payload?:any)=>engine.applyAction(s,'p1',{type,payload});
 const land=(s:any,tile=1)=>act({...s,phase:'train-decision',pendingTrainFare:0,trainFare:0},'choose-train',{destination:tile});
 const rival=(s:any,tile=1)=>{s.properties[tile]={owner:'p2',houses:0,buildings:[],landmark:false};return s;};
 const choices=(s:any)=>engine.getPlayerView(s,'p1').actions.filter((a:any)=>a.action.type==='takeover');
 it('draw stores one without cash and excludes it until manually consumed; deck23 old16',()=>{
  let s=fresh();s.takeoverDiscountPasses.p1=0;s.eventDeck=[pass,...s.eventDeck];const cash={...s.money};s=land(s,4);expect(s.takeoverDiscountPasses.p1).toBe(1);expect(s.eventDeck).not.toContain(pass);expect(s.money).toEqual(cash);expect(s.actionLog.some((a:any)=>a.cardId===pass&&a.cardOutcome==='applied')).toBe(true);
  expect(engine.createInitialState(1).eventDeck).toHaveLength(23);const old=name==='2p'?createLegacyMarbleState(1):createFourLegacyMarbleState(1);expect(old.eventDeck).toHaveLength(16);expect(old.eventDeck).not.toContain(pass);expect((engine.getPlayerView(JSON.parse(JSON.stringify(old)),'p1').board??engine.getPlayerView(old,'p1').publicState).takeoverDiscountPasses.p1).toBe(0);
 });
 it('pays ordinary toll first; coupon-only affordability and owner receives exact discounted price',()=>{
  let s=land(rival(fresh()));const full=choices(s).find((a:any)=>!a.action.payload.useDiscountPass);const fullNext=act(s,'takeover',full.action.payload),price=s.money.p1-fullNext.money.p1;expect(fullNext.takeoverDiscountPasses.p1).toBe(1);
  s.money.p1=Math.ceil(price/2);const before=s.money.p2,total=Object.values(s.money).reduce((a:any,b:any)=>a+b,0);expect(choices(s)).toHaveLength(1);expect(engine.validateAction(s,'p1',{type:'takeover',payload:{tile:1}})).toBeTruthy();
  const n=act(s,'takeover',{tile:1,useDiscountPass:true});expect(n.money.p1).toBe(0);expect(n.money.p2-before).toBe(Math.ceil(price/2));expect(Object.values(n.money).reduce((a:any,b:any)=>a+b,0)).toBe(total);expect(n.takeoverDiscountPasses.p1).toBe(0);expect(n.eventDeck.filter((id:string)=>id===pass)).toHaveLength(1);expect(n.properties[1].owner).toBe('p1');expect(engine.validateAction(n,'p1',{type:'takeover',payload:{tile:1,useDiscountPass:true}})).toBeTruthy();
  s.money.p1=Math.ceil(price/2)-1;expect(engine.validateAction(s,'p1',{type:'takeover',payload:{tile:1,useDiscountPass:true}})).toBeTruthy();
 });
 it('tourism requires coupon; base300→150; no build; toll separate or separately waived',()=>{
  let s=fresh();s.rentPasses.p1=1;const cash=s.money.p1;s=land(rival(s,2),2);expect(s.phase).toBe('rent-decision');expect(choices(s)).toHaveLength(0);s=act(s,'use-rent-pass');expect(s.money.p1).toBe(cash);expect(choices(s)).toHaveLength(1);expect(engine.validateAction(s,'p1',{type:'takeover',payload:{tile:2}})).toBeTruthy();const owner=s.money.p2;s=act(s,'takeover',{tile:2,useDiscountPass:true});expect(s.money.p1).toBe(cash-150);expect(s.money.p2).toBe(owner+150);expect(s.buildSite).toBeNull();expect(s.landmarkOptions).toEqual([]);
  const no=fresh();delete no.takeoverDiscountPasses;expect(choices(land(rival(no,2),2))).toHaveLength(0);
 });
 it('rejects landmarks and allies and malformed flag',()=>{
  const s=fresh();rival(s);s.properties[1].landmark=true;s.properties[1].houses=4;expect(choices(land(s))).toHaveLength(0);
  let n=land(rival(fresh()));expect(engine.validateAction(n,'p1',{type:'takeover',payload:{tile:1,useDiscountPass:'true'}})).toBeTruthy();
  if(name==='4p'){n=fresh();rival(n);n.properties[1].owner='p3';expect(choices(land(n))).toHaveLength(0);}
 });
});
