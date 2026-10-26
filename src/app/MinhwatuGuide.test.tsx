import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MINHWATU_GODORI_BONUS } from '../games/minhwatu';
import { GameGuide } from './PlayApp';
import { MinhwatuGuide } from './MinhwatuGuide';
import { existsSync, readFileSync } from 'node:fs';

describe('Minhwatu illustrated guide', () => {
  it.each(['ko', 'es'] as const)('connects the real attribution records from the %s guide', language => {
    const html = renderToStaticMarkup(<MinhwatuGuide language={language}/>);
    expect(html).toContain(language === 'ko' ? '카드 그림 출처' : 'Créditos de las cartas');
    expect(html).toContain('Spenĉjo');
    expect(html).toContain('Marcus Richert');
    expect(html).toContain('Louie Mantia, Jr.');
    expect(html).toContain('https://creativecommons.org/licenses/by-sa/4.0/');
    for (const path of ['/images/hwatu/ATTRIBUTION.txt', '/images/hwatu/source-verification.json']) {
      expect(html).toContain(`href="${path}"`);
      expect(existsSync(`public${path}`)).toBe(true);
    }
    expect(readFileSync('public/images/hwatu/ATTRIBUTION.txt', 'utf8')).toContain('source-verification.json');
  });
  it('explains the real 0–3 match outcomes with all pictured cards and localized turn steps', () => {
    const ko = renderToStaticMarkup(<MinhwatuGuide language="ko"/>);
    const es = renderToStaticMarkup(<MinhwatuGuide language="es"/>);
    for (const face of ['01-01', '01-02', '01-03', '01-04', '02-01']) {
      expect(ko).toContain(`/images/hwatu/${face}.svg`);
      expect(es).toContain(`/images/hwatu/${face}.svg`);
    }
    expect(ko).toContain('같은 달 카드를 모아 점수를 얻고');
    expect(ko).toContain('같은 달 짝이 있어요');
    expect(ko).toContain('누르면 바로 냅니다');
    expect(ko).toContain('후보가 두 장일 때만 바닥 패 하나를 더 골라요');
    expect(ko).toContain('더미 맨 위가 자동 공개돼요');
    expect(ko).toContain('낸 패와 바닥의 세 장, 모두 4장을 가져와요');
    expect(ko).toContain('0장 일치 →');
    expect(ko).toContain('1장 일치 →');
    expect(ko).toContain('2장 일치 →');
    expect(ko).toContain('3장 일치 →');
    expect(ko).toContain('획득 4장');
    expect(es).toContain('Junta cartas del mismo mes');
    expect(es).toContain('pulsa una carta de tu mano');
    expect(es).toContain('pulsa una carta de tu mano para jugarla');
    expect(es).toContain('Solo si hay dos cartas del mismo mes');
    expect(es).toContain('El juego revela la primera carta del mazo');
    expect(es).toContain('Te llevas la carta jugada y las tres de la mesa');
    expect(es).toContain('0 coincidencias →');
    expect(es).toContain('1 coincidencia →');
    expect(es).toContain('2 coincidencias →');
    expect(es).toContain('3 coincidencias →');
    expect(es).toContain('Capturas 4');
    expect(es).not.toMatch(/\b(vosotros|ustedes)\b/i);
    expect(es).toContain('No hay Go ni Stop');
    expect(ko.match(/<details class="minhwatu-guide-details">/)?.length).toBe(1);
    expect(es).toContain('Si empatan, nadie gana');
  });

  it('keeps category values, complete ribbon sets, exact Godori faces, and scoring rules in collapsed details', () => {
    const ko = renderToStaticMarkup(<MinhwatuGuide language="ko"/>);
    const es = renderToStaticMarkup(<MinhwatuGuide language="es"/>);
    for (const face of ['01-01', '02-01', '01-02', '01-03', '01-02', '02-02', '03-02', '06-02', '09-02', '10-02', '04-02', '05-02', '07-02', '02-01', '04-01', '08-02']) {
      expect(ko).toContain(`/images/hwatu/${face}.svg`);
    }
    expect(ko).toContain('고도리 · 50점');
    expect(es).toContain(`Godori · ${MINHWATU_GODORI_BONUS} pts`);
    expect(ko).toContain('기본점수 + 내 조합 보너스 × 2 − 상대 조합 보너스');
    expect(es).toContain('Puntos base + tus bonos × 2 − bonos rivales');
    expect(ko).toContain('11월 네 장 40점');
    expect(ko).toContain('5·10·12월 네 장은 각각 20점');
    expect(ko).toContain('−30점');
    expect(es).toContain('−30');
    expect(ko).toContain('Go·Stop 없이');
    expect(ko).toContain('당시 점수와 규칙을 유지해요');
  });

  it('is included only in Minhwatu’s existing guide', () => {
    const minhwatu = renderToStaticMarkup(createElement(GameGuide, { gameId: 'minhwatu', language: 'ko' }));
    const domino = renderToStaticMarkup(createElement(GameGuide, { gameId: 'domino', language: 'ko' }));
    expect(minhwatu).toContain('class="minhwatu-guide"');
    expect(minhwatu).toContain('id="game-guide"');
    expect(domino).not.toContain('class="minhwatu-guide"');
  });
});
