import type { Language } from '../core/types';
import { buildingName, moneyText, rentValue } from './marble-visuals';

export function MarbleCityPortfolio({ tiles, owner, language, economicVersion, onInspect }: {
  tiles: Record<string, any>[];
  owner: string;
  language: Language;
  economicVersion: number;
  onInspect: (index: number) => void;
}) {
  const ko = language === 'ko';
  const title = ko ? '내 도시' : 'Mis ciudades';
  const modern = tiles.length === 40 || economicVersion >= 2;
  const cities = tiles.map((tile, index) => ({ tile, index })).filter(({ tile }) => tile.kind === 'property' && tile.owner === owner);
  return <section className="mp-center-portfolio" aria-label={title}>
    <header><h3>{title}</h3><span>{cities.length}</span></header>
    {cities.length ? <ul className="mp-center-portfolio-list">{cities.map(({ tile, index }) => {
      const name = String(tile.name?.[language] ?? '');
      const level = Number(tile.houses) || 0;
      const stage = `${buildingName(level, language, modern) || (ko ? '미건설' : 'Sin construir')} · ${ko ? `${level}단계` : `nivel ${level}`}`;
      const rent = moneyText(rentValue(tile, modern, economicVersion), language);
      return <li key={index}>
        <button type="button" className="mp-center-portfolio-city" onClick={() => onInspect(index)} aria-label={ko ? `${name} 도시 카드 열기 · ${stage} · 통행료 ${rent}` : `Abrir tarjeta de ${name} · ${stage} · Alquiler ${rent}`}>
          <strong>{name}</strong><span className="mp-center-portfolio-stage">{stage}</span>
          <span className="mp-center-portfolio-rent"><small>{ko ? '통행료' : 'Alquiler'}</small><b>{rent}</b></span>
        </button>
      </li>;
    })}</ul> : <p>{ko ? '아직 내 도시가 없어요. 구매한 도시가 여기에 표시돼요.' : 'Aún no tienes ciudades. Las que compres aparecerán aquí.'}</p>}
  </section>;
}
