import {expect,it} from 'vitest';
import {createLetterFinaleState,reduceLetterFinale} from './letterFinaleState';

it('arms the rose only on explicit close after the letter is fully open, and waits for the completed fold',()=>{
 const folding=reduceLetterFinale({phase:'reading',roseArmed:false},{type:'close',opening:1});
 expect(folding).toEqual({phase:'folding',roseArmed:true});
 expect(reduceLetterFinale(folding,{type:'fold-complete',opening:.4,target:0})).toEqual(folding);
 expect(reduceLetterFinale(folding,{type:'fold-complete',opening:0,target:0})).toEqual({phase:'rose',roseArmed:false});
});

it('folds a partial reading without arming the rose; scroll alone cannot enter the finale',()=>{
 const initial=createLetterFinaleState();
 const partial=reduceLetterFinale({phase:'reading',roseArmed:false},{type:'close',opening:.8});
 expect(partial).toEqual({phase:'folding',roseArmed:false});
 expect(reduceLetterFinale(partial,{type:'fold-complete',opening:0,target:0})).toEqual(initial);
});

it('cancels a pending rose on interruption but lets the fold finish',()=>{
 const armed=reduceLetterFinale({phase:'reading',roseArmed:false},{type:'close',opening:.9995});
 const interrupted=reduceLetterFinale(armed,{type:'interrupt'});
 expect(interrupted).toEqual({phase:'folding',roseArmed:false});
 expect(reduceLetterFinale(interrupted,{type:'fold-complete',opening:0,target:0})).toEqual(createLetterFinaleState());
});

it.each(['read','reopen','shared-open'] as const)('%s returns to reading and rejects a stale fold completion',type=>{
 const armed=reduceLetterFinale({phase:'reading',roseArmed:false},{type:'close',opening:1});
 const reading=reduceLetterFinale(armed,{type});
 expect(reading).toEqual({phase:'reading',roseArmed:false});
 expect(reduceLetterFinale(reading,{type:'fold-complete',opening:0,target:0})).toEqual(reading);
});

it('does not arm or complete on non-finite/incomplete poses',()=>{
 const invalidClose=reduceLetterFinale({phase:'reading',roseArmed:false},{type:'close',opening:Number.NaN});
 expect(invalidClose).toEqual({phase:'folding',roseArmed:false});
 expect(reduceLetterFinale(invalidClose,{type:'fold-complete',opening:Number.NaN,target:0})).toEqual(invalidClose);
 const armed=reduceLetterFinale({phase:'reading',roseArmed:false},{type:'close',opening:1});
 expect(reduceLetterFinale(armed,{type:'fold-complete',opening:.0005,target:0})).toEqual(armed);
 expect(reduceLetterFinale(armed,{type:'fold-complete',opening:0,target:.001})).toEqual(armed);
});
