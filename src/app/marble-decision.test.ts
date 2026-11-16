import {classicCityEconomies} from '../games/marbleClassicEconomy';
import {rentValue} from './marble-visuals';
import {describe,it,expect} from 'vitest';
import {ownershipPreview,travelPreview,unavailableConstruction} from './marble-decision';
describe('Marble decision consequences',()=>{
 it('recomputes the arriving owner group rather than reusing a rival multiplier',()=>{
  const tiles=[{kind:'property',group:'a',owner:'p2',monopolyMultiplier:2},{kind:'property',group:'a',owner:'p2'}];
  expect(ownershipPreview(tiles,0,'p1',true).monopolyMultiplier).toBe(1);
  tiles[1].owner='p1';expect(ownershipPreview(tiles,0,'p1',true).monopolyMultiplier).toBe(2);
 });
 it('includes fare, effect-adjusted toll, salary and pass choice without equating free travel with free arrival',()=>{
  const p=travelPreview({tile:{owner:'p2',rent:100,houses:0,buildings:[],rentModifiers:{festival:'p2',blackout:'p1'}},visitor:'p1',position:30,destination:4,fare:0,cash:50,salary:300,passes:1});
  expect(p).toMatchObject({toll:100,reward:300,after:250,passChoice:true,shortfall:0});
  expect(travelPreview({tile:{owner:'p2',rent:100,houses:0,buildings:[]},visitor:'p1',position:1,destination:4,fare:100,cash:150,salary:300})).toMatchObject({after:-50,shortfall:50});
 });
 it('never charges a teammate toll',()=>{
  expect(travelPreview({tile:{owner:'p3',rent:100,buildings:['hotel'],houses:1},visitor:'p1',position:1,destination:4,fare:100,cash:150,salary:300,team:true})).toMatchObject({toll:0,ally:true,after:50});
 });
});

it('quotes only an eligible unaffordable construction site, never another owned city',()=>{
 const tiles=[{owner:'p1',houses:0,buildings:[],price:100},{owner:'p1',houses:0,buildings:[],price:400}];
 expect(unavailableConstruction(tiles,'p1',1,0,[],0,3)).toMatchObject({index:1,cost:160});
 expect(unavailableConstruction(tiles,'p1',null,0,[],0,3)).toBeUndefined();
});

it('uses source city identity for research-profile tolls rather than generic base scaling',()=>{const cityEconomy=classicCityEconomies['서울'];expect(rentValue({cityEconomy,rent:1,buildings:[],landmark:false},true,3)).toBe(120);expect(rentValue({cityEconomy,rent:1,buildings:['villa','building','hotel'],landmark:true},true,3)).toBe(2820);});

it('previews every special travel target without inventing a random card result',()=>{const common={visitor:'p1',position:30,destination:4,fare:100,cash:500,salary:300,fundPool:250};expect(travelPreview({...common,tile:{kind:'tax',price:200}})).toMatchObject({arrivalCharge:200,after:500});expect(travelPreview({...common,tile:{kind:'fund'}})).toMatchObject({arrivalCredit:250,after:950});expect(travelPreview({...common,tile:{kind:'event'}})).toMatchObject({uncertain:true,after:700});expect(travelPreview({...common,destination:30,tile:{kind:'train'}})).toMatchObject({reward:0,after:400});});

it('reports color completion independently of the removed color toll bonus',()=>{
 const tiles=[{kind:'property',group:'a',owner:'p2'},{kind:'property',group:'a',owner:'p1'}];
 expect(ownershipPreview(tiles,0,'p1',false)).toMatchObject({colorComplete:true,monopolyMultiplier:1});
 tiles[1].owner='p3';expect(ownershipPreview(tiles,0,'p1',false).colorComplete).toBe(false);
});

it('handles an empty loading board without claiming color completion',()=>{expect(ownershipPreview([],0,'p1',false)).toMatchObject({colorComplete:false,monopolyMultiplier:1});});
