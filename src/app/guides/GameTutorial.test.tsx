import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { gameCatalog } from '../../games/catalog';
import { GameTutorial, getGameTutorial } from './GameTutorial';
import { GuideLanguage } from '../GuideLanguage';
import { TeamGameGuide } from './TeamGameGuide';

describe('beginner tutorials in both guide languages', () => {
  for (const game of gameCatalog) for (const language of ['ko', 'es'] as const) {
    it(`${game.id} ${language} explains a complete first turn, example and mistakes`, () => {
      const guide = getGameTutorial(game.id, language)!;
      expect(guide).toBeDefined();
      expect(guide.goal.length).toBeGreaterThan(15);
      expect(guide.setup.length).toBeGreaterThanOrEqual(2);
      expect(guide.turnSteps.length).toBeGreaterThanOrEqual(3);
      expect(guide.turnSteps.length).toBeLessThanOrEqual(5);
      for (const step of guide.turnSteps) { expect(step.body.length).toBeGreaterThan(15); expect(step.control.length).toBeGreaterThan(3); }
      expect(guide.example.steps.length).toBeGreaterThanOrEqual(3);
      expect(guide.mistakes.length).toBeGreaterThanOrEqual(3);
      expect(guide.glossary.length).toBeGreaterThanOrEqual(2);
      const html = renderToStaticMarkup(createElement(GameTutorial, {gameId:game.id, language}));
      expect(html).toContain(`data-tutorial-game="${game.id}"`);
      expect(html).toContain(language === 'ko' ? '한 번 같이 해 볼까요?' : 'Veamos un ejemplo');
      expect(html).toContain(language === 'ko' ? '처음에 헷갈리는 것' : 'Dudas frecuentes');
      expect(html).not.toContain('<details open');
    });
  }
  for (const gameId of ['marble','davinci','splendor','minhwatu'] as const) for (const language of ['ko','es'] as const) {
    it(`${gameId} ${language} uses an actual team tutorial, not the two-player goal`,()=>{
      const team = getGameTutorial(gameId,language,true)!;
      expect(team).toBeDefined();
      expect(team.goal).not.toEqual(getGameTutorial(gameId,language)!.goal);
      const html = renderToStaticMarkup(createElement(TeamGameGuide,{gameId,language,children:()=>createElement('p',{},'variant details')}));
      expect(html).toContain('data-tutorial-mode="team"');
      expect(html).toContain('Español'); expect(html).toContain('한국어');
      expect(html).toContain('variant details');
    });
  }
});

it('guide language buttons are explicit keyboard-native choices without a gameplay action',()=>{
  const onChange=vi.fn();
  const node=GuideLanguage({language:'ko',onChange});
  const buttons=node.props.children.filter((child:any)=>child?.type==='button');
  buttons[1].props.onClick(); expect(onChange).toHaveBeenCalledExactlyOnceWith('es');
  const html=renderToStaticMarkup(node);
  expect(html).toContain('aria-pressed="true">한국어');
  expect(html).toContain('aria-pressed="false">Español');
});

it('keeps Korean and Spanish tutorial structures equally complete',()=>{
  for(const game of gameCatalog){
    const ko=getGameTutorial(game.id,'ko')!,es=getGameTutorial(game.id,'es')!;
    expect(es.turnSteps).toHaveLength(ko.turnSteps.length);
    expect(es.example.steps).toHaveLength(ko.example.steps.length);
    expect(es.mistakes).toHaveLength(ko.mistakes.length);
    expect(es.glossary).toHaveLength(ko.glossary.length);
  }
});

it('does not put a new32 tutorial over a saved40 team guide',()=>{
  const html=renderToStaticMarkup(createElement(TeamGameGuide,{gameId:'marble',language:'es',current:false,children:()=>createElement('p',{},'40 casillas · reglas guardadas')}));
  expect(html).toContain('40 casillas · reglas guardadas');
  expect(html).not.toContain('data-tutorial-game');
  expect(html).toContain('Español');
});

