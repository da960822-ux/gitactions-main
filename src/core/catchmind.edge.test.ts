import { build } from 'esbuild';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { catchmindEngine } from '../games/catchmind';
import { dominoEngine } from '../games/domino';

// Runs the actual Edge handler with a CAS database double; real SQL/RLS is covered in database.test.ts.
let code: string;
beforeAll(async () => {
  const result = await build({ entryPoints: ['supabase/functions/action/index.ts'], bundle: true, write: false, format: 'iife', platform: 'node', plugins: [{ name: 'edge-test-imports', setup(builder) {
    builder.onResolve({ filter: /^npm:/ }, () => ({ path: 'supabase-double', namespace: 'test' }));
    builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const createClient = () => globalThis.testDB;', loader: 'js' }));
    builder.onResolve({ filter: /_shared\/engines\.js$/ }, () => ({ path: resolve('src/core/server.ts') }));
  } }] });
  code = result.outputFiles[0].text;
});
afterEach(() => vi.restoreAllMocks());

function fixture(gameId:'catchmind'|'domino'='catchmind', modern=false) {
  const fresh = catchmindEngine.createInitialState(27);
  const configured = catchmindEngine.applyAction(fresh, 'p1', { type: 'settings', payload: { settings: { ...fresh.settings, category_id: 'food' } } });
  let state:any = catchmindEngine.applyAction(configured, 'p1', { type: 'choose', payload: { wordId: 0 } });
  if (!modern) { delete state.rulesVersion; delete state.roundId; delete state.choosingDeadlineAt; delete state.roundOverAt; }
  const deadline = Date.now() + 80_000;
  state.deadlineAt = new Date(deadline).toISOString();
  if(gameId==='domino')state=dominoEngine.applyAction(dominoEngine.createInitialState(27),'p1',{type:'configure',payload:{mode:'partners',difficulty:'hard',targetScore:100}});
  const room = { id: crypto.randomUUID(), version: 1, game_id: gameId, pending_game: null, pending_by: null, expires_at: new Date(deadline + 86400000).toISOString() };
  const receipts = new Map<string, { version: number; user_id: string }>();
  const commits: any[] = [];
  const members = [{ seat: 'p1', user_id: 'alice', language: 'ko' }, { seat: 'p2', user_id: 'bob', language: 'es' }];
  const db = {
    auth: { getUser: async (id: string) => ({ data: { user: { id } }, error: null }) },
    from(table: string) {
      let requestId = '';
      const result = () => ({ error: null, data: structuredClone(table === 'rooms' ? room : table === 'room_members' ? members : table === 'room_states' ? { state } : table === 'action_receipts' ? receipts.get(requestId) ?? null : null) });
      const query: any = { select: () => query, update: () => query, eq: (key: string, value: string) => { if (key === 'request_id') requestId = value; return query; }, single: async () => result(), maybeSingle: async () => result(), then: (ok: any, fail: any) => Promise.resolve(result()).then(ok, fail) };
      return query;
    },
    async rpc(_name: string, args: any) {
      if (args.p_version !== room.version) return { data: null, error: { message: 'stale_state' } };
      state = structuredClone(args.p_state); room.version++; room.game_id = args.p_game; room.pending_game = args.p_pending; room.pending_by = args.p_pending_by;
      commits.push(args); receipts.set(args.p_request, { version: room.version, user_id: args.p_user });
      return { data: room.version, error: null };
    },
  };
  let handler!: (request: Request) => Promise<Response>;
  runInNewContext(code, { testDB: db, Date, Response, Request, structuredClone, crypto: webcrypto, console, Deno: { env: { get: () => undefined }, serve: (value: typeof handler) => { handler = value; } } });
  const send = (seat: 'p1' | 'p2', operation: object, version = room.version, requestId = crypto.randomUUID()) => handler(new Request('https://test/action', { method: 'POST', headers: { Authorization: `Bearer ${seat === 'p1' ? 'alice' : 'bob'}` }, body: JSON.stringify({ roomId: room.id, requestId, version, ...operation }) }));
  return { room, deadline, send, commits, get state() { return state; } };
}

