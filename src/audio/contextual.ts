import type { GameId } from '../core/types';

/** Original short accents supplement CC0 material Foley; never encode hidden card values. */
export type ContextualCue = 'step' | 'arrival' | 'landmark' | 'takeover' | 'income' | 'outgoing' | 'key-draw' | 'blackout' | 'festival' | 'ticket' | 'jail' | 'escape' | 'travel' | 'debt' | 'repay' | 'rest' | 'ready' | 'return-tokens';
export type Tone = { note: number; duration: number; delay?: number; level?: number };
export type Texture = { duration: number; cutoff: number; delay?: number; level?: number };
export type CueRecipe = { tones?: Tone[]; textures?: Texture[] };
const notes = (values: number[], duration = .16, gap = .06): Tone[] => values.map((note, index) => ({ note, duration, delay: index * gap }));
export const contextualRecipes: Record<ContextualCue, CueRecipe> = {
  step: { textures: [{ duration: .028, cutoff: 850, level: .04 }] },
  arrival: { tones: notes([12, 19], .17, .075) },
  landmark: { textures: [{ duration: .08, cutoff: 650 }], tones: notes([0, 7, 12, 19], .26, .09) },
  takeover: { textures: [{ duration: .045, cutoff: 900 }, { duration: .06, cutoff: 1450, delay: .09 }], tones: notes([2, 9, 14], .18, .075) },
  income: { tones: notes([19, 24, 31], .12, .045) },
  outgoing: { tones: notes([14, 7, 0], .12, .055) },
  'key-draw': { textures: [{ duration: .09, cutoff: 2800 }], tones: notes([19, 31], .21, .08) },
  blackout: { textures: [{ duration: .045, cutoff: 3500 }, { duration: .12, cutoff: 220, delay: .055 }], tones: notes([0, -12, -24], .16, .055) },
  festival: { tones: notes([0, 7, 12, 16, 19], .19, .065) },
  ticket: { textures: [{ duration: .04, cutoff: 2400 }], tones: notes([7, 19], .13, .05) },
  jail: { textures: [{ duration: .12, cutoff: 550 }, { duration: .07, cutoff: 2100, delay: .12 }], tones: notes([-19, -12], .19, .11) },
  escape: { tones: notes([-5, 7, 12], .15, .07) },
  travel: { textures: [{ duration: .17, cutoff: 1600 }], tones: notes([-12, 0, 12, 24], .18, .075) },
  debt: { textures: [{ duration: .12, cutoff: 360 }], tones: notes([-12, -11, -12], .21, .13) },
  repay: { tones: notes([-5, 2, 7], .13, .07) },
  rest: { tones: [{ note: 7, duration: .24, level: .035 }] },
  ready: { tones: notes([7, 12], .08, .04) },
  'return-tokens': { textures: [{ duration: .035, cutoff: 2400 }, { duration: .035, cutoff: 1700, delay: .05 }], tones: notes([14, 7], .08, .055) },
};

export function sampleFamily(game: GameId, cue: string): string | null {
  if (game === 'rhythm' || game === 'catchmind' || game === 'minhwatu') return null;
  const common: Record<string, string> = { dice: 'dice', step: 'step', arrival: 'arrival', build: 'build', landmark: 'build', 'key-draw': 'key', blackout: 'blackout', jail: 'jail', ticket: 'pass', travel: 'travel', income: 'coin', outgoing: 'coin', coin: 'coin' };
  if (common[cue]) return common[cue];
  if (game === 'domino' || game === 'davinci') return cue === 'place' || cue === 'draw' ? 'tile' : null;
  if (game === 'jaipur') return cue === 'place' || cue === 'draw' || cue === 'exchange' ? 'card' : cue === 'camel' ? 'step' : null;
  if (game === 'splendor') return cue === 'place' ? 'card' : cue === 'select' || cue === 'return-tokens' ? 'gem' : null;
  return null;
}
