import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarbleStructureChoices } from './MarbleStructureChoices';

describe('MarbleStructureChoices',()=>{
  it('shows exact outcomes for each legal structure and selects an action without inventing a level',()=>{
    const villa={type:'build',payload:{tile:31,structure:'villa'}};
    const building={type:'build',payload:{tile:31,structure:'building'}};
    const html=renderToStaticMarkup(createElement(MarbleStructureChoices,{options:[{action:villa,structure:'villa',cost:200000,tollAfter:600000},{action:building,structure:'building',cost:600000,tollAfter:1050000}],selected:building,cash:4500000,tollBefore:200000,language:'ko',onSelect:()=>{}}));
    expect(html).toContain('빌라');expect(html).toContain('빌딩');
    expect(html).toContain('건설 20만 · 잔액 430만');
    expect(html).toContain('건설 60만 · 잔액 390만');
    expect(html).toContain('통행료 20만 → 105만');
    expect(html).toContain('aria-pressed="true"');
  });
});
