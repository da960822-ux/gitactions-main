export type LetterFinalePhase = 'sealed' | 'reading' | 'folding' | 'rose';
export type LetterFinaleState = { phase: LetterFinalePhase; roseArmed: boolean };
export type LetterFinaleEvent =
  | { type: 'read' | 'reopen' | 'shared-open' }
  | { type: 'close'; opening: number }
  | { type: 'fold-complete'; opening: number; target: number }
  | { type: 'interrupt' };

export function createLetterFinaleState(): LetterFinaleState {
  return { phase: 'sealed', roseArmed: false };
}

export function reduceLetterFinale(state: LetterFinaleState, event: LetterFinaleEvent): LetterFinaleState {
  if (event.type === 'read' || event.type === 'reopen' || event.type === 'shared-open') {
    return { phase: 'reading', roseArmed: false };
  }
  if (event.type === 'close') {
    return { phase: 'folding', roseArmed: Number.isFinite(event.opening) && event.opening >= .9995 };
  }
  if (event.type === 'interrupt') {
    return state.phase === 'folding' && state.roseArmed ? { ...state, roseArmed: false } : state;
  }
  if (event.type !== 'fold-complete') return state;
  if (state.phase !== 'folding' || event.target !== 0 || !Number.isFinite(event.opening) || event.opening >= .0005) return state;
  return { phase: state.roseArmed ? 'rose' : 'sealed', roseArmed: false };
}
