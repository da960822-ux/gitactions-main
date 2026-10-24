import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import type {client as ClientType} from './client';
let client:typeof ClientType;
beforeEach(async()=>{vi.resetModules();({client}=await import('./client'));});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
async function startDrawing(){
 await client.createRoom('구름','ko');await client.selectGame('catchmind');client.localSeat('p2');await client.selectGame('catchmind');client.localSeat('p1');await client.sendAction({type:'settings',payload:{settings:{category_id:'animals',drawTimeSeconds:80,rounds:2,choices:3,hints:2,customWords:[],customOnly:false}}});await client.sendAction({type:'choose',payload:{wordId:0}});
}
describe('local practice client',()=>{
 it('preserves a finished Minhwatu game until both seats accept a rematch',async()=>{
  await client.createRoom('Yeonseok','ko');await client.selectGame('minhwatu');client.localSeat('p2');await client.selectGame('minhwatu');
  for(let i=0;i<60&&!client.getSnapshot().view.result;i++){
   client.localSeat(client.getSnapshot().view.turn);
   await client.sendAction(client.getSnapshot().view.actions[0].action);
  }
  expect(client.getSnapshot().view.result).toBeTruthy();
  client.localSeat('p1');const finished=structuredClone(client.getSnapshot().view),version=client.getSnapshot().version;
  await client.selectGame('minhwatu');await client.selectGame('minhwatu');
  expect(client.getSnapshot().version).toBe(version);expect(client.getSnapshot().view).toEqual(finished);
  client.localSeat('p2');await client.selectGame('minhwatu');
  expect(client.getSnapshot().version).toBe(version+1);expect(client.getSnapshot().pendingGame).toBeNull();
  expect(client.getSnapshot().view).toMatchObject({result:null,opponentCount:10,board:{deckCount:20,scores:{p1:0,p2:0}}});
  expect(client.getSnapshot().view.ownHand).toHaveLength(10);
 });
 it('requires both players to agree on the initial game and later changes',async()=>{
  await client.createRoom('구름','ko');await client.selectGame('davinci');expect(client.getSnapshot().gameId).toBeNull();
  await client.selectGame('davinci');expect(client.getSnapshot().gameId).toBeNull();
  client.localSeat('p2');await client.selectGame('davinci');expect(client.getSnapshot().gameId).toBe('davinci');
  await client.selectGame('domino');expect(client.getSnapshot().gameId).toBe('davinci');
  client.localSeat('p1');await client.selectGame('domino');expect(client.getSnapshot().gameId).toBe('domino');
 });
 it('recognizes a bilingual chat answer without translating or revealing it in the chat',async()=>{
  await startDrawing();const answer=client.getSnapshot().view.hand.answer.ko;
  client.localSeat('p2');expect(client.getSnapshot().view.hand).toBeNull();await client.sendChat(answer);
  expect(client.getSnapshot().view.phase).toBe('round-over');expect(client.getSnapshot().messages.at(-1)).toMatchObject({status:'correct',text:''});
 });
 it('expires a drawing deadline and prevents guesses after time runs out',async()=>{
  await startDrawing();const deadline=Date.parse(client.getSnapshot().view.deadlineAt);vi.spyOn(Date,'now').mockReturnValue(deadline+1);
  client.localSeat('p2');await client.tick();expect(client.getSnapshot().view.phase).toBe('round-over');
  await client.sendChat('고양이');expect(client.getSnapshot().messages.at(-1)?.status).toBe('unavailable');
 });
 it('expires once at the exact deadline even when the answer arrives before a clock tick',async()=>{
  await startDrawing();const answer=client.getSnapshot().view.hand.answer.es,deadline=Date.parse(client.getSnapshot().view.deadlineAt),version=client.getSnapshot().version;
  client.localSeat('p2');vi.spyOn(Date,'now').mockReturnValue(deadline);
  await client.sendChat(answer);await Promise.all([client.tick(),client.tick()]);
  expect(client.getSnapshot()).toMatchObject({version:version+1,view:{phase:'round-over',deadlineAt:null,board:{round:1,scores:{p1:0,p2:0},answer:{es:answer}}}});
  expect(client.getSnapshot().messages.at(-1)?.status).toBe('unavailable');
  client.localSeat('p1');expect(client.getSnapshot().view.board.scores).toEqual({p1:0,p2:0});
 });
 it('does not call an answer correct when the deadline expires between chat validation and execution',async()=>{
  await startDrawing();const answer=client.getSnapshot().view.hand.answer.ko,deadline=Date.parse(client.getSnapshot().view.deadlineAt);
  client.localSeat('p2');vi.spyOn(Date,'now').mockReturnValueOnce(deadline-1).mockReturnValue(deadline);
  await client.sendChat(answer);
  expect(client.getSnapshot().messages.at(-1)?.status).toBe('unavailable');
  expect(client.getSnapshot().view.board.scores).toEqual({p1:0,p2:0});
 });
 it('accepts an answer just before expiration, then automatically advances after five seconds without a later timeout',async()=>{
  await startDrawing();const answer=client.getSnapshot().view.hand.answer.es,deadline=Date.parse(client.getSnapshot().view.deadlineAt);
  client.localSeat('p2');const clock=vi.spyOn(Date,'now').mockReturnValue(deadline-1);
  await client.sendChat(answer);const solved=structuredClone(client.getSnapshot().view);
  expect(solved.phase).toBe('round-over');
  expect(solved.board.scores).toEqual({p1:100,p2:60});
  clock.mockReturnValue(deadline+60_000);await client.tick();
  expect(client.getSnapshot().view).toMatchObject({phase:'choosing',board:{round:2,drawer:'p2',scores:solved.board.scores}});
  expect(client.getSnapshot().view.board.roundId).not.toBe(solved.board.roundId);
 });
 it('keeps the same match until both seats accept, then preserves settings while resetting drawing, answer, score and deadline',async()=>{
  await startDrawing();const answer=client.getSnapshot().view.hand.answer.ko;
  await client.sendAction({type:'draw',payload:{strokes:[{points:[{x:.1,y:.1},{x:.3,y:.3}]}]}});
  client.localSeat('p2');await client.sendChat(answer);client.localSeat('p1');await client.sendAction({type:'end-round'});
  client.localSeat('p2');await client.sendAction({type:'choose',payload:{wordId:0}});await client.sendAction({type:'pass'});await client.sendAction({type:'end-round'});
  const finished=structuredClone(client.getSnapshot().view),version=client.getSnapshot().version;expect(finished.result).toBeTruthy();
  await client.selectGame('catchmind');await client.selectGame('catchmind');
  expect(client.getSnapshot().view).toEqual(finished);expect(client.getSnapshot().version).toBe(version);
  client.localSeat('p1');await client.selectGame('catchmind');
  expect(client.getSnapshot()).toMatchObject({version:version+1,pendingGame:null,view:{phase:'choosing',deadlineAt:null,result:null,hand:{answer:null},board:{round:1,strokes:[],fills:[],guesses:[],hintStage:0,answer:null,scores:{p1:0,p2:0},settings:{category_id:'animals',rounds:2,drawTimeSeconds:80,choices:3,hints:2}}}});
  expect(client.getSnapshot().view.actions.filter((option:any)=>option.action.type==='choose')).toHaveLength(3);
 });
 it('keeps original chat when translation is not configured and validates length',async()=>{
  await client.createRoom('구름','ko');await client.selectGame('catchmind');client.localSeat('p2');await client.selectGame('catchmind');await client.sendChat('Hola, ¿cómo estás?');expect(client.getSnapshot().messages[0]).toMatchObject({text:'Hola, ¿cómo estás?',status:'unavailable'});
  await expect(client.sendChat('a'.repeat(501))).rejects.toThrow('chat_max_500');
  const id=client.getSnapshot().roomId;const feedbackKey=`couple-feedback:${crypto.randomUUID()}`;const storage=new Map([[feedbackKey,'saved post'],['dos-last-room',id!]]);const removeItem=vi.fn((key:string)=>storage.delete(key));vi.stubGlobal('localStorage',{getItem:(key:string)=>storage.get(key)??null,removeItem});
  await client.closeRoom();expect(client.getSnapshot().roomId).toBeNull();
  expect(storage.get(feedbackKey)).toBe('saved post');expect(removeItem).toHaveBeenCalledTimes(1);expect(removeItem).toHaveBeenCalledWith('dos-last-room');
 });
 it('restricts non-Catchmind chat to canonical reactions and never queues translations for them',async()=>{
  await client.createRoom('구름','ko');
  await client.selectGame('davinci');client.localSeat('p2');await client.selectGame('davinci');
  await expect(client.sendChat('Can you see this?')).rejects.toThrow('chat_not_allowed');
  await expect(client.sendReaction('wow')).resolves.toBeUndefined();
  await client.sendChat('❤️');
  expect(client.getSnapshot().messages.map(({text,status,translation})=>({text,status,translation}))).toEqual([
   {text:'😮',status:'original',translation:undefined},
   {text:'❤️',status:'original',translation:undefined},
  ]);
  await expect(client.sendReaction('custom' as never)).rejects.toThrow('invalid_reaction');
 });
 it.each(['getItem','removeItem'])('closes the room when browser storage %s is blocked',async operation=>{
  const id=await client.createRoom('구름','ko');
  vi.stubGlobal('localStorage',{getItem:()=>id,removeItem:()=>{},[operation]:()=>{throw new DOMException('Storage blocked','SecurityError');}});
  await expect(client.closeRoom()).resolves.toBeUndefined();
  expect(client.getSnapshot()).toMatchObject({roomId:null,gameId:null,players:[],view:null});
 });
 it('cannot join a demo room from a different room or after seven days',async()=>{
  const room=await client.createRoom('구름','ko');await expect(client.joinRoom(crypto.randomUUID(),'Luna','es')).rejects.toThrow('demo_same_browser_only');
  const future=Date.now()+8*86400000;vi.spyOn(Date,'now').mockReturnValue(future);await expect(client.joinRoom(room,'Luna','es')).rejects.toThrow('demo_same_browser_only');
 });
});
