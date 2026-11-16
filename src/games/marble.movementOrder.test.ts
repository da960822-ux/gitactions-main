import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { marbleDrawFixture, marbleEffectFixture, marbleScenarioDice } from './marble.effectFixtures';

for (const [name, engine] of [['2p', marbleEngine], ['4p', fourMarbleEngine]] as const) {
  for (const version of [1, 2] as const) describe(`${name} construction ${version} movement receipts`, () => {
    for (const route of ['roll', 'train', 'visit', 'advance-start'] as const) it(`${route} emits movement before cross-START salary without changing cash or laps`, () => {
      const card = route === 'visit' || route === 'advance-start';
      const state = card ? marbleDrawFixture(engine, route === 'visit' ? 'visit-santo-domingo' : 'advance-start', version) : marbleEffectFixture(engine, version);
      state.positions.p1 = card ? 32 : route === 'roll' ? 38 : 30;
      state.rng = marbleScenarioDice(1, route === 'roll' ? 2 : 1);
      if (route === 'train') { state.phase = 'train-decision'; state.trainReady.p1 = true; state.pendingTrainFare = 100; state.pendingTrainSource = 'station'; state.trainFare = 100; }
      const action = route === 'train' ? { type: 'choose-train', payload: { destination: 1 } } : { type: 'roll' };
      expect(engine.validateAction(state, 'p1', action)).toBeNull();
      const next: any = engine.applyAction(state, 'p1', action);
      const draw = next.actionLog.find((event: any) => event.cardPhase === 'draw');
      const events = card ? next.actionLog.filter((event: any) => event.cardDrawSequence === draw.sequence) : next.actionLog;
      const move = events.find((event: any) => event.type === 'move');
      const salary = events.find((event: any) => event.moneyDelta?.p1 === 300);
      expect(move.sequence).toBeLessThan(salary.sequence);
      if (route !== 'advance-start') expect(salary.sequence).toBeLessThan(events.find((event: any) => event.type === 'arrival').sequence);
      expect(next.positions.p1).toBe(route === 'visit' ? 15 : route === 'advance-start' ? 0 : 1);
      expect(next.money.p1).toBe(10300 - (route === 'train' ? 100 : route === 'visit' ? 30 : 0));
      if (version === 2) expect(next.completedLaps.p1).toBe(2);
      if (card) expect(salary.cardDrawSequence).toBe(draw.sequence);
    });
  });
}
