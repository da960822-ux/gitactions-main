import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarbleMobileSpotlight } from './MarbleMobileSpotlight';

describe('Marble mobile city spotlight',()=>{
  it('identifies the selected vacant city and exact buy amount',()=>{
    const html=renderToStaticMarkup(createElement(MarbleMobileSpotlight,{name:'서울',city:'seoul',level:0,owner:null,ownerLabel:'은행',price:500000,toll:10000,language:'ko'}));
    expect(html).toContain('서울');expect(html).toContain('매입 50만');expect(html).toContain('data-building-level="0"');
  });
  it('shows an owned city and current rent in Spanish',()=>{
    const html=renderToStaticMarkup(createElement(MarbleMobileSpotlight,{name:'Seúl',city:'seoul',level:2,owner:'p2',ownerLabel:'Rival',price:500000,toll:120000,language:'es'}));
    expect(html).toContain('Dueño Rival');expect(html).toContain('Alquiler 120 mil');
  });
});
