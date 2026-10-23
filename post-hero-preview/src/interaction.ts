export const LETTER_RANGE = [0.65, 0.79] as const;
export const LETTER_PAPER_HANDOFF = .70;
export const LETTER_UNFOLDED = .86;

export function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function sceneProgress(scrollY: number, start: number, end: number): number {
  if (![scrollY, start, end].every(Number.isFinite) || end <= start) return 0;
  return clamp01((scrollY - start) / (end - start));
}

export function letterOpenProgress(sceneP: number): number {
  const p = clamp01(sceneP);
  return clamp01((p - LETTER_RANGE[0]) / (LETTER_RANGE[1] - LETTER_RANGE[0]));
}

export type EnvelopeState = { manual: boolean | null; previousInRange: boolean; returning: boolean };

export function createEnvelopeState(): EnvelopeState {
  return { manual: null, previousInRange: false, returning: false };
}

export function updateEnvelopeFromScroll(state: EnvelopeState, sceneP: number): EnvelopeState {
  const inRange = clamp01(sceneP) >= LETTER_RANGE[0];
  return { manual: state.manual, previousInRange: inRange, returning: state.returning && clamp01(sceneP) > LETTER_PAPER_HANDOFF };
}

export function toggleEnvelope(state: EnvelopeState, sceneP: number): EnvelopeState {
  if (state.returning) return reopenEnvelope(state);
  const current = envelopeTarget(state, sceneP) >= 0.5;
  return { manual: !current, previousInRange: clamp01(sceneP) >= LETTER_RANGE[0], returning: false };
}

export function reopenEnvelope(_state: EnvelopeState): EnvelopeState {
  return { manual: true, previousInRange: true, returning: false };
}

export function closeEnvelope(state: EnvelopeState, sceneP: number): EnvelopeState {
  return { ...state, manual: false, returning: clamp01(sceneP) >= LETTER_RANGE[1] };
}

export function envelopeTarget(state: EnvelopeState, sceneP: number): number {
  if (state.returning && clamp01(sceneP) > LETTER_PAPER_HANDOFF) return 1;
  return state.manual === null ? letterOpenProgress(sceneP) : state.manual ? 1 : 0;
}

export type LocalPreferences = { effectsEnabled?: boolean; stamp?: 'YL' | 'heart'; decor?: 'gem' | 'clip'; pawn?: number };

export function loadPreferences(storage: Pick<Storage, 'getItem'> | null | undefined, key: string): LocalPreferences {
  try {
    const value = storage?.getItem(key);
    if (!value) return {};
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return {};
    const data = parsed as Record<string, unknown>;
    return {
      ...(typeof data.effectsEnabled === 'boolean' ? { effectsEnabled: data.effectsEnabled } : {}),
      ...(data.stamp === 'YL' || data.stamp === 'heart' ? { stamp: data.stamp } : {}),
      ...(typeof data.pawn === 'number' && Number.isInteger(data.pawn) && data.pawn >= 0 && data.pawn < 7 ? { pawn: data.pawn } : {}),
      ...(data.decor === 'gem' || data.decor === 'clip' ? { decor: data.decor } : {}),
    };
  } catch {
    return {};
  }
}

export function savePreferences(storage: Pick<Storage, 'setItem'> | null | undefined, key: string, prefs: LocalPreferences): boolean {
  try {
    storage?.setItem(key, JSON.stringify(prefs));
    return Boolean(storage);
  } catch {
    return false;
  }
}

export type DominoTile = readonly [number, number];
export type DominoState = { placed: DominoTile[]; openEnd: number };

export function createDominoState(): DominoState {
  return { placed: [[0, 1]], openEnd: 1 };
}

export function isDominoChainComplete(state: DominoState): boolean {
  return state.placed.length === 4;
}

export function placeDominoTile(state: DominoState, tile: DominoTile): DominoState | null {
  if (!Array.isArray(tile) || tile.length !== 2 || !tile.every((pip) => Number.isInteger(pip) && pip >= 0 && pip <= 6) || isDominoChainComplete(state)) return null;
  if (tile[0] === state.openEnd) return { placed: [...state.placed, [tile[0], tile[1]]], openEnd: tile[1] };
  if (tile[1] === state.openEnd) return { placed: [...state.placed, [tile[1], tile[0]]], openEnd: tile[0] };
  return null;
}
