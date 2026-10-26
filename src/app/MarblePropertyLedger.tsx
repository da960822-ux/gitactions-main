import type { GameAction, Language } from '../core/types';
import { marbleBuildCost, marbleCityValue, marbleTakeoverPrice, type MarbleTile } from '../games/marble';
import { marbleRentAtStage } from '../games/marble-economy';
import { selectMarblePropertySale } from '../games/marble-actions';

const t = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
export function MarblePropertyLedger({ tile, language, economicVersion, propertyRulesVersion, multiplier = 1 }: { tile: MarbleTile; language: Language; economicVersion?: number; propertyRulesVersion?: number; multiplier?: number }) {
  return <table className="marble-property-ledger"><caption>{t(language, '단계별 금액', 'Importes por nivel')}</caption><thead><tr><th>{t(language, '단계', 'Nivel')}</th><th>{t(language, '추가비', 'Costo extra')}</th><th>{t(language, '누적', 'Invertido')}</th><th>{t(language, '통행료', 'Alquiler')}</th>{propertyRulesVersion === 1 && <th>{t(language, '인수', 'Adquirir')}</th>}</tr></thead><tbody>{[0,1,2,3].map(level => <tr key={level}><th>{level === 0 ? t(language, '대지', 'Terreno') : level === 3 ? t(language, '랜드마크', 'Monumento') : `${level}`}</th><td>{level === 0 ? tile.price : marbleBuildCost(tile, level - 1, economicVersion)}</td><td>{marbleCityValue(tile, level, economicVersion)}</td><td>{marbleRentAtStage(tile.rent ?? 0, level, economicVersion, true, tile.rentMultipliers, multiplier)}</td>{propertyRulesVersion === 1 && <td>{marbleTakeoverPrice(tile, level, economicVersion) ?? t(language, '불가', 'Protegido')}</td>}</tr>)}</tbody></table>;
}
type SaleChoice = { label: Record<Language, string>; action: GameAction };
export function MarblePropertySale({ choices, language, runAction, selectedTile, onSelectTile, disabled = false }: { choices: SaleChoice[]; language: Language; runAction: (action: GameAction) => unknown; selectedTile: number | null; onSelectTile: (tile: number) => void; disabled?: boolean }) {
  const choice = selectMarblePropertySale(choices, selectedTile);
  if (!choice) return null;
  return <div className="marble-property-sale"><label>{t(language, '도시 매각으로 지급', 'Vender para pagar')}<select value={String(choice.action.payload?.tile)} onChange={event => onSelectTile(Number(event.target.value))} disabled={disabled}>{choices.map(item => <option key={String(item.action.payload?.tile)} value={String(item.action.payload?.tile)}>{item.label[language]}</option>)}</select></label><button disabled={disabled} onClick={() => void runAction(choice.action)}>{t(language, '선택 도시·건물 매각', 'Vender ciudad y edificios')}</button></div>;
}
