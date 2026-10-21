import {afterEach,describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {PostHeroPreview} from '../../post-hero-preview/src/PostHeroPreview';
import {landingCopy} from '../copy/home';

afterEach(()=>vi.unstubAllGlobals());
describe('main narrative content remains present without opening optional discoveries',()=>{
 for(const language of ['ko','es'] as const)it(language,()=>{
  vi.stubGlobal('matchMedia',()=>({matches:false}));
  const html=renderToStaticMarkup(<PostHeroPreview embedded renderScene={false} language={language}/>);
  for(const id of ['distance','time-difference','shared-place','letter-scene','papi-letter','together-again'])expect(html.match(new RegExp(`id="${id}"`,'g'))).toHaveLength(1);
  expect(html).not.toContain('distance-workstations');
  expect(html).not.toContain('ending-room');
  expect(html.match(/class="duel-illustration-stage"/g)).toHaveLength(1);
  expect(html.match(/id="moment-letter-copy"/g)).toHaveLength(1);
  for(const paragraph of landingCopy[language].letterBody)expect(html.split(paragraph)).toHaveLength(2);
  expect(html).toContain('href="/feedback"');
  expect(html).toContain('href="#games"');
 });
});
