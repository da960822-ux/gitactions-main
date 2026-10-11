import { describe, expect, it } from 'vitest';
import { minhwatuPresentationChange, minhwatuPresentationSteps, minhwatuPublicSnapshot } from './useMinhwatuPresentation';
import type { HwatuEvent } from './hwatu-motion';
import type { MinhwatuCard } from '../games/minhwatu';
const card = (id: string): MinhwatuCard => ({ id, month: Number(id.split('-')[0]), kind: 'plain', points: 0, flower: { ko: '꽃', es: 'flor' }, badge: { ko: '피', es: 'simple' } });
const event = (sequence: number, type: HwatuEvent['type'], extra = {}): HwatuEvent => ({ sequence, type, title: { ko: '사건', es: 'Evento' }, ...extra });
const base = () => ({ turn: 'p1', ownHand: [card('3-1')], opponentCount: 10, log: [], board: { table: [card('3-2')], captures: { p1: [], p2: [] }, scores: { p1: 0, p2: 0 }, rulesVersion: 2, deckCount: 20 } });
describe('Minhwatu public presentation', () => {
  it('retains only the authorized hand and named public fields', () => {
    const view = minhwatuPublicSnapshot({ ...base(), hands: { p2: [card('12-1')] }, board: { ...base().board, deck: [card('12-2')], hands: { p2: [card('12-1')] } } });
    expect(JSON.stringify(view)).not.toContain('12-1'); expect(JSON.stringify(view)).not.toContain('12-2');
    expect(view.ownHand[0].id).toBe('3-1');
  });
  it('routes play to the exact capture partner and keeps moving cards out of static zones', () => {
    const events = [event(2, 'play', { actor: 'p1', cards: [card('3-1')] }), event(3, 'capture', { actor: 'p1', cards: [card('3-2'), card('3-1')], origins: { '3-1': 'table', '3-2': 'table' } })];
    const steps = minhwatuPresentationSteps(events, base()); expect(steps[0].targetId).toBe('3-2');
    const departure = minhwatuPresentationChange(base(), steps[0], 'p1', false); expect(departure.ownHand).toEqual([]);
    const landed = minhwatuPresentationChange(departure, steps[0], 'p1', true); expect(landed.board.table.map((c: MinhwatuCard) => c.id)).toEqual(['3-2']);
    const gathering = minhwatuPresentationChange(landed, steps[1], 'p1', false); expect(gathering.board.table).toEqual([]); expect(gathering.board.captures.p1).toEqual([]);
    const first = minhwatuPresentationChange(gathering, steps[1], 'p1', true, 0); expect(first.board.captures.p1.map((c: MinhwatuCard) => c.id)).toEqual(['3-2']);
  });
  it('draws through reveal and a physical matching stop; only a real pending draw waits', () => {
    const draw = event(4, 'draw', { actor: 'p1', cards: [card('3-3')] });
    const matched = minhwatuPresentationSteps([draw, event(5, 'capture', { actor: 'p1', cards: [card('3-2'), card('3-3')] })], base());
    expect(matched.map(s => [s.events[0].type, Boolean(s.transfer), s.targetId])).toEqual([['draw', false, '3-2'], ['draw', true, '3-2'], ['capture', false, undefined]]);
    expect(minhwatuPresentationSteps([draw], { board: { pendingCard: card('3-3') } }).length).toBe(1);
    const unmatched = minhwatuPresentationSteps([draw, event(5, 'turn')], base()); expect(unmatched[1].transfer).toBe(true);
  });
  it('completes all four landings before advancing and combines simultaneous yakus', () => {
    const capture = event(3, 'capture', { actor: 'p1', cards: [1, 2, 3, 4].map(i => card(`3-${i}`)) });
    const yaku = { id: 'godori', label: { ko: '고도리', es: 'Godori' }, bonus: 50 };
    const steps = minhwatuPresentationSteps([capture, event(4, 'special', { yaku }), event(5, 'special', { yaku: { ...yaku, id: 'hongdan' } }), event(6, 'turn')], base());
    expect(steps[0].impactOffsets).toEqual([260, 285, 310, 335]); expect(steps[0].duration).toBeGreaterThan(335);
    expect(steps[1].events.length).toBe(2); expect(steps[1].duration).toBe(1050); expect(steps.length).toBe(3);
  });
  it('updates mirrored scores only at the last arrival and retains legacy Godori zero', () => {
    const events = [event(3, 'capture', { actor: 'p1', cards: [card('3-1'), card('3-2')] })], step = minhwatuPresentationSteps(events, base())[0];
    const first = minhwatuPresentationChange(base(), step, 'p1', true, 0); expect(first.board.breakdown).toBeUndefined();
    const last = minhwatuPresentationChange(first, step, 'p1', true, 1); expect(last.board.breakdown.p1.yakus.find((y: any) => y.id === 'godori').bonus).toBe(50);
    const legacy = minhwatuPresentationChange({ ...first, board: { ...first.board, rulesVersion: 1 } }, step, 'p1', true, 1); expect(legacy.board.breakdown.p1.yakus.find((y: any) => y.id === 'godori').bonus).toBe(0);
  });
});

it('takes a previously waiting two-target draw to the chosen table partner before sweeping', () => {
  const drawn = card('3-3'), chosen = card('3-2');
  const capture = event(9, 'capture', { actor: 'p1', cards: [chosen, drawn], origins: { '3-2': 'table', '3-3': 'draw' } });
  const steps = minhwatuPresentationSteps([capture, event(10, 'turn', { actor: 'p2' })], base());
  expect(steps.map(step => [step.events[0].type, Boolean(step.transfer)])).toEqual([['draw', true], ['capture', false], ['turn', false]]);
  expect(steps[0].targetId).toBe(chosen.id); expect(steps[0].events[0].cards?.[0].id).toBe(drawn.id);
  const waiting = { ...base(), board: { ...base().board, pendingCard: drawn } };
  const departure = minhwatuPresentationChange(waiting, steps[0], 'p1', false);
  expect(departure.board.pendingCard).toBeNull();
  const arrival = minhwatuPresentationChange(departure, steps[0], 'p1', true);
  expect(arrival.board.table.map((card: MinhwatuCard) => card.id)).toEqual([chosen.id]);
  expect(arrival.board.captures.p1).toEqual([]);
  expect(steps[0].duration).toBeGreaterThan(steps[0].impactOffsets[0]);
});
