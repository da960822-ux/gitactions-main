import { describe, expect, it } from 'vitest';
import { sameMarbleAction, selectMarblePrimaryAction, selectMarblePropertySale } from './marble-actions';

const choices = (...items: [string, number?][]) => items.map(([type, tile]) => ({ action: { type, ...(tile === undefined ? {} : { payload: { tile } }) } }));

describe('Marble primary action selection', () => {
  it('selects the phase action and never lets optional loans displace it', () => {
    expect(selectMarblePrimaryAction({ phase: 'roll', choices: choices(['borrow'], ['roll']), position: 0 })?.action.type).toBe('roll');
    expect(selectMarblePrimaryAction({ phase: 'decision', choices: choices(['decline'], ['buy']), position: 1 })?.action.type).toBe('buy');
  });

  it('prefers the inspected legal build, then the landed build, then the next legal fallback', () => {
    const actions = choices(['build', 3], ['build', 8], ['takeover', 1], ['endTurn']);
    expect(selectMarblePrimaryAction({ phase: 'main', choices: actions, position: 8, selectedTile: 3 })?.action.payload?.tile).toBe(3);
    expect(selectMarblePrimaryAction({ phase: 'main', choices: actions, position: 8, selectedTile: 9 })?.action.payload?.tile).toBe(8);
    expect(selectMarblePrimaryAction({ phase: 'main', choices: choices(['takeover', 1], ['endTurn']), position: 8 })?.action.type).toBe('takeover');
    expect(selectMarblePrimaryAction({ phase: 'main', choices: choices(['endTurn']), position: 8 })?.action.type).toBe('endTurn');
  });

  it('uses the selected train/event target and falls back to the phase alternative', () => {
    const train = choices(['choose-train', 4], ['choose-train', 7], ['skip-train']);
    const selected = { type: 'choose-train', payload: { tile: 7 } };
    expect(selectMarblePrimaryAction({ phase: 'train-decision', choices: train, position: 0, selectedAction: selected })?.action.payload?.tile).toBe(7);
    expect(selectMarblePrimaryAction({ phase: 'train-decision', choices: choices(['skip-train']), position: 0 })?.action.type).toBe('skip-train');
    expect(selectMarblePrimaryAction({ phase: 'event-decision', choices: choices(['choose-event-city', 4], ['choose-event-city', 7]), position: 0, selectedAction: { type: 'choose-event-city', payload: { tile: 4 } } })?.action.payload?.tile).toBe(4);
  });

  it('prioritizes legal rent/debt resolution and binds a sale offer to its selected tile', () => {
    expect(selectMarblePrimaryAction({ phase: 'rent-decision', choices: choices(['use-rent-pass'], ['pay-rent']), position: 0 })?.action.type).toBe('pay-rent');
    const sales = choices(['sell-property', 1], ['sell-property', 7]);
    expect(selectMarblePropertySale(sales, 7)).toBe(sales[1]);
    expect(selectMarblePrimaryAction({ phase: 'debt', choices: [...sales, ...choices(['repay'])], position: 0, selectedSaleTile: 7 })?.action.payload?.tile).toBe(7);
    expect(selectMarblePrimaryAction({ phase: 'debt', choices: [...choices(['borrow']), ...sales], position: 0, selectedSaleTile: 7 })?.action.type).toBe('borrow');
  });

  it('compares only the action contract, treating absent and empty payloads equally', () => {
    expect(sameMarbleAction({ type: 'roll' }, { type: 'roll', payload: {} })).toBe(true);
    expect(sameMarbleAction({ type: 'build', payload: { tile: 1 } }, { type: 'build', payload: { tile: 2 } })).toBe(false);
  });
});
