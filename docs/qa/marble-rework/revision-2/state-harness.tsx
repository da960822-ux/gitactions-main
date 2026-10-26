import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '/src/styles/app.css';
import MarbleBoard from '/src/app/MarbleBoard';
import { marbleEngine, type MarbleState } from '/src/games/marble';
import type { GameAction } from '/src/core/types';

type Scenario = 'levels' | 'shortfall' | 'rent' | 'train' | 'bankruptcy' | 'buy-race' | 'motion';
const labels: Record<Scenario, string> = {
  levels: 'Level artwork: 0 / 1 / 2 / 3',
  shortfall: 'Unaffordable purchase',
  rent: 'Rent transfer',
  train: 'Train destination',
  bankruptcy: 'Bankruptcy confirmation',
  'buy-race': 'Competing purchase actions',
  motion: 'Reduced-motion roll',
};

function makeState(scenario: Scenario): MarbleState {
  const state = marbleEngine.createInitialState(153);
  state.cityRouteVersion = 3;
  state.economicVersion = 3;
  state.propertyRulesVersion = 1;
  state.active = 'p1';
  state.positions = { p1: 3, p2: 0 };
  state.pawnLocked = { p1: true, p2: true };
  state.properties = {};
  state.money = { p1: 1500, p2: 1500 };
  if (scenario === 'levels') {
    state.phase = 'main';
    state.properties = { '3': { owner: 'p1', houses: 1 }, '4': { owner: 'p1', houses: 2 }, '9': { owner: 'p1', houses: 3 } };
  } else if (scenario === 'shortfall') {
    state.phase = 'decision';
    state.positions.p1 = 38;
    state.pendingTile = 38;
    state.money.p1 = 200;
  } else if (scenario === 'rent') {
    state.phase = 'rent-decision';
    state.positions.p1 = 3;
    state.properties = { '3': { owner: 'p2', houses: 1 } };
    state.pendingRent = { amount: 120, creditor: 'p2', playerId: 'p1', tile: 3, reason: { ko: '상대 도시 통행료', es: 'Alquiler de la ciudad rival' } };
  } else if (scenario === 'train') {
    state.phase = 'train-decision';
    state.positions.p1 = 27;
    state.pendingTrainFare = 100;
    state.pendingTrainSource = 'station';
  } else if (scenario === 'buy-race') {
    state.phase = 'decision';
    state.positions.p1 = 1;
    state.pendingTile = 1;
  } else if (scenario === 'motion') {
    state.phase = 'roll';
    state.positions.p1 = 0;
  } else {
    state.phase = 'debt';
    state.money.p1 = 0;
    state.debt = { p1: 330, p2: 0 };
    state.pendingPayment = { amount: 5000, creditor: 'bank', reason: { ko: '은행 납부금', es: 'Pago al banco' }, resumePhase: 'main', resumeActive: 'p1', type: 'tax' };
  }
  return state;
}

function Harness() {
  const [scenario, setScenario] = useState<Scenario>(() => new URLSearchParams(location.search).get('state') as Scenario || 'levels');
  const [state, setState] = useState(() => makeState(scenario));
  const view = useMemo(() => marbleEngine.getPlayerView(state, 'p1'), [state]);
  const status = scenario === 'levels' ? 'Stage map: Gwangju 0 · New York 1 · Madrid 2 · San Juan 3' : `${scenario} · phase ${state.phase} · cash ${state.money.p1} · events ${state.actionLog?.map(event => event.type).join(',') || 'none'}`;
  const select = (next: Scenario) => { setScenario(next); setState(makeState(next)); history.replaceState({}, '', `?state=${next}`); };
  const dispatch = (action: GameAction) => setState(current => marbleEngine.applyAction(current, 'p1', action));
  return <div className="app-shell room-shell room-game-marble quality-table-room">
    <nav className="qa-controls" aria-label="Marble QA scenario">
      <label>Scenario <select value={scenario} onChange={event => select(event.target.value as Scenario)}>{Object.entries(labels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      {scenario === 'rent' && <button type="button" onClick={() => dispatch({ type: 'pay-rent' })}>Pay rent</button>}
      {scenario === 'bankruptcy' && <button type="button" onClick={() => document.querySelector<HTMLButtonElement>('.mp-bankruptcy-confirm > button')?.click()}>Open confirmation</button>}
      <output className="qa-status">{status}</output>
    </nav>
    <main className="room-main">
      <section className="board-card">
        <header className="board-header"><div className="board-game"><b>Marble · state QA</b></div></header>
        <MarbleBoard key={scenario} view={view} language="ko" playerId="p1" runAction={dispatch}/>
      </section>
    </main>
  </div>;
}

createRoot(document.getElementById('root')!).render(<Harness/>);
