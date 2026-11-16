import {classicCityEconomies} from '../games/marbleClassicEconomy';
import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {describe,it,expect,vi} from 'vitest';
import {MarbleCardDecision} from './MarbleCardDecision';import {MarbleCardOutcome,currentCardOutcome} from './MarbleCardOutcome';import {marbleCardCopy} from './marble-card-copy';import {marbleEventFamilyById} from './MarbleEventArt';
describe('clear persistent golden-key cards',()=>{
 it('describes all sixteen actual cards with explicit target and duration in both languages',()=>{
  for(const id of Object.keys(marbleEventFamilyById) as (keyof typeof marbleEventFamilyById)[])for(const language of ['ko','es'] as const){const copy=marbleCardCopy(id,language,3,true);for(const value of Object.values(copy))expect(value.length).toBeGreaterThan(1);}
  expect(marbleCardCopy('advance-start','es',3).effect).toContain('300');expect(marbleCardCopy('maintenance','ko',3,true).effect).toContain('160');
 });
 it('makes blackout selection understandable without any old receipt',()=>{
  const choice={action:{type:'choose-event-city',payload:{tile:3}},label:{ko:'뉴욕 선택',es:'Nueva York'}};
  const html=renderToStaticMarkup(createElement(MarbleCardDecision,{id:'blackout',tile:{name:{ko:'뉴욕'},owner:'p2',rent:90,buildings:['villa','building','hotel'],houses:2},actor:'p1',choices:[choice],choice,owner:'상대',language:'ko',disabled:false,onChoose:vi.fn(),onConfirm:vi.fn()}));
  expect(html).toContain('정전');expect(html).toContain('다음 내 착지 1회까지 유지');expect(html).toContain('360 → 180');expect(html).toContain('뉴욕에 정전 적용 · 다음 통행료 180');expect(html).toContain('지금 현금 변동 0');expect(html).not.toContain('mp-center-receipt');
 });
 it('retains the drawn card through its child payment but never the previous turn receipt',()=>{
  const card={sequence:3,type:'event-card',cardId:'travel-cost'},paid={sequence:4,type:'tax',amount:100};
  const events=[{sequence:1,type:'rent',amount:360},{sequence:2,type:'roll'},card,paid];
  expect(currentCardOutcome(events)).toEqual({card,result:paid});
  const repeated={...card,sequence:6};expect(currentCardOutcome([...events,{sequence:5,type:'roll'},repeated,{...paid,sequence:7}])?.card.sequence).toBe(6);
  expect(currentCardOutcome([...events,{sequence:5,type:'turn'}])).toBeNull();
 });
 it('retains explicit no-target/no-effect result instead of disappearing',()=>{
  const noEffect={sequence:4,type:'event-card',cardId:'blackout',text:{ko:'선택 가능한 도시가 없어 효과가 없습니다.'}};
  expect(currentCardOutcome([{sequence:3,type:'event-card',cardId:'blackout'},noEffect])?.result).toBe(noEffect);
 });
});

it('does not call bankruptcy forfeiture a paid creditor transaction',()=>{const card={sequence:2,type:'event-card',cardId:'travel-cost'},result={sequence:3,type:'bankruptcy',cardOutcome:'applied',moneyDelta:{p1:-50},text:{ko:'잔액 50 소멸 · 채권자에게 지급되지 않음'}};const html=renderToStaticMarkup(createElement(MarbleCardOutcome,{outcome:{card,result},language:'ko',economicVersion:3,onContinue:()=>{},disabled:false}));expect(html).toContain('잔액 50 소멸');expect(html).not.toContain('거래 처리 완료');});

it('uses profile salary for advance-start instead of old40 salary',()=>{expect(marbleCardCopy('advance-start','ko',3,true,450).effect).toContain('450');expect(marbleCardCopy('advance-start','es',3,true,450).effect).toContain('450');expect(marbleCardCopy('advance-start','ko',3,true).effect).toContain('300');});

it('previews blackout on a landmark at the exact source half-toll without charging now',()=>{const choice={action:{type:'choose-event-city',payload:{tile:31}},label:{ko:'서울',es:'Seúl'}};const html=renderToStaticMarkup(createElement(MarbleCardDecision,{id:'blackout',tile:{name:{ko:'서울'},owner:'p2',cityEconomy:classicCityEconomies['서울'],rent:120,buildings:['villa','building','hotel'],houses:3,landmark:true},actor:'p1',choices:[choice],choice,owner:'상대',language:'ko',disabled:false,onChoose:()=>{},onConfirm:()=>{}}));expect(html).toContain('랜드마크 포함');expect(html).toContain('2,820 → 1,410');expect(html).toContain('지금 현금 변동 0');expect(html).not.toContain('랜드마크 제외');expect(marbleCardCopy('blackout','es').target).toContain('incluido un monumento');});

