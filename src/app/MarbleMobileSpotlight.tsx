import type { Language } from '../core/types';
import { MarblePropertyArt } from './MarblePropertyArt';
import { moneyText } from './marble-visuals';
import { buildingName } from './marble-visuals';

export function MarbleMobileSpotlight({name,city,level,owner,ownerLabel,price,toll,language,routeVersion=3}: {
  name:string;city:string|null;level:number;owner:'p1'|'p2'|'p3'|'p4'|null;ownerLabel:string;
  price:number|null;toll:number|null;language:Language;routeVersion?:number;
}) {
  const ko=language==='ko';
  return <aside className="mp-mobile-spotlight" aria-live="polite" aria-label={ko?'선택한 칸 확대':'Casilla seleccionada ampliada'}>
    {city&&<MarblePropertyArt className="mp-mobile-spotlight-art" city={city} level={level} owner={owner} ownerLabel={ownerLabel} routeVersion={routeVersion} language={language}/>}
    <div><small>{ko?'선택한 칸':'Casilla seleccionada'}</small><strong>{name}</strong><span>{owner?`${ko?'소유':'Dueño'} ${ownerLabel}`:ko?'은행 소유':'Del banco'}{city&&level>0?` · ${buildingName(level,language,true,routeVersion)}`:''}</span>{price!==null&&<b>{owner?ko?'통행료':'Alquiler':ko?'매입':'Compra'} {moneyText(owner?toll??0:price,language)}</b>}</div>
  </aside>;
}
