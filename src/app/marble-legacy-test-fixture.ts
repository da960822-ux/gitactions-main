import { marbleEngine } from '../games/marble';
import { fourMarbleEngine } from '../games/fourMarble';

/** A saved version-three match; new matches now use the classic 32-cell profile. */
export function savedMarbleState(seed: number) {
  const state = marbleEngine.createInitialState(seed);
  state.referenceProfileId = undefined;
  state.cityRouteVersion = 3;
  state.economicVersion = 3;
  state.money = { p1: 1500, p2: 1500 };
  state.salaryAmount = 200;
  state.completedLaps = undefined;
  state.buildArrivalTile = undefined;
  return state;
}

/** A saved team match with its forty-cell inventory and historical loan rules. */
export function savedFourMarbleState(seed: number) {
  const state = fourMarbleEngine.createInitialState(seed);
  state.referenceProfileId = undefined;
  state.cityRouteVersion = undefined;
  state.economicVersion = undefined;
  state.money = { p1: 1500, p2: 1500, p3: 1500, p4: 1500 };
  state.completedLaps = undefined;
  state.buildArrivalTile = undefined;
  return state;
}
