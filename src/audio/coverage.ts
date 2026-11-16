import type { AudioCue } from './audio';
import type { GameId } from '../core/types';

export const contextualGames = ['marble', 'splendor', 'davinci', 'minhwatu', 'domino', 'jaipur'] as const;
export type ContextualGame = typeof contextualGames[number];
export type AudioCoverage = { cues: readonly AudioCue[]; owner: string; clock: 'presented-event' | 'accepted-action' | 'public-delta' | 'silent'; reason: string };
const at = (cues: AudioCue[], owner: string, reason: string, clock: AudioCoverage['clock'] = 'presented-event'): AudioCoverage => ({ cues, owner, clock, reason });
const marble = (cues: AudioCue[], reason: string) => at(cues, 'createMarbleAudioPresenter', reason);
const splendor = (cues: AudioCue[], reason: string) => at(cues, 'SplendorMotion / splendorOpponentCues / SplendorTeamTable', reason, 'public-delta');
const davinci = (cues: AudioCue[], reason: string) => at(cues, 'GameFeedback / DaVinciTeamTable', reason, 'public-delta');
const hwatu = (cues: AudioCue[], reason: string) => at(cues, 'useMinhwatuPresentation / HwatuMotion', reason);
const domino = (cues: AudioCue[], reason: string) => at(cues, 'DominoEventStage', reason);
const jaipur = (cues: AudioCue[], reason: string) => at(cues, 'JaipurMotion', reason);

