import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { audioCoverage, contextualGames, excludedAudioGames, marbleCardCoverage } from './coverage';
import { marbleEventAudio } from './marble-audio';
import { splendorOpponentCues } from './public-audio';
import { dominoCueForEvent } from '../app/domino-motion';
import { jaipurCuesForEvent } from '../app/jaipur-motion';
import { hwatuCueForEvent } from '../app/hwatu-motion';

const parse = (source: string) => ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
const read = (file: string) => readFileSync(file, 'utf8');
const literals = (node: ts.Node | undefined): string[] => {
  if (!node) return [];
  if (ts.isStringLiteral(node)) return [node.text];
  if (ts.isConditionalExpression(node)) return [...literals(node.whenTrue), ...literals(node.whenFalse)];
  if (ts.isArrayLiteralExpression(node)) return node.elements.flatMap(literals);
  if (ts.isLiteralTypeNode(node)) return literals(node.literal);
  if (ts.isUnionTypeNode(node)) return node.types.flatMap(literals);
  if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) return literals(node.expression);
  return [];
};
const sorted = (items: Iterable<string>) => [...new Set(items)].sort();
function actionTypes(source: string): string[] {
  const file = parse(source), found = new Set<string>();
  const actionType = (node: ts.Node) => ts.isPropertyAccessExpression(node) && node.name.text === 'type' && ts.isIdentifier(node.expression) && ['a', 'action'].includes(node.expression.text);
  const add = (node: ts.Node | undefined) => literals(node).forEach(value => found.add(value));
  const actionObject = (node: ts.Node) => {
    if (ts.isObjectLiteralExpression(node)) for (const property of node.properties) {
      if (ts.isPropertyAssignment(property) && property.name.getText(file) === 'type') add(property.initializer);
    }
  };
  const visit = (node: ts.Node) => {
    if (ts.isBinaryExpression(node)) { if (actionType(node.left)) add(node.right); if (actionType(node.right)) add(node.left); }
    if (ts.isSwitchStatement(node) && actionType(node.expression)) for (const clause of node.caseBlock.clauses) if (ts.isCaseClause(clause)) add(clause.expression);
    if (ts.isCallExpression(node)) {
      if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'includes' && node.arguments.some(actionType)) add(node.expression.expression);
      // Only action constructors, never unrelated event/card objects with a `type` field.
      if (ts.isIdentifier(node.expression) && ['add', 'actionLabel', 'label'].includes(node.expression.text)) {
        node.arguments.forEach(actionObject);
        if (node.expression.text === 'add') add(node.arguments[2]); // fourMarble's add(ko, es, type, payload)
      }
    }
    if (ts.isPropertyAssignment(node) && node.name.getText(file) === 'action') actionObject(node.initializer);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return sorted(found);
}
function eventTypes(source: string): string[] {
  const file = parse(source), found = new Set<string>();
  const visit = (node: ts.Node) => {
    if ((ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) && /Event$/.test(node.name.text)) {
      const members = ts.isInterfaceDeclaration(node) ? node.members : ts.isTypeLiteralNode(node.type) ? node.type.members : [];
      for (const member of members) if (ts.isPropertySignature(member) && member.name.getText(file) === 'type') literals(member.type).forEach(value => found.add(value));
    }
    // FourMarble intentionally has an open string event type; inspect actual emitter calls too.
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'emit') literals(node.arguments[1]).forEach(value => found.add(value));
    ts.forEachChild(node, visit);
  };
  visit(file);
  return sorted(found);
}
function namedUnion(source: string, name: string): string[] {
  const file = parse(source);
  return file.statements.flatMap(node => ts.isTypeAliasDeclaration(node) && node.name.text === name ? literals(node.type) : []);
}

