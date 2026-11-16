import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { classicCityEconomies } from '../games/marbleClassicEconomy';
import { MarblePropertySale, MarblePropertyLedger } from './MarblePropertyLedger';

describe('independent construction ledger',()=>{
  it('shows independent villas, buildings, hotels and landmark examples',()=>{
    const html=renderToStaticMarkup(createElement(MarblePropertyLedger,{tile:{kind:'property',name:{ko:'광주',es:'Gwangju'},price:100,rent:20},language:'ko',economicVersion:3,effectiveValues:true,constructionRulesVersion:2}));
    expect(html).toContain('<th>인수</th>'); expect(html).toContain('<td>불가</td>'); expect(html).toContain('<td>280</td>');
    expect(html).toContain('각 건물 단독 기준');expect(html).not.toContain('선택 예시');expect(html).toContain('빌라');expect(html).toContain('빌딩');expect(html).toContain('호텔');expect(html).toContain('3종 + 랜드마크');expect(html.match(/<tbody>(.*?)<\/tbody>/)?.[1].match(/<tr>/g)).toHaveLength(5);
  });
});

describe('canonical city economics',()=>{
  it('uses Seoul fixed values, not a price-ratio substitute, including landmark sale',()=>{
    const html=renderToStaticMarkup(createElement(MarblePropertyLedger,{tile:{kind:'property',name:{ko:'서울',es:'Seúl'},price:1,rent:1,cityEconomy:classicCityEconomies['서울']},language:'ko',economicVersion:3,effectiveValues:false}));
    const rows=html.match(/<tbody>(.*?)<\/tbody>/)?.[1].match(/<tr>.*?<\/tr>/g) ?? [];
    const cells=rows.map(row=>Array.from(row.matchAll(/<td[^>]*>(.*?)<\/td>/g),cell=>cell[1]));
    expect(cells.map(row=>row[0])).toEqual(['300','120','360','600','600']);
    expect(cells[4]).toEqual(['600','1980','2820','불가','690']);
    expect(cells[0][3]).toBe('600');
    expect(html).toContain('data-inferred="true"');expect(html).toContain('재구성한 추정값');
  });
  it('preserves fractional sale values from the source',()=>{
    const html=renderToStaticMarkup(createElement(MarblePropertyLedger,{tile:{kind:'property',name:{ko:'강릉',es:'Gangneung'},cityEconomy:classicCityEconomies['강릉']},language:'es'}));
    expect(html).toContain('<td>22.5</td>');expect(html).toContain('Protegido');
  });
});

describe('liquidation consequences' ,()=>{
  const choices=[{label:{ko:'광주',es:'Gwangju'},action:{type:'sell-property',payload:{tile:1}}}];
  it('previews lost buildings, rent and group, and automatic settlement',()=>{
    const html=renderToStaticMarkup(createElement(MarblePropertySale,{choices,language:'ko',runAction:()=>{},cash:50,obligation:100,preview:()=>({name:'광주',buildings:'빌라·호텔',refund:80,toll:60,groupLost:true})}));
    expect(html).toContain('광주 · 빌라·호텔');expect(html).toContain('통행료 60 → 0');expect(html).toContain('매각 즉시 지급 완료 · 남는 현금 30');expect(html).toContain('완성 색상군 해제');expect(html).toContain('되돌릴 수 없습니다');
  });
  it('does not imply an insufficient sale resolves the obligation',()=>{
    const html=renderToStaticMarkup(createElement(MarblePropertySale,{choices,language:'es',runAction:()=>{},cash:0,obligation:200,preview:()=>({name:'Gwangju',buildings:'Villa',refund:80,toll:60})}));
    expect(html).toContain('Todavía faltan 120 después de vender');expect(html).not.toContain('El pago se completa');
  });
});

describe('compact debt sale choice',()=>{
 const props={choices:[{label:{ko:'광주',es:'Gwangju'},action:{type:'sell-property',payload:{tile:1}}}],language:'es' as const,runAction:()=>{},cash:50,obligation:100,compact:true,preview:()=>({name:'Gwangju',buildings:'Villa',refund:80,toll:60,groupLost:true})};
 it('starts collapsed beside an available loan while preserving exact quote and consequences',()=>{
  const html=renderToStaticMarkup(createElement(MarblePropertySale,props));
  expect(html).toContain('<details class="mp-sale-choice">');expect(html).toContain('Vender propiedad');expect(html).toContain('Recibes 80');expect(html).toContain('quedan 30 tras pagar');expect(html).toContain('Confirmar venta');expect(html).toContain('Se pierde el color completo');expect(html).toContain('<details class="mp-sale-consequences">');expect(html).toContain('irreversible');
 });
 it('opens immediately if borrowing is unavailable and keeps an insufficient sale pending',()=>{
  const html=renderToStaticMarkup(createElement(MarblePropertySale,{...props,initiallyOpen:true,cash:0,obligation:200}));
  expect(html).toContain('<details class="mp-sale-choice" open="">');expect(html).toContain('aún faltan 120');expect(html).not.toContain('quedan 30');
 });
});

it('shows loss of completed color without claiming lower group tolls in revision3',()=>{
 for(const compact of [false,true]) for(const language of ['ko','es'] as const) {
 const html=renderToStaticMarkup(createElement(MarblePropertySale,{compact,choices:[{label:{ko:'광주',es:'Gwangju'},action:{type:'sell-property',payload:{tile:1}}}],language,runAction:()=>{},preview:()=>({name:'Gwangju',buildings:'Villa',refund:80,toll:60,groupLost:true,groupTollLost:false})}));
 expect(html).toContain(language==='ko'?(compact?'색상 독점 해제':'색상군 해제'):'color completo');expect(html).not.toContain(language==='ko'?'통행료도 감소':'baja el alquiler');
 }
});
