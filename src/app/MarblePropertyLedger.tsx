import type { GameAction, Language } from '../core/types';
import { marbleBuildCost, marbleCityValue, marbleTakeoverPrice, type MarbleTile } from '../games/marble';
import { marbleRentAtStage } from '../games/marble-economy';
import { selectMarblePropertySale } from '../games/marble-actions';
import { classicMarbleAcquisitionPrice, classicMarbleCityToll, classicMarbleConstructionCost, classicMarbleReferenceProfile, type ClassicMarbleBuildings, type ClassicMarbleStructure } from '../games/marble-reference-profile';

const t = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
export function MarblePropertyLedger({ tile, language, economicVersion, propertyRulesVersion, multiplier = 1 }: { tile: MarbleTile; language: Language; economicVersion?: number; propertyRulesVersion?: number; multiplier?: number }) {
  if (tile.referenceProfileId === classicMarbleReferenceProfile.id && tile.referenceCity) {
    const city = classicMarbleReferenceProfile.cities.find(item => item.name === tile.referenceCity);
    if (city) {
      const structures: readonly ClassicMarbleStructure[] = ['villa', 'building', 'hotel', 'landmark'];
      const activeBuildings = (tile as MarbleTile & { buildings?: ClassicMarbleBuildings }).buildings ?? {};
      const masks = [{}, { villa: true }, { villa: true, building: true }, { villa: true, building: true, hotel: true }, { villa: true, building: true, hotel: true, landmark: true }];
      return <table className="marble-property-ledger"><caption>{t(language, '단계별 금액 · 원본 비즈니스 클래스', 'Importes por etapa · clase Business de referencia')}</caption><thead><tr><th>{t(language, '단계', 'Nivel')}</th><th>{t(language, '추가비', 'Costo extra')}</th><th>{t(language, '누적 투자', 'Invertido')}</th><th>{t(language, '통행료', 'Alquiler')}</th><th>{t(language, '인수', 'Adquirir')}</th></tr></thead><tbody>{masks.map((buildings, level) => {
        const extra = level === 0 ? city.land : classicMarbleConstructionCost(city.name, structures[level - 1]);
        const investment = city.land + structures.slice(0, level).reduce((sum, structure) => sum + classicMarbleConstructionCost(city.name, structure)!, 0);
        const current = structures.every(structure => Boolean(buildings[structure]) === Boolean(activeBuildings[structure]));
        return <tr key={level} data-current-stage={current ? 'true' : undefined}><th>{level === 0 ? t(language, '대지', 'Terreno') : [t(language, '빌라', 'Villa'), t(language, '빌딩', 'Edificio'), t(language, '호텔', 'Hotel'), t(language, '랜드마크', 'Monumento')][level - 1]}</th><td>{extra}</td><td>{investment}</td><td>{classicMarbleCityToll(city.name, buildings)}</td><td>{classicMarbleAcquisitionPrice(city.name, buildings)}</td></tr>;
      })}</tbody></table>;
    }
  }
  return <table className="marble-property-ledger"><caption>{t(language, '단계별 금액', 'Importes por nivel')}</caption><thead><tr><th>{t(language, '단계', 'Nivel')}</th><th>{t(language, '추가비', 'Costo extra')}</th><th>{t(language, '누적', 'Invertido')}</th><th>{t(language, '통행료', 'Alquiler')}</th>{propertyRulesVersion === 1 && <th>{t(language, '인수', 'Adquirir')}</th>}</tr></thead><tbody>{[0,1,2,3].map(level => <tr key={level}><th>{level === 0 ? t(language, '대지', 'Terreno') : level === 3 ? t(language, '랜드마크', 'Monumento') : `${level}`}</th><td>{level === 0 ? tile.price : marbleBuildCost(tile, level - 1, economicVersion)}</td><td>{marbleCityValue(tile, level, economicVersion)}</td><td>{marbleRentAtStage(tile.rent ?? 0, level, economicVersion, true, tile.rentMultipliers, multiplier)}</td>{propertyRulesVersion === 1 && <td>{marbleTakeoverPrice(tile, level, economicVersion) ?? t(language, '불가', 'Protegido')}</td>}</tr>)}</tbody></table>;
}
type SaleChoice = { label: Record<Language, string>; action: GameAction };
export function MarblePropertySale({ choices, language, runAction, selectedTile, onSelectTile, disabled = false }: { choices: SaleChoice[]; language: Language; runAction: (action: GameAction) => unknown; selectedTile: number | null; onSelectTile: (tile: number) => void; disabled?: boolean }) {
  const choice = selectMarblePropertySale(choices, selectedTile);
  if (!choice) return null;
  return <div className="marble-property-sale"><label>{t(language, '도시 매각으로 지급', 'Vender para pagar')}<select value={String(choice.action.payload?.tile)} onChange={event => onSelectTile(Number(event.target.value))} disabled={disabled}>{choices.map(item => <option key={String(item.action.payload?.tile)} value={String(item.action.payload?.tile)}>{item.label[language]}</option>)}</select></label><button disabled={disabled} onClick={() => void runAction(choice.action)}>{t(language, '선택 도시·건물 매각', 'Vender ciudad y edificios')}</button></div>;
}
