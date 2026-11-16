import { useState, type ReactNode } from 'react';
import type { MarbleEventId } from '../games/marble';
import artManifest from '../../public/images/marble/events/manifest.json';
import './marble-event-art.css';

export type MarbleEventFamily = 'cash' | 'movement' | 'city' | 'protection';

export const marbleEventFamilyById = {
  'takeover-discount-pass': 'protection',
  festival: 'cash',
  lottery: 'cash',
  'rent-rebate': 'cash',
  'city-dividend': 'cash',
  'visit-santo-domingo': 'movement',
  retreat: 'movement',
  'advance-start': 'movement',
  'train-ticket': 'movement',
  'go-to-island': 'movement',
  'travel-cost': 'city',
  maintenance: 'city',
  'monopoly-warning': 'city',
  'city-festival': 'city',
  blackout: 'city',
  'escape-pass': 'protection',
  'rent-pass': 'protection',
  'forced-sale': 'city', earthquake: 'city', 'city-shield': 'protection',
  'construction-grant': 'city', 'property-hunt': 'movement', birthday: 'cash',
} satisfies Record<MarbleEventId, MarbleEventFamily>;

export function marbleEventArtFamily(cardId: unknown): MarbleEventFamily | null {
  return typeof cardId === 'string' && Object.hasOwn(marbleEventFamilyById, cardId)
    ? marbleEventFamilyById[cardId as MarbleEventId]
    : null;
}

export function marbleEventArtPath(cardId: unknown): string | null {
  const family = marbleEventArtFamily(cardId);
  if (!family) return null;
  const overrides:Record<string,string> = {
    'travel-cost':'expense', maintenance:'repair', 'monopoly-warning':'expense',
    blackout:'blackout', 'rent-pass':'protection', 'city-festival':'festival',
  };
  return overrides[String(cardId)] ? `/images/marble/events/semantic-v2/${overrides[String(cardId)]}.webp` : artManifest.families[family].path;
}