it('requires an intentional board target before confirming a city card',()=>{const choice={action:{type:'choose-event-city',payload:{tile:3}},label:{ko:'서울',es:'Seúl'}};const html=renderToStaticMarkup(createElement(MarbleCardDecision,{id:'blackout',tile:{name:{ko:'황금열쇠'}},actor:'p1',choices:[choice],owner:'은행',language:'ko',disabled:false,onChoose:()=>{},onConfirm:()=>{}}));expect(html).not.toContain('<select');expect(html).toContain('선택 가능한 도시 1곳');expect(html).toContain('강조된 도시 타일을 눌러 주세요.');expect(html).not.toContain('id="mp-card-confirm"');expect(html).toContain('mp-card-selection');expect(html).not.toContain('0 → 0');});
it('labels a free festival-site choice distinctly from drawing a golden key',()=>{
 const choice={action:{type:'choose-event-city',payload:{tile:3}},label:{ko:'산토도밍고',es:'Santo Domingo'}};
 const html=renderToStaticMarkup(createElement(MarbleCardDecision,{id:'city-festival',source:'festival-site',tile:{name:{ko:'산토도밍고'},owner:'p1',rent:30,buildings:[]},actor:'p1',choices:[choice],choice,owner:'나',language:'ko',disabled:false,onChoose:vi.fn(),onConfirm:vi.fn()}));
 expect(html).toContain('축제개최 · 무료');expect(html).toContain('30 → 60');expect(html).not.toContain('황금 열쇠 · 대상 선택');
});

it('explains the per-player limit only for new-rule rooms in both languages',()=>{
 const choice={action:{type:'choose-event-city',payload:{tile:3}},label:{ko:'서울',es:'Seúl'}};
 for(const language of ['ko','es'] as const)for(const selected of [false,true])for(const version of [undefined,1,2]) {
  const html=renderToStaticMarkup(createElement(MarbleCardDecision,{festivalRulesVersion:version,id:'city-festival',tile:{name:{ko:'서울',es:'Seúl'},owner:'p1',rent:30,buildings:[]},actor:'p1',choices:[choice],choice:selected?choice:undefined,owner:'나',language,disabled:false,onChoose:vi.fn(),onConfirm:vi.fn()}));
  expect(html.includes(language==='ko'?'플레이어당 축제 1개':'Un festival por jugador')).toBe(version===2);
 }
});

it('previews all three new board-target interventions without a dropdown in both languages',()=>{
 const choice={action:{type:'choose-event-city',payload:{tile:3}},label:{ko:'서울',es:'Seúl'}};
 for(const language of ['ko','es'] as const)for(const id of ['forced-sale','earthquake','construction-grant'] as const){
  const props={id,tile:{name:{ko:'서울',es:'Seúl'},owner:id==='construction-grant'?'p1':'p2',price:100,rent:20,houses:1,buildings:['villa']},actor:'p1',choices:[choice],owner:'OWNER',ownerCash:500,language,disabled:false,onChoose:vi.fn(),onConfirm:vi.fn()};
  const selection=renderToStaticMarkup(createElement(MarbleCardDecision,props));
  expect(selection).not.toContain('mp-card-confirm');expect(selection).not.toContain('<select');
  const html=renderToStaticMarkup(createElement(MarbleCardDecision,{...props,choice}));
  expect(html).toContain('mp-card-confirm');expect(html).toContain('OWNER');expect(html).toContain('→');
  if(id==='forced-sale'){expect(html).toContain('500 → 570');expect(html).toContain(language==='ko'?'은행 → OWNER':'Banco → OWNER');}
  if(id==='earthquake')expect(html).toContain(language==='ko'?'빌라 → 빈 땅':'Villa → Terreno vacío');
  if(id==='construction-grant')expect(html).toContain(language==='ko'?'빌라 → 빌라 + 빌딩':'Villa → Villa + Edificio');
 }
});
it('warns that a shield blocks targeted attacks and consumes the shield, not money',()=>{
 for(const id of ['forced-sale','earthquake','blackout'] as const){const choice={action:{type:'choose-event-city',payload:{tile:3}},label:{ko:'서울',es:'Seúl'}};
 const html=renderToStaticMarkup(createElement(MarbleCardDecision,{id,tile:{name:{ko:'서울'},owner:'p2',houses:1,buildings:['villa'],price:100},ownerShields:1,ownerCash:500,actor:'p1',choices:[choice],choice,owner:'상대',language:'ko',disabled:false,onChoose:vi.fn(),onConfirm:vi.fn()}));
 expect(html).toContain('도시 방어권 1 → 0');expect(html).toContain('도시·건물·현금 변화 없음');expect(html).not.toContain('500 → 570');}
});
it('shows blocked/no-target results and birthday payer deltas explicitly',()=>{
 for(const id of ['forced-sale','earthquake','city-shield','construction-grant','property-hunt','birthday'] as const){const card={sequence:1,type:'event-card',cardId:id},result={sequence:2,type:'event-card',cardId:id,cardOutcome:'no-effect',text:{ko:'대상 없음 · 효과 없음'}};
 const html=renderToStaticMarkup(createElement(MarbleCardOutcome,{outcome:{card,result},language:'ko',economicVersion:3,onContinue:vi.fn(),disabled:false}));expect(html).toContain('대상 없음 · 효과 없음');}
 const html=renderToStaticMarkup(createElement(MarbleCardOutcome,{outcome:{card:{sequence:1,type:'event-card',cardId:'birthday'},result:{sequence:2,type:'bonus',moneyDelta:{p1:55,p2:-40,p4:-15},text:{es:'Cumpleaños'}}},language:'es',economicVersion:3,names:{p1:'Ana',p2:'Luis',p4:'Sol'},onContinue:vi.fn(),disabled:false}));
 expect(html).toContain('Ana · +55 recibe');expect(html).toContain('Luis · -40 paga');expect(html).toContain('Sol · -15 paga');
});
