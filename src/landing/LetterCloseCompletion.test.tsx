import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,expect,it,vi} from 'vitest';
import {PostHeroPreview} from './story/PostHeroPreview';
import {landingCopy} from '../copy/home';

afterEach(()=>vi.unstubAllGlobals());

it('keeps one original letter and one optional pact at its reading end, without a scroll-only ending',()=>{
 vi.stubGlobal('matchMedia',()=>({matches:false}));
 for(const language of ['ko','es'] as const){
  const html=renderToStaticMarkup(<PostHeroPreview embedded language={language}/>);
  expect(html.match(/id="moment-letter-copy"/g)).toHaveLength(1);
  expect(html).toContain('id="letter-title" tabindex="-1"');
  expect(html.match(/class="partner-pact"/g)).toHaveLength(1);
  expect(html.indexOf('class="letter-signature"')).toBeLessThan(html.indexOf('id="letter-reading-end"'));
  expect(html.indexOf('id="letter-reading-end"')).toBeLessThan(html.indexOf('class="partner-pact"'));
  for(const paragraph of landingCopy[language].letterBody)expect(html).toContain(paragraph.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;'));
  expect(html).toContain('data-letter-view="sealed"');
  expect(html).toContain('data-rose-gift="false"');
  expect(html).toContain('id="letter-journey-end"');
  expect(html).not.toContain('id="rose-gift-finale"');
  expect(html).not.toContain('id="together-again"');
  expect(html).not.toContain('ec-invitation');
 }
});
