import {expect,it} from 'vitest';
import {previewPlayHour,relationshipDays,storyClockTimes,storyDistanceKm} from './coupleStoryFacts';

it('computes a plausible approximate Gwangju-to-Santo Domingo city-centre distance',()=>{
 expect(storyDistanceKm).toBeCloseTo(13792.441,2);
});

it('uses Seoul and Santo Domingo local dates and hours across midnight',()=>{
 expect(storyClockTimes(new Date('2026-01-01T00:30:00Z'))).toEqual({
  seoul:{year:2026,month:1,day:1,hour:9,minute:30},
  santoDomingo:{year:2025,month:12,day:31,hour:20,minute:30},
 });
});

it('counts elapsed Seoul calendar days from D+0 and never goes negative',()=>{
 expect(relationshipDays(new Date('2025-04-03T14:59:59Z'))).toBe(0);
 expect(relationshipDays(new Date('2025-04-03T15:00:00Z'))).toBe(0);
 expect(relationshipDays(new Date('2025-04-04T15:00:00Z'))).toBe(1);
 expect(relationshipDays(new Date('2026-10-20T15:00:00Z'))).toBe(565);
});

it('shifts an invited play hour by thirteen hours with the prior-day marker',()=>{
 expect(previewPlayHour(0)).toEqual({koHour:0,drHour:11,drDayOffset:-1});
 expect(previewPlayHour(12)).toEqual({koHour:12,drHour:23,drDayOffset:-1});
 expect(previewPlayHour(13)).toEqual({koHour:13,drHour:0,drDayOffset:0});
 expect(previewPlayHour(23)).toEqual({koHour:23,drHour:10,drDayOffset:0});
 expect(previewPlayHour(24)).toEqual({koHour:23,drHour:10,drDayOffset:0});
 expect(previewPlayHour(Number.NaN)).toEqual({koHour:0,drHour:11,drDayOffset:-1});
});