it('shows actual Korean control labels alongside a Spanish explanation without changing game language',()=>{
  const html=renderToStaticMarkup(createElement(GameTutorial,{gameId:'marble',language:'es',uiLanguage:'ko'}));
  expect(html).toContain('Pantalla actual');expect(html).toContain('lang="ko"');expect(html).toContain('주사위 굴리기');expect(html).toContain('Lanzar los dados');
  const same=renderToStaticMarkup(createElement(GameTutorial,{gameId:'marble',language:'es',uiLanguage:'es'}));expect(same).not.toContain('Pantalla actual');
});
it('distinguishes new festival boards from saved eight-island boards',()=>{
  for(const language of ['ko','es'] as const){
    const current=renderToStaticMarkup(createElement(GameTutorial,{gameId:'marble',language,boardRevision:2}));
    const saved=renderToStaticMarkup(createElement(GameTutorial,{gameId:'marble',language,boardRevision:1}));
    expect(current).toContain(language==='ko'?'관광지 7곳':'7 destinos turísticos');
    expect(saved).toContain(language==='ko'?'관광지 8곳':'8 destinos turísticos');
    expect(saved).toContain(language==='ko'?'출발 맞은편 모서리는 이비사':'La esquina opuesta a Salida es Ibiza');
  }
});

it('uses revision-specific first turns and color rules in both languages and modes',()=>{
 for(const language of ['ko','es'] as const) for(const teamMode of [false,true]) {
  const current=getGameTutorial('marble',language,teamMode)!;
  expect(current.example.title).toContain(language==='ko'?'인천':'Incheon');
  expect(current.example.steps.join(' ')).toContain('87');expect(current.example.result).toContain('38');
  expect(current.mistakes[0].answer).toContain(language==='ko'?'통행료가 2배가 되지는':'no duplica el alquiler');
  expect(current.win).toContain('④');expect(current.win).toContain('120');
  expect(current.win).toContain(language==='ko'?'모든 관광지':'todos los destinos turísticos');
  for(const revision of [1,2]) {
   const saved=getGameTutorial('marble',language,teamMode,revision)!;
   expect(saved.example.title).toContain(language==='ko'?'산토도밍고':'Santo Domingo');
   expect(saved.mistakes[0].answer).toContain(language==='ko'?(teamMode?'통행료 2배':'통행료가 2배'):teamMode?'duplica su alquiler':'alquileres se duplican');
  }
 }
});

it('describes new single-festival and saved multi-city rules independently of board revision',()=>{
 for(const language of ['ko','es'] as const)for(const festivalRulesVersion of [1,2]){
  const html=renderToStaticMarkup(createElement(GameTutorial,{gameId:'marble',language,boardRevision:3,festivalRulesVersion}));
  expect(html).toContain(festivalRulesVersion===2?(language==='ko'?'플레이어당 1개':'Un festival por jugador'):(language==='ko'?'여러 내 도시':'varias ciudades propias'));
 }
});


it('keeps saved rents while updating current examples and tourism without changing the turn limit',()=>{
 for(const language of ['ko','es'] as const)for(const teamMode of [false,true])for(const boardRevision of [1,3])for(const rentRulesVersion of [1,2]){
  const copy=getGameTutorial('marble',language,teamMode,boardRevision,rentRulesVersion)!;
  expect(copy.example.result).toContain(rentRulesVersion===2?'38':'48');
  expect(copy.glossary[0].meaning).toContain(language==='ko'?`통행료 ${rentRulesVersion===2?96:120}`:`cobra ${rentRulesVersion===2?96:120} fijos`);
  expect(copy.win).toContain('120');
  const html=renderToStaticMarkup(createElement(GameTutorial,{gameId:'marble',language,teamMode,boardRevision,rentRulesVersion}));
  expect(html).toContain(copy.example.result);expect(html).toContain(copy.glossary[0].meaning);
 }
});

