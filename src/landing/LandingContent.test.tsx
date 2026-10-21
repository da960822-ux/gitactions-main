import {afterEach,describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {Landing} from './Landing';
import {PostHeroPreview} from '../../post-hero-preview/src/PostHeroPreview';
import {landingCopy} from '../copy/home';

vi.mock('./LandingWorldHost',()=>({LandingWorldHost:()=>null}));

afterEach(()=>vi.unstubAllGlobals());
describe('landing navigation',()=>{
 for(const [language,label] of [['ko','게임 목록'],['es','Juegos']] as const)it(`links to the game gallery in ${language}`,()=>{
  vi.stubGlobal('localStorage',{getItem:()=>language});
  const html=renderToStaticMarkup(<Landing/>);
  expect(html).toContain(`<a href="#games">${label}</a>`);
  expect(html).toContain(`<a href="/feedback">${language === 'ko' ? '건의사항' : 'Sugerencias'}</a>`);
 });
});

describe('main narrative content remains present without opening optional discoveries',()=>{
 for(const language of ['ko','es'] as const)it(language,()=>{
  vi.stubGlobal('matchMedia',()=>({matches:false}));
  const html=renderToStaticMarkup(<PostHeroPreview embedded renderScene={false} language={language}/>);
  for(const id of ['distance','time-difference','shared-place','letter-scene','papi-letter','letter-journey-end'])expect(html.match(new RegExp(`id="${id}"`,'g'))).toHaveLength(1);
  expect(html).not.toContain('id="together-again"');
  expect(html).not.toContain('id="rose-gift-finale"');
  expect(html).not.toContain('distance-workstations');
  expect(html).not.toContain('ending-room');
  expect(html.match(/class="duel-illustration-stage"/g)).toHaveLength(1);
  expect(html.match(/id="moment-letter-copy"/g)).toHaveLength(1);
  for(const paragraph of landingCopy[language].letterBody)expect(html.split(paragraph)).toHaveLength(2);
  expect(html).toContain('href="#games"');
 });
});
