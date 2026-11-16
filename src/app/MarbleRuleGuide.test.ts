import {createLegacyMarbleState} from '../games/marble';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { marbleBuildCost, marbleCityValue, marbleEngine, marbleTakeoverPrice, type MarbleTile } from '../games/marble';
import { marbleExpandedRules, marblePropertyRules } from '../games/rules';
import { getBeginnerGuide } from './beginner-guides';
import { GameInstructions } from './GameInstructions';
import { MarbleRuleGuide } from './MarbleRuleGuide';

const options = { marbleVersion: 2, marbleEconomyVersion: 2, marbleCityRouteVersion: 3, marblePropertyRulesVersion: 1 };

describe('Marble property-rule illustrated guide', () => {
  it('uses current property helpers for every illustrated ledger amount', () => {
    const html = renderToStaticMarkup(createElement(MarbleRuleGuide, { language: 'es', rules: marblePropertyRules.es, options }));
    const state = createLegacyMarbleState(1); state.economicVersion = 2;
    const tile = marbleEngine.getPlayerView(state, 'p1').board.tiles.find((tile: MarbleTile) => tile.name.es === 'Santo Domingo') as MarbleTile;
    const rows = html.match(/<tbody>(.*?)<\/tbody>/)?.[1].match(/<tr>.*?<\/tr>/g) ?? [];
    expect(rows).toHaveLength(4);
    rows.forEach((row, level) => {
      const cells = Array.from(row.matchAll(/<td>(.*?)<\/td>/g), cell => cell[1]);
      expect(cells).toEqual([
        String(level === 0 ? tile.price : marbleBuildCost(tile, level - 1, 2)),
        String(marbleCityValue(tile, level, 2)),
        String(tile.rent! * [1, 2, 4, 8][level]),
        String(marbleTakeoverPrice(tile, level, 2) ?? 'Protegido'),
      ]);
    });
  });

  it('presents artwork and local language labels while keeping full rules and all 16 cards collapsed', () => {
    for (const language of ['ko', 'es'] as const) {
      const html = renderToStaticMarkup(createElement(GameInstructions, { gameId: 'marble', language, rules: marblePropertyRules[language], options }));
      expect(html).toContain(`lang="${language === 'es' ? 'es-DO' : 'ko'}"`);
      expect(html).toContain('/images/marble/guides/takeover-protection.webp');
      expect(html).toContain('/images/marble/guides/doubles-island.webp');
      for (const image of ['cash-dividend', 'movement-travel', 'protection-exemption', 'city-intervention']) expect(html).toContain(`/images/marble/events/${image}.webp`);
      expect(html).toContain('marble-rule-building-art');
      expect(html).not.toContain('<details open');
      expect(html.match(/<details /g)).toHaveLength(2);
      const cardList = html.split('<ul>')[1]?.split('</ul>')[0];
      expect(cardList?.match(/<li>/g)).toHaveLength(16);
      expect(html).toContain(language === 'es' ? 'adquieres' : '선택 인수');
    }
  });

  it('keeps saved 18- and 40-space games on their original introduction', () => {
    for (const marbleVersion of [1, 2]) {
      const html = renderToStaticMarkup(createElement(GameInstructions, { gameId: 'marble', language: 'es', rules: marbleExpandedRules.es, options: { marbleVersion, marbleEconomyVersion: 2 } }));
      expect(html).not.toContain('marble-rule-guide');
      expect(html).not.toContain('takeover-protection.webp');
      const saved = getBeginnerGuide('marble', 'es', { marbleVersion, marbleEconomyVersion: 2 })!;
      expect(saved.steps.map(step => step.body).join(' ')).not.toContain('adquirirla');
    }
    expect(getBeginnerGuide('marble', 'es', options)!.steps[1].body).toContain('adquirirla');
  });

  it('uses current salary and build chances only for new economy rooms', () => {
    const fresh = getBeginnerGuide('marble', 'ko', { ...options, marbleEconomyVersion: 3, marbleConstructionRulesVersion: 1 })!;
    expect(fresh.steps[0].body).toContain('통과하면 300');
    expect(fresh.steps[1].body).toContain('출발 정확 도착');
    expect(getBeginnerGuide('marble', 'ko', options)!.steps[0].body).toContain('통과하면 200');
    const current = renderToStaticMarkup(createElement(MarbleRuleGuide, { language: 'ko', rules: marblePropertyRules.ko, options: { ...options, marbleEconomyVersion: 3, marbleConstructionRulesVersion: 1 } }));
    expect(current).toContain('출발 이동 +300');
    expect(current).toContain('첫 구매는 최대 2단계');
    expect(current).toContain('인수 뒤 추가 건설도 가능합니다');
    const saved = renderToStaticMarkup(createElement(MarbleRuleGuide, { language: 'ko', rules: marblePropertyRules.ko, options: { ...options, marbleEconomyVersion: 3 } }));
    expect(saved).toContain('이 저장 방은 기존 건설 규칙을 유지합니다');
    expect(saved).not.toContain('첫 구매는 최대 2단계');
  });

  it('uses the current salary in Spanish travel cards and explains individual construction', () => {
    const html=renderToStaticMarkup(createElement(MarbleRuleGuide,{language:'es',rules:marblePropertyRules.es,options:{...options,marbleEconomyVersion:3,marbleConstructionRulesVersion:2}}));
    expect(html).toContain('Si pasas por Salida, cobras 300');
    expect(html).not.toContain('cobras 200');
    expect(html).toContain('Selecciona villa, edificio y hotel por separado');
    expect(html).toContain('Después de adquirir también puedes añadir');
    expect(html).toContain('ya tenía los tres edificios antes de adquirirla');
    expect(html).toContain('Si los completas después, debes volver');
    expect(html).toContain('Importes por construcción');
  });

  it('explains team resources and elimination only when rendering the team guide', () => {
    const solo = renderToStaticMarkup(createElement(MarbleRuleGuide, { language: 'es', rules: marblePropertyRules.es, options }));
    const team = renderToStaticMarkup(createElement(MarbleRuleGuide, { language: 'es', rules: marblePropertyRules.es, options, teamMode: true }));
    expect(solo).not.toContain('No pagas alquiler a tu compañero');
    expect(team).toContain('No pagas alquiler a tu compañero');
    expect(team).toContain('el equipo pierde cuando ambos quiebran');
    expect(team).toContain('se suma el patrimonio neto de ambos compañeros');
    expect(team).toContain('si está entre quienes lideran');
    expect(team).not.toContain('Ganas por quiebra rival');
  });
});

