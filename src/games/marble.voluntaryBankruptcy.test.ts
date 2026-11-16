import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { chooseSimpleAiAction } from './simpleAi';

for (const engine of [marbleEngine, fourMarbleEngine]) describe(`${engine === marbleEngine ? '2p' : '4p'} voluntary bankruptcy`, () => {
  const crisis = () => {
    const s: any = engine.createInitialState(1);
    s.phase = 'debt'; s.money.p1 = 20;
    s.pendingPayment = { amount: 100, creditor: 'p2', resumeActive: 'p1', resumePhase: 'main', reason: { ko: '통행료', es: 'Alquiler' }, type: 'rent' };
    s.properties[1] = { owner: 'p1', houses: 0 };
    s.properties[2] = { owner: 'p2', houses: 0 };
    if (engine === fourMarbleEngine) s.properties[3] = { owner: 'p3', houses: 0 };
    return s;
  };
  const action = { type: 'declare-bankruptcy', payload: { voluntary: true } };
  it('allows an explicit choice despite unused credit and saleable assets, without changing AI rescue behavior', () => {
    const s = crisis();
    expect(engine.validateAction(s, 'p1', { type: 'declare-bankruptcy' })).toBeTruthy();
    expect(engine.validateAction(s, 'p1', action)).toBeNull();
    const view: any = engine.getPlayerView(s, 'p1');
    expect(view.actions.some((c: any) => c.action.payload?.voluntary === true)).toBe(true);
    const ai = engine === marbleEngine ? chooseSimpleAiAction('marble', view, 'p1', () => 0) : fourMarbleEngine.chooseAiAction!(view, 'p1', () => 0);
    expect(ai?.type).not.toBe('declare-bankruptcy');
    const next: any = engine.applyAction(s, 'p1', action);
    expect(next.pendingPayment).toBeNull();
    expect(next.money.p2).toBe(s.money.p2);
    expect(next.properties[2]).toEqual(s.properties[2]);
    expect(next.actionLog.filter((e: any) => e.type === 'bankruptcy')).toHaveLength(1);
    if (engine === marbleEngine) expect(next.result.winner).toBe('p2');
    else {
      expect(next.eliminated).toEqual({ p1: true, p2: false, p3: false, p4: false });
      expect(next.result).toBeNull(); expect(next.properties[1]).toBeUndefined();
      expect(next.properties[3]).toEqual(s.properties[3]); expect(next.money.p3).toBe(s.money.p3);
      expect(next.money.p1).toBe(0);
    }
    expect(engine.validateAction(next, 'p1', action)).toBeTruthy();
    expect(() => engine.applyAction(next, 'p1', action)).toThrow();
    expect(s.phase).toBe('debt'); expect(s.properties[1]).toBeDefined();
  });
  it('requires actor, debt phase, pending obligation and an exact boolean opt-in', () => {
    const s = crisis();
    expect(engine.validateAction(s, 'p2', action)).toBeTruthy();
    expect(engine.validateAction(s, 'p1', { ...action, payload: { voluntary: 'true' } })).toBeTruthy();
    for (const phase of ['roll', 'main', 'decision', 'rent-decision', 'finished']) {
      expect(engine.validateAction({ ...s, phase }, 'p1', action)).toBeTruthy();
    }
    expect(engine.validateAction({ ...s, pendingPayment: null }, 'p1', action)).toBeTruthy();
  });
});
