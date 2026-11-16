import { classicCityEconomies, classicTourismEconomy } from './marbleClassicEconomy';
import type { MarbleTile } from './marble';

export const WORLD_ISLANDS_PROFILE = 'world-islands-32-v1' as const;
export const worldIslandsProfile = {
  id: WORLD_ISLANDS_PROFILE, routeVersion: 5, size: 32, status: 'playable-custom',
  ruleBasis: 'Source-priced cities with custom world names, fixed islands, existing card/loan/travel rules and island-inclusive line victory.',
  startingCash: 3000, salary: 450, travelFare: 100, jailEscapeFee: 100,
  tourismPrice: 150, tourismToll: 120, tourismGrowth: false,
  victory: ['line-monopoly', 'triple-monopoly', 'tourism-monopoly', 'bankruptcy', '120-turn-net-assets'],
} as const;
const roster = [
  ['광주','Gwangju'],['산토도밍고','Santo Domingo'],['기자','Guiza'],['리우','Río'],['싱가포르','Singapur'],
  ['베를린','Berlín'],['파리','París'],['도쿄','Tokio'],['이스탄불','Estambul'],['아그라','Agra'],
  ['아테네','Atenas'],['시드니','Sídney'],['뉴욕','Nueva York'],['런던','Londres'],['바르셀로나','Barcelona'],
  ['베이징','Pekín'],['두바이','Dubái'],['서울','Seúl'],
] as const;
const citySlots = [1,3,5,6,7,10,11,13,15,17,19,21,22,23,26,27,29,31];
const groupNumbers = [1,1,2,2,2,3,3,4,4,5,5,6,6,6,7,7,8,8];
const islands:Record<number,readonly[string,string]> = {
  2:['몰디브','Maldivas'],4:['보라보라','Bora Bora'],9:['발리','Bali'],14:['하와이','Hawái'],
  16:['이비사','Ibiza'],18:['산토리니','Santorini'],25:['세이셸','Seychelles'],30:['제주도','Isla de Jeju'],
};
const sourceRows = Object.values(classicCityEconomies);
export const worldIslandsBoard:MarbleTile[] = Array.from({length:32},(_,index)=>{
  const row=citySlots.indexOf(index);
  if(row>=0){const economy=sourceRows[row];return {kind:'property',name:{ko:roster[row][0],es:roster[row][1]},group:`world-g${groupNumbers[row]}`,cityEconomy:economy,price:economy.landCost,rent:economy.tollByMask[0]!};}
  if(islands[index])return {kind:'tourism',name:{ko:islands[index][0],es:islands[index][1]},tourismEconomy:classicTourismEconomy,price:150,rent:120};
  if(index===0)return {kind:'start',name:{ko:'출발',es:'Salida'}};
  if(index===8)return {kind:'island',name:{ko:'무인도',es:'Isla desierta'}};
  if(index===24)return {kind:'train',name:{ko:'세계여행',es:'Viaje por el mundo'}};
  return {kind:'event',name:{ko:'황금열쇠',es:'Llave dorada'}};
});
// Saved v50 rooms with no revision keep their owned island at16.
export const worldFestivalBoard:MarbleTile[] = worldIslandsBoard.map((tile,index)=>index===16?{kind:'festival-site',name:{ko:'축제 개최',es:'Celebrar un festival'}}:tile);
const travelRoster = [
  ['광주','Gwangju'],['인천','Incheon'],['기자','Guiza'],['리우','Río'],['싱가포르','Singapur'],
  ['뉴욕','Nueva York'],['베를린','Berlín'],['파리','París'],['산토도밍고','Santo Domingo'],['도쿄','Tokio'],
  ['이스탄불','Estambul'],['시드니','Sídney'],['런던','Londres'],['바르셀로나','Barcelona'],['베이징','Pekín'],
  ['두바이','Dubái'],['뉴어크','Newark'],['서울','Seúl'],
] as const;
// Revision3 changes city names only; saved rooms retain their exact slots, economics and ownership.
export const worldTravelBoard:MarbleTile[] = worldFestivalBoard.map((tile,index)=>{
  const row=citySlots.indexOf(index);
  return row<0?tile:{...tile,name:{ko:travelRoster[row][0],es:travelRoster[row][1]}};
});
// Revision4 replaces only Bora Bora; saved revision3 rooms keep their owned island.
export const worldGoldenKeyBoard:MarbleTile[] = worldTravelBoard.map((tile,index)=>index===4?{kind:'event',name:{ko:'황금열쇠',es:'Llave dorada'}}:tile);
export const worldIslandsBoardFor = (revision?:number):MarbleTile[] => revision===4?worldGoldenKeyBoard:revision===3?worldTravelBoard:revision===2?worldFestivalBoard:worldIslandsBoard;
export const worldIslandsMetadata = (revision?:number) => ({...worldIslandsProfile,boardRevision:revision===4?4:revision===3?3:revision===2?2:1,tourismCount:worldIslandsBoardFor(revision).filter(tile=>tile.kind==='tourism').length,festivalSites:worldIslandsBoardFor(revision).flatMap((tile,index)=>tile.kind==='festival-site'?[index]:[]),...(revision===3||revision===4?{travelMilestones:[1,3,10,15,29,31,0,1]}:{})});
export const isPurchasableMarbleTile = (tile?:MarbleTile) => tile?.kind==='property'||tile?.kind==='tourism';
/** Custom corner16 belongs only to its forward side16..23; other corners are not purchasable. */
export function completedPropertyLines(board:MarbleTile[],properties:Record<string,{owner:string}>,owner:string):number[]{
  if(board.length!==32)return [];
  return [0,1,2,3].filter(side=>{
    const required=board.flatMap((tile,index)=>index>=side*8&&index<(side+1)*8&&isPurchasableMarbleTile(tile)?[index]:[]);
    return required.length>0&&required.every(index=>properties[index]?.owner===owner);
  });
}

/** Simultaneous victories use line, then three color groups, then every tourism island. */
export function worldOwnershipVictory(board:MarbleTile[],properties:Record<string,{owner:string}>,owner:string):'line-monopoly'|'triple-monopoly'|'tourism-monopoly'|null {
  if(completedPropertyLines(board,properties,owner).length)return 'line-monopoly';
  const groups=[...new Set(board.filter(tile=>tile.kind==='property'&&tile.group).map(tile=>tile.group!))];
  if(groups.filter(group=>board.every((tile,index)=>tile.kind!=='property'||tile.group!==group||properties[index]?.owner===owner)).length>=3)return 'triple-monopoly';
  const islands=board.flatMap((tile,index)=>tile.kind==='tourism'?[index]:[]);
  return islands.length>0&&islands.every(index=>properties[index]?.owner===owner)?'tourism-monopoly':null;
}