it('explains immediate landmark only for a city already complete before acquisition in live v1',()=>{const html=renderToStaticMarkup(createElement(MarbleRuleGuide,{language:'ko',rules:marblePropertyRules.ko,options:{...options,marbleEconomyVersion:3,marbleConstructionRulesVersion:1}}));expect(html).toContain('인수 전부터 2단계였던 도시');expect(html).toContain('인수 후 2단계를 완성했다면 재방문');});
it('keeps saved world32 island counts and explains new free festival revision only when present',()=>{
 for(const language of ['ko','es'] as const){
  const base={language,rules:marblePropertyRules[language],options:{...options,marbleCityRouteVersion:5,marbleConstructionRulesVersion:2,marbleEconomyVersion:3}};
  const old=renderToStaticMarkup(createElement(MarbleRuleGuide,base));
  const fresh=renderToStaticMarkup(createElement(MarbleRuleGuide,{...base,options:{...base.options,marbleBoardRevision:2}}));
  expect(old).toContain(language==='ko'?'관광지 8곳':'8 destinos turísticos');expect(fresh).toContain(language==='ko'?'관광지 7곳':'7 destinos turísticos');
  expect(fresh).toContain(language==='ko'?'출발 맞은편 축제개최 칸은 무료':'Festival, frente a Salida, es gratis');expect(old).not.toContain(language==='ko'?'출발 맞은편 축제개최':'Festival, frente a Salida');
 }
});

it('explains current colors, tourism, bankruptcy and settlement in both solo and team Spanish guides',()=>{
 for(const teamMode of [false,true]) {
  const html=renderToStaticMarkup(createElement(MarbleRuleGuide,{language:'es',teamMode,rules:marblePropertyRules.es,options:{...options,marbleCityRouteVersion:5,marbleBoardRevision:3}}));
  expect(html).toContain('Completar un color no aumenta el alquiler');expect(html).toContain('todos los destinos turísticos');expect(html).toContain('120 turnos completos');expect(html).toContain(teamMode?'quiebran los dos rivales':'tu rival quiebra');
 }
});
it('keeps old world loan copy and displays 600/660 only for flagged new games in both languages',()=>{for(const language of ['ko','es'] as const)for(const version of [undefined,2]){const html=renderToStaticMarkup(createElement(MarbleRuleGuide,{language,rules:marblePropertyRules[language],options:{marbleCityRouteVersion:5,marbleBoardRevision:3,marbleLoanRulesVersion:version}}));expect(html).toContain(version===2?'660':'330');}});

