import { describe, expect, it, vi } from 'vitest';
import { createMatchState } from './newMatch';
import { engines } from './registry';

vi.mock('./supabase',()=>({onlineDb:null}));
import { client, soloClient } from './client';

describe('same-game replay settings',()=>{
  it.each(['partners','humans-vs-bots'] as const)('preserves solo Domino %s, chosen difficulty and target on a new match',async mode=>{
    await soloClient.createRoom('Player','ko');await soloClient.selectGame('domino');
    expect(soloClient.getSnapshot().view.settings.difficulty).toBe('hard');
    await soloClient.sendAction({type:'configure',payload:{mode,difficulty:'normal',targetScore:100}});
    await soloClient.selectGame('domino');
    const replay=soloClient.getSnapshot().view;
    expect(replay).toMatchObject({mode,round:1,result:null,settings:{difficulty:'normal',targetScore:100},board:{matchScores:{p1:0,p2:0}}});
    expect(replay.board.seats).toHaveLength(4);
    await soloClient.closeRoom();
  });

  it('keeps local Domino settings only after both players agree to the rematch',async()=>{
    await client.createRoom('Player','ko');await client.selectGame('domino');client.localSeat('p2');await client.selectGame('domino');client.localSeat('p1');
    await client.sendAction({type:'configure',payload:{mode:'partners',difficulty:'hard',targetScore:100}});
    const before=structuredClone(client.getSnapshot().view),version=client.getSnapshot().version;
    await client.selectGame('domino');
    expect(client.getSnapshot().view).toEqual(before);expect(client.getSnapshot().version).toBe(version);
    client.localSeat('p2');await client.selectGame('domino');
    expect(client.getSnapshot()).toMatchObject({version:version+1,pendingGame:null,view:{mode:'partners',round:1,result:null,settings:{difficulty:'hard',targetScore:100}}});
    await client.closeRoom();
  });

  it('resets Catchmind progress while retaining its topic, timer, rounds, choices and hints',()=>{
    const engine=engines.catchmind!;
    let previous=engine.createInitialState(17);
    const settings={...previous.settings,category_id:'animals',drawTimeSeconds:45,rounds:4,choices:4,hints:1};
    previous=engine.applyAction(previous,'p1',{type:'settings',payload:{settings}});
    previous=engine.applyAction(previous,'p1',{type:'choose',payload:{wordId:0}});
    previous.deadlineAt=new Date(Date.now()+45000).toISOString();previous.score={p1:5,p2:3};
    const before=structuredClone(previous),replay=createMatchState('catchmind',91,'catchmind',previous);
    expect(previous).toEqual(before);
    expect(replay).toMatchObject({seed:91,phase:'choosing',round:0,answer:null,strokes:[],fills:[],guesses:[],score:{p1:0,p2:0},deadlineAt:null,settings});
    expect(replay.wordChoices).toHaveLength(4);expect(replay.wordChoices[0]).toHaveLength(4);
  });

  it('does not carry settings across games and migrates old Domino settings to valid current rules',()=>{
    const old={mode:'partners',settings:{difficulty:'easy',targetScore:0,capicuaBonus:25,pasoCorridoBonus:25,tranqueRule:'team'}};
    const replay=createMatchState('domino',17,'domino',old);
    expect(replay.mode).toBe('partners');
    expect(replay.settings).toMatchObject({difficulty:'easy',targetScore:200,capicuaBonus:30,pasoCorridoBonus:0,tranqueRule:'trancador'});
    expect(createMatchState('domino',17,'catchmind',old)).toEqual(engines.domino!.createInitialState(17));
    expect(createMatchState('rhythm',17,'domino',old)).toBeNull();
  });
});