describe('Catchmind Edge clock and consent', () => {
  it.each([-1, 0, 1])('uses server expiration before matching an answer at deadline %i ms', async offset => {
    const f = fixture(), answer = f.state.answer!.es;
    vi.spyOn(Date, 'now').mockReturnValue(f.deadline + offset);
    expect((await f.send('p2', { chat: answer })).status).toBe(200);
    expect(f.state.phase).toBe('round-over'); expect(f.state.deadlineAt).toBeNull();
    expect(f.state.score).toEqual(offset < 0 ? { p1: 1, p2: 1 } : { p1: 0, p2: 0 });
    expect(f.commits[0].p_chat.status === 'correct').toBe(offset < 0);
  });

  it('commits one timeout across both seats racing and keeps a receipt retry idempotent', async () => {
    const f = fixture(), requestId = crypto.randomUUID(); vi.spyOn(Date, 'now').mockReturnValue(f.deadline);
    const results = await Promise.all([f.send('p1', { tick: true }, 1, requestId), f.send('p2', { tick: true }, 1)]);
    expect(results.map(result => result.status).sort()).toEqual([200, 409]);
    expect(f.commits).toHaveLength(1); expect(f.state.round).toBe(0); expect(f.state.score).toEqual({ p1: 0, p2: 0 });
    expect((await f.send('p1', { tick: true }, 1, requestId)).status).toBe(200);
    expect((await f.send('p2', { tick: true })).status).toBe(200); expect(f.commits).toHaveLength(1);
    expect(f.commits[0].p_views.p1.board.answer).toEqual(f.commits[0].p_views.p2.board.answer);
  });

  it('keeps a mask static before timeout and resets the match only after both seats agree', async () => {
    const f = fixture(); vi.spyOn(Date, 'now').mockReturnValue(f.deadline - 1);
    expect((await f.send('p2', { tick: true })).status).toBe(200); expect(f.commits).toHaveLength(0);
    expect((await f.send('p1', { selectGame: 'catchmind' })).status).toBe(200);
    expect(f.state.phase).toBe('drawing'); expect(f.state.deadlineAt).not.toBeNull();
    await f.send('p1', { selectGame: 'catchmind' }); expect(f.state.phase).toBe('drawing');
    await f.send('p2', { selectGame: 'catchmind' });
    expect(f.state).toMatchObject({ phase: 'choosing', deadlineAt: null, answer: null, strokes: [], fills: [], guesses: [], score: { p1: 0, p2: 0 }, settings: { category_id: 'food' } });
    expect(f.state.wordChoices).toHaveLength(6); expect(f.state.wordChoices[0]).toHaveLength(3); expect(f.room.pending_game).toBeNull();
  });

  it('preserves online Domino team settings only after both seats agree to replay',async()=>{
    const f=fixture('domino'),before=structuredClone(f.state);
    expect((await f.send('p1',{selectGame:'domino'})).status).toBe(200);
    expect(f.state).toEqual(before);
    expect((await f.send('p2',{selectGame:'domino'})).status).toBe(200);
    expect(f.state).toMatchObject({mode:'partners',round:1,roundResult:null,result:null,matchScores:{p1:0,p2:0},settings:{difficulty:'hard',targetScore:100}});
    expect(dominoEngine.getPlayerView(f.state,'p1').board.seats).toHaveLength(4);
    expect(f.room.pending_game).toBeNull();
  });
});

describe('Catchmind v2 Edge authority', () => {
  it('commits a hint only at its server-clock boundary and scores from that hint', async () => {
    const f=fixture('catchmind',true), roundId=f.state.roundId;
    vi.spyOn(Date,'now').mockReturnValue(f.deadline-40_001);
    expect((await f.send('p2',{tick:true})).status).toBe(200);
    expect(f.commits).toHaveLength(0);
    vi.spyOn(Date,'now').mockReturnValue(f.deadline-40_000);
    expect((await f.send('p2',{tick:true})).status).toBe(200);
    expect(f.commits).toHaveLength(1);
    expect(f.state.hintStage).toBe(1);
    expect(f.state.roundId).toBe(roundId);
    const answer=f.state.answer!.ko;
    expect((await f.send('p2',{chat:answer,roundId,expectedPhase:'drawing'})).status).toBe(200);
    expect(f.state.score).toEqual({p1:100,p2:130});
    expect(f.state.phase).toBe('round-over');
    expect(f.state.roundOverAt).not.toBeNull();
  });

  it('commits expiration without applying a stale answer or retry receipt', async () => {
    const f=fixture('catchmind',true), answer=f.state.answer!.es, roundId=f.state.roundId;
    vi.spyOn(Date,'now').mockReturnValue(f.deadline);
    const requestId=crypto.randomUUID();
    const stale={chat:answer,roundId,expectedPhase:'drawing'};
    expect((await f.send('p2',stale,1,requestId)).status).toBe(409);
    expect(f.state.phase).toBe('round-over');
    expect(f.state.score).toEqual({p1:0,p2:0});
    expect(f.commits).toHaveLength(1);
    expect(f.commits[0].p_chat).toBeNull();
    expect(f.commits[0].p_request).not.toBe(requestId);
    expect((await f.send('p2',stale,1,requestId)).status).toBe(409);
  });

  it('automatically chooses and advances after the display delay without replaying an old action', async () => {
    const f=fixture('catchmind',true);
    f.state.phase='choosing';f.state.answer=null;f.state.deadlineAt=null;
    f.state.choosingDeadlineAt=new Date(f.deadline-15_000).toISOString();
    vi.spyOn(Date,'now').mockReturnValue(f.deadline);
    expect((await f.send('p2',{tick:true})).status).toBe(200);
    expect(f.state.phase).toBe('drawing');
    expect(f.state.deadlineAt).toBe(new Date(f.deadline+80_000).toISOString());
    const oldRoundId=f.state.roundId;
    f.state.phase='round-over';f.state.roundOverAt=new Date(f.deadline).toISOString();f.state.deadlineAt=null;
    expect((await f.send('p1',{action:{type:'end-round'},roundId:oldRoundId,expectedPhase:'round-over'})).status).toBe(409);
    expect(f.state.phase).toBe('choosing');
    expect(f.state.roundId).not.toBe(oldRoundId);
    expect(f.state.round).toBe(1);
  });
});
