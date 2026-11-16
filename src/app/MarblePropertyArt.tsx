import { marbleDestinationImage } from './marble-destination-art';
import { marbleLandmarkAsset } from './marble-world-theme';
import type { CSSProperties } from 'react';
import { useId } from 'react';
import type { Language } from '../core/types';
import dioramas from '../../public/images/marble/dioramas/manifest.json';

const cityColors: Record<string, string> = {
  gwangju: '#70a689', 'santo-domingo': '#d1ad74', madrid: '#c88779', santiago: '#b88378',
  'puerto-plata': '#9882b1', 'san-juan': '#ae89b6', 'la-vega': '#d49c66', 'punta-cana': '#dbb377',
  'new-york': '#b77474', paris: '#cb8395', tokyo: '#d0b268', barcelona: '#c99c61', samana: '#75aaa3',
  havana: '#8ab7a8', 'mexico-city': '#6b9397', lisbon: '#80a4a2', london: '#c088a8', rome: '#ce999c',
  miami: '#b08f76', valparaiso: '#b78269', cebu: '#cba357', toronto: '#bca871', auckland: '#96aab7',
  vancouver: '#8b9fab', incheon:'#779fad', dubai:'#a67965', newark: '#a67965', seoul: '#7898b0',
  berlin: '#d49c66', istanbul: '#75aaa3', agra: '#b78269', athens: '#cba357', sydney: '#96aab7',
};
const ownerColors = { p1: '#cf6473', p2: '#398d80', p3: '#92596b', p4: '#2b6b62' };

