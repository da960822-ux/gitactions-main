import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarbleLegacyConstructionPanel } from './MarbleLegacyConstructionPanel';
const props={action:{type:'build',payload:{tile:1}},tile:{name:{ko:'산티아고',es:'Santiago'},houses:1},cash:2820,cost:80,resultingRent:90,language:'ko' as const,disabled:false,onConfirm:()=>{},onCancel:()=>{},id:'legacy-confirm'};
describe('legacy construction panel',()=>{
 it('keeps the original one-step action with large current/next art and visible footer',()=>{
  const html=renderToStaticMarkup(createElement(MarbleLegacyConstructionPanel,props));
  expect(html).toContain('산티아고');expect(html).toContain('현재');expect(html).toContain('건설 후');expect(html.match(/mp-legacy-card-art/g)).toHaveLength(2);expect(html).toContain('건설 확정 · 80');expect(html).toContain('2,740');expect(html).toContain('건너뛰기');expect(html).not.toContain('checkbox');
 });
 it('renders a land-only purchase and blocks unaffordable confirmation',()=>{
  const html=renderToStaticMarkup(createElement(MarbleLegacyConstructionPanel,{...props,action:{type:'buy'},tile:{...props.tile,houses:0},cash:0}));
  expect(html).toContain('is-purchase');expect(html).toContain('구매 확정 · 80');expect(html).toContain('현금 80 부족');expect(html).toContain('disabled=""');expect(html.match(/mp-legacy-card-art/g)).toHaveLength(1);
 });
});

describe('production v1 atomic target selection',()=>{
 const tile={name:{ko:'광주',es:'Gwangju'},houses:0,price:80,rent:20,monopolyMultiplier:1};
 const choices=[0,1,2].map(targetLevel=>({action:{type:'buy',payload:{targetLevel}}}));
 it('shows mandatory land and two cumulative choices without changing the legacy building model',()=>{const html=renderToStaticMarkup(createElement(MarbleLegacyConstructionPanel,{...props,action:{type:'buy'},choices,tile,economicVersion:3,cash:3000}));expect(html.match(/type="checkbox"/g)).toHaveLength(3);expect(html).toContain('토지 · 필수');expect(html).toContain('단독주택');expect(html).toContain('아파트');expect(html).toContain('구매 확정 · 80');expect(html).toContain('2,920');expect(html).not.toContain('호텔');});
 it('previews land+two stages in a single payment with the final toll',()=>{const html=renderToStaticMarkup(createElement(MarbleLegacyConstructionPanel,{...props,action:choices[2].action,choices,tile,economicVersion:3,cash:3000}));expect(html).toContain('구매·건설 확정 · 160');expect(html).toContain('2,840');expect(html).toContain('통행료 <b>60</b>');expect(html.match(/id="legacy-confirm"/g)).toHaveLength(1);});
 it('only shows landmark when a legal target3 action exists',()=>{const base={...props,tile:{...tile,houses:2},choices:[{action:{type:'build',payload:{tile:1,targetLevel:3}}}],economicVersion:3};const yes=renderToStaticMarkup(createElement(MarbleLegacyConstructionPanel,base));expect(yes).toContain('랜드마크');expect(yes).toContain('건설 확정 · 60');const no=renderToStaticMarkup(createElement(MarbleLegacyConstructionPanel,{...base,tile,choices:[{action:{type:'build',payload:{tile:1,targetLevel:2}}}]}));expect(no).not.toContain('랜드마크');});
});
