import { useEffect, useRef, useState } from 'react';
import type { GameAction, Language } from '../core/types';
import { constructionCostAtPrice, constructionRentAtBase, type MarbleConstructionSelection, type MarbleBuildingType } from '../games/marbleConstruction';
import { classicBuildingMask, classicConstructionCost, classicToll } from '../games/marbleClassicEconomy';
import { MarblePropertyArt } from './MarblePropertyArt';
import { cityArtNames, moneyText } from './marble-visuals';
import './marble-construction.css';
type Choice={label:Record<Language,string>;action:GameAction};
const types:MarbleBuildingType[]=['villa','building','hotel'];
const labels={villa:{ko:'빌라',es:'Villa'},building:{ko:'빌딩',es:'Edificio'},hotel:{ko:'호텔',es:'Hotel'}};
export function toggleConstructionSelection(current:MarbleBuildingType[],owned:MarbleBuildingType[],type:MarbleBuildingType,checked:boolean,laps:number):MarbleBuildingType[]{
 if(owned.includes(type)||(type==='hotel'&&laps<1))return current;
 if(!checked)return current.filter(item=>item!==type);
 const added=types.slice(0,types.indexOf(type)+1);
 return types.filter(item=>!owned.includes(item)&&(current.includes(item)||added.includes(item)));
}

