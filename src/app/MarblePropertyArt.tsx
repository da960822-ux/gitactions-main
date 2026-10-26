import type { CSSProperties } from 'react';
import { useId } from 'react';
import type { Language } from '../core/types';
import dioramas from '../../public/images/marble/dioramas/manifest.json';
import { MarbleWorldHotelArt, MarbleWorldLandmarkArt } from './MarbleWorldLandmarkArt';

const cityColors: Record<string, string> = {
  gwangju: '#70a689', 'santo-domingo': '#d1ad74', madrid: '#c88779', santiago: '#b88378',
  'puerto-plata': '#9882b1', 'san-juan': '#ae89b6', 'la-vega': '#d49c66', 'punta-cana': '#dbb377',
  'new-york': '#b77474', paris: '#cb8395', tokyo: '#d0b268', barcelona: '#c99c61', samana: '#75aaa3',
  havana: '#8ab7a8', 'mexico-city': '#6b9397', lisbon: '#80a4a2', london: '#c088a8', rome: '#ce999c',
  miami: '#b08f76', valparaiso: '#b78269', cebu: '#cba357', toronto: '#bca871', auckland: '#96aab7',
  vancouver: '#8b9fab', newark: '#a67965', seoul: '#7898b0',
  berlin: '#d49c66', istanbul: '#75aaa3', agra: '#b78269', athens: '#cba357', sydney: '#96aab7',
  bangkok:'#c7a06c',beijing:'#b97566',taipei:'#82a9aa',dubai:'#8db7bd',cairo:'#d6ad76',quebec:'#8ca4a2','sao-paulo':'#83a4a4',prague:'#b77964',moscow:'#b68181',geneva:'#87aebb',
};

type PropertyArtProps = { city: string; level?: number; className?: string; routeVersion?: number; language?: Language; owner?: 'p1'|'p2'|'p3'|'p4'|null; ownerLabel?: string };
export function MarblePropertyArt({owner, ownerLabel, className = '', ...props}: PropertyArtProps) {
  if (owner === undefined) return <MarblePropertyImage {...props} className={className}/>;
  return <span className={`${className} mp-property-art-frame`} data-marble-owner={owner ?? 'bank'} title={ownerLabel} data-building-level={props.level ?? 0} aria-hidden="true"><MarblePropertyImage {...props} className="mp-property-art-image"/><span className="mp-building-plinth"/></span>;
}
function MarblePropertyImage({ city, level = 0, className = '', routeVersion = 2, language = 'ko' }: { city: string; level?: number; className?: string; routeVersion?: number; language?: Language }) {
  const tintId = `mp-building-${useId().replace(/:/g, '')}`;
  // A vacant city is open land; the completed landmark appears only at the route's final stage.
  if (routeVersion >= 3 && level === 0) return <svg className={className} viewBox="0 40 128 80" style={{ color: cityColors[city] ?? '#a7b7aa' } as CSSProperties} data-building-level={0} aria-hidden="true" focusable="false">
    <ellipse cx="65" cy="106" rx="52" ry="8" fill="#193f43" opacity=".18"/>
    <path d="m12 81 61-18 44 20-61 20Z" fill="#a7ba91" stroke="#5f806f" strokeWidth="3"/>
    <path d="m25 81 47-13 31 14-47 15Z" fill="#ccb687" stroke="#8e7651" strokeWidth="2"/>
    <path d="m39 82 30-8 20 9-30 9Z" fill="currentColor" opacity=".32"/>
    <path d="m25 80 47-13 31 15-47 15Z" fill="none" stroke="#f8edc9" strokeWidth="1.8" strokeDasharray="3 4"/>
    <path d="M26 82v-10m78 11V73" stroke="#735e46" strokeWidth="3" strokeLinecap="round"/>
    <path d="m20 72 6-6 6 6zm78 1 6-6 6 6Z" fill="#f0c875" stroke="#7b6348" strokeWidth="1.5"/>
    <path d="m38 91 3-5 4 4m36-6 4-5 4 4" fill="none" stroke="#4c8b65" strokeWidth="3" strokeLinecap="round"/>
  </svg>;
  if (routeVersion >= 3 && level > 0) {
    if (routeVersion >= 4 && level === 3) return <MarbleWorldHotelArt className={className} color={cityColors[city] ?? '#a7b7aa'}/>;
    const asset = level === 1 ? dioramas.commonStages.house : level === 2 ? dioramas.commonStages.apartment : dioramas.assets.find(asset => asset.slug === city);
    if (asset?.path && level < 3) return <svg className={className} data-building-level={level} data-city-color={cityColors[city] ?? '#a7b7aa'} viewBox={`0 0 ${asset.width} ${asset.height}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
      <defs><filter id={tintId} colorInterpolationFilters="sRGB">
        {/* Tint warm roofs or neutral masonry while preserving the source shading and plants. */}
        <feColorMatrix in="SourceGraphic" type="matrix" values={`0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${level === 1 ? '3 -2 -1 0 -.05' : '-2 -2 4 0 .2'}`} result="color-area"/>
        <feComposite in="color-area" in2="SourceGraphic" operator="in" result="masked-area"/>
        <feFlood floodColor={cityColors[city] ?? '#a7b7aa'} result="city-color"/>
        <feComposite in="city-color" in2="masked-area" operator="in" result="tint"/>
        <feBlend in="SourceGraphic" in2="tint" mode="multiply"/>
      </filter></defs>
      <image href={asset.path} width={asset.width} height={asset.height} filter={`url(#${tintId})`}/>
    </svg>;
    if (asset?.path) return <img className={className} data-building-level={Math.min(routeVersion>=4?4:3, level)} src={asset.path} alt="" aria-hidden="true" loading="lazy" decoding="async"/>;
    if (routeVersion >= 4 && level >= 4) return <MarbleWorldLandmarkArt className={className} city={city} color={cityColors[city] ?? '#a7b7aa'}/>;
    return <span className={`${className} mp-art-pending`} data-building-level={Math.min(3, level)} data-art-pending={city} aria-hidden="true">{language === 'ko' ? '그림 준비 중' : 'Imagen pendiente'}</span>;
  }
  if (level >= 3) {
    const landmark = ['newark', 'seoul', 'gwangju', 'santo-domingo', 'santiago', 'samana', 'lisbon', 'mexico-city', 'punta-cana', 'la-vega'].includes(city);
    return <img className={className} data-building-level={3} src={`/images/marble/${landmark ? 'landmarks' : 'cities'}/${city}.svg`} alt="" aria-hidden="true" loading="lazy" decoding="async"/>;
  }
  return <svg className={className} viewBox="0 0 128 128" aria-hidden="true" focusable="false" style={{ color: cityColors[city] ?? '#a7b7aa' } as CSSProperties} data-building-level={level}>
    <use href={`/images/marble/building-stages.svg#${level === 1 ? 'villa' : level === 2 ? 'building' : 'land'}`}/>
  </svg>;
}
