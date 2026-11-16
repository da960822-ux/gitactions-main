import { legacyInitial } from './marble.effectFixtures';
import { expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { marbleBuildToCostAtPrice } from './marbleEconomy';
import { classicCityEconomies, classicEconomyConfig, classicTourismEconomy } from './marbleClassicEconomy';

// Budget stress fixtures, NOT human-game simulations: route order, alternating buyers,
// no salary, rent, cards, tourism or compulsory fees. They isolate purchasing bank sinks.
const live = () => marbleEngine.getPlayerView(legacyInitial(marbleEngine, 1),'p1').board.tiles.filter((t:any)=>t.kind==='property').map((t:any)=>({land:t.price,normal:marbleBuildToCostAtPrice(t.price,0,2,3)}));
const classic = () => Object.values(classicCityEconomies).map(t=>({land:t.landCost,normal:t.buildCosts.villa+t.buildCosts.building}));
function budget(rows:{land:number;normal:number}[], build:boolean, reserve=0) {
  const cash=[3000,3000];let count=0,sunk=0;
  rows.forEach((t,index)=>{const p=index%2,cost=t.land+(build?t.normal:0);if(cash[p]-cost>=reserve){cash[p]-=cost;count++;sunk+=cost;}});
  return {cash,count,sunk};
}
it('documents source32 versus custom40 aggregate purchase pressure without changing prices',()=>{
  expect(live()).toHaveLength(24);expect(classic()).toHaveLength(18);
  const sum=(rows:{land:number;normal:number}[])=>rows.reduce((a,t)=>({land:a.land+t.land,normal:a.normal+t.normal}),{land:0,normal:0});
  expect(sum(live())).toEqual({land:6340,normal:6340});expect(sum(live().slice(0,16))).toEqual({land:3200,normal:3200});
  expect(sum(classic())).toEqual({land:2901,normal:4800});expect(5*classicTourismEconomy.purchaseCost).toBe(750);expect(classicEconomyConfig.passStartSalary).toBe(450);
});
it('land-first source32 can acquire every ordinary city while retaining over half combined opening cash',()=>{
  expect(budget(live(),false)).toEqual({cash:[40,70],count:23,sunk:5890});
  expect(budget(classic(),false)).toEqual({cash:[1620,1479],count:18,sunk:2901});
});
it('max allowed ordinary construction can exhaust either economy near 15 acquired cities',()=>{
  expect(budget(live(),true)).toEqual({cash:[160,80],count:15,sunk:5760});
  expect(budget(classic(),true)).toEqual({cash:[108,414],count:15,sunk:5478});
});
it('a stated 600-per-player reserve preserves liquidity by foregoing purchases, not by creating money',()=>{
  expect(budget(live(),true,600)).toEqual({cash:[760,660],count:13,sunk:4580});
  expect(budget(classic(),true,600)).toEqual({cash:[774,993],count:13,sunk:4233});
  for(const rows of [live(),classic()])for(const build of [false,true]){const result=budget(rows,build,600);expect(result.cash[0]+result.cash[1]+result.sunk).toBe(6000);}
});
it('original-source toll escalation is not a promise of safer maximum construction',()=>{
  const sum=(mask:number)=>Object.values(classicCityEconomies).reduce((a,t)=>a+t.tollByMask[mask]!,0);
  expect([sum(0),sum(3),sum(7)]).toEqual([855,6864,16209]);
});
