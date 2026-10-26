import type { GameAction } from '../core/types';

export type MarbleActionChoice = { action: GameAction };
type MarblePrimaryInput<T extends MarbleActionChoice> = {
  phase: string;
  choices: readonly T[];
  position: number;
  selectedTile?: number;
  selectedSaleTile?: number | null;
  selectedAction?: GameAction;
};

export function sameMarbleAction(left?: GameAction, right?: GameAction) {
  return !!left && !!right && left.type === right.type && JSON.stringify(left.payload ?? {}) === JSON.stringify(right.payload ?? {});
}

export function selectMarblePropertySale<T extends MarbleActionChoice>(choices: readonly T[], selectedTile: number | null) {
  return choices.find(choice => Number(choice.action.payload?.tile) === selectedTile) ?? choices[0];
}

export function selectMarblePrimaryAction<T extends MarbleActionChoice>({ phase, choices, position, selectedTile, selectedSaleTile, selectedAction }: MarblePrimaryInput<T>): T | undefined {
  const ofType = (type: string) => choices.filter(choice => choice.action.type === type);
  const first = (type: string) => ofType(type)[0];
  const buildAt = (tile: number | undefined) => tile === undefined ? undefined : ofType('build').find(choice => Number(choice.action.payload?.tile) === tile);
  const targeted = (type: string) => ofType(type).find(choice => sameMarbleAction(choice.action, selectedAction));

  if (phase === 'roll') return first('roll');
  if (phase === 'decision') return first('buy') ?? first('decline');
  if (phase === 'main') return targeted('build') ?? buildAt(selectedTile) ?? buildAt(position) ?? first('build') ?? first('takeover') ?? first('endTurn');
  if (phase === 'island') return first('attempt-doubles') ?? first('pay-escape') ?? first('use-escape-pass');
  if (phase === 'train-decision') return targeted('choose-train') ?? first('choose-train') ?? first('skip-train');
  if (phase === 'event-decision') return targeted('choose-event-city') ?? first('choose-event-city');
  if (phase === 'rent-decision') return first('pay-rent') ?? first('use-rent-pass');
  if (phase === 'debt') return first('borrow') ?? selectMarblePropertySale(ofType('sell-property'), selectedSaleTile ?? null) ?? first('repay');
  return undefined;
}
