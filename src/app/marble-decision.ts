import { classicConstructionCost } from '../games/marbleClassicEconomy';
import { constructionOptions, constructionCostAtPrice } from '../games/marbleConstruction';
import { rentValue } from './marble-visuals';
export function ownershipPreview(tiles:any[],index:number,owner:string,propertyRules:boolean){
 const tile=tiles[index]??{};const group=tiles.filter(t=>t.kind==='property'&&t.group===tile.group);const complete=tile.kind==='property'&&!!tile.group&&group.length>1&&group.every(t=>t===tile||t.owner===owner);
 return {...tile,owner,colorComplete:complete,monopolyMultiplier:propertyRules&&complete?2:1};
}
export function travelPreview({tile,visitor,position,destination,fare,cash,salary,team=false,passes=0,fundPool=0}: {tile:any;visitor:string;position:number;destination:number;fare:number;cash:number;salary:number;team?:boolean;passes?:number;fundPool?:number}){
 const ally=tile.owner&&(tile.owner===visitor||(team&&Number(tile.owner.slice(1))%2===Number(visitor.slice(1))%2));
 let toll=tile.owner&&!ally?rentValue(tile,true,tile.economicVersion):0;
 const effects=tile.rentModifiers??{};
 if(toll&&(effects.festival===tile.owner||effects.festival?.owner===tile.owner&&effects.festival?.playerId===tile.owner))toll*=2;
 if(toll&&(effects.blackout===visitor||effects.blackout?.owner===tile.owner&&effects.blackout?.playerId===visitor))toll=Math.max(1,Math.floor(toll/2));
 const reward=destination<position?salary:0;const arrivalCharge=['tax','fund-deposit'].includes(tile.kind)?Number(tile.price??(tile.kind==='fund-deposit'?150:0)):0;const arrivalCredit=tile.kind==='fund'?fundPool:0;const after=cash-fare+reward-toll-arrivalCharge+arrivalCredit;
 return {fare,toll,reward,after,arrivalCharge,arrivalCredit,kind:String(tile.kind??'property'),uncertain:tile.kind==='event',shortfall:Math.max(0,-after),ally:Boolean(ally),passChoice:toll>0&&passes>0};
}
export function constructionLabel(tile:any,language:'ko'|'es'){
 if(tile.kind==='tourism')return language==='ko'?'관광지':'Turismo';
 if(!Array.isArray(tile.buildings))return '';
 if(tile.landmark)return language==='ko'?'랜드마크':'Monumento';
 const names:Record<string,string>=language==='ko'?{villa:'빌라',building:'빌딩',hotel:'호텔'}:{villa:'Villa',building:'Edificio',hotel:'Hotel'};
 return tile.buildings.length?tile.buildings.map((type:string)=>names[type]).join(' + '):language==='ko'?'빈 땅':'Terreno vacío';
}

export function unavailableConstruction(tiles:any[],owner:string,site:unknown,laps:number,landmarks:number[],cash:number,economicVersion:number){
 const options=tiles.flatMap((tile,index)=>tile.owner===owner&&(site==='start'||site===index)?constructionOptions(tile,laps,landmarks.includes(index)).map(selection=>({tile,index,cost:tile.cityEconomy?classicConstructionCost(tile.cityEconomy,selection):constructionCostAtPrice(Number(tile.price??0),selection,economicVersion)})):[]);
 return options.sort((a,b)=>a.cost-b.cost).find(option=>option.cost>cash);
}
