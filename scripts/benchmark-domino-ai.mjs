import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { performance } from 'node:perf_hooks';

const seeds = Number(process.argv.find(value => value.startsWith('--seeds='))?.split('=')[1] ?? 100);
const seedStart = Number(process.argv.find(value => value.startsWith('--seed-start='))?.split('=')[1] ?? 1);
assert(Number.isInteger(seeds) && seeds >= 100, '--seeds must be an integer of at least 100 for paired comparisons');
assert(Number.isSafeInteger(seedStart) && seedStart >= 1, '--seed-start must be a positive safe integer');
assert(Number.isSafeInteger(seedStart + seeds - 1), 'seed range must remain within safe integer precision');

const [{ outputFiles }] = await Promise.all([build({
  entryPoints: ['src/games/domino.ts'], bundle: true, format: 'esm', platform: 'node', write: false,
  plugins: [{ name: 'benchmark-only-transition-export', setup(buildApi) {
    buildApi.onLoad({ filter: /[\\/]src[\\/]games[\\/]domino\.ts$/ }, async args => ({
      contents: `${await readFile(args.path, 'utf8')}\nexport { play as benchmarkPlay };`,
      loader: 'ts', resolveDir: dirname(args.path),
    }));
  } }],
})]);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`;
const { chooseDominoBotAction, dominoEngine, benchmarkPlay } = await import(moduleUrl);

const seatsFor = mode => mode === '1v1' ? ['p1', 'p2'] : ['p1', 'b1', 'p2', 'b2'];
const fits = (tile, pip) => tile.a === pip || tile.b === pip;

// Frozen pre-upgrade policy: the old normal/high-pip and hard/support heuristics.
function oldDominoAction(hand, board, ends, difficulty = 'normal', publicContext = {}) {
  const playable = hand.flatMap((tile, index) => ['left', 'right']
    .filter(side => !ends || (side === 'left' ? fits(tile, ends.left) : fits(tile, ends.right)))
    .map(side => ({ tile, index, side })));
  if (!playable.length) return { type: 'pass' };
  if (difficulty !== 'easy') {
    const rank = item => {
      const { tile, index, side } = item;
      const pips = tile.a + tile.b;
      if (difficulty === 'normal' || !ends) return pips;
      const outer = side === 'left' ? tile.a === ends.left ? tile.b : tile.a : tile.a === ends.right ? tile.b : tile.a;
      const after = side === 'left' ? [outer, ends.right] : [ends.left, outer];
      const remaining = hand.filter((_, i) => i !== index);
      const support = after.reduce((total, pip) => total + remaining.filter(candidate => fits(candidate, pip)).length, 0);
      const seen = board.filter(placed => fits(placed, outer)).length + hand.filter(candidate => fits(candidate, outer)).length;
      const unsupported = after.filter(pip => !remaining.some(candidate => fits(candidate, pip))).length;
      return pips + support * 6 - unsupported * 5 + Math.min(seen, 7) * (publicContext.passes ? 2 : 1);
    };
    playable.sort((a, b) => rank(b) - rank(a) || Number(b.tile.a === b.tile.b) - Number(a.tile.a === a.tile.b) || a.index - b.index);
  }
  return { type: 'play', payload: { index: playable[0].index, side: playable[0].side } };
}

function publicContext(state, actor) {
  const counts = Object.fromEntries(seatsFor(state.mode).map(seat => [seat, state.hands[seat].length]));
  return { actor, mode: state.mode, passes: state.passes, counts, log: state.log ?? [], tranqueRule: state.settings?.tranqueRule };
}

function openingAction(state, actor) {
  const index = state.hands[actor].findIndex(tile => tile.a === state.opening.tile.a && tile.b === state.opening.tile.b);
  assert(index >= 0, 'opening tile must be in the opening player hand');
  return { type: 'play', payload: { index, side: 'left' } };
}

function decide(state, actor, difficulty, policy) {
  // The opening rule is enforced by the engine wrapper before the utility chooser runs.
  if (!state.board.length && actor === state.opening.player) return { action: openingAction(state, actor), chooserMs: 0 };
  const ownHand = state.hands[actor].map(tile => ({ a: tile.a, b: tile.b }));
  const publicBoard = state.board.map(tile => ({ ...tile }));
  const ends = state.ends ? { ...state.ends } : null;
  const started = performance.now();
  const action = policy(ownHand, publicBoard, ends, difficulty, publicContext(state, actor));
  return { action, chooserMs: performance.now() - started };
}

function runOneVOne(seed, candidateSeat, candidateDifficulty, candidatePolicy, baselineDifficulty, baselinePolicy) {
  let state = dominoEngine.createInitialState(seed);
  let moves = 0, passes = 0;
  const candidateChooserMs = [], baselineChooserMs = [];
  while (!state.result && moves + passes < 80) {
    const actor = state.turn;
    const isCandidate = actor === candidateSeat;
    const decision = decide(state, actor, isCandidate ? candidateDifficulty : baselineDifficulty, isCandidate ? candidatePolicy : baselinePolicy);
    const { action } = decision;
    (isCandidate ? candidateChooserMs : baselineChooserMs).push(decision.chooserMs);
    assert.equal(dominoEngine.validateAction(state, actor, action), null, `illegal ${actor} action at seed ${seed}`);
    if (action.type === 'pass') passes += 1; else moves += 1;
    state = dominoEngine.applyAction(state, actor, action);
  }
  assert(state.result, `1v1 hand did not terminate within 80 actions (seed ${seed})`);
  return { winner: state.result.winner, moves, passes, candidateChooserMs, baselineChooserMs };
}

function runTeamSelfPlay(seed, mode, difficulty) {
  let state = dominoEngine.createInitialState(seed);
  state = dominoEngine.applyAction(state, 'p1', { type: 'configure', payload: { mode, difficulty, targetScore: 0 } });
  let humanActions = 0;
  const chooserTimes = [];
  for (let actionCount = 0; !state.result && actionCount < 160; actionCount += 1) {
    const actor = state.turn;
    if (actor === 'b1' || actor === 'b2') {
      throw new Error(`bot turn escaped the engine runner (seed ${seed}, ${mode})`);
    }
    const decision = decide(state, actor, difficulty, chooseDominoBotAction);
    const action = decision.action;
    assert.equal(dominoEngine.validateAction(state, actor, action), null, `illegal ${actor} action in ${mode} seed ${seed}`);
    humanActions += 1;
    chooserTimes.push(decision.chooserMs);
    state = dominoEngine.applyAction(state, actor, action);
  }
  assert(state.result, `${mode} hand did not terminate within 160 actions (seed ${seed})`);
  return { result: state.result.winner, humanActions, chooserTimes };
}

function teamOf(seat, mode) {
  if (mode === 'partners') return seat === 'p1' || seat === 'b1' ? 'p1' : 'p2';
  return seat === 'p1' || seat === 'p2' ? 'p1' : 'p2';
}

function fourSeatInitial(seed, mode) {
  const state = dominoEngine.createInitialState(seed);
  const hands = { ...state.hands, b1: state.stock.slice(0, 7), b2: state.stock.slice(7, 14) };
  const openingRank = tile => tile.a === tile.b ? 100 + tile.a : tile.a + tile.b;
  const opening = Object.entries(hands).flatMap(([seat, hand]) => hand.map(tile => ({ seat, tile, rank: openingRank(tile) })))
    .sort((a, b) => b.rank - a.rank)[0];
  state.mode = mode;
  state.hands = hands;
  state.stock = [];
  state.opening = { player: opening.seat, tile: opening.tile };
  state.turn = opening.seat;
  return state;
}

function isEngineLegal(state, actor, action) {
  const view = dominoEngine.getPlayerView(state, actor);
  return view.actions.some(({ action: allowed }) => allowed.type === action.type &&
    (action.type !== 'play' || (allowed.payload?.index === action.payload?.index && allowed.payload?.side === action.payload?.side)));
}

function runFourSeatPair(seed, mode, candidateTeam, difficulty, candidatePolicy = chooseDominoBotAction, baselineDifficulty = 'hard', baselinePolicy = oldDominoAction) {
  let state = fourSeatInitial(seed, mode);
  let actions = 0;
  const candidateChooserMs = [], baselineChooserMs = [];
  while (!state.result && actions < 128) {
    const actor = state.turn;
    const isCandidate = teamOf(actor, mode) === candidateTeam;
    const decision = decide(state, actor, isCandidate ? difficulty : baselineDifficulty, isCandidate ? candidatePolicy : baselinePolicy);
    assert(isEngineLegal(state, actor, decision.action), `illegal ${actor} action in ${mode}, seed ${seed}`);
    (isCandidate ? candidateChooserMs : baselineChooserMs).push(decision.chooserMs);
    state = benchmarkPlay(state, actor, decision.action);
    actions += 1;
  }
  assert(state.result, `${mode} paired hand did not terminate within 128 actions (seed ${seed})`);
  return { winner: state.result.winner === 'draw' ? 'draw' : state.result.winner === candidateTeam ? 'candidate' : 'baseline', actions, candidateChooserMs, baselineChooserMs };
}

function summarize(rows) {
  const candidateWins = rows.filter(row => row.winner === 'candidate').length;
  const baselineWins = rows.filter(row => row.winner === 'baseline').length;
  const draws = rows.length - candidateWins - baselineWins;
  return { pairedGames: rows.length, candidateWins, baselineWins, draws, candidateWinRate: candidateWins / rows.length, decisiveWinRate: candidateWins / Math.max(1, candidateWins + baselineWins) };
}
function timing(times) {
  return {
    chooserCalls: times.length,
    meanChooserMs: Number((times.reduce((sum, value) => sum + value, 0) / Math.max(1, times.length)).toFixed(5)),
    maxChooserMs: Number(Math.max(0, ...times).toFixed(5)),
  };
}

const comparisons = {};
for (const [name, candidateDifficulty, baselineDifficulty] of [['normal', 'normal', 'normal'], ['hard', 'hard', 'hard'], ['hard-vs-old-normal', 'hard', 'normal']]) {
  const rows = [], candidateTimes = [], baselineTimes = [];
  const start = performance.now();
  for (let seed = seedStart; seed < seedStart + seeds; seed += 1) {
    for (const candidateSeat of ['p1', 'p2']) {
      const result = runOneVOne(seed, candidateSeat, candidateDifficulty, chooseDominoBotAction, baselineDifficulty, oldDominoAction);
      const winner = result.winner === candidateSeat ? 'candidate' : result.winner === 'draw' ? 'draw' : 'baseline';
      rows.push({ seed, candidateSeat, winner, moves: result.moves, passes: result.passes });
      candidateTimes.push(...result.candidateChooserMs);
      baselineTimes.push(...result.baselineChooserMs);
    }
  }
  comparisons[name] = { ...summarize(rows), candidate: timing(candidateTimes), frozenBaseline: timing(baselineTimes), elapsedMs: Number((performance.now() - start).toFixed(2)), seedStart, seedEnd: seedStart + seeds - 1, seedPairs: seeds };
}

const difficultyRows = [];
const candidateHard = (hand, board, ends, _difficulty, context) => chooseDominoBotAction(hand, board, ends, 'hard', context);
const candidateNormal = (hand, board, ends, _difficulty, context) => chooseDominoBotAction(hand, board, ends, 'normal', context);
const difficultyStart = performance.now();
const hardTimes = [], normalTimes = [];
for (let seed = seedStart; seed < seedStart + seeds; seed += 1) {
  for (const candidateSeat of ['p1', 'p2']) {
    const result = runOneVOne(seed, candidateSeat, 'hard', candidateHard, 'normal', candidateNormal);
    const winner = result.winner === candidateSeat ? 'candidate' : result.winner === 'draw' ? 'draw' : 'baseline';
    difficultyRows.push({ seed, candidateSeat, winner, moves: result.moves, passes: result.passes });
    hardTimes.push(...result.candidateChooserMs);
    normalTimes.push(...result.baselineChooserMs);
  }
}
comparisons['candidate-hard-vs-normal'] = { ...summarize(difficultyRows), candidate: timing(hardTimes), baseline: timing(normalTimes), elapsedMs: Number((performance.now() - difficultyStart).toFixed(2)), seedStart, seedEnd: seedStart + seeds - 1, seedPairs: seeds };

const fourSeatPaired = {};
const fourSeatStart = performance.now();
for (const mode of ['humans-vs-bots', 'partners']) {
  const rows = [], candidateTimes = [], baselineTimes = [];
  for (let seed = seedStart; seed < seedStart + seeds; seed += 1) {
    for (const candidateTeam of ['p1', 'p2']) {
      const result = runFourSeatPair(seed, mode, candidateTeam, 'hard');
      rows.push({ seed, candidateTeam, winner: result.winner, actions: result.actions });
      candidateTimes.push(...result.candidateChooserMs);
      baselineTimes.push(...result.baselineChooserMs);
    }
  }
  fourSeatPaired[mode] = { ...summarize(rows), candidate: timing(candidateTimes), frozenBaseline: timing(baselineTimes), seedStart, seedEnd: seedStart + seeds - 1, seedPairs: seeds };
}

const fourSeatDifficultyComparison = {};
for (const mode of ['humans-vs-bots', 'partners']) {
  const rows = [], hardTimes = [], normalTimes = [];
  for (let seed = seedStart; seed < seedStart + seeds; seed += 1) {
    for (const candidateTeam of ['p1', 'p2']) {
      const result = runFourSeatPair(seed, mode, candidateTeam, 'hard', candidateHard, 'normal', candidateNormal);
      rows.push({ seed, candidateTeam, winner: result.winner, actions: result.actions });
      hardTimes.push(...result.candidateChooserMs);
      normalTimes.push(...result.baselineChooserMs);
    }
  }
  fourSeatDifficultyComparison[mode] = { ...summarize(rows), hard: timing(hardTimes), normal: timing(normalTimes), seedStart, seedEnd: seedStart + seeds - 1, seedPairs: seeds };
}

const teamSelfPlay = {};
const teamStart = performance.now();
const teamSeeds = Math.max(100, Math.min(seeds, 200));
for (const mode of ['humans-vs-bots', 'partners']) {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    let totalActions = 0;
    const chooserTimes = [];
    const modeStart = performance.now();
    for (let seed = seedStart; seed < seedStart + teamSeeds; seed += 1) {
      const result = runTeamSelfPlay(seed, mode, difficulty);
      totalActions += result.humanActions;
      chooserTimes.push(...result.chooserTimes);
    }
    teamSelfPlay[`${mode}:${difficulty}`] = { terminalGames: teamSeeds, meanHumanActions: Number((totalActions / teamSeeds).toFixed(2)), measuredHumanChooser: timing(chooserTimes), elapsedMs: Number((performance.now() - modeStart).toFixed(2)) };
  }
}

console.log(JSON.stringify({
  purpose: 'paired Domino chooser benchmark; results are descriptive and do not establish a production-strength claim by themselves',
  candidate: 'src/games/domino.ts chooseDominoBotAction',
  baseline: 'frozen pre-upgrade normal and hard chooser logic in this script',
  comparison: 'same deal seed, candidate/baseline seats swapped; engine owns state, validates and resolves actions',
  decisionBoundary: 'chooser receives only its own hand, public board/ends, difficulty, and public actor/mode/pass/count/log context',
  seedStart,
  seedEnd: seedStart + seeds - 1,
  seeds,
  comparisons,
  fourSeatPolicyComparison: 'synthetic paired team match: the benchmark exposes the engine pure play transition in-memory, selects all four seats through the same chooser boundary, and checks every selected action against engine player-view legal actions. No production export or source file is changed.',
  fourSeatPaired,
  fourSeatDifficultyComparison,
  teamSelfPlay: { seedCountPerModeDifficulty: teamSeeds, elapsedMs: Number((performance.now() - teamStart).toFixed(2)), seedStart, seedEnd: seedStart + teamSeeds - 1, ...teamSelfPlay },
}, null, 2));