/** Inventory, not a second dispatcher: cues are alternatives/layers, not an instruction to play all. */
export const audioCoverage: Record<ContextualGame, { sources: readonly string[]; actions: Record<string, AudioCoverage>; events: Record<string, AudioCoverage>; variants: Record<string, AudioCoverage> }> = {
  marble: {
    sources: ['marble.ts', 'fourMarble.ts'],
    actions: {
      roll: marble(['dice', 'step', 'arrival'], 'Accepted roll, each presented step, then arrival; no click anticipation.'),
      'attempt-doubles': marble(['dice', 'escape', 'jail', 'step'], 'Public dice outcome chooses escape or island rest.'),
      buy: marble(['buy', 'build', 'landmark'], 'Land purchase and optional selected buildings/landmark are public.'),
      build: marble(['build', 'landmark'], 'Ordinary construction and landmark completion differ.'),
      takeover: marble(['takeover'], 'Accepted ownership transfer.'),
      borrow: marble(['loan'], 'Fixed loan receipt, not an income-card reward.'),
      repay: marble(['repay'], 'Accepted debt repayment.'),
      'sell-property': marble(['sell'], 'Accepted bank liquidation.'),
      'declare-bankruptcy': marble(['crisis'], 'Confirmed individual bankruptcy; result is separate.'),
      'choose-pawn': marble(['select'], 'Confirmed public pawn choice.'),
      'pay-rent': marble(['income', 'outgoing', 'coin'], 'Direction uses only the presented public viewer money delta.'),
      'use-rent-pass': marble(['ticket'], 'Confirmed pass use, no cash sound for zero payment.'),
      'pay-escape': marble(['escape'], 'Confirmed paid island release.'),
      'use-escape-pass': marble(['ticket'], 'Confirmed escape-pass use.'),
      'choose-train': marble(['travel', 'step', 'arrival'], 'Travel departure and actual presented route.'),
      'choose-event-city': marble(['festival', 'blackout', 'sell', 'crisis', 'build', 'rest'], 'Applied city-card or free festival-site effect, or explicit no-effect result.'),
      endTurn: marble(['turn'], 'Confirmed next turn or extra roll.'),
      decline: at(['pass'], 'cueForAction / MarbleTeamBoard', 'No engine event; only successful action completion may acknowledge it.', 'accepted-action'),
      'skip-train': at(['pass'], 'cueForAction / MarbleTeamBoard', 'No travel sound when the accepted choice declines travel.', 'accepted-action'),
    },
    events: {
      roll: marble(['dice'], 'Dice phase of the presentation.'), move: marble(['step'], 'Movement event is silent itself; each presented traveler step owns one impact.'),
      arrival: marble(['arrival'], 'Arrival frame, not raw destination state.'), pawn: marble(['select'], 'Public pawn selection.'),
      buy: marble(['buy', 'build', 'landmark'], 'Purchase plus optional construction layer.'), build: marble(['build', 'landmark', 'crisis'], 'Public construction level selects material/accent.'),
      takeover: marble(['takeover'], 'Ownership transfer.'), sell: marble(['sell'], 'Bank sale.'),
      rent: marble(['income', 'outgoing', 'coin', 'ticket'], 'Viewer delta determines transfer direction; pass means ticket.'),
      tax: marble(['income', 'outgoing', 'coin'], 'Public payment direction.'), bonus: marble(['income', 'outgoing', 'coin', 'festival'], 'Public receipt; festival may add its specific accent.'),
      salary: marble(['income', 'coin'], 'Four-player-only Start crossing salary; income for recipient, neutral coin for another viewer.'),
      'event-card': marble(['key-draw', 'event', 'rest', 'ready', 'festival', 'income', 'outgoing', 'travel', 'move', 'jail', 'ticket', 'warning', 'blackout', 'sell', 'crisis', 'build'], 'Draw reveal uses key Foley; pending choice is ready, applied resolution uses the exact card below, no-effect uses rest.'),
      'festival-site': marble(['ready', 'festival', 'rest'], 'Free corner: ready on target choice, festival only on applied receipt, rest when no eligible city; never key draw even with inherited travel-card causality.'),
      loan: marble(['loan'], 'Loan receipt.'), repay: marble(['repay'], 'Debt repayment.'), crisis: marble(['debt'], 'Pending payment shortage.'), bankruptcy: marble(['crisis'], 'Confirmed bankruptcy.'),
      'monopoly-warning': marble(['warning', 'rest'], 'Warning or explicit no-effect outcome.'), island: marble(['jail'], 'Island entry or failed escape.'),
      escape: marble(['escape', 'ticket'], 'Release or escape-pass acquisition/use.'), train: marble(['travel', 'ticket', 'ready'], 'Departure, ticket, or travel-ready prompt are distinct.'),
      rest: marble(['rest'], 'Rest stop.'), turn: marble(['turn'], 'Turn advance.'), win: marble(['win', 'lose', 'score'], 'Viewer/team win, loss, or draw only after presentation.'),
    },
    variants: {
      'card:draw': marble(['key-draw'], 'Identical draw sound for every card until publicly revealed.'),
      'card:no-effect': marble(['rest'], 'Explicit no-effect card outcome is not a reward.'),
      'card:pending-choice': marble(['ready'], 'A public choice prompt is not yet an applied festival, blackout or travel effect.'),
      'construction:landmark': marble(['landmark'], 'Distinct completion accent from ordinary building.'),
      'route:step': marble(['step'], 'Deduplicated by event sequence, seat and presented tile.'),
    },
  },
  splendor: {
    sources: ['splendor.ts', 'fourSplendor.ts'],
    actions: {
      take: splendor(['select', 'return-tokens', 'noble'], 'Gem landing; optional returned excess and later public noble.'),
      takeTwo: splendor(['select', 'return-tokens', 'noble'], 'Double gem landing; optional excess return.'),
      reserve: splendor(['place', 'select', 'return-tokens', 'noble'], 'Card sleeve plus actual gold/return transfers; never encode reserved identity.'),
      buy: splendor(['buy', 'return-tokens', 'noble'], 'Card/purchase landing and public payment/noble.'),
      chooseNoble: splendor(['noble'], 'Only the confirmed award, not the selection click.'),
    },
    events: {},
    variants: {
      'take:zero-net-return': at(['return-tokens'], 'cueForAction / splendorZeroNetReturnCue', 'Only after acceptance, exact return of all just-taken gems has no public net flight; one clink fills that gap.', 'accepted-action'),
      'take:returnTokens': splendor(['return-tokens'], 'Excess-token return is a separate presented outward transfer.'),
      'reserve:market': splendor(['place'], 'Public market card reservation.'),
      'reserve:deck': splendor(['place'], 'Same reservation cue for every hidden deck identity.'),
      'reserve:gold': splendor(['select'], 'Only actual gold received.'),
      'buy:reserved': splendor(['buy'], 'Same accepted purchase cue as a market purchase.'),
      'buy:market': splendor(['buy'], 'Public development-card purchase.'),
      noble: splendor(['noble'], 'Noble may follow any accepted eligible turn.'),
      turn: splendor(['turn'], 'Public turn change.'), result: splendor(['win', 'lose', 'event'], 'Public viewer/team result; neutral event for draw and no hidden reserved-card scoring inference.'),
    },
  },
  davinci: {
    sources: ['davinci.ts', 'fourDavinci.ts'],
    actions: {
      draw: davinci(['draw'], 'Same tile draw cue for every hidden number and color.'),
      'skip-draw': davinci(['turn'], 'Public empty-stock transition to guessing.'),
      'place-joker': davinci(['place'], 'Confirmed arrangement only.'),
      'finish-setup': davinci(['ready'], 'Confirmed setup completion.'),
      guess: davinci(['correct', 'error'], 'No pre-accepted guess cue; only published outcome.'),
      'reveal-own': davinci(['error'], 'Published failed-guess penalty reveal, never hidden tile content.'),
      stop: davinci(['turn'], 'Accepted turn end.'),
    },
    events: {
      draw: davinci(['draw'], 'Public occurrence only; hidden tile identity never changes pitch.'), arrange: davinci(['place'], 'Public rack movement.'), ready: davinci(['ready'], 'Setup ready.'),
      'skip-draw': davinci(['turn'], 'Empty stock transition.'), 'correct-guess': davinci(['correct'], 'Published success.'), 'wrong-guess': davinci(['error'], 'Published failure.'), stop: davinci(['turn'], 'Turn end.'),
    },
    variants: { result: davinci(['win', 'lose', 'event'], 'Only public match outcome; neutral event for draw, setup and tile draws never disclose identity.') },
  },
  minhwatu: {
    sources: ['minhwatu.ts', 'fourMinhwatu.ts'],
    actions: { play: hwatu(['place', 'draw', 'capture', 'special'], 'Accepted hand-card, public deck flip, matched captures, then earned yaku.'), capture: hwatu(['capture', 'special'], 'Confirmed pending public pair and any completed yaku.') },
    events: {
      deal: hwatu(['deal'], 'Only live presented deal; initial/reconnect history is suppressed.'), play: hwatu(['place'], 'Card contact.'), draw: hwatu(['draw'], 'Public draw flip contact.'),
      capture: hwatu(['capture'], 'Per-card landing offsets with bounded voices.'), special: hwatu(['special'], 'Earned positive yaku bonus uses stack triplet, not premature victory.'),
      turn: hwatu(['turn'], 'Presented next turn.'), win: hwatu(['win', 'lose', 'score'], 'Public result; score uses draw-result Foley for ties.'),
    },
    variants: { 'special:no-bonus': at([], 'hwatuCueForEvent', 'A special event without a positive earned bonus intentionally has no reward sound.', 'silent'), 'capture:stack': hwatu(['capture'], 'Multiple cards use bounded, staggered physical contacts.') },
  },
  domino: {
    sources: ['domino.ts'],
    actions: {
      play: domino(['place'], 'Accepted public tile landing.'), pass: domino(['pass'], 'Confirmed legal pass, not failed attempted placement.'),
      configure: domino(['ready'], 'Public configure event acknowledges accepted setup.'), 'next-round': domino(['event'], 'Public round-start event.'),
      'set-mode': at(['ready'], 'cueForAction', 'Legacy mode action has no guaranteed event; acknowledge only accepted completion.', 'accepted-action'),
    },
    events: {
      play: domino(['place'], 'Presented tile contact.'), pass: domino(['pass'], 'Presented pass.'), turn: domino(['turn'], 'Presented next seat.'),
      tranque: domino(['tranque'], 'Blocked-table result.'), capicua: domino(['capicua'], 'Public capicúa bonus.'), 'paso-corrido': domino(['paso'], 'All other seats passed.'), 'opening-pass': domino(['paso'], 'Public opening-pass event.'),
      'round-end': domino(['score'], 'Round tally.'), score: domino(['score'], 'Public points award.'), win: domino(['win', 'lose', 'score'], 'Viewer/team outcome.'), 'round-start': domino(['event'], 'New round.'), configure: domino(['ready'], 'Confirmed setup configuration.'),
    },
    variants: { 'play:selection': at([], 'DominoBoard', 'Selecting a candidate is not an accepted play; optional selection Foley must never announce a placement.', 'silent') },
  },
  jaipur: {
    sources: ['jaipur.ts'],
    actions: { take: jaipur(['place', 'camel', 'exchange', 'draw'], 'Exact accepted take mode determines material; refill is separately presented.'), sell: jaipur(['sell', 'coin', 'bonus'], 'Accepted sale followed by earned token and optional bonus landings.') },
    events: {
      'take-single': jaipur(['place'], 'Goods card landing.'), exchange: jaipur(['exchange'], 'Accepted reciprocal card transfer.'), 'take-camels': jaipur(['camel'], 'Herd transfer.'),
      sale: jaipur(['sell', 'coin'], 'Sale accent then money-token landing.'), 'market-refill': jaipur(['draw'], 'Only newly public market card reveal.'), bonus: jaipur(['bonus'], 'Earned bonus landing.'),
      'round-end': jaipur(['score'], 'Public round tally.'), 'round-start': jaipur(['event'], 'New round.'), win: jaipur(['win', 'lose', 'score'], 'Public viewer result.'),
    },
    variants: { 'take:single': jaipur(['place'], 'One public goods card.'), 'take:camels': jaipur(['camel'], 'All public market camels.'), 'take:exchange': jaipur(['exchange'], 'Public goods exchanged; no deck prediction.') },
  },
};

