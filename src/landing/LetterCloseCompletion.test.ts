import {expect,it} from 'vitest';
import {letterCloseOutcome} from '../../post-hero-preview/src/PostHeroPreview';
import {closeEnvelope,createEnvelopeState,envelopeTarget,reopenEnvelope,updateEnvelopeFromScroll,LETTER_PAPER_HANDOFF} from '../../post-hero-preview/src/interaction';

it('never celebrates initial, scroll-only or incomplete closing states',()=>{
 expect(letterCloseOutcome(0,0,false)).toBe('opener');
 const scrollOnly=updateEnvelopeFromScroll(createEnvelopeState(),1);
 expect(letterCloseOutcome(1,envelopeTarget(scrollOnly,1),false)).toBeNull();
 expect(letterCloseOutcome(0,0,false)).not.toBe('rose-gift');
 expect(letterCloseOutcome(.0006,0,true)).toBeNull();
});

it('waits through the actual reverse handoff and final fold, including a full reading before progress .86',()=>{
 let closing=closeEnvelope(reopenEnvelope(createEnvelopeState()),.884);
 for(const progress of [.884,.81,.83,.75]){
  closing=updateEnvelopeFromScroll(closing,progress);
  expect(letterCloseOutcome(1,envelopeTarget(closing,progress),true)).toBeNull();
 }
 closing=updateEnvelopeFromScroll(closing,LETTER_PAPER_HANDOFF);
 expect(letterCloseOutcome(.4,envelopeTarget(closing,LETTER_PAPER_HANDOFF),true)).toBeNull();
 expect(letterCloseOutcome(0,envelopeTarget(closing,LETTER_PAPER_HANDOFF),true)).toBe('rose-gift');
 const earlyFullReading=closeEnvelope(reopenEnvelope(createEnvelopeState()),.66);
 expect(letterCloseOutcome(1,envelopeTarget(earlyFullReading,.66),true)).toBeNull();
 expect(letterCloseOutcome(0,envelopeTarget(earlyFullReading,.66),true)).toBe('rose-gift');
});

it('cannot deliver a stale pending gift after reopening or user interruption cancels that close',()=>{
 const reopened=reopenEnvelope(closeEnvelope(reopenEnvelope(createEnvelopeState()),.884));
 expect(letterCloseOutcome(0,envelopeTarget(reopened,.884),false)).toBeNull();
 expect(letterCloseOutcome(0,0,false)).toBe('opener');
});
