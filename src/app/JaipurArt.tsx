import { useId } from 'react';
import type { Language } from '../core/types';
import type { JaipurGood } from '../games/jaipur';
import '../styles/jaipur-art.css';

export type { JaipurGood } from '../games/jaipur';
type Variant = 0 | 1 | 2;

export function jaipurCardVariant(id: string): Variant {
  let hash = 2166136261;
  for (const character of id) hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619) >>> 0;
  return (hash % 3) as Variant;
}

const goodsNames: Record<JaipurGood, Record<Language, string>> = {
  diamond: { ko: '다이아몬드', es: 'Diamantes' }, gold: { ko: '금', es: 'Oro' }, silver: { ko: '은', es: 'Plata' },
  cloth: { ko: '옷감', es: 'Tela' }, spice: { ko: '향신료', es: 'Especias' }, leather: { ko: '가죽', es: 'Cuero' }, camel: { ko: '낙타', es: 'Camello' },
};

const sceneNames: Record<JaipurGood, [string, string, string]> = {
  diamond: ['single-cut', 'crystal-cluster', 'gem-parcel'], gold: ['ingot-stack', 'filigree-necklace', 'coin-purse'], silver: ['silver-ewer', 'anklet-pair', 'engraved-bowl'],
  cloth: ['folded-bolts', 'draped-scarf', 'woven-loom'], spice: ['mortar-and-spice', 'saffron-sachets', 'spice-market-bowls'],
  leather: ['rolled-hide', 'stitched-saddle', 'travel-pouch'], camel: ['walking-camel', 'resting-camel', 'caravan-camel'],
};

type GoodProps = { good: JaipurGood; variant?: number; language?: Language; decorative?: boolean; className?: string };

