import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {StoryTimeInteraction} from './story/StoryTimeInteraction';

describe('shared story hour selection',()=>{
 it.each(['ko','es'] as const)('keeps live clocks independent while a controlled preview crosses the previous day in %s',language=>{
  const now=new Date('2026-01-01T00:30:00Z');
  const render=(koreanHour:number)=>renderToStaticMarkup(<StoryTimeInteraction language={language} now={now} koreanHour={koreanHour} onHourChange={()=>{}}/>);
  const midnight=render(0),late=render(23),times=(html:string)=>[...html.matchAll(/<time>([^<]+)<\/time>/g)].map(match=>match[1]);
  expect(times(midnight)).toEqual(['09:30','20:30']);expect(times(late)).toEqual(times(midnight));
  expect(midnight).toContain('data-korean-hour="0"');expect(midnight).toContain('data-dominican-hour="11"');expect(midnight).toContain('data-day-offset="-1"');
  expect(late).toContain('data-korean-hour="23"');expect(late).toContain('data-dominican-hour="10"');expect(late).toContain('data-day-offset="0"');
  expect(midnight).toContain(language==='ko'?'전날':'el día anterior');expect(late).toContain(language==='ko'?'같은 날':'el mismo día');
 });
});
