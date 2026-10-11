import type { CSSProperties } from 'react';

const cityColors: Record<string, string> = {
  gwangju: '#70a689', 'santo-domingo': '#d1ad74', madrid: '#c88779', santiago: '#b88378',
  'puerto-plata': '#9882b1', 'san-juan': '#ae89b6', 'la-vega': '#d49c66', 'punta-cana': '#dbb377',
  'new-york': '#b77474', paris: '#cb8395', tokyo: '#d0b268', barcelona: '#c99c61', samana: '#75aaa3',
  havana: '#8ab7a8', 'mexico-city': '#6b9397', lisbon: '#80a4a2', london: '#c088a8', rome: '#ce999c',
  miami: '#b08f76', valparaiso: '#b78269', cebu: '#cba357', toronto: '#bca871', auckland: '#96aab7',
  vancouver: '#8b9fab', newark: '#a67965', seoul: '#7898b0',
};

export function MarblePropertyArt({ city, level = 0, className = '' }: { city: string; level?: number; className?: string }) {
  if (level !== 1 && level !== 2) {
    const landmark = city === 'newark' || city === 'seoul' || level >= 3 && ['gwangju', 'santo-domingo', 'santiago', 'samana', 'lisbon', 'mexico-city', 'punta-cana', 'la-vega'].includes(city);
    return <img className={className} src={`/images/marble/${landmark ? 'landmarks' : 'cities'}/${city}.svg`} alt="" aria-hidden="true" loading="lazy" decoding="async"/>;
  }
  return <svg className={className} viewBox="0 0 128 128" aria-hidden="true" focusable="false" style={{ color: cityColors[city] ?? '#a7b7aa' } as CSSProperties} data-building-level={level}>
    <use href={`/images/marble/building-stages.svg#${level === 1 ? 'villa' : 'building'}`}/>
  </svg>;
}
