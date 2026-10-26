// Run from the repository root with esbuild, then node on the generated .mjs.
import { createHash } from 'node:crypto';
import { minhwatuEngine } from '../src/games/minhwatu';
import { fourMinhwatuEngine } from '../src/games/fourMinhwatu';

const N = 20000;
const seedAt = (i: number) => createHash('sha256').update(`minhwatu-correlation-2026:${i}`).digest().readUInt32LE(0);
const analyze = (mode: '2p' | '4p') => {
  const seats = mode === '2p' ? ['p1','p2'] : ['p1','p2','p3','p4'];
  const counts = seats.map(() => 0), topMonth = seats.map(() => Array(12).fill(0));
  let sum = 0, sumSquares = 0;
  for(let i=0;i<N;i++) {
    const seed = seedAt(i), bucket = mode === '2p' ? seed >>> 31 : seed >>> 30;
    const state = mode === '2p' ? minhwatuEngine.createInitialState(seed) : fourMinhwatuEngine.createInitialState(seed);
    counts[bucket]++;
    topMonth[bucket][state.deck[0].month-1]++;
    const rates = seats.map(seat => state.hands[seat as keyof typeof state.hands].filter(card => state.table.some(face => face.month === card.month)).length / state.hands[seat as keyof typeof state.hands].length);
    const difference = rates[bucket] - rates.reduce((a,b) => a+b,0)/seats.length;
    sum += difference; sumSquares += difference*difference;
  }
  const columns = Array.from({length:12},(_,j)=>topMonth.reduce((a,row)=>a+row[j],0));
  const chiSquare = topMonth.reduce((sum,row,i)=>sum+row.reduce((subtotal,observed,j)=>{
    const expected = counts[i]*columns[j]/N;
    return subtotal+(observed-expected)**2/expected;
  },0),0);
  const mean = sum/N, half95=1.96*Math.sqrt((sumSquares-N*mean*mean)/(N-1)/N);
  return { mode, seeds:N, bucketCounts:counts, firstStockMonthChiSquare:chiSquare, degreesOfFreedom:(seats.length-1)*11,
    chosenStarterOpeningMatchMinusSeatAverage:mean, paired95CI:[mean-half95,mean+half95] };
};
console.log(JSON.stringify({ twoPlayer:analyze('2p'), fourPlayer:analyze('4p') },null,2));
