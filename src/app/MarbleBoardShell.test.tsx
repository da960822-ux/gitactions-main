import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarbleBoardShell } from './MarbleBoardShell';

describe('MarbleBoardShell',()=>{
  it('keeps each supported route size accessible in Korean and Spanish',()=>{
    expect(renderToStaticMarkup(createElement(MarbleBoardShell,{tileCount:40,language:'ko',children:createElement('span',null,'center')}))).toContain('총 40칸 보드');
    expect(renderToStaticMarkup(createElement(MarbleBoardShell,{tileCount:32,language:'ko',children:createElement('span',null,'center')}))).toContain('mp-board-grid--32');
    expect(renderToStaticMarkup(createElement(MarbleBoardShell,{tileCount:18,language:'es',children:createElement('span',null,'centro')}))).toContain('mp-board-grid--18');
  });
});