export const marbleCardCoverage: Record<string, AudioCoverage> = {
  'forced-sale': marble(['sell', 'rest'], 'Bank sale or shield/no eligible city.'),
  earthquake: marble(['crisis', 'rest'], 'Building loss or shield/no eligible building.'),
  'city-shield': marble(['ticket', 'rest'], 'Stored protection or already-held shield.'),
  'construction-grant': marble(['build', 'rest'], 'Free ordinary building or no eligible construction.'),
  'property-hunt': marble(['travel', 'step', 'arrival', 'rest'], 'Forward property search or no unowned city.'),
  'takeover-discount-pass': marble(['ticket', 'takeover'], 'Stored half-price takeover coupon; acquisition pays the existing owner.'),
  birthday: marble(['festival', 'income', 'outgoing', 'coin', 'rest'], 'Birthday collection with actual viewer cash direction.'),
  festival: marble(['festival', 'income'], 'Neighborhood festival and public cash receipt.'), lottery: marble(['income'], 'Lottery receipt.'), 'rent-rebate': marble(['income'], 'Rent reimbursement.'),
  'travel-cost': marble(['outgoing'], 'Travel expense.'), maintenance: marble(['outgoing', 'rest'], 'Actual maintenance debit or no-effect.'),
  'visit-santo-domingo': marble(['travel', 'step', 'arrival'], 'Destination travel.'), 'advance-start': marble(['travel', 'step', 'arrival', 'income'], 'Move to Start; salary only if publicly awarded.'), retreat: marble(['move', 'step', 'arrival'], 'Backward movement, not a forward salary.'),
  'go-to-island': marble(['jail', 'step', 'arrival'], 'Travel to confinement.'), 'escape-pass': marble(['ticket'], 'Escape card acquisition/use.'), 'train-ticket': marble(['ticket', 'travel'], 'Ticket acquisition followed by travel only when used.'),
  'city-dividend': marble(['income', 'rest'], 'Public per-city dividend or no-effect.'), 'monopoly-warning': marble(['warning', 'outgoing', 'rest'], 'Warning and actual assessed payment, or no-effect.'),
  'city-festival': marble(['festival', 'rest'], 'Confirmed selected-city festival or no eligible city.'), blackout: marble(['blackout', 'rest'], 'Confirmed blackout or no eligible city.'), 'rent-pass': marble(['ticket'], 'Rent-pass acquisition/use.'),
};

export const excludedAudioGames: Partial<Record<GameId, string>> = { rhythm: 'Explicitly excluded: existing rhythm audio is unchanged.', catchmind: 'Explicitly excluded: existing drawing/answer audio is unchanged.' };
