import {describe,it,expect} from 'vitest';
import {executeAction,validChat,textLength,chatMessageForGame,reactionMessageForId} from './authority';
import {davinciEngine} from '../games/davinci';
import {catchmindEngine} from '../games/catchmind';
describe('authority boundary',()=>{
 it('rejects invalid and oversized actions without modifying state',()=>{
  const state=davinciEngine.createInitialState(42),before=structuredClone(state);
  expect(()=>executeAction(davinciEngine,state,'p2',{type:'impossible'})).toThrow();
  expect(()=>executeAction(davinciEngine,state,'p1',{type:'x',payload:{large:'x'.repeat(25000)}})).toThrow('invalid_action');
  expect(state).toEqual(before);
 });
 it('only the drawing player sees the selected word and next choices stay private',()=>{
  const initial=catchmindEngine.createInitialState(21);
  const {state,views}=executeAction(catchmindEngine,initial,'p1',{type:'choose',payload:{wordId:0}});
  expect(views.p1.hand.answer).toEqual(state.answer);
  expect(views.p2.hand).toBeNull();
  expect(JSON.stringify(views.p2)).not.toContain('wordChoices');
  expect(JSON.stringify(views.p2)).not.toContain('seed');
 });
 it('limits actual characters and rejects whitespace-only messages',()=>{
  expect(textLength('🇩🇴')).toBe(2);
  expect(validChat('가'.repeat(500))).toBe(true);
  expect(validChat('😀'.repeat(501))).toBe(false);
  expect(validChat('  ')).toBe(false);
 });
 it('allows only canonical reactions outside Catchmind and keeps normal Catchmind text',()=>{
  expect(chatMessageForGame('catchmind','Dibuja algo bonito')).toEqual({text:'Dibuja algo bonito',status:'pending'});
  expect(chatMessageForGame('jaipur',' ❤️ ')).toEqual({text:'❤️',status:'original'});
  expect(()=>chatMessageForGame('jaipur','Are you ready?')).toThrow('chat_not_allowed');
  expect(()=>chatMessageForGame(null,'forged free text')).toThrow('chat_not_allowed');
  expect(reactionMessageForId('heart')).toEqual({text:'❤️',status:'original'});
  expect(reactionMessageForId('sad')).toEqual({text:'😢',status:'original'});
  expect(()=>reactionMessageForId('free-text')).toThrow('invalid_reaction');
 });
});