export function MarbleConstructionPicker({choices,tile,cash,laps,language,disabled,onConfirm,onCancel,id,routeVersion=3}: {choices:Choice[];tile:any;cash:number;laps:number;language:Language;disabled:boolean;onConfirm:(action:GameAction)=>unknown;onCancel?:()=>unknown;id:string;routeVersion?:number}){
 const [selection,setSelection]=useState<MarbleBuildingType[]>([]),[landmark,setLandmark]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState(false);const lock=useRef(false);const ko=language==='ko';
 const buy=choices[0]?.action.type==='buy',owned:MarbleBuildingType[]=tile.buildings??[],landmarkChoice=choices.find(c=>c.action.payload?.landmark===true),ready=owned.length===3&&!tile.landmark;
 const city=String(tile.name?.ko??''),cityName=String(tile.name?.[language]??city),art=cityArtNames[city]??(tile.cityEconomy?`korea-${tile.index??city}`:'');
 const identity=`${tile.index??city}:${buy}:${owned.join(',')}:${!!tile.landmark}`;
 useEffect(()=>{setSelection([]);setLandmark(false);setError(false);},[identity]);
 const selected=choices.find(c=>Boolean(c.action.payload?.landmark)===landmark&&JSON.stringify([...(c.action.payload?.buildings as MarbleBuildingType[]??[])].sort())===JSON.stringify([...selection].sort()));
 const addition:MarbleConstructionSelection=landmark?{landmark:true}:{buildings:selection};
 const economy=tile.cityEconomy,price=Number(economy?.landCost??tile.price??0),version=Number(tile.economicVersion??3);
 const buildCost=(choice:MarbleConstructionSelection)=>economy?classicConstructionCost(economy,choice):constructionCostAtPrice(price,choice,version);
 const cost=(buy?price:0)+buildCost(addition),result={...tile,buildings:[...owned,...selection],landmark:tile.landmark||landmark};
 const rent=economy?classicToll(economy,result,Number(tile.monopolyMultiplier??1)):constructionRentAtBase(Number(tile.rent??0),result,Number(tile.monopolyMultiplier??1));
 const inferred=!!economy&&!result.landmark&&economy.inferredTollMasks.includes(classicBuildingMask(result));
 const confirm=async()=>{if(!selected||cost>cash||disabled||lock.current)return;lock.current=true;setPending(true);setError(false);try{const accepted=await onConfirm(selected.action);if(accepted===false)setError(true);}catch{setError(true);}finally{lock.current=false;setPending(false);}};
 return <fieldset className="mp-construction-picker" disabled={disabled||pending}>
 <legend className="mp-construction-sr">{buy?(ko?'도시 구매와 건설':'Compra y construcción'):(ko?'도시 건설':'Construcción')}</legend>
 <header className="mp-construction-heading"><strong>{cityName}</strong><span>{buy?(ko?`토지 ${moneyText(price,language)} 포함`:`Terreno ${moneyText(price,language)} incluido`):(ko?'추가할 건물을 선택하세요':'Elige qué añadir')}</span></header>
 <div className={`mp-construction-cards ${ready?'is-landmark-choice':''}`}>
 {ready?<label className={`mp-construction-card ${landmark?'is-selected':''} ${!landmarkChoice?'is-unavailable':''}`}><span className="mp-construction-card-title"><input type="checkbox" checked={landmark} disabled={!landmarkChoice} onChange={e=>{setLandmark(e.target.checked);setSelection([]);}}/><b>{ko?'랜드마크':'Monumento'}</b><strong>{moneyText(buildCost({landmark:true}),language)}</strong></span><MarblePropertyArt loading="eager" city={art} buildings={owned} landmark routeVersion={routeVersion} language={language} owner={tile.owner} className="mp-construction-card-art"/><small>{landmarkChoice?(ko?'빌라·빌딩·호텔 완성 · 전환 가능':'Tres edificios completos · disponible'):(ko?'재방문 또는 출발 정확 도착 때 가능':'Disponible al revisitar o llegar a Salida')}</small></label>:types.map(type=>{const built=owned.includes(type),locked=type==='hotel'&&laps<1;return <label key={type} className={`mp-construction-card ${built||selection.includes(type)?'is-selected':''} ${built||locked?'is-unavailable':''}`}><span className="mp-construction-card-title"><input type="checkbox" checked={built||selection.includes(type)} disabled={built||locked||!!tile.landmark} onChange={e=>{const checked=e.target.checked;setSelection(old=>toggleConstructionSelection(old,owned,type,checked,laps));}}/><b>{labels[type][language]}</b></span><MarblePropertyArt loading="eager" city={art} buildings={[type]} landmark={false} routeVersion={routeVersion} language={language} owner={tile.owner} className="mp-construction-card-art"/><strong>{moneyText(buildCost({buildings:[type]}),language)}</strong><small>{built?(ko?'건설 완료':'Construido'):locked?(ko?'출발 1회 통과 후':'Tras pasar Salida'):(type==='villa'?(ko?'선택 가능':'Disponible'):type==='building'?(ko?'빌라 함께 선택 · 해제 가능':'Incluye villa · puedes quitarla'):(ko?'빌라·빌딩 함께 · 해제 가능':'Incluye villa y edificio · ajustable'))}</small></label>})}
 </div>
 <div className="mp-construction-summary" aria-live="polite"><span>{ko?'총 결제':'Total'} <b>{moneyText(cost,language)}</b></span><span>{ko?'남는 현금':'Efectivo'} <b>{moneyText(cash-cost,language)}</b></span><span>{ko?'통행료':'Alquiler'} <b>{rent===null?(ko?'미확인':'Sin verificar'):moneyText(rent,language)}{inferred?'*':''}</b></span></div>
 {(inferred||cost>cash||error)&&<small className="mp-construction-notice" role={cost>cash||error?'alert':undefined}>{error?(ko?'처리하지 못했어요. 다시 시도해 주세요.':'No se pudo completar. Inténtalo de nuevo.'):cost>cash?(ko?`현금 ${moneyText(cost-cash,language)} 부족`:`Faltan ${moneyText(cost-cash,language)}`):(ko?'* 자료에서 재구성한 조합 통행료':'* Alquiler de combinación reconstruido')}</small>}
 <footer className="mp-construction-footer">{onCancel&&<button type="button" className="mp-construction-cancel" onClick={()=>{if(!disabled&&!lock.current)void onCancel();}}>{ko?'건너뛰기':'Omitir'}</button>}<button type="button" id={id} className="mp-action mp-action-primary mt-primary" disabled={!selected||cost>cash||disabled||pending} onClick={()=>void confirm()}>{pending?(ko?'처리 중…':'Procesando…'):buy?(ko?`구매 확정 · ${moneyText(cost,language)}`:`Comprar · ${moneyText(cost,language)}`):(ko?`건설 확정 · ${moneyText(cost,language)}`:`Construir · ${moneyText(cost,language)}`)}</button></footer>
 </fieldset>;
}