export type MarbleBuilding = 'villa' | 'building' | 'hotel';
type PropertyArtProps = { loading?: 'eager'|'lazy'; buildings?: MarbleBuilding[]; landmark?: boolean; city: string; level?: number; className?: string; routeVersion?: number; language?: Language; owner?: 'p1'|'p2'|'p3'|'p4'|null; ownerLabel?: string };
export function MarblePropertyArt({owner, ownerLabel, buildings, landmark, className = '', ...props}: PropertyArtProps) {
  if (props.city.startsWith('tourism')) return <MarblePropertyImage {...props} className={className}/>;
  if (buildings !== undefined || landmark !== undefined) return <span className={`${className} mp-property-art-frame mp-building-cluster ${landmark ? 'is-landmark' : ''}`} data-marble-owner={owner ?? 'bank'} data-building-level={landmark ? 3 : buildings?.length ? 2 : 0} data-building-count={buildings?.length ?? 0} title={ownerLabel} aria-hidden="true">
    <span className="mp-city-ground"/>
    {landmark ? props.city.startsWith('korea-') ? <span className="mp-cluster-landmark mp-generic-landmark" data-art-placeholder="regional-landmark"><HotelArt color={owner ? ownerColors[owner] : '#c9a04a'}/></span> : <MarblePropertyImage {...props} level={3} owner={owner} className="mp-cluster-landmark"/> : buildings?.length ? (['villa','building','hotel'] as const).filter(kind => buildings.includes(kind)).map(kind => <span key={kind} className={`mp-cluster-building mp-cluster-${kind}`} data-building-kind={kind}>{kind === 'hotel' ? <HotelArt color={owner ? ownerColors[owner] : cityColors[props.city]}/> : <MarblePropertyImage {...props} level={kind === 'villa' ? 1 : 2} owner={owner} className="mp-cluster-asset"/>}</span>) : <MarblePropertyImage {...props} level={0} owner={owner} className="mp-cluster-land"/>}
    {owner && <span className="mp-city-owner-flag" data-owner-seat={owner}>P{owner.slice(1)}</span>}
  </span>;
  if (owner === undefined) return <MarblePropertyImage {...props} className={className}/>;
  return <span className={`${className} mp-property-art-frame`} data-marble-owner={owner ?? 'bank'} title={ownerLabel} data-building-level={props.level ?? 0} aria-hidden="true"><MarblePropertyImage {...props} owner={owner} className="mp-property-art-image"/><span className="mp-building-plinth"/>{owner&&<span className="mp-city-owner-flag" data-owner-seat={owner}>P{owner.slice(1)}</span>}</span>;
}
function MarblePropertyImage({ city, level = 0, className = '', routeVersion = 2, language = 'ko', owner, loading = 'lazy' }: { city: string; level?: number; className?: string; routeVersion?: number; language?: Language; owner?: 'p1'|'p2'|'p3'|'p4'|null; loading?: 'eager'|'lazy' }) {
  if(city==='dubai'&&routeVersion<3)city='newark';
  const tintId = `mp-building-${useId().replace(/:/g, '')}`;
  if(city==='tourism'||city.startsWith('tourism:')) return <img className={className} data-building-level="island" src={marbleDestinationImage(city.slice('tourism:'.length))} alt="" aria-hidden="true" decoding="async"/>;
  // A vacant city is surveyed land; its completed landmark only appears at level three.
  if (routeVersion >= 3 && level === 0) return <svg className={className} viewBox="0 34 128 80" style={{ color: cityColors[city] ?? '#a7b7aa' } as CSSProperties} data-building-level={0} aria-hidden="true" focusable="false">
    <ellipse cx="65" cy="108" rx="50" ry="11" fill="#193f43" opacity=".18"/>
    <path d="M10 77 64 107 118 77v8l-54 30-54-30Z" fill="#b6a27e" stroke="#756b54" strokeWidth="2"/>
    <path d="m24 88 8 5m11 5 8 5m16 5 8-5m13-7 8-5" stroke="#e4cf9d" strokeWidth="2"/>
    <path d="M10 77 66 49l52 28-54 30Z" fill="#f5e3b9" stroke="#6b7a6c" strokeWidth="3"/>
    <path d="M19 76 66 53l44 24-46 24Z" fill="currentColor" opacity=".74"/>
    <path d="M28 79 66 61l36 18-38 18Z" fill="#dce6d1" stroke="#86a996" strokeWidth="2"/>
    <path d="m28 79 36-18 38 18-38 18Z" fill="none" stroke="#7ba28c" strokeWidth="1.5" opacity=".75"/>
    <path d="m23 78 7-3m60 12 8-4M44 91l5-2M73 68l6 2" stroke="#6d926f" strokeWidth="2" strokeLinecap="round"/>
    <path d="m28 79 36 18m2-36 36 18" stroke="#b8cbb9" strokeWidth="2" strokeDasharray="3 4"/>
    <path d="M22 76V56m84 21V57M64 97V78" stroke="#765b3e" strokeWidth="4" strokeLinecap="round"/>
    <path d="m18 57 4-6 4 6Zm84 1 4-6 4 6ZM60 79l4-6 4 6Z" fill="#bd9860" stroke="#765b3e" strokeWidth="2"/>
    <path d="M48 63V39m1 1 23 5-23 8Z" fill="#f4efdd" stroke="#626b5d" strokeWidth="2"/>
    <path d="m10 77 54 30 54-30" fill="none" stroke="#9a7c52" strokeWidth="4" strokeLinejoin="round"/>
  </svg>;
  if (routeVersion >= 3 && level > 0) {
    const landmarkAsset=level>=3?marbleLandmarkAsset(city,routeVersion):undefined;
    if(landmarkAsset)return <img className={className} data-building-level={3} src={landmarkAsset} alt="" aria-hidden="true" loading={loading} decoding={loading==='eager'?'sync':'async'}/>;
    const asset = level === 1 ? dioramas.commonStages.house : level === 2 ? dioramas.commonStages.apartment : dioramas.assets.find(asset => asset.slug === city);
    if (asset?.path && level < 3) return <svg className={className} data-building-level={level} data-city-color={cityColors[city] ?? '#a7b7aa'} viewBox={`0 0 ${asset.width} ${asset.height}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
      <defs><filter id={tintId} colorInterpolationFilters="sRGB">
        {/* Tint warm roofs or neutral masonry while preserving the source shading and plants. */}
        <feColorMatrix in="SourceGraphic" type="matrix" values={`0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${level === 1 ? '3 -2 -1 0 -.05' : '1.1 1.1 1.1 0 -1.65'}`} result="color-area"/>
        <feComposite in="color-area" in2="SourceGraphic" operator="in" result="masked-area"/>
        <feFlood floodColor={owner ? ownerColors[owner] : cityColors[city] ?? '#a7b7aa'} result="city-color"/>
        <feComposite in="city-color" in2="masked-area" operator="in" result="tint"/>
        <feComponentTransfer in="tint" result="owner-paint"><feFuncA type="linear" slope="0.8"/></feComponentTransfer>
        <feComposite in="owner-paint" in2="SourceGraphic" operator="over"/>
      </filter></defs>
      <image href={asset.path} width={asset.width} height={asset.height} filter={`url(#${tintId})`}/>
    </svg>;
    if (asset?.path) return <img className={className} data-building-level={Math.min(3, level)} src={marbleLandmarkAsset(city,routeVersion) ?? asset.path} alt="" aria-hidden="true" loading={loading} decoding={loading==='eager'?'sync':'async'}/>;
    return <span className={`${className} mp-art-pending`} data-building-level={Math.min(3, level)} data-art-pending={city} aria-hidden="true">{language === 'ko' ? '그림 준비 중' : 'Imagen pendiente'}</span>;
  }
  if (level >= 3) {
    const landmark = ['newark', 'seoul', 'gwangju', 'santo-domingo', 'santiago', 'samana', 'lisbon', 'mexico-city', 'punta-cana', 'la-vega'].includes(city);
    return <img className={className} data-building-level={3} src={`/images/marble/${landmark ? 'landmarks' : 'cities'}/${city}.svg`} alt="" aria-hidden="true" loading={loading} decoding={loading==='eager'?'sync':'async'}/>;
  }
  return <svg className={className} viewBox="0 0 128 128" aria-hidden="true" focusable="false" style={{ color: cityColors[city] ?? '#a7b7aa' } as CSSProperties} data-building-level={level}>
    <use href={`/images/marble/building-stages.svg#${level === 1 ? 'villa' : level === 2 ? 'building' : 'land'}`}/>
  </svg>;
}

// A code-native high-rise complements the two approved raster buildings without replacing them.
function HotelArt({color = '#6f9aaa'}: {color?:string}) {
  const id = `hotel-${useId().replace(/:/g,'')}`;
  return <svg className="mp-cluster-asset" viewBox="0 0 100 150" aria-hidden="true"><defs><linearGradient id={id}><stop stopColor="#d9e5df"/><stop offset="1" stopColor="#f9f4df"/></linearGradient></defs>
    <ellipse cx="52" cy="139" rx="43" ry="8" fill="#1c333a" opacity=".2"/>
    <path d="m8 129 50-21 36 19v9l-50 13-36-11Z" fill="#8d9b94"/><path d="m8 129 49-17 37 15-50 15Z" fill="#e6e3c9"/>
    <path d="M22 28 58 12l25 14v103l-36 12-25-15Z" fill={`url(#${id})`} stroke="#73877f"/>
    <path d="m22 28 25 13v100l-25-15Z" fill="#9eafa8"/><path d="m47 41 36-15v103l-36 12Z" fill={`url(#${id})`}/>
    <path d="m18 26 39-17 30 15-39 19Z" fill={color} stroke="#ffffff" strokeWidth="2"/><path d="m18 26 30 17v7L18 34Zm30 17 39-19v8L48 50Z" fill={color}/>
    {[0,1,2,3,4,5].map(row=><g key={row}><path d={`M54 ${48+row*12}l8-3v7l-8 3Zm16-6 8-3v7l-8 3Z`} fill={row%2?'#e5bc65':'#537e8b'}/><path d={`M27 ${41+row*13}l6 3v7l-6-3Zm10 5 5 3v7l-5-3Z`} fill="#50727b"/><path d={`M49 ${59+row*12}l33-12`} stroke="#a7b8ae"/></g>)}
    <path d="m59 122 12-5v17l-12 4Z" fill="#31515c"/><path d="m55 119 19-7 6 4-20 8Z" fill={color}/><path d="M59 11V0m0 1 16 4-16 5Z" stroke="#53645a" fill={color} strokeWidth="2"/>
  </svg>;
}
