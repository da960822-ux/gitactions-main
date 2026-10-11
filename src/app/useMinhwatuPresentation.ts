import { useLayoutEffect, useRef, useState } from 'react';
import type { PlayerId } from '../core/types';
import { minhwatuScoreBreakdown, type MinhwatuCard } from '../games/minhwatu';
import { hwatuEvents, hwatuEventWindow, hwatuSequence, type HwatuEvent } from './hwatu-motion';

export type MinhwatuPresentationStep = { events: HwatuEvent[]; sequence: number; duration: number; impactOffsets: number[]; targetId?: string; transfer?: boolean };
export const MINHWATU_PRESENTATION_CUE = 'minhwatu-presentation-cue';
export function minhwatuPresentationSteps(events: HwatuEvent[], finalView: any): MinhwatuPresentationStep[] {
  const steps: MinhwatuPresentationStep[] = [];
  for (let index = 0; index < events.length; index++) {
    const event = events[index], next = events[index + 1];
    if (event.type === 'special' && steps.at(-1)?.events[0].type === 'special') {
      const prior = steps.at(-1)!; prior.events.push(event); prior.duration = Math.max(prior.duration, event.yaku?.id === 'godori' ? 1050 : 700); continue;
    }
    const waitingDraw = event.type === 'capture' ? event.cards?.find(card => event.origins?.[card.id] === 'draw') : undefined;
    if (waitingDraw && events[index - 1]?.type !== 'draw') {
      const transferEvent: HwatuEvent = { sequence: event.sequence, type: 'draw', actor: event.actor, title: event.title, cards: [waitingDraw] };
      steps.push({ events: [transferEvent], sequence: event.sequence, duration: 180, impactOffsets: [160], targetId: event.cards?.find(card => card.id !== waitingDraw.id)?.id, transfer: true });
    }
    const impacts = event.type === 'capture' ? (event.cards ?? []).map((_, i) => 260 + i * 25) : [event.type === 'play' ? 220 : event.type === 'draw' ? 200 : 0];
    const duration = event.type === 'capture' ? Math.max(320, (impacts.at(-1) ?? 260) + 35) : event.type === 'play' ? 280 : event.type === 'draw' ? 260 : event.type === 'special' ? event.yaku?.id === 'godori' ? 1050 : 700 : 180;
    const targetId = (event.type === 'play' || event.type === 'draw') && next?.type === 'capture' ? next.cards?.find(card => card.id !== event.cards?.[0]?.id)?.id : undefined;
    steps.push({ events: [event], sequence: event.sequence, duration, impactOffsets: impacts, targetId });
    if (event.type === 'draw' && next?.type === 'capture') steps.push({ events: [event], sequence: event.sequence, duration: 180, impactOffsets: [160], targetId, transfer: true });
    if (event.type === 'draw' && next?.type !== 'capture' && finalView?.board?.pendingCard?.id !== event.cards?.[0]?.id) steps.push({ events: [event], sequence: event.sequence, duration: 180, impactOffsets: [160], transfer: true });
  }
  return steps;
}

// Only caller-projected data is retained. Never accept an engine state or an opponent hand.
export function minhwatuPublicSnapshot(view: any) {
  return { turn: view?.turn, phase: view?.phase, result: view?.result, opponentCount: view?.opponentCount, ownHand: [...(view?.ownHand ?? [])], log: [...hwatuEvents(view)], board: { pendingCard: view?.board?.pendingCard, deckCount: view?.board?.deckCount, remainingDeck: view?.board?.remainingDeck, scores: view?.board?.scores, breakdown: view?.board?.breakdown, rulesVersion: view?.board?.rulesVersion, table: [...(view?.board?.table ?? [])], captures: { p1: [...(view?.board?.captures?.p1 ?? [])], p2: [...(view?.board?.captures?.p2 ?? [])] } } };
}
export function minhwatuPresentationChange(view: any, step: MinhwatuPresentationStep, playerId: PlayerId, landing: boolean, cardIndex?: number) {
  const out = minhwatuPublicSnapshot(view), event = step.events[0], cards = event.cards ?? [], ids = new Set(cards.map(card => card.id));
  if (!landing) {
    if (event.type === 'play') {
      if (event.actor === playerId) out.ownHand = out.ownHand.filter((card: MinhwatuCard) => !ids.has(card.id));
      else out.opponentCount = Math.max(0, Number(out.opponentCount ?? 0) - 1);
    }
    if (event.type === 'capture') { out.board.table = out.board.table.filter((card: MinhwatuCard) => !ids.has(card.id)); out.board.pendingCard = null; }
    if (step.transfer) out.board.pendingCard = null;
    return out;
  }
  out.log = [...out.log.filter((old: HwatuEvent) => old.sequence < event.sequence), ...step.events];
  if (event.type === 'turn' && event.actor) out.turn = event.actor;
  if (event.type === 'play' && !step.targetId) out.board.table.push(...cards);
  if (event.type === 'draw') {
    if (step.transfer) { if (!step.targetId) out.board.table.push(...cards); } else { out.board.pendingCard = cards[0] ?? null; out.board.deckCount = Math.max(0, Number(out.board.deckCount ?? 0) - 1); }
  }
  if (event.type === 'capture' && event.actor) {
    const added = cardIndex === undefined ? cards : cards.slice(cardIndex, cardIndex + 1);
    const pile = out.board.captures[event.actor];
    out.board.captures[event.actor] = [...pile, ...added.filter(card => !pile.some((owned: MinhwatuCard) => owned.id === card.id))];
    if (cardIndex === undefined || cardIndex === cards.length - 1) {
      out.board.breakdown = minhwatuScoreBreakdown(out.board.captures, Number(out.board.rulesVersion) === 1 ? 0 : 50);
      out.board.scores = { p1: out.board.breakdown.p1.finalScore, p2: out.board.breakdown.p2.finalScore };
    }
  }
  return out;
}