it('renders new and saved loan contracts in the actual beginner tutorial for solo and team in both languages',()=>{
 for(const language of ['ko','es'] as const)for(const teamMode of [false,true])for(const loanRulesVersion of [1,2]){
  const guide=getGameTutorial('marble',language,teamMode,3,2,loanRulesVersion)!;
  const expected=loanRulesVersion===2?['600','660']:['300','330'];
  const wrong=loanRulesVersion===2?'330':'660';
  const answer=guide.mistakes.find(item=>item.answer.includes(expected[1]))!.answer;
  for(const amount of expected)expect(answer).toContain(amount);
  const html=renderToStaticMarkup(createElement(GameTutorial,{gameId:'marble',language,teamMode,loanRulesVersion}));
  for(const amount of expected)expect(html).toContain(amount);
  expect(html).not.toContain(wrong);
  if(teamMode){const wrapper=renderToStaticMarkup(createElement(TeamGameGuide,{gameId:'marble',language,loanRulesVersion,children:()=>null}));for(const amount of expected)expect(wrapper).toContain(amount);expect(wrapper).not.toContain(wrong);}
 }
});


it('versions building prices independently of rent and preserves exact land, purchase and remaining cash',()=>{
 for(const language of ['ko','es'] as const)for(const teamMode of [false,true])for(const rentVersion of [1,2])for(const priceVersion of [1,2]){
  const copy=getGameTutorial('marble',language,teamMode,3,rentVersion,2,priceVersion)!;
  const steps=copy.example.steps.join(' ');
  expect(steps).toContain(language==='ko'?`토지 39 + 빌라 ${priceVersion===2?12:15} + 빌딩 ${priceVersion===2?36:45}`:`terreno 39 + Villa ${priceVersion===2?12:15} + Edificio ${priceVersion===2?36:45}`);
  expect(steps).toContain(priceVersion===2?'87':'99');expect(steps).toContain(priceVersion===2?'2,913':'2,901');
  expect(copy.example.result).toContain(rentVersion===2?'38':'48');
  const html=renderToStaticMarkup(createElement(GameTutorial,{gameId:'marble',language,teamMode,rentRulesVersion:rentVersion,constructionPriceRulesVersion:priceVersion}));
  expect(html).toContain(copy.example.result);expect(html).toContain(priceVersion===2?'2,913':'2,901');
 }
});

it('routes the actual golden-key deck version through solo and team tutorials',()=>{
 for(const language of ['ko','es'] as const)for(const eventVersion of [3,4]){
  const solo=renderToStaticMarkup(createElement(GameTutorial,{gameId:'marble',language,eventVersion}));
  const team=renderToStaticMarkup(createElement(TeamGameGuide,{gameId:'marble',language,eventVersion,children:()=>null}));
  for(const html of [solo,team]){
   expect(html).toContain(language==='ko'?`황금열쇠 ${eventVersion===4?23:16}종`:`Llaves doradas: ${eventVersion===4?23:16} cartas`);
   if(eventVersion===4)expect(html).toContain(language==='ko'?'도시 방어권':'Escudo urbano');else expect(html).not.toContain(language==='ko'?'도시 방어권':'Escudo urbano');
  }
 }
});

it('shows six current islands and seven saved revision3 islands, retaining Festival in both languages and modes',()=>{
 for(const language of ['ko','es'] as const)for(const teamMode of [false,true])for(const boardRevision of [undefined,3,4]){
  const html=renderToStaticMarkup(createElement(GameTutorial,{gameId:'marble',language,teamMode,boardRevision}));
  const count=boardRevision===3?7:6;
  expect(html).toContain(language==='ko'?`관광지 ${count}곳`:`${count} destinos turísticos`);
  expect(html).toContain(language==='ko'?'무료 축제개최 칸':'Festival gratis');
  expect(html).toContain(language==='ko'?'색상 독점으로 통행료가 2배가 되지는 않습니다':'Completar un color no duplica el alquiler');
 }
});
it('tourism acquisition guide follows saved deck versions in both languages and modes',()=>{
 for(const language of ['ko','es'] as const)for(const teamMode of [false,true])for(const eventVersion of [3,4]){
  const html=renderToStaticMarkup(createElement(GameTutorial,{gameId:'marble',language,teamMode,eventVersion}));
  expect(html.includes('300 → 150')).toBe(eventVersion===4);
  if(eventVersion===4){expect(html).not.toContain('관광섬과 랜드마크는 인수할 수 없어요');expect(html).not.toContain('no permite construcción ni adquisición');}
 }
});
