import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {StoryChapters} from './story/StoryChapters';

describe('personal post-room story content',()=>{
 it.each(['ko','es']as const)('connects actual cities, useful time choice and conditional couple reactions in %s',language=>{
  const html=renderToStaticMarkup(<StoryChapters language={language}/>);
  expect([...html.matchAll(/data-pose="([^"]+)"/g)].map(m=>Number(m[1]))).toEqual([0,.08,.16,.32,.45]);
  for(const id of ['first-conversation','distance','time-difference','shared-place'])expect(html).toContain(`id="${id}"`);
  expect(html).toContain(language==='ko'?'광주':'Gwangju');expect(html).toContain('Santo Domingo');
  expect(html).not.toMatch(/서울|Seúl|capitales|STORY_COUNTRY|<canvas|<dialog/);
  expect(html).toContain('type="range"');expect(html).toContain('data-korean-hour="20"');expect(html).toContain('data-dominican-hour="7"');expect(html).toContain('data-day-offset="0"');
  expect(html).toContain('InterPals');expect(html).toContain(language==='ko'?'첫날부터 12시간을 쉬지 않고 얘기했어.':'El primer día hablamos doce horas sin parar.');
  expect(html).toContain(language==='ko'?'멀리 있어도, 너랑.':'Lejos, pero contigo.');
  expect(html).toContain(language==='ko'?'시간은 달라도, 우리 같이.':'Horas distintas. Un ratito juntos.');
  expect(html).toContain(language==='ko'?'한국이 13시간 빨라.':'Corea va trece horas por delante.');
  expect(html).toMatch(/class="story-light-river"[^>]*aria-hidden="true"[^>]*focusable="false"/);
  expect(html.match(/class="story-light-core"/g)).toHaveLength(1);
  expect(html.indexOf('id="first-conversation"')).toBeLessThan(html.indexOf('id="distance"'));
  expect(html).toContain('2025.04.04');expect(html).toContain('href="#games"');
  expect(html).toContain(language==='ko'?'한국 리듬게임에 접속이 안 됐잖아':'No podías entrar al juego de ritmo de Corea');
  expect(html).toContain(language==='ko'?'네가 이기면':'Si ganas tú');expect(html).toContain(language==='ko'?'내가 이기면':'Si gano yo');
  expect(html.match(/class="duel-illustration"/g)).toHaveLength(1);
  expect(html.match(/class="country-companions"/g)).toHaveLength(1);expect(html.match(/class="lovebird"/g)).toHaveLength(2);
  expect(html).not.toContain('data-selected-play-hour');
 });
});