function defs(id: string, colors: string[]) {
  return <defs>
    <linearGradient id={`${id}-body`} x1=".08" y1="0" x2=".92" y2="1"><stop stopColor={colors[0]}/><stop offset=".48" stopColor={colors[1]}/><stop offset="1" stopColor={colors[2]}/></linearGradient>
    <linearGradient id={`${id}-light`} x1=".1" y1="0" x2=".8" y2="1"><stop stopColor="#fff9e8" stopOpacity=".96"/><stop offset=".45" stopColor="#fff2d0" stopOpacity=".34"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
    <linearGradient id={`${id}-brass`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff2c7"/><stop offset=".38" stopColor="#dbb15f"/><stop offset=".72" stopColor="#9c6935"/><stop offset="1" stopColor="#f3d993"/></linearGradient>
    <linearGradient id={`${id}-shadow`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff4d9" stopOpacity=".3"/><stop offset="1" stopColor="#3b1e23" stopOpacity=".68"/></linearGradient>
    <filter id={`${id}-drop`} x="-25%" y="-25%" width="150%" height="165%"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>;
}

function highlight(id: string) { return `url(#${id}-light)`; }
function metallic(id: string) { return `url(#${id}-brass)`; }
function body(id: string) { return `url(#${id}-body)`; }

function DiamondScene({ v, id }: { v: Variant; id: string }) {
  const b = body(id);
  if (v === 0) return <g stroke="#527f91" strokeWidth="1.3" strokeLinejoin="round"><ellipse cx="50" cy="82" rx="29" ry="5" fill="#49333a" opacity=".2"/><path d="m50 14 24 21-8 39-16 13-16-13-8-39z" fill={b}/><path d="m30 35 20 4 24-4-16 19H43z" fill="#e8fbf8"/><path d="m43 54-9 20 16 13V54m7 0 9 20-16 13V54m0-15v15l24-19-8 39-16 13" fill="#64b8c7" opacity=".92"/><path d="m50 14 9 25h-9l-20-4zm0 0 24 21-15 4z" fill="#f6ffff" opacity=".74"/><path d="m35 35 15 4v15L43 54z" fill={highlight(id)} opacity=".64"/></g>;
  if (v === 1) return <g stroke="#4f7c8c" strokeWidth="1.1" strokeLinejoin="round"><ellipse cx="53" cy="84" rx="36" ry="5" fill="#49333a" opacity=".2"/><path d="m29 60 4-23 15-17 8 23-8 19z" fill={b}/><path d="m49 62 8-35 16 18-6 25-16 10z" fill="#7ec8d1"/><path d="m23 72 12-23 18 14-8 22z" fill="#b6e6e4"/><path d="m33 37 15 23-15 12-4-12zm23-10 16 18-15 6-8-11zm-22 22 18 13-7 23-13-6zm23-8 16 2-6 25-15-4z" fill="#effff4" opacity=".78"/><path d="m26 75 20 10 31-8-22 13-34-4z" fill={metallic(id)} stroke="#a77f4e"/></g>;
  return <g stroke="#547e8d" strokeWidth="1.1" strokeLinejoin="round"><ellipse cx="50" cy="85" rx="35" ry="5" fill="#49333a" opacity=".2"/><path d="M19 60c0-8 14-14 31-14s31 6 31 14v13c0 8-14 14-31 14s-31-6-31-14z" fill="#b89154" stroke="#88643b"/><ellipse cx="50" cy="60" rx="31" ry="13" fill="#efdaa9" stroke="#b48b50"/><path d="M22 60c7-7 17-10 28-10s21 3 28 10c-8 8-18 11-28 11S30 68 22 60z" fill="#ede1bb" stroke="#91b8ba"/><path d="m34 59 10-11 7 10-9 9zm23-7 10 4-4 11-11-6z" fill="#7dc4ce" stroke="#537f8c"/><path d="m44 48 8-13 9 12-9 11z" fill="#f5ffff" stroke="#5b98a7"/><path d="m32 60 8-2 4 6-8 4zm32-9 5-5 6 8-7 3z" fill="#c2edf0"/></g>;
}

function GoldScene({ v, id }: { v: Variant; id: string }) {
  if (v === 0) return <g stroke="#93602f" strokeWidth="1.3" strokeLinejoin="round"><ellipse cx="51" cy="84" rx="34" ry="5" fill="#49333a" opacity=".2"/><path d="m19 63 9-21 53-4 10 19-8 22-54 3z" fill="#9c692e"/><path d="m21 58 8-21 52-3 9 19-8 22-53 3z" fill={metallic(id)}/><path d="m29 37 52-3 9 19-53 4z" fill="#f9d983"/><path d="m37 48 34-2 7 7-7 7-34 2-7-7z" fill="#d6a847" stroke="#fff0bb"/><path d="m43 51 17-1 4 4-4 4-17 1-4-4z" fill="#fff1b6" stroke="#b07d36"/><path d="m35 43 37-2" stroke="#fff6d3" strokeWidth="2" opacity=".72"/></g>;
  if (v === 1) return <g stroke="#976331" strokeWidth="1.2" strokeLinejoin="round"><ellipse cx="50" cy="82" rx="34" ry="5" fill="#49333a" opacity=".2"/><path d="M25 32c4-9 15-13 25-9 10-7 24-2 27 9 11 4 15 17 9 26l-5 15-11-5-10 8-12-8-12 7-7-12-13 1 5-16c-9-7-6-16 4-16z" fill="none" stroke={metallic(id)} strokeWidth="5"/><path d="M29 34c3-7 12-9 19-4 8-7 20-2 21 6 9 4 11 14 5 21-3 5-10 4-14 0-5 5-12 5-17 0-7 4-15 2-17-5-7-6-4-14 3-18z" fill={metallic(id)}/><path d="M50 28c-10 10-11 28 0 40m0-39c12 9 12 29 0 40M35 42l31 12m-32 0 30-13m-16-12v38" fill="none" stroke="#8d5e31" strokeWidth="1.2"/><circle cx="50" cy="48" r="7" fill="#fff0b8" stroke="#aa782f"/><path d="m50 43 4 5-4 5-4-5z" fill="#bb8737"/></g>;
  return <g stroke="#996532" strokeWidth="1.2" strokeLinejoin="round"><ellipse cx="50" cy="83" rx="35" ry="5" fill="#49333a" opacity=".2"/><path d="M19 58v16c0 6 9 11 20 11s20-5 20-11V58z" fill="#9c692f"/><ellipse cx="39" cy="58" rx="20" ry="9" fill={metallic(id)}/><path d="M47 47v12c0 4 7 8 16 8s16-4 16-8V47z" fill="#9b682e"/><ellipse cx="63" cy="47" rx="16" ry="7" fill="#f5d47a"/><path d="M67 58v12c0 4 6 7 13 7s13-3 13-7V58z" fill="#9a682e"/><ellipse cx="80" cy="58" rx="13" ry="6" fill="#e7be62"/><path d="M21 58c5 6 29 6 36 0m-19-9c5 6 17 6 25 0m4-8c3 4 17 4 25 0" fill="none" stroke="#fff0b8" strokeWidth="1.4" opacity=".75"/><circle cx="39" cy="58" r="3" fill="#fff2c4"/><circle cx="63" cy="47" r="2.4" fill="#fff2c4"/></g>;
}

function SilverScene({ v, id }: { v: Variant; id: string }) {
  if (v === 0) return <g stroke="#617082" strokeWidth="1.3" strokeLinejoin="round"><ellipse cx="51" cy="83" rx="32" ry="5" fill="#49333a" opacity=".2"/><path d="M35 32h29l-3 11 9 26c2 7-6 13-20 13s-22-6-20-13l9-26z" fill={body(id)}/><path d="M36 33h27l-3 12 8 24c2 6-5 10-18 10s-20-4-18-10l8-24z" fill="#bccbd2" stroke="#f4f7e9"/><path d="M34 34c-8-6-13-3-13 4 0 6 7 9 15 8m31-12c7-8 16-6 17 0s-7 11-15 10" fill="none" stroke={metallic(id)} strokeWidth="4"/><path d="M39 49h22m-25 8h28m-27 8h25" stroke="#81919a" strokeWidth="1.4"/><path d="M42 31c3-10 13-14 19-3" fill="none" stroke="#e9c879" strokeWidth="4"/><path d="M43 51c5-4 13-4 19 0" stroke="#fff" strokeWidth="2" opacity=".85"/></g>;
  if (v === 1) return <g stroke="#687887" strokeWidth="1.2" strokeLinejoin="round"><ellipse cx="50" cy="83" rx="36" ry="5" fill="#49333a" opacity=".2"/><path d="M28 43c0-8 10-14 22-14s22 6 22 14v20c0 8-10 14-22 14s-22-6-22-14z" fill={body(id)}/><ellipse cx="50" cy="43" rx="22" ry="10" fill="#edf3ec" stroke="#778a96"/><path d="M29 61c7 8 34 8 42 0" fill="none" stroke="#fcfffa" strokeWidth="2"/><path d="M29 52c7 8 34 8 42 0" fill="none" stroke="#8d9ca5" strokeWidth="1.2"/><path d="M32 32c-7-8-9-16-3-18 7-2 9 9 13 14m29 4c7-8 9-16 3-18-7-2-9 9-13 14" fill="none" stroke={metallic(id)} strokeWidth="3.5"/><circle cx="50" cy="43" r="3" fill={metallic(id)}/><path d="M38 43h-5m34 0h-5" stroke="#fff" strokeWidth="1.5"/></g>;
  return <g stroke="#657784" strokeWidth="1.25" strokeLinejoin="round"><ellipse cx="50" cy="84" rx="34" ry="5" fill="#49333a" opacity=".2"/><path d="M23 55c0 17 13 27 27 27s27-10 27-27L68 65H32z" fill={body(id)}/><ellipse cx="50" cy="54" rx="28" ry="14" fill="#dce5e4" stroke="#f9fff7"/><ellipse cx="50" cy="54" rx="21" ry="8" fill="#879aa2" stroke="#647984"/><ellipse cx="50" cy="52" rx="17" ry="5" fill="#e4c879" stroke="#94753c"/><path d="M27 57c7 5 14 7 23 7s17-2 24-7M35 71c10 5 20 5 30 0" fill="none" stroke="#f7f7eb" strokeWidth="1.5"/><path d="M33 54c4-3 8-5 13-5m9 0c4 0 8 2 12 5" fill="none" stroke="#fff" strokeWidth="1.4"/></g>;
}

function ClothScene({ v, id }: { v: Variant; id: string }) {
  if (v === 0) return <g stroke="#693544" strokeWidth="1.3" strokeLinejoin="round"><ellipse cx="51" cy="83" rx="36" ry="5" fill="#49333a" opacity=".2"/><path d="m20 58 12-25 47-5 9 13-11 28-48 7z" fill="#873c50"/><path d="m25 54 12-22 42-3 7 12-10 24-43 5z" fill={body(id)}/><path d="m32 35 43-3 8 11-8 19-43 5-8-11z" fill="#bb6566"/><path d="m32 35 43-3-6 9-41 4m-1 11 43-4 10 1" fill="none" stroke="#f2d29b" strokeWidth="1.6"/><path d="m38 38 4 4-4 4 4 4-4 4 4 4" fill="none" stroke="#f3d7a4" strokeWidth="1.3"/><path d="M57 39c4 3 6 6 6 10s-3 7-6 9m10-20c4 4 4 10 0 15" fill="none" stroke="#f5d4a1" strokeWidth="1.5"/><path d="m32 35 42-3" stroke="#ffd9b4" strokeWidth="2" opacity=".78"/></g>;
  if (v === 1) return <g stroke="#5e3a55" strokeWidth="1.2" strokeLinejoin="round"><ellipse cx="50" cy="84" rx="36" ry="5" fill="#49333a" opacity=".2"/><path d="M23 31c13 5 23 12 27 22 3 8 10 13 27 14l-8 10c-17-1-27-8-32-20-4-10-11-16-20-18z" fill={body(id)}/><path d="M23 31c13 5 23 12 27 22 3 8 10 13 27 14l-8 10c-17-1-27-8-32-20-4-10-11-16-20-18z" fill="#5d405e" opacity=".48"/><path d="M28 38c12 4 19 11 23 19s12 13 22 15M30 35c14 6 22 13 26 22 4 9 11 13 19 13" fill="none" stroke="#ebce9b" strokeWidth="1.5"/><path d="m43 49 7-5 6 8-7 5zm9 14 7-5 6 7-8 4z" fill="#d9ae70" stroke="#f6dda6"/><circle cx="50" cy="52" r="1.2" fill="#f9e3bb"/><circle cx="63" cy="66" r="1.2" fill="#f9e3bb"/></g>;
  return <g stroke="#5e4050" strokeWidth="1.2" strokeLinejoin="round"><ellipse cx="50" cy="84" rx="36" ry="5" fill="#49333a" opacity=".2"/><path d="M19 32h10v39H19zm52-4h10v43H71z" fill="#98623e"/><path d="M28 35c16-5 28-5 44 0v32c-15 7-29 7-44 0z" fill={body(id)}/><path d="M30 39c15-5 26-5 40 0m-40 6c15-5 26-5 40 0m-40 6c15-5 26-5 40 0m-40 6c15-5 26-5 40 0m-40 6c15-5 26-5 40 0" fill="none" stroke="#f0d09a" strokeWidth="1.5"/><path d="M34 34v34m8-36v37m9-37v37m9-37v37m9-36v35" fill="none" stroke="#692f47" strokeWidth="1.3" opacity=".9"/><circle cx="24" cy="31" r="7" fill="#e6be77" stroke="#956740"/><circle cx="76" cy="29" r="7" fill="#e6be77" stroke="#956740"/><path d="M24 25v12m-6-6h12m46-8v12m-6-6h12" stroke="#fff0c4" strokeWidth="1"/></g>;
}

function SpiceScene({ v, id }: { v: Variant; id: string }) {
  if (v === 0) return <g stroke="#69412f" strokeWidth="1.3" strokeLinejoin="round"><ellipse cx="50" cy="83" rx="34" ry="5" fill="#49333a" opacity=".2"/><path d="M24 53h52l-6 22c-13 9-27 9-40 0z" fill="#a55236"/><ellipse cx="50" cy="53" rx="26" ry="10" fill="#e1bb79"/><ellipse cx="50" cy="51" rx="22" ry="7" fill={body(id)}/><path d="M32 50c5-8 12-13 19-13 8 0 15 5 18 13-10 7-26 8-37 0z" fill="#d08b4c"/><path d="M38 47c3-6 7-8 12-9m2 12c4-8 9-10 14-10" fill="none" stroke="#f4d387" strokeWidth="2"/><path d="M26 56c14 5 35 5 48 0" fill="none" stroke="#fff0bf" strokeWidth="1.4"/><path d="M69 28c-3 8-8 14-14 20" fill="none" stroke={metallic(id)} strokeWidth="5" strokeLinecap="round"/><circle cx="54" cy="49" r="4" fill="#b87a43"/></g>;
  if (v === 1) return <g stroke="#77482e" strokeWidth="1.2" strokeLinejoin="round"><ellipse cx="50" cy="83" rx="35" ry="5" fill="#49333a" opacity=".2"/><path d="M25 42c0-7 11-13 25-13s25 6 25 13v28c0 8-11 13-25 13S25 78 25 70z" fill="#bc8a51"/><ellipse cx="50" cy="42" rx="25" ry="11" fill="#f1d39a"/><path d="M29 47c12 8 30 8 42 0v22c-11 9-31 9-42 0z" fill={body(id)}/><path d="M32 43c5-8 11-12 18-12s13 4 18 12" fill="none" stroke="#fff0c3" strokeWidth="1.5"/><path d="M36 55c6 3 22 3 28 0m-28 6c6 3 22 3 28 0m-25 7c5 3 17 3 22 0" fill="none" stroke="#f1cc86" strokeWidth="1.2"/><path d="m40 36 10 9 10-9" fill="none" stroke="#8c5334" strokeWidth="1.2"/><circle cx="50" cy="43" r="3" fill={metallic(id)}/></g>;
  return <g stroke="#72502d" strokeWidth="1.2" strokeLinejoin="round"><ellipse cx="50" cy="84" rx="36" ry="5" fill="#49333a" opacity=".2"/><path d="M17 60c0-5 9-9 19-9s19 4 19 9v16c0 5-9 9-19 9s-19-4-19-9zm31-16c0-5 9-9 19-9s19 4 19 9v16c0 5-9 9-19 9s-19-4-19-9z" fill="#a76d43"/><ellipse cx="36" cy="60" rx="19" ry="8" fill="#e7c283"/><ellipse cx="67" cy="44" rx="19" ry="8" fill="#edd18e"/><path d="M20 61c9 5 23 5 32 0m-1-17c9 5 23 5 32 0" fill="none" stroke="#fff0c3" strokeWidth="1.3"/><path d="m27 59 5-4m1 8 7-6m0 7 8-6m-4-18 7-5m2 9 8-6m3 6 9-6" stroke="#a94e33" strokeWidth="2"/><path d="m68 55 5 13m-3-15 8 13" stroke="#8c482e" strokeWidth="3" strokeLinecap="round"/></g>;
}

function LeatherScene({ v, id }: { v: Variant; id: string }) {
  if (v === 0) return <g stroke="#6b3d2b" strokeWidth="1.3" strokeLinejoin="round"><ellipse cx="50" cy="84" rx="35" ry="5" fill="#49333a" opacity=".2"/><path d="M24 48c0-8 12-14 26-14s26 6 26 14v29c0 6-12 11-26 11s-26-5-26-11z" fill="#73442f"/><ellipse cx="50" cy="48" rx="26" ry="12" fill="#bc7e4e"/><ellipse cx="50" cy="47" rx="19" ry="7" fill="#51362d"/><path d="M26 53c14 7 34 7 48 0v24c-14 7-34 7-48 0z" fill={body(id)}/><path d="M30 56c12 6 28 6 40 0m-38 6c12 6 24 6 36 0m-34 6c10 5 20 5 30 0" fill="none" stroke="#e1b57d" strokeWidth="1.2" strokeDasharray="1 4"/><path d="M34 39c7-7 25-8 33-1" fill="none" stroke="#ffe1ad" strokeWidth="2"/></g>;
  if (v === 1) return <g stroke="#683f30" strokeWidth="1.3" strokeLinejoin="round"><ellipse cx="50" cy="84" rx="36" ry="5" fill="#49333a" opacity=".2"/><path d="M20 63c0-10 10-20 29-26l10-6 14 8 9 18-10 21-20 7-18-3z" fill={body(id)}/><path d="M49 37 60 29l13 8-2 16-14 9-17-4-10 4" fill="#a2623d"/><path d="M50 37 44 58l13 7 14-11" fill="#633e30"/><path d="m59 30 14 8 11 19-8 20-11 3-5-13 7-9-8-8z" fill="#ba7b4e"/><path d="M27 63c13-10 27-10 36-2m-28 12c13-9 25-8 35-2m-13 7c9-5 17-5 24-2" fill="none" stroke="#e3b987" strokeWidth="1.2" strokeDasharray="1 4"/><path d="m67 40 5 8-8 6-6-8z" fill={metallic(id)}/></g>;
  return <g stroke="#704531" strokeWidth="1.25" strokeLinejoin="round"><ellipse cx="50" cy="84" rx="35" ry="5" fill="#49333a" opacity=".2"/><path d="M22 39c0-6 11-11 28-11s28 5 28 11v35c0 8-12 13-28 13s-28-5-28-13z" fill={body(id)}/><path d="M23 39c11 6 43 6 54 0v8c-11 7-43 7-54 0z" fill="#ce9560"/><path d="M34 48h32v26H34z" fill="#9d603b"/><path d="M37 51h26v21H37z" fill="#b87b4e"/><path d="M34 48h32l-4-9H38z" fill={metallic(id)}/><path d="M37 53c8 4 18 4 26 0m-26 6c8 4 18 4 26 0m-26 6c8 4 18 4 26 0" fill="none" stroke="#efce9a" strokeWidth="1" strokeDasharray="1 3"/><path d="M46 40h8v8h-8z" fill="#f4d891" stroke="#9a713f"/><circle cx="50" cy="44" r="1.5" fill="#865533"/></g>;
}

function CamelScene({ v, id }: { v: Variant; id: string }) {
  const color = body(id);
  if (v === 0) return <g stroke="#85562f" strokeWidth="1.5" strokeLinejoin="round"><ellipse cx="50" cy="83" rx="37" ry="5" fill="#49333a" opacity=".2"/><path d="M21 59c2-10 10-16 20-15 5-11 16-12 22-2 8 4 13 11 14 22l-6 7-5-14-7 2-2 19h-5l-3-18H40l-3 18h-5l1-22c-7 5-9 7-12 3z" fill={color}/><path d="M61 43c5-10 11-15 18-11 4 2 3 7-2 10l-6 4" fill={color}/><path d="m75 36 8-1-5 5m-1 1 7 1" fill="none" stroke="#5c4130" strokeWidth="1.3"/><ellipse cx="79" cy="36" rx="1.4" ry="1.7" fill="#332a28"/><path d="M35 47c4-6 14-9 23-5l4 11-27 2z" fill={metallic(id)}/><path d="m38 53 21-1m-17 5 18-1m-15 4 14-1" stroke="#fff0bb" strokeWidth="1"/></g>;
  if (v === 1) return <g stroke="#805331" strokeWidth="1.5" strokeLinejoin="round"><ellipse cx="50" cy="83" rx="36" ry="5" fill="#49333a" opacity=".2"/><path d="M22 58c0-10 11-15 22-12 6-12 19-12 25-1 8 3 12 11 11 20-4 6-12 7-21 4l-8 6-18-3-10 5-7-4z" fill={color}/><path d="M58 44c6-11 12-14 18-10 4 3 3 7-3 10l-5 4" fill={color}/><path d="m69 39 10-2-5 6" fill="none"/><path d="M31 69c7-6 18-7 26-3l-1 12H34z" fill={metallic(id)}/><path d="M34 73h20m-14 3 5-7 6 7" fill="none" stroke="#fff0b8" strokeWidth="1.2"/><path d="M27 67h-5v11h6m38-8 1 10h5m-36-9-2 9h5" fill="none" strokeWidth="3"/><ellipse cx="76" cy="40" rx="1.5" ry="1.7" fill="#332a28"/><path d="M82 48c4 0 7 2 9 5" fill="none" stroke="#f3dcb0" strokeWidth="1.2"/></g>;
  return <g stroke="#805331" strokeWidth="1.45" strokeLinejoin="round"><ellipse cx="50" cy="84" rx="37" ry="5" fill="#49333a" opacity=".2"/><path d="M13 60c1-8 9-13 18-12 5-9 14-9 19 0 7 2 9 9 9 16l-6 4-4-12-5 1-2 18h-5l-3-16H32l-4 16h-5l2-19c-5 5-8 8-12 4z" fill={color}/><path d="M43 47c4-10 10-13 16-9 4 3 2 7-3 10l-4 5" fill={color}/><path d="m54 41 9-3-4 6m-2 1 6 1" fill="none"/><ellipse cx="59" cy="42" rx="1.3" ry="1.5" fill="#332a28"/><path d="M26 50c4-5 12-7 18-4l4 10-22 2z" fill={metallic(id)}/><path d="M63 58c1-8 9-13 18-12 5-9 14-9 19 0 7 2 9 9 9 16l-6 4-4-12-5 1-2 18h-5l-3-16h-7l-4 16h-5l2-19c-5 5-8 8-12 4z" fill={color} opacity=".9"/><path d="M93 47c4-10 10-13 16-9 4 3 2 7-3 10l-4 5" fill={color}/><path d="M76 50c4-5 12-7 18-4l4 10-22 2z" fill={metallic(id)}/><path d="M17 54h25m35 0h24" stroke="#fff0b8" strokeWidth="1.2"/></g>;
}

function GoodScene({ good, variant, id }: { good: JaipurGood; variant: Variant; id: string }) {
  if (good === 'diamond') return <DiamondScene v={variant} id={id}/>;
  if (good === 'gold') return <GoldScene v={variant} id={id}/>;
  if (good === 'silver') return <SilverScene v={variant} id={id}/>;
  if (good === 'cloth') return <ClothScene v={variant} id={id}/>;
  if (good === 'spice') return <SpiceScene v={variant} id={id}/>;
  if (good === 'camel') return <CamelScene v={variant} id={id}/>;
  return <LeatherScene v={variant} id={id}/>;
}

export function JaipurGoodArt({ good, variant = 0, language = 'ko', decorative = false, className = '' }: GoodProps) {
  const id = useId().replace(/:/g, '');
  const scene = (((Math.floor(variant) % 3) + 3) % 3) as Variant;
  const colors: Record<JaipurGood, string[]> = {
    diamond: ['#d4f4ef', '#65b6c4', '#285e76'], gold: ['#ffebaa', '#dfa944', '#93602f'], silver: ['#f8fbf4', '#aebdc4', '#536671'],
    cloth: ['#f5d5b1', '#aa5262', '#513953'], spice: ['#ffd886', '#d17a3d', '#863d2e'], leather: ['#e3b681', '#985c3e', '#4c322d'], camel: ['#f1d095', '#bd8751', '#704630'],
  };
  return <svg className={`jaipur-art jaipur-art--${good} ${className}`.trim()} viewBox="0 0 100 100" role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : goodsNames[good][language]} data-good={good} data-variant={scene} data-composition={sceneNames[good][scene]}>
    {defs(id, colors[good])}
    <ellipse className="jaipur-art__ground" cx="50" cy="83" rx="38" ry="8" fill="#482c34" opacity=".12" filter={`url(#${id}-drop)`}/>
    <GoodScene good={good} variant={scene} id={id}/>
    <path d="M19 33c5-12 16-20 28-21" fill="none" stroke="#fff8e7" strokeWidth="2.2" strokeLinecap="round" opacity=".78"/>
  </svg>;
}

export function JaipurCoin({ value, good, language = 'ko', label }: { value?: number; good?: JaipurGood; language?: Language; label?: string }) {
  const id = useId().replace(/:/g, '');
  const defaultLabel = good
    ? language === 'ko' ? `${goodsNames[good].ko} 토큰${value === undefined ? '' : ` ${value}점`}` : `Ficha de ${goodsNames[good].es}${value === undefined ? '' : ` · ${value} puntos`}`
    : value === undefined ? (language === 'ko' ? '금화 토큰' : 'Ficha de moneda') : (language === 'ko' ? `${value}점 금화` : `Moneda de ${value} puntos`);
  return <svg className={`jaipur-coin${good ? ` jaipur-coin--${good}` : ''}`} viewBox="0 0 64 64" role="img" aria-label={label ?? defaultLabel} data-mark={good ?? 'coin'}>
    <defs><linearGradient id={`${id}-coin`} x1=".08" y1="0" x2=".9" y2="1"><stop stopColor="#fff1ba"/><stop offset=".38" stopColor="#e0b550"/><stop offset=".75" stopColor="#a56c31"/><stop offset="1" stopColor="#f8dc8f"/></linearGradient></defs>
    <ellipse cx="32" cy="36" rx="25" ry="24" fill="#634328" opacity=".25"/>
    <path d="M8 29c0-13 10-23 24-23s24 10 24 23v8c0 13-10 22-24 22S8 50 8 37z" fill="#9a642d" stroke="#714727" strokeWidth="1.5"/>
    <ellipse cx="32" cy="29" rx="24" ry="23" fill={`url(#${id}-coin)`} stroke="#ffedb1" strokeWidth="2"/>
    <ellipse cx="32" cy="29" rx="18" ry="17" fill="none" stroke="#9b6b36" strokeWidth="1.3"/>
    <CoinMark good={good} />
    <path d="M20 17c3-4 7-6 12-6" fill="none" stroke="#fff9dc" strokeWidth="2" strokeLinecap="round" opacity=".8"/>
    {value !== undefined && <text x="32" y="49" textAnchor="middle" className="jaipur-coin__value">{value}</text>}
  </svg>;
}

function CoinMark({ good }: { good?: JaipurGood }) {
  if (good === 'diamond') return <g fill="#e9faff" stroke="#8bced4" strokeWidth="1.1" strokeLinejoin="round"><path d="m32 15 11 10-11 16-11-16z"/><path d="m21 25 11 3 11-3m-11 3v13m0-23-6 7 6 3 6-3z" fill="#9edbe1"/><path d="m32 15 6 10-6 3z" fill="#fff" stroke="none"/></g>;
  if (good === 'gold') return <g stroke="#875b2e" strokeWidth="1" strokeLinejoin="round"><path d="m20 24 5-7h15l5 7-4 14H24z" fill="#d7a64d"/><path d="m20 24 5-7h15l5 7z" fill="#f7dc8c"/><path d="M25 24h20l-4 14H24z" fill="#bf8739"/><path d="M26 20h13m-14 7h15" stroke="#fff1c1" strokeWidth="1.3"/></g>;
  if (good === 'silver') return <g stroke="#61747e" strokeWidth="1" strokeLinejoin="round"><path d="M26 17h12l-2 6 6 13c1 3-4 5-10 5s-11-2-10-5l6-13z" fill="#c8d4d5"/><path d="M27 18h10l-2 6 5 12c0 2-3 3-8 3s-8-1-8-3l5-12z" fill="#eef4e9"/><path d="M25 20c-5-5-8-3-8 0s5 5 9 4m17-4c5-5 8-3 8 0s-5 5-9 4" fill="none" stroke="#d6b96f" strokeWidth="2.2"/><path d="M26 29h13m-15 5h17" stroke="#95a5a8"/></g>;
  if (good === 'cloth') return <g stroke="#744251" strokeWidth="1" strokeLinejoin="round"><path d="m17 21 8-6 23 4v19l-10 7-22-7z" fill="#9f485c"/><path d="m17 21 21 4 10-6-23-4z" fill="#e4b277"/><path d="m17 21 21 4v18l-21-4z" fill="#be6970"/><path d="M21 21v16m5-15v17m5-16v17m5-16v17m5-15v14" stroke="#f3d7a0" strokeWidth="1.4"/><path d="m20 28 15 3m-15 4 15 3" stroke="#6e4056"/></g>;
  if (good === 'spice') return <g stroke="#74402d" strokeWidth="1" strokeLinejoin="round"><path d="M18 25h28l-4 14c-6 5-15 5-21 0z" fill="#a45a37"/><ellipse cx="32" cy="25" rx="14" ry="6" fill="#edd09a"/><ellipse cx="32" cy="24" rx="11" ry="4" fill="#c47940"/><path d="M24 25c2-6 6-9 10-9s7 3 9 9c-5 4-13 4-19 0z" fill="#d49a49"/><path d="M27 23c3-4 5-5 8-5m-3 8 7-7" fill="none" stroke="#f6e3ad" strokeWidth="1.1"/><path d="M43 13c-3 5-7 9-10 11" stroke="#d6ad62" strokeWidth="2.8" strokeLinecap="round"/></g>;
  if (good === 'leather') return <g stroke="#684231" strokeWidth="1" strokeLinejoin="round"><path d="M19 23c0-5 5-8 13-8s13 3 13 8v18c0 3-6 6-13 6s-13-3-13-6z" fill="#a76a43"/><path d="M21 25c6 4 20 4 24 0v6c-4 4-18 4-24 0z" fill="#d0a16d"/><path d="M22 32c6 4 16 4 22 0v9c-6 5-16 5-22 0z" fill="#8c5439"/><path d="M25 34v7m5-6v7m5-7v7m5-8v7" stroke="#e7c394" strokeWidth="1.2" strokeDasharray="1 2"/><path d="M25 21c3-3 11-3 14 0" fill="none" stroke="#f0d09f" strokeWidth="1.3"/></g>;
  if (good === 'camel') return <g fill="#96633c" stroke="#6f4a31" strokeWidth="1.2" strokeLinejoin="round"><path d="M14 29c1-6 6-9 12-8 4-8 11-8 15-1 5 1 8 6 8 11l-4 4-4-8-5 1-1 13h-4l-3-10h-5l-3 10h-4l1-12c-4 3-6 4-8 1z"/><path d="M39 21c4-7 8-9 12-6 2 2 1 5-3 7l-3 3"/><path d="M23 23c3-4 8-5 12-3l3 6-15 2z" fill="#d1a55c" stroke="#936b3e"/><circle cx="47" cy="17" r=".9" fill="#312a27" stroke="none"/></g>;
  return <g fill="#b77c3c" stroke="#805832" strokeWidth="1"><path d="M24 20c-5 6-7 14-7 22h30c-1-8-2-16-8-22l-7 5z"/><path d="M24 20c5-5 13-6 18 0m-13-2c-1-6 3-9 7-9s8 4 6 9" fill="#d6a950"/><path d="M22 28h19m-18 5h17" stroke="#fff0bd" strokeWidth="1.2"/></g>;
}

export function JaipurBonusArt({ revealed = false, value, count, language = 'ko', className = '' }: { revealed?: boolean; value?: number; count?: number; language?: Language; className?: string }) {
  const id = useId().replace(/:/g, '');
  const revealedValue = value ?? '—';
  const label = language === 'ko' ? (revealed ? `판매 보너스 ${revealedValue}점` : '뒤집힌 판매 보너스') : (revealed ? `Bono de venta: ${revealedValue} puntos` : 'Bono de venta boca abajo');
  return <svg className={`jaipur-bonus-art ${className}`.trim()} viewBox="0 0 86 112" role="img" aria-label={label}>
    <defs><linearGradient id={`${id}-card`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#33233b"/><stop offset=".55" stopColor="#54354c"/><stop offset="1" stopColor="#241d33"/></linearGradient><linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0bd"/><stop offset=".5" stopColor="#d4a653"/><stop offset="1" stopColor="#8e6138"/></linearGradient></defs>
    <rect x="7" y="7" width="73" height="98" rx="10" fill="#30202c" opacity=".22"/>
    {!revealed && count !== undefined && count > 1 && <g className="jaipur-bonus-art__stack" fill="none" stroke="#b88d4c" strokeWidth="1.4"><path d="M10 10h66a8 8 0 0 1 8 8v84H18a8 8 0 0 1-8-8z" fill="#35233a" transform="translate(-4 -2)"/><path d="M10 10h66a8 8 0 0 1 8 8v84H18a8 8 0 0 1-8-8z" fill="#3d2a40" transform="translate(-2 -1)"/></g>}
    <rect x="4" y="3" width="73" height="98" rx="9" fill={revealed ? '#f3dca5' : `url(#${id}-card)`} stroke={revealed ? '#f7e7bd' : '#d1aa63'} strokeWidth="2"/>
    <rect x="10" y="9" width="61" height="86" rx="5" fill="none" stroke={revealed ? '#9c6c3a' : '#ead39a'} strokeWidth="1.1" opacity=".8"/>
    {revealed ? <g><circle cx="40.5" cy="42" r="21" fill={`url(#${id}-gold)`} stroke="#986633" strokeWidth="1.5"/><path d="M40 24c-7 5-9 10-9 16 0 7 5 13 10 19 5-6 9-12 9-18 0-8-3-13-10-17z" fill="#784955" stroke="#64394c"/><path d="m40 31 5 9-5 9-5-9z" fill="#f4d582"/><text x="41" y="82" className="jaipur-bonus-art__value" textAnchor="middle">{revealedValue}</text></g> : <g className="jaipur-bonus-art__pattern" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="1.2"><path d="M40 17 47 27 60 25 55 38 64 48 51 52 47 65 40 57 33 65 29 52 16 48 25 38 20 25 33 27z"/><circle cx="40" cy="42" r="20"/><circle cx="40" cy="42" r="11"/><path d="M40 13v58M11 42h58M20 22l40 40m0-40L20 62" opacity=".55"/></g>}
  </svg>;
}

export function JaipurCamelAward({ language = 'ko', className = '', 'aria-hidden': ariaHidden }: { language?: Language; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }) {
  const id = useId().replace(/:/g, '');
  const decorative = ariaHidden === true || ariaHidden === 'true';
  return <svg className={`jaipur-camel-award ${className}`.trim()} viewBox="0 0 88 88" role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : language === 'ko' ? '낙타 다수 배지' : 'Sello por mayoría de camellos'}>
    <defs><linearGradient id={`${id}-badge`} x1=".08" y1="0" x2=".9" y2="1"><stop stopColor="#fff0bb"/><stop offset=".4" stopColor="#daa84e"/><stop offset=".8" stopColor="#976435"/><stop offset="1" stopColor="#eecb75"/></linearGradient></defs>
    <path d="M44 5c4 0 6 4 10 5s8-2 11 1 1 8 3 11 7 4 8 8-3 7-3 11 5 7 4 11-6 5-8 9 0 8-4 11-8 0-12 1-6 6-10 6-6-5-10-6-8 2-12-1-2-8-4-11-7-4-8-8 4-8 3-12-6-6-4-10 6-5 8-9 1-8 5-10 8 1 12-1 6-5 10-6z" fill={`url(#${id}-badge)`} stroke="#765330" strokeWidth="2"/>
    <circle cx="44" cy="43" r="31" fill="none" stroke="#fff1bf" strokeWidth="1.4"/><circle cx="44" cy="43" r="26" fill="none" stroke="#8b6037" strokeWidth="1"/>
    <path d="M17 43c-5-11-8-16-13-19m67 19c5-11 8-16 13-19M16 48c-3 10-5 15-10 19m66-19c3 10 5 15 10 19" fill="none" stroke="#577148" strokeWidth="2" strokeLinecap="round"/>
    <g transform="translate(20 20) scale(.49)"><path d="M14 52c3-14 14-21 27-19 6-18 22-20 32-4 13 4 21 16 22 31l-8 11-7-19-9 2-3 27h-7l-5-24H41l-5 24h-7l2-27c-10 7-13 11-18 5z" fill="#80522f" stroke="#62412d" strokeWidth="3"/><path d="M72 30c8-15 17-20 26-14 6 4 4 11-5 15l-8 8" fill="#80522f" stroke="#62412d" strokeWidth="3"/><path d="M43 37c7-10 19-13 30-7l6 17-35 3z" fill="#b77b43" stroke="#80522f" strokeWidth="3"/><circle cx="90" cy="24" r="2" fill="#34292a"/></g>
    <path d="M31 72h26" stroke="#835b33" strokeWidth="1.3"/><path d="m34 72 3 4 3-4m8 0 3 4 3-4" fill="none" stroke="#835b33" strokeWidth="1.2"/>
  </svg>;
}
