import { useRef, useState } from 'react';
import type { GameAction, Language } from '../core/types';
import { marbleBuildCost, marbleCityValue, marbleTakeoverPrice, type MarbleTile } from '../games/marble';
import { constructionCostAtPrice, constructionRentAtBase, constructionValueAtPrice, type MarbleConstruction, type MarbleConstructionSelection } from '../games/marbleConstruction';
import { classicBuildingMask, classicConstructionCost, classicInvestment, classicSaleValue, classicTakeoverPrice, classicToll } from '../games/marbleClassicEconomy';
import { marbleBaseRent, marbleBuildCostAtPrice, marbleCityValueAtPrice, marbleLandPrice, marbleRentAtBase, marbleTakeoverPriceAtPrice } from '../games/marbleEconomy';

const t = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
export function MarblePropertyLedger({ tile, language, economicVersion, propertyRulesVersion, multiplier = 1, effectiveValues = false, constructionRulesVersion }: { tile: MarbleTile; language: Language; economicVersion?: number; propertyRulesVersion?: number; multiplier?: number; effectiveValues?: boolean; constructionRulesVersion?:number }) {
  if(tile.kind==='tourism')return <table className="marble-property-ledger"><caption>{t(language,'관광지 · 건설 불가 · 할인권으로만 인수','Turismo · sin construcción; adquisición solo con cupón')}</caption><thead><tr><th>{t(language,'구매','Compra')}</th><th>{t(language,'통행료','Alquiler')}</th><th>{t(language,'매각','Venta')}</th></tr></thead><tbody><tr><td>{tile.price}</td><td>{tile.rent}</td><td>{Number(tile.price??0)/2}</td></tr></tbody></table>;
  const economy = tile.cityEconomy;
  const land = economy?.landCost ?? (effectiveValues ? tile.price ?? 0 : marbleLandPrice(tile, economicVersion));
  const baseRent = economy ? economy.tollByMask[0] ?? 0 : effectiveValues ? tile.rent ?? 0 : marbleBaseRent(tile, economicVersion);
  const buildCost = (level: number) => effectiveValues ? marbleBuildCostAtPrice(land, level, economicVersion) : marbleBuildCost(tile, level, economicVersion);
  const invested = (level: number) => effectiveValues ? marbleCityValueAtPrice(land, level, economicVersion) : marbleCityValue(tile, level, economicVersion);
  const takeover = (level: number) => effectiveValues ? marbleTakeoverPriceAtPrice(land, level, economicVersion) : marbleTakeoverPrice(tile, level, economicVersion);
  if(economy || constructionRulesVersion===2) {
    const stages:{name:string;property:MarbleConstruction;selection?:MarbleConstructionSelection}[] = [
      {name:t(language,'대지','Terreno'),property:{houses:0,buildings:[]}},
      ...(['villa','building','hotel'] as const).map((kind,index)=>({name:(language==='ko'?['빌라','빌딩','호텔']:['Villa','Edificio','Hotel'])[index],property:{houses:1,buildings:[kind]},selection:{buildings:[kind]}})),
      {name:t(language,'3종 + 랜드마크','Los tres + monumento'),property:{houses:3,buildings:['villa','building','hotel'],landmark:true},selection:{landmark:true}},
    ];
    return <table className="marble-property-ledger"><caption>{t(language,'건설별 금액 · 각 건물 단독 기준','Importes por construcción · edificios individuales')}{economy&&<small>{t(language,' · * 조합 통행료는 자료의 단계별 금액에서 재구성한 추정값입니다.',' · * Alquiler de combinación reconstruido a partir de los niveles de la fuente; no verificado directamente.')}</small>}</caption><thead><tr><th>{t(language,'건물','Edificio')}</th><th>{t(language,'추가비','Costo extra')}</th><th>{t(language,'땅 포함 투자액','Inversión con terreno')}</th><th>{t(language,'기본 통행료','Alquiler base')}</th><th>{t(language,'인수','Adquirir')}</th>{economy&&<th>{t(language,'매각','Venta')}</th>}</tr></thead><tbody>{stages.map(({name,property,selection})=>{
      const inferred = !!economy && !property.landmark && economy.inferredTollMasks.includes(classicBuildingMask(property));
      const cost = selection ? economy ? classicConstructionCost(economy,selection) : constructionCostAtPrice(land,selection,economicVersion) : land;
      const value = economy ? classicInvestment(economy,property) : constructionValueAtPrice(land,property,economicVersion);
      const rent = economy ? classicToll(economy,property,multiplier) : constructionRentAtBase(baseRent,property,multiplier);
      const acquire = economy ? classicTakeoverPrice(economy,property) : property.landmark ? null : value*2;
      return <tr key={name}><th>{name}</th><td>{cost}</td><td>{value}</td><td data-inferred={inferred || undefined}>{rent ?? t(language,'미확인','Sin verificar')}{inferred?' *':''}</td><td>{acquire ?? t(language,'불가','Protegido')}</td>{economy&&<td>{classicSaleValue(economy,property)}</td>}</tr>;
    })}</tbody></table>;
  }
  return <table className="marble-property-ledger"><caption>{t(language, '단계별 금액', 'Importes por nivel')}</caption><thead><tr><th>{t(language, '단계', 'Nivel')}</th><th>{t(language, '추가비', 'Costo extra')}</th><th>{t(language, '누적', 'Invertido')}</th><th>{t(language, '통행료', 'Alquiler')}</th>{propertyRulesVersion === 1 && <th>{t(language, '인수', 'Adquirir')}</th>}</tr></thead><tbody>{[0,1,2,3].map(level => <tr key={level}><th>{level === 0 ? t(language, '대지', 'Terreno') : level === 3 ? t(language, '랜드마크', 'Monumento') : `${level}`}</th><td>{level === 0 ? land : buildCost(level - 1)}</td><td>{invested(level)}</td><td>{marbleRentAtBase(baseRent, level, economicVersion, multiplier)}</td>{propertyRulesVersion === 1 && <td>{takeover(level) ?? t(language, '불가', 'Protegido')}</td>}</tr>)}</tbody></table>;
}
export type MarbleSalePreview = { name:string; buildings:string; refund:number; toll:number; groupLost?:boolean; groupTollLost?:boolean };
export function MarblePropertySale({ choices, language, runAction, disabled = false, cash = 0, obligation = 0, preview, compact = false, initiallyOpen = false }: { compact?:boolean; initiallyOpen?:boolean; choices: { label: Record<Language, string>; action: GameAction }[]; language: Language; runAction: (action: GameAction) => unknown; disabled?: boolean; cash?:number; obligation?:number; preview?:(tile:number)=>MarbleSalePreview }) {
  const [selected, setSelected] = useState('');
  const [saleOpen,setSaleOpen] = useState(initiallyOpen);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const choice = choices.find(item => String(item.action.payload?.tile) === selected) ?? choices[0];
  if (!choice) return null;
  const info = preview?.(Number(choice.action.payload?.tile));
  const after = cash + (info?.refund ?? 0) - obligation;
  const sell = async () => {
    if (disabled || pendingRef.current) return;
    pendingRef.current = true; setPending(true);
    try { await runAction(choice.action); } finally { pendingRef.current = false; setPending(false); }
  };
  if(compact)return <details className="mp-sale-choice" open={saleOpen} onToggle={event=>setSaleOpen(event.currentTarget.open)}><summary>{t(language,'자산 매각','Vender propiedad')}</summary><div className="marble-property-sale is-compact">
    <label><span className="mp-construction-sr">{t(language,'매각할 자산','Propiedad a vender')}</span><select value={String(choice.action.payload?.tile)} onChange={event=>setSelected(event.target.value)} disabled={disabled||pending}>{choices.map(item=><option key={String(item.action.payload?.tile)} value={String(item.action.payload?.tile)}>{item.label[language]}</option>)}</select></label>
    {info&&<div className="mp-sale-compact-quote" aria-live="polite"><p><b>{t(language,`받기 ${info.refund}`,`Recibes ${info.refund}`)}</b> · {after>=0?t(language,`지급 후 현금 ${after}`,`quedan ${after} tras pagar`):t(language,`매각 후 ${-after} 부족`,`aún faltan ${-after}`)}</p>{info.groupLost&&<strong>{t(language,'색상 독점 해제','Se pierde el color completo')}</strong>}</div>}
    <button disabled={disabled||pending} onClick={()=>void sell()}>{t(language,'선택 자산 매각 확정','Confirmar venta')}</button>
    <details className="mp-sale-consequences"><summary>{t(language,'매각 결과 자세히','Consecuencias de la venta')}</summary><p>{t(language,'선택 도시와 모든 건물을 은행에 반환합니다. 매각은 되돌릴 수 없습니다.','Devuelves la propiedad y todos sus edificios al banco. La venta es irreversible.')}</p>{info&&<><p>{info.name} · {info.buildings} · {t(language,`통행료 ${info.toll} → 0`,`alquiler ${info.toll} → 0`)}</p><p>{t(language,`지급 필요 ${obligation} · 현재 부족 ${Math.max(0,obligation-cash)}`,`Pago pendiente ${obligation} · faltan ahora ${Math.max(0,obligation-cash)}`)}</p>{info.groupLost && info.groupTollLost !== false&&<p>{t(language,'같은 그룹의 다른 도시 통행료도 감소합니다.','También baja el alquiler de las demás ciudades del grupo.')}</p>}</>}</details>
  </div></details>;
  return <div className="marble-property-sale"><label>{t(language, '도시 매각으로 지급', 'Vender para pagar')}<select value={String(choice.action.payload?.tile)} onChange={event => setSelected(event.target.value)} disabled={disabled||pending}>{choices.map(item => <option key={String(item.action.payload?.tile)} value={String(item.action.payload?.tile)}>{item.label[language]}</option>)}</select></label>
    {info&&<div className="mp-sale-preview" aria-live="polite"><strong>{info.name} · {info.buildings}</strong><p>{t(language, `매각 대금 ${info.refund} · 통행료 ${info.toll} → 0`, `Recibes ${info.refund} · alquiler ${info.toll} → 0`)}</p><p>{t(language, `지급 필요 ${obligation} · 현재 부족 ${Math.max(0,obligation-cash)}`, `Pago pendiente ${obligation} · faltan ahora ${Math.max(0,obligation-cash)}`)}</p><p>{after>=0?t(language, `매각 즉시 지급 완료 · 남는 현금 ${after}`, `El pago se completa al vender · efectivo restante ${after}`):t(language, `매각 후에도 ${-after} 부족 · 지급 대기`, `Todavía faltan ${-after} después de vender · pago pendiente`)}</p>{info.groupLost&&<strong>{info.groupTollLost === false ? t(language, '완성 색상군 해제', 'Pierdes el color completo') : t(language, '완성 색상군 해제 · 같은 그룹 도시 통행료도 감소', 'Pierdes el color completo; baja el alquiler de las demás ciudades del grupo')}</strong>}</div>}
    <p>{t(language, '선택 도시와 모든 건물을 은행에 반환합니다. 매각은 되돌릴 수 없습니다.', 'Devuelves la ciudad seleccionada y todos sus edificios al banco. La venta no se puede deshacer.')}</p>
    <button disabled={disabled||pending} onClick={()=>void sell()}>{t(language, '선택 도시·건물 매각 확정', 'Confirmar venta de ciudad y edificios')}</button></div>;
}
