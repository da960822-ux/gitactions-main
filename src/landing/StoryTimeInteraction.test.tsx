import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {StoryTimeInteraction,storyCelestialPose} from './story/StoryTimeInteraction';

describe('shared story hour selection',()=>{
 it('moves the sun and moon through bounded sky arcs while the hour dial follows the chosen hour',()=>{
  expect(storyCelestialPose(6)).toEqual({daylight:true,x:24,y:70,rotation:180});
  expect(storyCelestialPose(12)).toEqual({daylight:true,x:100,y:40,rotation:360});
  expect(storyCelestialPose(0)).toEqual({daylight:false,x:100,y:40,rotation:0});
  for(let hour=0;hour<24;hour++){
   const pose=storyCelestialPose(hour);
   expect(pose.x).toBeGreaterThanOrEqual(24);expect(pose.x).toBeLessThanOrEqual(176);
   expect(pose.y-35).toBeGreaterThanOrEqual(5);expect(pose.y+14).toBeLessThan(100);
   expect(pose.daylight).toBe(hour>=6&&hour<18);expect(pose.rotation).toBe(hour*30);
  }
 });
 it.each(['ko','es'] as const)('keeps live clocks independent while a controlled preview crosses the previous day in %s',language=>{
  const now=new Date('2026-01-01T00:30:00Z');
  const render=(koreanHour:number)=>renderToStaticMarkup(<StoryTimeInteraction language={language} now={now} koreanHour={koreanHour} onHourChange={()=>{}}/>);
  const midnight=render(0),late=render(23),times=(html:string)=>[...html.matchAll(/<time>([^<]+)<\/time>/g)].map(match=>match[1]);
  expect(times(midnight)).toEqual(['09:30','20:30']);expect(times(late)).toEqual(times(midnight));
  expect(midnight).toContain('data-korean-hour="0"');expect(midnight).toContain('data-dominican-hour="11"');expect(midnight).toContain('data-day-offset="-1"');
  expect(late).toContain('data-korean-hour="23"');expect(late).toContain('data-dominican-hour="10"');expect(late).toContain('data-day-offset="0"');
  expect(midnight).toContain(language==='ko'?'전날':'el día anterior');expect(late).toContain(language==='ko'?'같은 날':'el mismo día');
  expect(midnight.match(/class="story-city-celestial"/g)).toHaveLength(2);
  expect(midnight).toContain('data-celestial="sun"');expect(midnight).toContain('data-celestial="moon"');
  expect(midnight).toContain('data-time-motion="instant"');
 });
});
