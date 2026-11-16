import { marbleRuntimeImage } from './marble-runtime-images';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarbleConstructionPicker, toggleConstructionSelection } from './MarbleConstructionPicker';
import { classicCityEconomies, classicConstructionCost } from '../games/marbleClassicEconomy';
import { worldIslandsBoard } from '../games/marbleWorldIslands';
const choice={label:{ko:'구매',es:'Comprar'},action:{type:'buy'}};
const props={choices:[choice],tile:{name:{ko:'서울',es:'Seúl'},price:300,rent:100,buildings:[]},cash:3000,laps:0,language:'ko' as const,disabled:false,onConfirm:()=>{},onCancel:()=>{},id:'confirm'};
describe('construction card decision',()=>{
 it('shows large separate building art and a compact summary with confirm/cancel footer',()=>{
  const html=renderToStaticMarkup(createElement(MarbleConstructionPicker,props));
  expect(html.match(/class="mp-construction-card /g)).toHaveLength(3);expect(html.match(/mp-construction-card-art/g)).toHaveLength(3);
  expect(html).toContain('data-building-kind="villa"');expect(html).toContain('data-building-kind="building"');expect(html).toContain('data-building-kind="hotel"');expect(html).toContain('출발 1회 통과 후');expect(html).toContain('mp-construction-footer');expect(html).toContain('구매 확정 · 300');expect(html).toContain('건너뛰기');expect(html).not.toContain('mp-stage-preview');
 });
 it('uses exact city economics instead of a generic price ratio',()=>{
  const html=renderToStaticMarkup(createElement(MarbleConstructionPicker,{...props,tile:{...props.tile,price:1,rent:1,cityEconomy:classicCityEconomies['서울']}}));
  expect(html).toContain('토지 300 포함');expect(html).toContain('<strong>120</strong>');expect(html).toContain('<strong>360</strong>');expect(html).toContain('<strong>600</strong>');expect(html).toContain('구매 확정 · 300');
 });
 it('keeps an existing complete city on a distinct landmark choice',()=>{
  const html=renderToStaticMarkup(createElement(MarbleConstructionPicker,{...props,choices:[{...choice,action:{type:'build',payload:{tile:1,landmark:true}}}],tile:{...props.tile,buildings:['villa','building','hotel']}}));
  expect(html).toContain('is-landmark-choice');expect(html).toContain('랜드마크');expect(html).toContain('전환 가능');expect(html).toContain('disabled=""');
 });
});

describe('higher building checkbox selects missing lower buildings',()=>{
 it('selects villa plus building in one click and all three for an eligible hotel',()=>{
  expect(toggleConstructionSelection([],[],'building',true,0)).toEqual(['villa','building']);
  expect(toggleConstructionSelection([],[],'hotel',true,1)).toEqual(['villa','building','hotel']);
 });
 it('never bills already built lower buildings and does not bypass the hotel lap lock',()=>{
  expect(toggleConstructionSelection([],['villa'],'building',true,0)).toEqual(['building']);
  expect(toggleConstructionSelection([],['villa','building'],'hotel',true,1)).toEqual(['hotel']);
  expect(toggleConstructionSelection([],[],'hotel',true,0)).toEqual([]);
  expect(toggleConstructionSelection(['building'],['villa'],'villa',false,1)).toEqual(['building']);
 });
 it('lets the player remove a lower checkbox without clearing the higher choice',()=>{
  const chosen=toggleConstructionSelection([],[],'hotel',true,1);
  expect(toggleConstructionSelection(chosen,[],'villa',false,1)).toEqual(['building','hotel']);
  expect(toggleConstructionSelection(['villa','building'],[],'villa',false,0)).toEqual(['building']);
 });
 it('does not duplicate selection on repeated checks or silently drop an expensive lower building',()=>{
  const chosen=toggleConstructionSelection([],[],'building',true,0);
  expect(toggleConstructionSelection(chosen,[],'building',true,0)).toEqual(chosen);
  // Cash is deliberately not a selection input: the existing exact total/shortfall disables confirmation.
  expect(chosen).toEqual(['villa','building']);
 });
 it('keeps the full auto-selected exact cost when cash is insufficient, then permits manual reduction',()=>{
  const economy=worldIslandsBoard[3].cityEconomy!;
  const both=toggleConstructionSelection([],[],'building',true,0);
  const full=economy.landCost+classicConstructionCost(economy,{buildings:both});
  expect(full).toBe(99);expect(full).toBeGreaterThan(90);
  const onlyBuilding=toggleConstructionSelection(both,[],'villa',false,0);
  expect(economy.landCost+classicConstructionCost(economy,{buildings:onlyBuilding})).toBe(84);
 });

});

for(const language of ['ko','es'] as const)it(`uses the saved route art in the ${language} landmark picker`,()=>{
 const tile={...props.tile,name:{ko:'뉴어크',es:'Newark'},buildings:['villa','building','hotel']};
 const choices=[{...choice,action:{type:'build',payload:{tile:1,landmark:true}}}];
 const modern=renderToStaticMarkup(createElement(MarbleConstructionPicker,{...props,language,tile,choices,routeVersion:5}));
 const legacy=renderToStaticMarkup(createElement(MarbleConstructionPicker,{...props,language,tile,choices,routeVersion:3}));
 expect(modern).toContain('loading="eager" decoding="sync"');expect(modern).toContain('/newark-sacred-heart.webp');expect(modern).not.toContain('dubai-burj-khalifa');
 expect(legacy).toContain(marbleRuntimeImage('dubai-burj-khalifa-v1.png'));
 expect(legacy).not.toContain('/newark-sacred-heart.webp');
});
