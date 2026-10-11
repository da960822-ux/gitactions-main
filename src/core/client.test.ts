import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import type {client as ClientType} from './client';
let client:typeof ClientType;
beforeEach(async()=>{vi.resetModules();({client}=await import('./client'));});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
async function startDrawing(){
 await client.createRoom('구름','ko');await client.selectGame('catchmind');client.localSeat('p2');await client.selectGame('catchmind');client.localSeat('p1');await client.sendAction({type:'choose',payload:{wordId:0}});
}
describe('local practice client',()=>{
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
 it('cannot join a demo room from a different room or after seven days',async()=>{
  const room=await client.createRoom('구름','ko');await expect(client.joinRoom(crypto.randomUUID(),'Luna','es')).rejects.toThrow('demo_same_browser_only');
  const future=Date.now()+8*86400000;vi.spyOn(Date,'now').mockReturnValue(future);await expect(client.joinRoom(room,'Luna','es')).rejects.toThrow('demo_same_browser_only');
 });
});