it('keeps saved multi-city festivals while teaching new per-player limit in Korean and Spanish',()=>{
 for(const language of ['ko','es'] as const)for(const version of [undefined,1,2]){
  const html=renderToStaticMarkup(createElement(MarbleRuleGuide,{language,rules:[],options:{marbleCityRouteVersion:5,marbleBoardRevision:3,marbleFestivalRulesVersion:version}}));
  expect(html).toContain(version===2?(language==='ko'?'플레이어당 1개':'Un festival por jugador'):(language==='ko'?'여러 내 도시':'varias ciudades propias'));
 }
});


it('projects the matching saved/current ledger and tourism toll in both languages',()=>{
 for(const language of ['ko','es'] as const)for(const version of [undefined,1,2]){
  const html=renderToStaticMarkup(createElement(MarbleRuleGuide,{language,rules:[],options:{marbleCityRouteVersion:5,marbleBoardRevision:3,marbleRentRulesVersion:version}}));
  expect(html).toContain(language==='ko'?`통행료 ${version===2?96:120}`:`alquiler ${version===2?96:120}`);
  const rows=html.match(/<tbody>(.*?)<\/tbody>/)?.[1].match(/<tr>.*?<\/tr>/g)??[];
  const rentCells=rows.map(row=>Array.from(row.matchAll(/<td>(.*?)<\/td>/g),cell=>cell[1])[2]);
  expect(rentCells[0]).toBe(version===2?'2':'3');expect(rentCells.at(-1)).toBe(version===2?'351':'501');
  expect(html).toContain('120');
  expect(html).not.toContain(language==='ko'?'부족할 때만 파산':'solo quiebras');
 }
});


it('versions sample construction prices independently without discounting land',()=>{
 for(const language of ['ko','es'] as const)for(const version of [undefined,1,2]){
  const html=renderToStaticMarkup(createElement(MarbleRuleGuide,{language,rules:[],options:{marbleCityRouteVersion:5,marbleBoardRevision:3,marbleRentRulesVersion:2,marbleConstructionPriceRulesVersion:version}}));
  const rows=html.match(/<tbody>(.*?)<\/tbody>/)?.[1].match(/<tr>.*?<\/tr>/g)??[];
  const cells=rows.map(row=>Array.from(row.matchAll(/<td>(.*?)<\/td>/g),cell=>cell[1]));
  expect(cells[0][0]).toBe('30');expect(cells[1][0]).toBe(version===2?'12':'15');
  expect(cells.at(-1)?.[0]).toBe(version===2?'60':'75');expect(cells.at(-1)?.[1]).toBe(version===2?'198':'240');
 }
});

it('shows all seven adapted cards only for the expanded deck in both world and legacy guides',()=>{
 for(const language of ['ko','es'] as const)for(const marbleCityRouteVersion of [3,5])for(const marbleEventVersion of [undefined,3,4]){
  const html=renderToStaticMarkup(createElement(MarbleRuleGuide,{language,rules:marblePropertyRules[language],options:{...options,marbleCityRouteVersion,marbleEventVersion}}));
  const expanded=marbleEventVersion===4;
  expect(html).toContain(language==='ko'?`황금열쇠 ${expanded?23:16}종`:marbleCityRouteVersion===5?`Llaves doradas: ${expanded?23:16} cartas`:`${expanded?23:16} llaves doradas`);
  for(const name of language==='ko'?['강제 청산','지진','도시 방어권','건설 지원금','빈 도시 탐색','생일 축하금']:['Venta forzosa','Terremoto','Escudo urbano','Ayuda de construcción','Busca una ciudad libre','Regalo de cumpleaños']){
   if(expanded)expect(html).toContain(name);else expect(html).not.toContain(name);
  }
  if(expanded){expect(html).toContain(language==='ko'?'통행료는 막지 않아요':'No evita alquileres');expect(html).toContain(language==='ko'?'최대 40':'hasta 40');expect(html.toLowerCase()).toContain(language==='ko'?'대상이 없으면':'sin objetivo válido');}
 }
});

it('keeps Festival instructions and no color bonus on revision4 despite having six islands',()=>{
 for(const language of ['ko','es'] as const)for(const marbleBoardRevision of [3,4]){
  const html=renderToStaticMarkup(createElement(MarbleRuleGuide,{language,rules:[],options:{marbleCityRouteVersion:5,marbleBoardRevision}}));
  expect(html).toContain(language==='ko'?`관광지 ${marbleBoardRevision===4?6:7}곳`:`${marbleBoardRevision===4?6:7} destinos turísticos`);
  expect(html).toContain(language==='ko'?'축제개최 칸은 무료':'Festival, frente a Salida, es gratis');
  expect(html).toContain(language==='ko'?'색상군 하나의 완성은 통행료를 올리지 않습니다':'Completar un color no aumenta el alquiler');
 }
});
