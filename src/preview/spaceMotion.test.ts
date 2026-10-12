import {describe, expect, it} from 'vitest';
import {advanceLetter, balloonBatchIndex, balloonDepthAppearance, balloonPlan, pointerRepulsionFactor, SPACE_PLAN, stepSpring} from './spaceMotion';
import {createPaperGeometry, updatePaper} from './spaceGeometry';
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
  it('can reuse spring output storage without changing its trajectory', () => {
    const output={position:0,velocity:0};let expected={position:180,velocity:120},actual={...expected};
    for(let i=0;i<90;i++){
      expected=stepSpring(expected.position,expected.velocity,0,1/60);
      expect(stepSpring(actual.position,actual.velocity,0,1/60,output)).toBe(output);
      actual={position:output.position,velocity:output.velocity};
    }
    expect(actual).toEqual(expected);
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
  it('adds a restrained size and color falloff with distance while preserving the foreground', () => {
    const near = balloonDepthAppearance(7.2), middle = balloonDepthAppearance(10.6), far = balloonDepthAppearance(18.4);
    expect(near).toEqual({scale: 1, tint: 0});
    expect(middle.scale).toBeLessThan(near.scale);
    expect(far.scale).toBeCloseTo(.7);
    expect(far.tint).toBeCloseTo(.42);
    expect(far.scale).toBeGreaterThan(.65);
  });
  it('allocates every depth/material bucket from the actual balloon count', () => {
    const plans = Array.from({length: SPACE_PLAN.balloons}, (_, index) => balloonPlan(index, false));
    const counts = Array(6).fill(0); plans.forEach(plan => counts[balloonBatchIndex(plan)]++);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(SPACE_PLAN.balloons);
    expect(counts.every(count => count > 0)).toBe(true);
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
});
