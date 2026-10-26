import type { GameAction, GameId, PlayerId } from '../core/types';
import { chooseDominoBotAction } from './domino';
import { chooseDavinciGuess } from './davinciAi';
import { minhwatuYakuProgress } from './minhwatu';
import { classicMarbleCityToll, classicMarbleReferenceProfile } from './marble-reference-profile';
import { classicMarbleIslandCount, classicMarbleTourismRent } from './marble-tourism-selector';
import { marbleRentAtStage } from './marble-economy';

export const aiGameIds = ['davinci', 'domino', 'jaipur', 'splendor', 'minhwatu', 'marble'] as const;
// Leave time for the existing capture and dice sequences before the next computer action.
export const aiTurnDelay = (game: GameId) => game === 'minhwatu' ? 2800 : game === 'marble' ? 2400 : 700;
export const supportsAi = (id: GameId) => (aiGameIds as readonly GameId[]).includes(id);

// Only the player's filtered view enters the policy; hidden hands and decks never do.
export function chooseSimpleAiAction(game: GameId, view: any, player: PlayerId, random = Math.random): GameAction | null {
  if (!supportsAi(game) || view?.result) return null;
  const actions: GameAction[] = (view?.actions ?? []).map((option: any) => option.action)
    .filter((action: GameAction) => !['configure', 'set-mode', 'next-round'].includes(action.type))
    .filter((action: GameAction) => game !== 'jaipur' || action.payload?.mode !== 'exchange' || !(action.payload.handIndices as number[]).some(i => (action.payload!.marketIndices as number[]).some(j => view.ownHand[i] === view.board.market[j])));
  if (!actions.length) return null;
  const pick = (options: GameAction[]) => options[Math.min(options.length - 1, Math.floor(random() * options.length))];
  if (game === 'domino') {
    const chosen = chooseDominoBotAction(view.hand, view.board.tiles, view.board.ends, view.settings.difficulty ?? 'hard', {
      actor: player, mode: view.mode, round: view.round, rulesVersion: view.board.rulesVersion,
      counts: view.board.counts, log: view.log, tranqueRule: view.settings.tranqueRule,
    });
    return actions.find(a => a.type === chosen.type && JSON.stringify(a.payload) === JSON.stringify(chosen.payload)) ?? actions[0];
  }
  if (game === 'davinci') {
    const guesses = actions.filter(a => a.type === 'guess');
    if (!guesses.length) return actions[0].type === 'reveal-own' ? pick(actions) : actions[0];
    return chooseDavinciGuess(view, player, guesses, random);
  }
  const score = (action: GameAction): number => {
    const x = action.payload ?? {};
    if (game === 'jaipur') {
      const hand: string[] = view.ownHand;
      const value = (good: string) => Number(view.board.piles[good]?.[0]) || 1;
      const bonus = (count: number) => count >= 3 && view.board.bonusTileCounts[Math.min(count,5)] > 0 ? count >= 5 ? 9 : count === 4 ? 5 : 2 : 0;
      const potential = (cards: string[]) => [...new Set(cards)].reduce((total, good) => {
        const count = cards.filter(g => g === good).length;
        const minimum = ['diamond','gold','silver'].includes(good) ? 2 : 1;
        return total + Math.min(count, view.board.piles[good].length) * value(good) * (count < minimum ? .35 : 1) + (count >= 3 ? bonus(count) : count * .7);
      }, 0);
      if (action.type === 'sell') {
        const count = Number(x.count), good = String(x.good), remaining = [...hand];
        for(let i=0;i<count;i++)remaining.splice(remaining.indexOf(good),1);
        const pile = view.board.piles[good];
        const sale = Array.from({length: Math.min(count,pile.length)}, (_,i) => Math.max(1,value(good)-i*.6)).reduce((a,b)=>a+b,0) + bonus(count);
        return sale + .65 * (potential(remaining)-potential(hand)) + (view.board.deckCount < 8 ? count : 0);
      }
      if (x.mode === 'single') return potential([...hand, view.board.market[(x.indices as number[])[0]]])-potential(hand);
      if (x.mode === 'camels') return 1 + view.board.market.filter((g: string) => g === 'camel').length * .5 + (view.board.herdCounts[player] <= view.board.herdCounts[player==='p1'?'p2':'p1'] ? 1 : 0);
      const given = x.handIndices as number[], received = (x.marketIndices as number[]).map(i=>view.board.market[i]);
      return potential([...hand.filter((_,i)=>!given.includes(i)),...received])-potential(hand)-1;

    }
    if (game === 'minhwatu') {
      const card = action.type === 'capture' ? view.board.pendingCard : view.hand[Number(x.index)];
      const taken = view.board.table.filter((t: any, i: number) => t.month === card.month && (x.targetIndex === undefined || i === x.targetIndex));
      const worth = (t: any) => ({ bright: 20, animal: 10, ribbon: 5, plain: 1 }[String(t.kind)] ?? 0);
      const captures = view.board.captures[player];
      const before = minhwatuYakuProgress(captures), after = minhwatuYakuProgress([...captures, card, ...taken]);
      const combo = after.reduce((n, y, i) => n + (y.have > before[i].have ? y.bonus * (y.complete ? 2 : y.have / y.need * .5) : 0), 0);
      return taken.length ? taken.reduce((n: number, t: any) => n + worth(t), worth(card)) + combo : -worth(card);
    }
    if (game === 'marble') {
      const money = view.ownHand.money;
      const tiles = view.board.tiles as any[], opponent = player === 'p1' ? 'p2' : 'p1';
      const rent = (tile: any) => tile.referenceProfileId === classicMarbleReferenceProfile.id
        ? tile.kind === 'property' ? classicMarbleCityToll(tile.referenceCity ?? tile.name?.ko, tile.buildings) ?? 0 : Number(tile.currentToll ?? 0)
        : marbleRentAtStage(tile.rent ?? 0, tile.houses ?? 0, view.board.economicVersion, view.board.version === 2, tile.rentMultipliers, tile.monopolyMultiplier ?? 1);
      const risk = tiles.reduce((total, tile, index) => {
        const distance = (index - view.ownHand.position + tiles.length) % tiles.length;
        return total + (tile.owner === opponent && distance >= 2 && distance <= 12 ? rent(tile) * (6-Math.abs(7-distance))/36 : 0);
      }, 0);
      const reserve = Math.max(200, risk * 2 + 100);
      if (action.type === 'buy') { const tile = tiles[view.ownHand.position], group = tiles.filter(t => t.group === tile.group && t.kind === 'property'), expectedRent = tile.kind === 'tourism' ? classicMarbleTourismRent(tile.name?.ko, { ownerTourismCount: classicMarbleIslandCount(tiles.filter(t => t.kind === 'tourism' && t.owner === player).map(t => t.name?.ko)), beachVisitStage: Number(view.board.tourismVisitStages?.[String(view.ownHand.position)] ?? 1), visitorPosition: view.ownHand.position, landingIndex: view.ownHand.position }).amount ?? 0 : rent(tile); return money - tile.price >= reserve ? 30 + (tile.group ? group.filter(t=>t.owner===player).length * 5 : 0) + expectedRent / Math.max(1, Number(tile.price)) * 20 : -1; }
      if (action.type === 'takeover') { const tile = tiles[Number(x.tile)], cost = view.board.takeoverOffer?.price; return cost != null && money - cost >= reserve ? 15 + tile.houses * 3 : -5; }
      if (action.type === 'build') { const tile = tiles[Number(x.tile)], distance = (Number(x.tile)-view.board.positions[opponent]+tiles.length)%tiles.length; const chance = distance>=2&&distance<=12 ? (6-Math.abs(7-distance))/36 : .02;
        if (tile.referenceProfileId === classicMarbleReferenceProfile.id) {
          const option = (tile.nextBuildOptions ?? []).find((item: any) => item.structure === x.structure), cost = option?.cost ?? Infinity;
          const after = classicMarbleCityToll(tile.referenceCity ?? tile.name?.ko, { ...(tile.buildings ?? {}), [String(x.structure)]: true });
          const before = classicMarbleCityToll(tile.referenceCity ?? tile.name?.ko, tile.buildings);
          return money - cost >= reserve && after !== null && before !== null ? 10 + (after-before) / cost * (1+chance*10) : -1;
        }
        return money - tile.nextBuildCost >= reserve ? 10 + (tile.nextRent-rent(tile)) / tile.nextBuildCost * (1+chance*10) : -1;
      }
      if (action.type === 'sell-property') { const tile = tiles[Number(x.tile)]; return -20 - rent(tile) - (view.board.monopolies[player].includes(tile.group) ? 200 : 0); }
      if (action.type === 'borrow') return view.phase === 'debt' ? 10 : -10;
      if (action.type === 'repay') return money > 700 ? 12 : -5;
      if (action.type === 'choose-pawn') return -20;
      if (action.type === 'choose-train') { const tile = view.board.tiles[Number(x.destination)]; return !tile.owner && money > (tile.price ?? 0) + 400 ? 8 : -2; }
      if (action.type === 'use-rent-pass') return view.board.pendingRent.amount > 100 || money-view.board.pendingRent.amount < reserve ? 40 : -1;
      if (action.type === 'use-escape-pass') return 40;
      if (action.type === 'choose-event-city') { const tile = view.board.tiles[Number(x.tile)]; return (tile.nextRent ?? tile.rent ?? 0) + tile.houses * 100; }
      return 0;
    }
    const { tokens, bonuses, reserved } = view.ownHand;
    const colors = ['white', 'blue', 'green', 'red', 'black'];
    const market = Object.values(view.board.market).flat() as any[];
    const cards = [...reserved, ...market];
    const deficit = (card: any, wallet: any) => Math.max(0, colors.reduce((n, g) => n + Math.max(0, card.cost[g] - bonuses[g] - wallet[g]), 0) - wallet.gold);
    const target = cards.reduce((best, card) => deficit(card, tokens) - card.points * .3 < deficit(best, tokens) - best.points * .3 ? card : best, cards[0]);
    if (action.type === 'chooseNoble') return 100;
    if (action.type === 'buy') { const card = x.source === 'reserved' ? reserved[Number(x.index)] : view.board.market[Number(x.tier)][Number(x.index)]; const nobleValue = Math.max(0, ...(Object.values(view.board.nobles) as any[]).map(n => n.requirement[card.bonus] > bonuses[card.bonus] ? 8 / (1 + colors.reduce((sum,g)=>sum+Math.max(0,(n.requirement[g]??0)-bonuses[g]),0)) : 0)); return 50 + card.points * 10 + nobleValue + (bonuses[card.bonus] < 4 ? 3 : 0); }
    const wallet = { ...tokens };
    if (action.type === 'take') for (const g of x.gems as string[]) wallet[g]++;
    if (action.type === 'takeTwo') wallet[String(x.gem)] += 2;
    if (action.type === 'reserve' && view.board.bank.gold) wallet.gold++;
    for (const [g, count] of Object.entries(x.returnTokens ?? {})) wallet[g] -= Number(count);
    const progress = deficit(target, tokens) - deficit(target, wallet);
    if (action.type === 'reserve') return x.index !== undefined && view.board.market[Number(x.tier)][Number(x.index)].id === target.id && !reserved.length ? progress * 5 + 1 : -5;
    return progress * 5 + colors.reduce((n, g) => n + Math.min(wallet[g], Math.max(0, target.cost[g] - bonuses[g])) * .1, 0);
  };
  let best = -Infinity, choices: GameAction[] = [];
  for (const action of actions) {
    const value = score(action);
    if (value > best) { best = value; choices = [action]; }
    else if (value === best) choices.push(action);
  }
  return pick(choices);
}
