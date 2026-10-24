import {afterEach,describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {Landing} from './Landing';
import {PostHeroPreview} from './story/PostHeroPreview';
import {GameGallery} from './gallery/GameGallery';
import {landingCopy} from '../copy/home';

vi.mock('./LandingWorldHost',()=>({LandingWorldHost:()=>null}));

afterEach(()=>vi.unstubAllGlobals());
describe('landing navigation',()=>{
 for(const [language,label] of [['ko','게임 목록'],['es','Juegos']] as const)it(`links to the game gallery in ${language}`,()=>{
  vi.stubGlobal('localStorage',{getItem:()=>language});
  const html=renderToStaticMarkup(<Landing/>);
  expect(html).toContain(`<a href="#games">${label}</a>`);
  expect(html).toContain(`<a href="/feedback">${language === 'ko' ? '아이디어 보내기' : 'Enviar una idea'}</a>`);
 });
});

describe('main narrative content remains present without opening optional discoveries',()=>{
 for(const language of ['ko','es'] as const)it(language,()=>{
  vi.stubGlobal('matchMedia',()=>({matches:false}));
  const html=renderToStaticMarkup(<PostHeroPreview embedded language={language}/>);
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

describe('letter entry points name the actual action',()=>{
 for(const [language,envelope,direct,shared] of [
  ['ko','봉투 열어보기','바로 읽기','연결해서 같이 열기'],
  ['es','Abrir el sobre','Leerla directamente','Abrirla juntos en una sala'],
 ] as const)it(language,()=>{
  vi.stubGlobal('matchMedia',()=>({matches:false}));
  const html=renderToStaticMarkup(<PostHeroPreview embedded language={language}/>);
  expect(html).toContain(`>${envelope}<span aria-hidden="true">`);
  expect(html).not.toContain(`>${direct}</a>`);
  const standalone=renderToStaticMarkup(<PostHeroPreview language={language}/>);
  expect(standalone).not.toContain(`>${direct}</a>`);
  expect(html).toContain(`>${shared}</button>`);
 });
});

describe('selected Catchmind caption',()=>{
 for(const [language,joke] of [
  ['ko','우리 화가님, 실력 좀 볼까? 못 맞히면 내 탓은 아닌 걸로 ㅋㅋㅋ'],
  ['es','A ver qué tal dibuja mi artista… Si no adivino, no me eches la culpa, haha.'],
 ] as const)it(language,()=>{
  vi.stubGlobal('window',{matchMedia:()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}})});
  const html=renderToStaticMarkup(<GameGallery language={language} selected="catchmind"/>);
  expect(html).toContain(joke);
  expect(html).toContain('class="rd-game-tease"');
 });
});

it('keeps game mechanics first and includes banter for every game',()=>{
 vi.stubGlobal('window',{matchMedia:()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}})});
 for(const [game,description] of [
  ['davinci','숨겨진 숫자와 조커를 하나씩 맞혀 봐요.'],
  ['domino','같은 숫자를 잇고 손패를 먼저 비워 봐요.'],
  ['jaipur','상품을 모아 팔고, 먼저 두 라운드를 이겨 봐요.'],
  ['splendor','보석으로 카드를 사고 점수를 모아요.'],
  ['minhwatu','같은 달의 패를 맞춰 점수를 모아요.'],
  ['marble','주사위를 굴려 도시를 사고 건물을 지어요.'],
  ['rhythm','음악에 맞춰 방향키와 스페이스바를 눌러요.'],
 ] as const){
  const html=renderToStaticMarkup(<GameGallery language="ko" selected={game}/>);
  expect(html).toContain(description);
  expect(html).toContain('class="rd-game-tease"');
 }
});

for (const [language, line] of [
 ['ko', '같이 여행은 가도, 통행료는 따로야.'],
 ['es', 'Viajamos juntos, pero el alquiler va por separado.'],
] as const) it(`shows the common Marble intro in ${language} without selecting a mode`, () => {
 vi.stubGlobal('window', {matchMedia: () => ({matches: false, addEventListener: () => {}, removeEventListener: () => {}})});
 const html = renderToStaticMarkup(<GameGallery language={language} selected="marble"/>);
 expect(html).toContain(line);
});