describe('complete contextual audio inventory', () => {
  it('covers exactly the six requested games, preserving both exclusions', () => {
    expect(sorted(Object.keys(audioCoverage))).toEqual(sorted(contextualGames));
    expect(sorted(Object.keys(excludedAudioGames))).toEqual(['catchmind', 'rhythm']);
  });

  for (const game of contextualGames) it(`${game}: every accepted action and public event is explicitly covered`, () => {
    const coverage = audioCoverage[game];
    const sources = coverage.sources.map(file => read(`src/games/${file}`));
    // Strict equality also rejects stale entries masquerading as supported actions.
    expect(sorted(sources.flatMap(actionTypes))).toEqual(sorted(Object.keys(coverage.actions)));
    expect(sorted(sources.flatMap(eventTypes))).toEqual(sorted(Object.keys(coverage.events)));
  });

  it('detects action additions through comparisons, includes, switch, literal objects and dynamic add helpers without treating events as actions', () => {
    const fixture = `if (a.type === 'new-action') {} if (action.type !== 'guarded') {} ['one','two'].includes(a.type); switch(action.type) {case 'switch-action': break;} label('ko','es',{type:'literal'}); add('ko','es','dynamic'); const choice={action:{type:'wrapped'}}; const event={type:'not-an-action'}; emit(state,'also-not-action');`;
    expect(actionTypes(fixture)).toEqual(['dynamic', 'guarded', 'literal', 'new-action', 'one', 'switch-action', 'two', 'wrapped']);
    expect(eventTypes(`interface ActionEvent {type:'alpha'|'beta'}; emit(s, cond ? 'gamma' : 'delta');`)).toEqual(['alpha', 'beta', 'delta', 'gamma']);
  });

  it('covers all twenty-two card IDs from both Marble engines', () => {
    expect(sorted(namedUnion(read('src/games/marble.ts'), 'MarbleEventId'))).toEqual(sorted(Object.keys(marbleCardCoverage)));
    const source = parse(read('src/games/fourMarble.ts'));
    const declared: string[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) && ['eventIds','expandedEventIds'].includes(node.name.getText(source))) declared.push(...literals(node.initializer));
      ts.forEachChild(node, visit);
    };
    visit(source);
    expect(sorted(declared)).toEqual(sorted(Object.keys(marbleCardCoverage)));
    expect(declared).toHaveLength(23);
  });

  it('covers every Jaipur take mode, not only the shared take action name', () => {
    const file = parse(read('src/games/jaipur.ts')), modes: string[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isBinaryExpression(node) && node.left.getText(file) === 'mode') modes.push(...literals(node.right));
      ts.forEachChild(node, visit);
    };
    visit(file);
    expect(sorted(modes.map(mode => `take:${mode}`))).toEqual(sorted(Object.keys(audioCoverage.jaipur.variants)));
  });

  it('uses real cue IDs and explains every owner, clock and intentional silence', () => {
    const cues = new Set([...namedUnion(read('src/audio/audio.ts'), 'AudioCue'), ...namedUnion(read('src/audio/contextual.ts'), 'ContextualCue')]);
    const entries = [...Object.values(audioCoverage).flatMap(game => [...Object.values(game.actions), ...Object.values(game.events), ...Object.values(game.variants)]), ...Object.values(marbleCardCoverage)];
    for (const entry of entries) {
      expect(entry.owner.length).toBeGreaterThan(5); expect(entry.reason.length).toBeGreaterThan(7);
      expect(['presented-event', 'accepted-action', 'public-delta', 'silent']).toContain(entry.clock);
      expect(entry.clock === 'silent' ? entry.cues.length === 0 : entry.cues.length > 0).toBe(true);
      for (const cue of entry.cues) expect(cues.has(cue), cue).toBe(true);
    }
  });

  it('matches live dispatchers for all public event types and card resolutions', () => {
    for (const [type, coverage] of Object.entries(audioCoverage.marble.events)) for (const cue of marbleEventAudio({ type, sequence: 1 })) expect(coverage.cues).toContain(cue);
    expect(marbleEventAudio({ type: 'salary', sequence: 1, moneyDelta: { p1: 200 } })).toEqual(['income']);
    for (const [cardId, coverage] of Object.entries(marbleCardCoverage)) for (const cue of marbleEventAudio({ type: 'event-card', sequence: 1, cardId })) expect(coverage.cues).toContain(cue);
    for (const cardId of ['city-festival', 'blackout', 'train-ticket']) expect(marbleEventAudio({ type: 'event-card', sequence: 1, cardId, cardOutcome: 'pending-choice' })).toEqual(['ready']);
    for (const [type, coverage] of Object.entries(audioCoverage.domino.events)) { const cue = dominoCueForEvent({ type }); if (cue) expect(coverage.cues).toContain(cue); }
    for (const [type, coverage] of Object.entries(audioCoverage.jaipur.events)) for (const cue of jaipurCuesForEvent({ type: type as Parameters<typeof jaipurCuesForEvent>[0]['type'], sequence: 1, round: 1, title: { ko: '', es: '' } })) expect(coverage.cues).toContain(cue);
    for (const [type, coverage] of Object.entries(audioCoverage.minhwatu.events)) { const cue = hwatuCueForEvent({ type: type as Parameters<typeof hwatuCueForEvent>[0]['type'], sequence: 1, title: { ko: '', es: '' } }, 'p1'); if (cue) expect(coverage.cues).toContain(cue); }
  });

  it('does not derive reservation or card-draw audio from hidden identities', () => {
    const before = { turn: 'p2', board: { reservedOpponentCount: 0, bank: { gold: 5 } } };
    const after = { turn: 'p1', board: { reservedOpponentCount: 1, bank: { gold: 4 } } };
    expect(splendorOpponentCues(before, { ...after, hiddenDeck: ['rare'], opponentHand: ['secret-a'] }, 'p1')).toEqual(['place']);
    expect(splendorOpponentCues(before, { ...after, hiddenDeck: ['common'], opponentHand: ['secret-b'] }, 'p1')).toEqual(['place']);
    for (const cardId of Object.keys(marbleCardCoverage)) expect(marbleEventAudio({ type: 'event-card', sequence: 1, cardPhase: 'draw', cardId })).toEqual(['key-draw']);
  });
});
