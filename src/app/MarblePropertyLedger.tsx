import { useState } from 'react';
import type { GameAction, Language } from '../core/types';
import { marbleBuildCost, marbleCityValue, marbleTakeoverPrice, type MarbleTile } from '../games/marble';
import { marbleBaseRent, marbleBuildCostAtPrice, marbleCityValueAtPrice, marbleLandPrice, marbleRentAtBase, marbleTakeoverPriceAtPrice } from '../games/marbleEconomy';

const t = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
export function MarblePropertyLedger({ tile, language, economicVersion, propertyRulesVersion, multiplier = 1, effectiveValues = false }: { tile: MarbleTile; language: Language; economicVersion?: number; propertyRulesVersion?: number; multiplier?: number; effectiveValues?: boolean }) {
  const land = effectiveValues ? tile.price ?? 0 : marbleLandPrice(tile, economicVersion);
  const baseRent = effectiveValues ? tile.rent ?? 0 : marbleBaseRent(tile, economicVersion);
  const buildCost = (level: number) => effectiveValues ? marbleBuildCostAtPrice(land, level, economicVersion) : marbleBuildCost(tile, level, economicVersion);
  const invested = (level: number) => effectiveValues ? marbleCityValueAtPrice(land, level, economicVersion) : marbleCityValue(tile, level, economicVersion);
  const takeover = (level: number) => effectiveValues ? marbleTakeoverPriceAtPrice(land, level, economicVersion) : marbleTakeoverPrice(tile, level, economicVersion);
  return <table className="marble-property-ledger"><caption>{t(language, '단계별 금액', 'Importes por nivel')}</caption><thead><tr><th>{t(language, '단계', 'Nivel')}</th><th>{t(language, '추가비', 'Costo extra')}</th><th>{t(language, '누적', 'Invertido')}</th><th>{t(language, '통행료', 'Alquiler')}</th>{propertyRulesVersion === 1 && <th>{t(language, '인수', 'Adquirir')}</th>}</tr></thead><tbody>{[0,1,2,3].map(level => <tr key={level}><th>{level === 0 ? t(language, '대지', 'Terreno') : level === 3 ? t(language, '랜드마크', 'Monumento') : `${level}`}</th><td>{level === 0 ? land : buildCost(level - 1)}</td><td>{invested(level)}</td><td>{marbleRentAtBase(baseRent, level, economicVersion, multiplier)}</td>{propertyRulesVersion === 1 && <td>{takeover(level) ?? t(language, '불가', 'Protegido')}</td>}</tr>)}</tbody></table>;
}
export function MarblePropertySale({ choices, language, runAction, disabled = false }: { choices: { label: Record<Language, string>; action: GameAction }[]; language: Language; runAction: (action: GameAction) => unknown; disabled?: boolean }) {
  const [selected, setSelected] = useState('');
  const choice = choices.find(item => String(item.action.payload?.tile) === selected) ?? choices[0];
  if (!choice) return null;
  return <div className="marble-property-sale"><label>{t(language, '도시 매각으로 지급', 'Vender para pagar')}<select value={String(choice.action.payload?.tile)} onChange={event => setSelected(event.target.value)} disabled={disabled}>{choices.map(item => <option key={String(item.action.payload?.tile)} value={String(item.action.payload?.tile)}>{item.label[language]}</option>)}</select></label><button disabled={disabled} onClick={() => void runAction(choice.action)}>{t(language, '선택 도시·건물 매각', 'Vender ciudad y edificios')}</button></div>;
}
