import { describe, expect, it, vi } from 'vitest';
import { contextualRecipes, sampleFamily } from './contextual';
import { createMarbleAudioPresenter, marbleEventAudio } from './marble-audio';
import { marbleEventsAfter, marblePresentationFrames } from '../app/marble-motion';
import { splendorOpponentCues, splendorZeroNetReturnCue } from './public-audio';

describe('contextual event audio', () => {
  it('sounds every presented pawn step, then arrival and viewer-side rent once', () => {
    const events = [{ sequence: 1, type: 'roll', actor: 'p2' }, { sequence: 2, type: 'move', actor: 'p2', from: 0, to: 3, steps: 3 }, { sequence: 3, type: 'arrival', actor: 'p2' }, { sequence: 4, type: 'rent', actor: 'p2', moneyDelta: { p1: 120, p2: -120 } }];
    const frames = marblePresentationFrames(events, { p1: 4, p2: 0 }, { p1: 4, p2: 3 }, 32);
    const emit = vi.fn(), present = createMarbleAudioPresenter('p1', undefined, emit);
    frames.forEach(frame => { present(frame); present(frame); });
    expect(emit.mock.calls.flat()).toEqual(['dice', 'step', 'step', 'step', 'arrival', 'income']);
    present(frames[0]);
    expect(emit).toHaveBeenCalledTimes(6);
    expect(marbleEventAudio(events[3], 'p2')).toEqual(['outgoing']);
  });
  it('separates card reveal, target choice, applied effect and no-effect without reading the board', () => {
    expect(marbleEventAudio({ type: 'event-card', cardId: 'blackout', cardPhase: 'draw' })).toEqual(['key-draw']);
    expect(marbleEventAudio({ type: 'event-card', cardId: 'blackout', cardPhase: 'resolution', cardOutcome: 'applied' })).toEqual(['blackout']);
    expect(marbleEventAudio({ type: 'event-card', cardId: 'city-festival', cardOutcome: 'applied' })).toEqual(['festival']);
    expect(marbleEventAudio({ type: 'event-card', cardId: 'blackout', cardOutcome: 'no-effect' })).toEqual(['rest']);
    expect(marbleEventAudio({ type: 'rent', cardId: 'rent-pass', amount: 0 })).toEqual(['ticket']);
    expect(marbleEventAudio({ type: 'build', landmark: true })).toEqual(['landmark']);
    expect(marbleEventAudio({ type: 'build', landmark: false })).toEqual(['build']);
  });
  it('sounds all six added cards once and treats blocked or no-effect cards as rest',()=>{
    const cues={'forced-sale':'sell',earthquake:'crisis','city-shield':'ticket','construction-grant':'build','property-hunt':'travel',birthday:'festival'};
    expect(marbleEventAudio({type:'build',cardId:'earthquake',cardOutcome:'applied'})).toEqual(['crisis']);
    expect(marbleEventAudio({type:'bonus',cardId:'birthday',cardOutcome:'applied',moneyDelta:{p1:40,p2:-40}})).toEqual(['festival','income']);
    for(const [cardId,cue] of Object.entries(cues)){
      const event={sequence:2,type:'event-card',cardId,cardPhase:'resolution',cardOutcome:'applied'};
      expect(marbleEventAudio(event)).toEqual([cue]);
      expect(marbleEventAudio({...event,cardOutcome:'no-effect'})).toEqual(['rest']);
      expect(marbleEventAudio({...event,blockedByShield:true})).toEqual(['rest']);
      const emit=vi.fn(),present=createMarbleAudioPresenter('p1',undefined,emit);
      present({event:{...event,sequence:1,cardPhase:'draw'},traveler:null});
      present({event,traveler:null});present({event,traveler:null});
      expect(emit.mock.calls.flat()).toEqual(['key-draw',cue]);
    }
  });
  it('distinguishes travel readiness/departure, debt, repayment, jail and victory', () => {
    expect(marbleEventAudio({ type: 'train' })).toEqual(['ready']);
    expect(marbleEventAudio({ type: 'train', from: 1, to: 18 })).toEqual(['travel']);
    expect(marbleEventAudio({ type: 'crisis' })).toEqual(['debt']);
    expect(marbleEventAudio({ type: 'repay' })).toEqual(['repay']);
    expect(marbleEventAudio({ type: 'island' })).toEqual(['jail']);
    expect(marbleEventAudio({ type: 'win' }, 'p1', 'lose')).toEqual(['lose']);
    expect(marbleEventAudio({ type: 'win' }, 'p1', 'draw')).toEqual(['score']);
    expect(marbleEventAudio({ type: 'takeover' })).toEqual(['takeover']);
  });
  it('sounds the free festival corner only when applied, never as a new card draw', () => {
    for (const cause of [{}, { cardId: 'train-ticket', cardDrawSequence: 2, cardPhase: 'resolution' }]) {
      expect(marbleEventAudio({ type: 'festival-site', cardOutcome: 'pending-choice', ...cause })).toEqual(['ready']);
      expect(marbleEventAudio({ type: 'festival-site', cardOutcome: 'applied', ...cause })).toEqual(['festival']);
      expect(marbleEventAudio({ type: 'festival-site', cardOutcome: 'no-effect', ...cause })).toEqual(['rest']);
    }
    expect(marbleEventAudio({ type: 'festival-site' })).toEqual([]);
    expect(marbleEventAudio({ type: 'festival-site', cardPhase: 'draw', cardOutcome: 'pending-choice' })).toEqual(['ready']);
  });
  it('deduplicates applied festival frames and excludes already-consumed snapshot receipts', () => {
    const events = [
      { sequence: 7, type: 'festival-site', cardOutcome: 'pending-choice', cardDrawSequence: 2 },
      { sequence: 8, type: 'festival-site', cardOutcome: 'applied', cardDrawSequence: 2 },
    ];
    const emit = vi.fn(), present = createMarbleAudioPresenter('p1', undefined, emit);
    const positions = { p1: 16, p2: 0 };
    const frames = marblePresentationFrames(events, positions, positions, 32);
    frames.forEach(frame => { present(frame); present(frame); });
    frames.forEach(present);
    expect(emit.mock.calls.flat()).toEqual(['ready', 'festival']);
    const reconnect = createMarbleAudioPresenter('p1', undefined, emit);
    marblePresentationFrames(marbleEventsAfter(events, 8), positions, positions, 32).forEach(reconnect);
    expect(emit.mock.calls.flat()).toEqual(['ready', 'festival']);
  });
  it('never changes opponent audio according to a private reserve identity or hidden draw', () => {
    const before = { turn: 'p2', board: { bank: { gold: 5 }, reservedOpponentCount: 0 } };
    const a = { board: { bank: { gold: 4 }, reservedOpponentCount: 1 }, hiddenCard: 'expensive' };
    const b = { ...a, hiddenCard: 'cheap' };
    expect(splendorOpponentCues(before, a, 'p1')).toEqual(['place']);
    expect(splendorOpponentCues(before, b, 'p1')).toEqual(['place']);
    expect(splendorOpponentCues(before, before, 'p1')).toEqual([]);
  });
  it('acknowledges exact zero-net returns only once, without duplicating ordinary token flights', () => {
    expect(splendorZeroNetReturnCue({ type: 'takeTwo', payload: { gem: 'blue', returnTokens: { blue: 2 } } })).toBe('return-tokens');
    expect(splendorZeroNetReturnCue({ type: 'take', payload: { gems: ['red', 'blue', 'green'], returnTokens: { red: 1, blue: 1, green: 1 } } })).toBe('return-tokens');
    expect(splendorZeroNetReturnCue({ type: 'takeTwo', payload: { gem: 'blue', returnTokens: { red: 2 } } })).toBeNull();
    expect(splendorZeroNetReturnCue({ type: 'takeTwo', payload: { gem: 'blue', returnTokens: { blue: 1 } } })).toBeNull();
    expect(splendorZeroNetReturnCue({ type: 'take', payload: { gems: ['red'], returnTokens: {} } })).toBeNull();
    expect(splendorZeroNetReturnCue({ type: 'reserve', payload: { returnTokens: { gold: 1 } } })).toBeNull();
  });
  it('keeps the six games distinct and excludes Rhythm and Catchmind from new material', () => {
    expect(sampleFamily('domino', 'place')).toBe('tile');
    expect(sampleFamily('jaipur', 'place')).toBe('card');
    expect(sampleFamily('splendor', 'select')).toBe('gem');
    expect(sampleFamily('marble', 'dice')).toBe('dice');
    expect(sampleFamily('catchmind', 'place')).toBeNull();
    expect(sampleFamily('rhythm', 'dice')).toBeNull();
    expect(new Set(Object.values(contextualRecipes).map(recipe => JSON.stringify(recipe))).size).toBe(Object.keys(contextualRecipes).length);
  });
});
