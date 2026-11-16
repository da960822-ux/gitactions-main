import { playCue, type AudioCue } from './audio';
import type { MarbleActionEvent, MarblePresentationFrame } from '../app/marble-motion';

const cardCues: Record<string, AudioCue> = {
  'takeover-discount-pass': 'ticket',
  festival: 'festival', lottery: 'income', 'rent-rebate': 'income', 'travel-cost': 'outgoing', maintenance: 'outgoing',
  'visit-santo-domingo': 'travel', 'advance-start': 'travel', retreat: 'move', 'go-to-island': 'jail',
  'escape-pass': 'ticket', 'train-ticket': 'ticket', 'city-dividend': 'income', 'monopoly-warning': 'warning',
  'city-festival': 'festival', blackout: 'blackout', 'rent-pass': 'ticket',
  'forced-sale': 'sell', earthquake: 'crisis', 'city-shield': 'ticket',
  'construction-grant': 'build', 'property-hunt': 'travel', birthday: 'festival',
};

/** Reads only the public event being presented, never the latest authoritative board. */
export function marbleEventAudio(event: MarbleActionEvent, viewer = 'p1', outcome?: 'win' | 'lose' | 'draw'): AudioCue[] {
  const type = event.type;
  // The free corner can inherit travel-card causality, but never draws a card itself.
  if (type === 'festival-site') return event.cardOutcome === 'applied' ? ['festival'] : event.cardOutcome === 'pending-choice' ? ['ready'] : event.cardOutcome === 'no-effect' ? ['rest'] : [];
  if (event.cardPhase === 'draw') return ['key-draw'];
  if (event.cardOutcome === 'pending-choice') return ['ready'];
  if (event.cardOutcome === 'no-effect' || event.blockedByShield) return ['rest'];
  const delta = event.moneyDelta?.[viewer];
  const money: AudioCue = typeof delta === 'number' && delta > 0 ? 'income' : typeof delta === 'number' && delta < 0 ? 'outgoing' : 'coin';
  switch (type) {
    case 'roll': return ['dice'];
    case 'move': return []; // Every presented pawn step owns its own material impact.
    case 'pawn': return ['select'];
    case 'arrival': return ['arrival'];
    case 'buy': return event.landmark ? ['buy', 'landmark'] : event.houses ? ['buy', 'build'] : ['buy'];
    case 'build': return [event.cardId === 'earthquake' ? 'crisis' : event.landmark ? 'landmark' : 'build'];
    case 'takeover': return ['takeover'];
    case 'sell': return ['sell'];
    case 'rent': return event.cardId === 'rent-pass' ? ['ticket'] : [money];
    case 'tax': return [money];
    case 'salary': return [money];
    case 'bonus': return ['festival', 'birthday'].includes(String(event.cardId)) ? ['festival', money] : [money];
    case 'event-card': return [cardCues[String(event.cardId ?? event.id)] ?? 'event'];
    case 'loan': return ['loan'];
    case 'repay': return ['repay'];
    case 'crisis': return ['debt'];
    case 'bankruptcy': return ['crisis'];
    case 'monopoly-warning': return ['warning'];
    case 'island': return ['jail'];
    case 'escape': return [event.cardId === 'escape-pass' ? 'ticket' : 'escape'];
    case 'train': return [Number.isInteger(event.from) && Number.isInteger(event.to) ? 'travel' : event.cardId ? 'ticket' : 'ready'];
    case 'rest': return ['rest'];
    case 'turn': return ['turn'];
    case 'win': return [outcome === 'draw' ? 'score' : outcome === 'lose' ? 'lose' : 'win'];
    default: return [];
  }
}

/** One presenter per confirmed batch. Frames—not action clicks—are the clock. */
export function createMarbleAudioPresenter(viewer: string, outcome?: 'win' | 'lose' | 'draw', emit: (cue: AudioCue) => void = cue => playCue('marble', cue)) {
  let sequence = 0, step = '';
  const cards = new Map<number, string>();
  return (frame: Pick<MarblePresentationFrame, 'event' | 'traveler'>) => {
    const event = frame.event, next = Number(event.sequence ?? event.seq ?? 0);
    if (!Number.isSafeInteger(next) || next < sequence) return;
    if (frame.traveler) {
      const key = `${next}:${frame.traveler.seat}:${frame.traveler.tile}`;
      if (step !== key) { step = key; emit('step'); }
    }
    if (next <= sequence) return;
    sequence = next;
    if (event.cardPhase === 'draw' && event.cardId) cards.set(next, event.cardId);
    const cardId = event.cardId ?? cards.get(Number(event.cardDrawSequence));
    for (const cue of marbleEventAudio(cardId ? { ...event, cardId } : event, viewer, outcome)) emit(cue);
  };
}