export function useMinhwatuPresentation(authoritative: any, playerId: PlayerId, sceneKey = '') {
  const identity = `${playerId}:${sceneKey}`;
  const controller = useRef({ identity, sequence: Math.max(0, ...hwatuEvents(authoritative).map(hwatuSequence)), generation: 0, timers: [] as number[], running: false });
  const [display, setDisplay] = useState(() => minhwatuPublicSnapshot(authoritative));
  const [step, setStep] = useState<MinhwatuPresentationStep | null>(null);
  const [busy, setBusy] = useState(false);
  const latest = useRef(authoritative); latest.current = authoritative;
  const resetNeeded = controller.current.identity !== identity || Math.max(0, ...hwatuEvents(authoritative).map(hwatuSequence)) < controller.current.sequence;
  useLayoutEffect(() => {
    const control = controller.current;
    const windowed = hwatuEventWindow(hwatuEvents(authoritative), control.sequence);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const stop = () => { window.dispatchEvent(new CustomEvent('minhwatu-presentation-cancel')); control.generation++; control.timers.forEach(clearTimeout); control.timers = []; control.running = false; setStep(null); setBusy(false); };
    // shortcut: more than 12 fresh events or delivery during playback snaps quietly; upgrade the queue if live network shows overlapping snapshots.
    if (control.identity !== identity || windowed.reset || reduced || windowed.fresh.length > 12 || control.running && windowed.fresh.length) {
      const quiet = control.identity !== identity || windowed.reset || windowed.fresh.length > 12 || control.running;
      stop(); control.identity = identity; control.sequence = windowed.latestSequence; setDisplay(minhwatuPublicSnapshot(authoritative));
      if (reduced && !quiet) {
        let specialPlayed = false;
        for (const event of windowed.fresh) {
          if (event.type === 'special' && specialPlayed) continue;
          if (event.type === 'special') specialPlayed = true;
          window.dispatchEvent(new CustomEvent(MINHWATU_PRESENTATION_CUE, { detail: { event, events: [event], playerId, impactOffsets: [0] } }));
        }
      }
      return;
    }
    if (!windowed.fresh.length) return;
    control.sequence = windowed.latestSequence;
    const steps = minhwatuPresentationSteps(windowed.fresh, authoritative), generation = ++control.generation;
    control.running = true; setBusy(true);
    let offset = 0;
    const schedule = (delay: number, action: () => void) => control.timers.push(window.setTimeout(() => { if (control.generation === generation) action(); }, delay));
    for (const current of steps) {
      schedule(offset, () => {
        setStep(current); setDisplay(value => minhwatuPresentationChange(value, current, playerId, false));
        window.dispatchEvent(new CustomEvent(MINHWATU_PRESENTATION_CUE, { detail: { event: current.events[0], events: current.events, playerId, impactOffsets: current.impactOffsets, transfer: current.transfer } }));
      });
      if (current.events[0].type === 'capture') current.impactOffsets.forEach((impact, index) => schedule(offset + impact, () => setDisplay(value => minhwatuPresentationChange(value, current, playerId, true, index))));
      else schedule(offset + (current.impactOffsets[0] || current.duration), () => setDisplay(value => minhwatuPresentationChange(value, current, playerId, true)));
      offset += current.duration;
    }
    schedule(offset, () => { control.running = false; control.timers = []; setDisplay(minhwatuPublicSnapshot(latest.current)); setStep(null); setBusy(false); });
  }, [authoritative, identity]);
  useLayoutEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => {
      if (!query.matches) return;
      const control = controller.current; control.generation++; control.timers.forEach(clearTimeout); control.timers = []; control.running = false;
      window.dispatchEvent(new CustomEvent('minhwatu-presentation-cancel'));
      setDisplay(minhwatuPublicSnapshot(latest.current)); setStep(null); setBusy(false);
    };
    query.addEventListener?.('change', change);
    return () => query.removeEventListener?.('change', change);
  }, []);
  useLayoutEffect(() => () => { const control = controller.current; window.dispatchEvent(new CustomEvent('minhwatu-presentation-cancel')); control.generation++; control.timers.forEach(clearTimeout); }, []);
  return { view: resetNeeded ? minhwatuPublicSnapshot(authoritative) : display, busy: resetNeeded ? false : busy, step: resetNeeded ? null : step };
}
