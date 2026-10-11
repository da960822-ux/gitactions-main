// Local SQL/RLS/authority fixture smoke check. Manual snapshot refreshes are explicit; this does not test Supabase Realtime.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { launchChromium } from './playwright-browser.mjs';
const baseURL = process.env.QUALITY_ONLINE_URL || 'http://127.0.0.1:5192';
const out='output/playwright/game-quality/online-fixture';await fs.mkdir(out,{recursive:true});
const browser=await launchChromium();
const contexts=await Promise.all([browser.newContext(),browser.newContext()]);
const pages=await Promise.all(contexts.map(c=>c.newPage()));const errors=[];for(const p of pages)p.on('pageerror',e=>errors.push(e.message));
for(const p of pages){await p.goto(`${baseURL}/play`);await p.evaluate(async()=>{window.qclient=(await import('/src/core/client.ts')).client;window.qnavigate=(await import('/src/app/Router.tsx')).navigate;});}
const reports=[];
try {
for(const game of ['domino','jaipur','splendor']){
const id=await pages[0].evaluate(async()=>window.qclient.createRoom('Quality KO','ko'));
await pages[1].evaluate(async id=>window.qclient.joinRoom(id,'Quality ES','es'),id);
for(const p of pages)await p.evaluate(id=>window.qnavigate(`/room/${id}`),id);
await pages[0].evaluate(game=>window.qclient.selectGame(game),game);
await pages[1].evaluate(()=>window.qclient.reconnectRoom());
await pages[1].evaluate(game=>window.qclient.selectGame(game),game);
await pages[0].evaluate(()=>window.qclient.reconnectRoom());
const snaps=await Promise.all(pages.map(p=>p.evaluate(()=>window.qclient.getSnapshot())));
assert.equal(snaps[0].playerId,'p1');assert.equal(snaps[1].playerId,'p2');assert.equal(snaps[0].gameId,game);assert.equal(snaps[1].gameId,game);
let committed=0;
for(let i=0;i<6;i++){
for(const p of pages)await p.evaluate(()=>window.qclient.reconnectRoom());
const current=await pages[0].evaluate(()=>window.qclient.getSnapshot());if(current.view.result)break;
const pi=current.view.turn==='p2'?1:0;
const action=await pages[pi].evaluate(()=>{const v=window.qclient.getSnapshot().view;const choices=v.actions??[];return (choices.find(x=>x.action.type==='play')??choices.find(x=>x.action.type==='take')??choices[0])?.action});
if(!action)break;
await pages[pi].evaluate(action=>window.qclient.sendAction(action),action);committed++;
}
for(const p of pages)await p.evaluate(()=>window.qclient.reconnectRoom());
const ending=await Promise.all(pages.map(p=>p.evaluate(()=>window.qclient.getSnapshot())));
assert.equal(ending[0].version,ending[1].version);
for (const snapshot of ending) {
  assert.equal(snapshot.view.hands, undefined);
  assert.equal(snapshot.view.seed, undefined);
  assert.equal(snapshot.view.rngSeed, undefined);
  assert.equal(snapshot.view.deck, undefined);
  if (game === 'domino' && snapshot.view.phase === 'play') assert.equal(snapshot.view.board.revealedHands, undefined);
  if (game === 'jaipur') {
    assert.equal(snapshot.view.board.bonusTiles, undefined);
    assert.deepEqual(snapshot.view.handCards.map(card => card.good), snapshot.view.ownHand);
    const ownIds = new Set(snapshot.view.handCards.map(card => card.id));
    const otherView = ending.find(other => other.playerId !== snapshot.playerId).view;
    assert(otherView.handCards.every(card => !ownIds.has(card.id)));
  }
  if (game === 'splendor') {
    assert.equal(snapshot.view.reserved, undefined);
    assert.equal(snapshot.view.board.tokens, undefined);
    assert.equal(snapshot.view.board.decks, undefined);
  }
}
await pages[0].screenshot({path:`${out}/${game}-p1.png`,fullPage:true});
reports.push({game,independentBrowserContexts:2,committedActions:committed,matchingVersion:ending[0].version,players:ending[0].players.length,realtimeImplemented:false});
await pages[0].evaluate(()=>window.qclient.closeRoom());
await pages[1].evaluate(()=>window.qclient.reconnectRoom());
assert.equal(await pages[1].evaluate(()=>window.qclient.getSnapshot().view),null);
}
assert.deepEqual(errors,[]);
console.log(JSON.stringify({reports,errors},null,2));await fs.writeFile(`${out}/report.json`,JSON.stringify({reports,errors},null,2));
}finally{await browser.close();}
