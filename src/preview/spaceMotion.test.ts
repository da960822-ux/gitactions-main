import {describe, expect, it} from 'vitest';
import {advanceLetter, balloonPlan, pointerRepulsionFactor, stepSpring} from './spaceMotion';
import {createPaperGeometry, createRibbonGeometry, updateRibbon, updatePaper} from './spaceGeometry';
import {createRoseBloomGeometry} from './roseBloomGeometry';

describe('couple space continuity and preserved volume', () => {
  it('reverses an interrupted letter from its current fold without teleporting', () => {
    const opening = advanceLetter(.43, true, .016, false);
    const closing = advanceLetter(opening, false, .016, false);
    expect(closing).toBeCloseTo(.43, 8);
    expect(advanceLetter(.99, true, 2, false)).toBe(1);
    expect(advanceLetter(0, true, 1.2, false)).toBe(1);
    expect(advanceLetter(1, false, .6, false)).toBeCloseTo(.5, 8);
    expect(advanceLetter(.25, true, 0, true)).toBe(1);
  });
  it('settles released input and remains finite after a resumed tab', () => {
    let state = {position: 180, velocity: 120};
    for(let i=0;i<90;i++) state = stepSpring(state.position, state.velocity, 0, 1/60);
    expect(Math.abs(state.position)).toBeLessThan(.05);
    const slowFrame=stepSpring(180,0,0,1.6);
    expect(Math.abs(slowFrame.position)).toBeLessThan(1);
    expect(Number.isFinite(stepSpring(0, 0, 180, 5).position)).toBe(true);
  });
  it('leaves a balloon pickable at the cursor center while retaining a strong near-pointer response', () => {
    expect(pointerRepulsionFactor(0)).toBe(0);
    expect(pointerRepulsionFactor(1)).toBeGreaterThan(0);
    expect(pointerRepulsionFactor(64)).toBeCloseTo(116/180, 8);
    expect(pointerRepulsionFactor(180)).toBe(0);
    expect(pointerRepulsionFactor(Number.NaN)).toBe(0);
  });
  it('keeps foreground, middle and rear balloons on mobile too', () => {
    for(const mobile of [false,true]) {
      const plan = Array.from({length:48},(_,i)=>balloonPlan(i,mobile));
      expect(new Set(plan.map(p=>p.depth)).size).toBe(4);
      expect(plan.filter(p=>p.depth!==18.4&&p.x<.3)).toHaveLength(18);
      expect(plan.filter(p=>p.depth!==18.4&&p.x>.7)).toHaveLength(20);
    }
  });
  it('has a genuinely thick petal and unfolds the same paper vertices', () => {
    const petal = createRoseBloomGeometry();
    expect(petal.boundingBox!.max.z - petal.boundingBox!.min.z).toBeGreaterThan(.5);
    const paper = createPaperGeometry(), array = paper.attributes.position.array;
    updatePaper(paper, 0, 6, 4); const foldedWidth = paper.boundingBox!.max.x - paper.boundingBox!.min.x;
    updatePaper(paper, 1, 6, 4);
    expect(paper.attributes.position.array).toBe(array);
    expect(paper.boundingBox!.max.x - paper.boundingBox!.min.x).toBeCloseTo(6);
    expect(foldedWidth).toBeLessThan(3);
    expect(paper.boundingBox!.max.z - paper.boundingBox!.min.z).toBeLessThan(.001);
    petal.dispose(); paper.dispose();
  });
  it('keeps the thick ribbon vertices finite and continuous through the full unfold', () => {
    const ribbon=createRibbonGeometry(),array=ribbon.attributes.position.array;
    for(const amount of [0,.2,.5,.9,1]){
      updateRibbon(ribbon,amount);
      expect([...ribbon.attributes.position.array].every(Number.isFinite)).toBe(true);
      expect(ribbon.attributes.position.array).toBe(array);
    }
    expect(ribbon.boundingBox!.max.x-ribbon.boundingBox!.min.x).toBeCloseTo(17);
    expect(ribbon.boundingBox!.max.z-ribbon.boundingBox!.min.z).toBeGreaterThan(.03);
    ribbon.dispose();
  });
});