export const marbleEventSymbols:Record<MarbleEventId,string> = {
 'takeover-discount-pass':'half-price-ticket',
 festival:'trophy',lottery:'gift','rent-rebate':'refund','city-dividend':'dividend',
 'travel-cost':'payment',maintenance:'repair','monopoly-warning':'tax',
 'visit-santo-domingo':'destination',retreat:'back-three','advance-start':'start',
 'train-ticket':'free-flight','go-to-island':'island','escape-pass':'escape',
 'city-festival':'festival',blackout:'blackout','rent-pass':'shield',
 'forced-sale':'bank-sale',earthquake:'cracked-building','city-shield':'city-defense',
 'construction-grant':'building-crane','property-hunt':'house-search',birthday:'birthday-cake',
};
function EffectSymbol({kind}:{kind:string}) {
 const paths:Record<string,ReactNode> = {
  'half-price-ticket':<><path d="M7 14h50v11a7 7 0 0 0 0 14v11H7V39a7 7 0 0 0 0-14zM39 14v8m0 5v10m0 5v8"/><text x="24" y="37" fill="currentColor" stroke="none" fontSize="16" fontWeight="900" textAnchor="middle">½</text></>,
  'bank-sale':<><path d="M8 49V31l13-9 13 9v18M18 49V37h8v12M5 53h33M39 9l14 10-7 10-14-10zM39 26 29 40M42 44h15M47 36v17m-5-5 5 5 5-5"/></>,
  'cracked-building':<><path d="M14 48V14h34v34M21 22h4m14 0h3M21 31h4m14 0h3M32 11l-6 13 10 8-7 10 5 7M5 54l13-5 12 8 13-7 16 4M5 25l4 7-5 7M56 25l-4 7 5 7"/></>,
  'city-defense':<><path d="M32 5 56 14v16c0 17-24 29-24 29S8 47 8 30V14z"/><path d="M19 39V28h10v11m0 0V19h11v20m0 0V29h7v10M17 42h31M2 10l7 4M62 10l-7 4"/></>,
  'building-crane':<><path d="M12 56V8h9v48M8 8h44v8H8zM21 8l22 8M44 16v14q0 8 7 4M26 56V36h22v20M32 43h3m6 0h2M32 50h3m6 0h2M7 58h47"/><path d="M51 44h10m-5-5v10"/></>,
  'house-search':<><circle cx="28" cy="27" r="21"/><path d="m43 43 15 15M17 34V23l11-8 11 8v11H17M25 34v-9h6v9M7 55h23m-7-7 7 7-7 7"/></>,
  'birthday-cake':<><path d="M13 51V31h38v20M9 54h46M13 36q5 10 10 0 5 10 10 0 5 10 10 0 4 8 8 0M23 30V20m18 10V20M23 16q-6-5 0-10 6 5 0 10zM41 16q-6-5 0-10 6 5 0 10z"/><circle cx="7" cy="22" r="4"/><circle cx="57" cy="22" r="4"/><path d="m5 9 3 3M56 8l-3 4"/></>,
  trophy:<><path d="M20 12h24v12c0 19-24 19-24 0zM20 16H11v8c0 8 7 9 12 9M44 16h9v8c0 8-7 9-12 9M32 39v12M23 53h18"/><path d="m32 17 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="currentColor" strokeWidth="1"/></>,
  gift:<><path d="M12 28h40v26H12zM9 21h46v9H9zM32 21v33M32 20c-23 2-19-18-8-13 6 3 8 13 8 13s2-10 8-13c11-5 15 15-8 13"/></>,
  refund:<><path d="M15 25a20 20 0 1 1-1 19M7 12v17h17"/><path d="M32 27v18M23 36h18"/></>,
  dividend:<><path d="M8 52V29h14v23M26 52V16h14v36M44 52V25h12v27M7 56h50M49 6v12M43 12h12"/></>,
  payment:<><circle cx="24" cy="25" r="15"/><path d="M24 16v18M18 20h9c7 0 7 10 0 10h-9M45 26v28m-9-9 9 9 9-9"/></>,
  repair:<><path d="M39 10a13 13 0 0 0-15 18L9 43a7 7 0 0 0 10 10l15-16a13 13 0 0 0 18-15l-10 8-8-8z"/></>,
  tax:<><path d="m8 22 24-14 24 14zM13 26v23M26 26v23M39 26v23M51 26v23M8 54h48"/><path d="M32 15v5"/></>,
  destination:<><path d="M32 56s19-20 19-32a19 19 0 0 0-38 0c0 12 19 32 19 32z"/><circle cx="32" cy="24" r="7"/></>,
  'back-three':<><path d="m23 14-15 17 15 17M9 31h45"/><text x="42" y="24" fill="currentColor" stroke="none" fontSize="21" fontWeight="900" textAnchor="middle">3</text></>,
  start:<><path d="M17 57V8M18 9h31l-7 10 7 10H18M32 40h23m-8-8 8 8-8 8"/></>,
  'free-flight':<><path d="m7 33 20-4L39 9l6 1-6 19 15 4v6l-17-1-8 14-5-1 3-15-19 3z"/><circle cx="49" cy="51" r="9"/><path d="m44 51 4 4 7-8"/></>,
  island:<><path d="M7 52q25-17 50 0zM33 45q-6-16 0-27M33 18Q15 0 9 18l24 1Q43-2 56 15l-23 4M33 19Q14 21 17 34M34 20q15 0 18 14M8 59h48"/></>,
  escape:<><path d="M8 55h25V9H8zM27 32h29m-10-10 10 10-10 10"/><circle cx="18" cy="32" r="2"/></>,
  festival:<><path d="M12 56V34h40v22M9 31l23-14 23 14M32 4v8M12 9l7 7M52 9l-7 7M3 22l8 2M61 22l-8 2"/><text x="32" y="51" fill="currentColor" stroke="none" fontSize="18" fontWeight="900" textAnchor="middle">×2</text></>,
  blackout:<><path d="m34 6-21 27h16l-2 25 23-31H34zM8 8l48 48"/></>,
  shield:<><path d="M32 7 53 15v17c0 15-21 25-21 25S11 47 11 32V15zM21 32l8 8 15-17"/></>,
 };
 return <svg className="marble-effect-symbol" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

export function MarbleEventArt({ cardId, fallback }: { cardId: unknown; fallback: ReactNode }) {
  const [failedSrc, setFailedSrc] = useState<string|null>(null);
  const family = marbleEventArtFamily(cardId);
  const src = marbleEventArtPath(cardId);
  if (!src || !family || failedSrc === src) return <span className="marble-event-card-art-pending" data-art-pending={family ?? 'unknown'}>{fallback}</span>;
  const symbol=marbleEventSymbols[cardId as MarbleEventId];
  if (['forced-sale','earthquake','city-shield','construction-grant','property-hunt','birthday','takeover-discount-pass'].includes(String(cardId))) return <span className={`marble-event-card-art marble-semantic-card is-${family}`} data-card-symbol={String(cardId)} data-event-family={family} data-effect-symbol={symbol} data-art-medium="svg">
    <svg className="marble-semantic-frame" viewBox="0 0 160 200" width="160" height="200" aria-hidden="true"><rect x="3" y="3" width="154" height="194" rx="17" fill="#fff4d7" stroke="#c69b48" strokeWidth="3"/><rect x="10" y="10" width="140" height="180" rx="12" fill="none" stroke="#d7b871"/><path d="M25 29h37m36 0h37M25 171h110" stroke="#c69b48" strokeWidth="2"/><circle cx="80" cy="29" r="6" fill="none" stroke="#c69b48" strokeWidth="3"/><path d="M80 35v13m0-5h6" stroke="#c69b48" strokeWidth="3"/><circle cx="80" cy="108" r="52" fill="currentColor" opacity=".08"/><path d="m26 153 5-5 5 5-5 5zm98 0 5-5 5 5-5 5z" fill="#c69b48"/></svg>
    <span className="marble-semantic-scene"><EffectSymbol kind={symbol}/></span>
  </span>;
  return <span className="marble-event-card-art" data-card-symbol={String(cardId)} data-event-family={family} data-effect-symbol={symbol}>
  <img
    className="marble-event-illustration"
    data-event-family={family}
    src={src}
    alt=""
    aria-hidden="true"
    width={160}
    height={200}
    loading="lazy"
    decoding="async"
    onError={() => setFailedSrc(src)}
  />
  <span className={`marble-effect-badge is-${family}`}><EffectSymbol kind={symbol}/></span>
  </span>;
}
