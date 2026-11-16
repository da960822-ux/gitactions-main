import { marbleRuntimeImage } from './marble-runtime-images';
import type { Language } from '../core/types';
// Display theme only: persisted route indices, economic values and old saves are unchanged.
const replacements = [
  { old:'푸에르토플라타', slug:'puerto-plata', ko:'기자', es:'Guiza', asset:'giza-pyramids-v1.png' },
  { old:'산후안', slug:'san-juan', ko:'리우', es:'Río', asset:'rio-christ-redeemer-v1.png' },
  { old:'마이애미', slug:'miami', ko:'싱가포르', es:'Singapur', asset:'singapore-marina-bay-sands-v1.png' },
  { old:'뉴어크', slug:'newark', ko:'두바이', es:'Dubái', asset:'dubai-burj-khalifa-v1.png' },
  { old:'토론토', slug:'toronto', ko:'베이징', es:'Pekín', asset:'beijing-temple-of-heaven-v1.png' },
  { old:'뉴욕', slug:'new-york', ko:'뉴욕', es:'Nueva York', asset:'new-york-statue-of-liberty-v2.png' },
];
export function marbleDisplayName(names:Record<string,unknown>, language:Language):string {
  const match=replacements.find(item=>item.old===names.ko);
  return match?.[language] ?? String(names[language]??names.ko??'');
}
export function marbleLandmarkAsset(slug:string, routeVersion=3):string|undefined {
  if(slug==='seoul')return '/images/marble/runtime/seoul-gyeongbokgung-5ad6d942f2a2.webp';
  if(slug==='incheon')return '/images/marble/runtime/incheon-airport-57a0d74bd12a.webp';
  if(slug==='newark'&&routeVersion===5)return '/images/marble/premium/cities/newark-sacred-heart.webp';
  const match=replacements.find(item=>item.slug===(slug==='dubai'?'newark':slug));
  return match ? marbleRuntimeImage(match.asset) : undefined;
}
export function marbleHasReplacement(names:Record<string,unknown>):boolean { return replacements.some(item=>item.old===names.ko&&item.slug!=='new-york'); }
export function marbleLandmarkNote(slug:string, language:Language, routeVersion=3):string|undefined {
  const notes:Record<string,{ko:string;es:string}>={
    seoul:{ko:'경복궁 근정전 · 서울',es:'Salón Geunjeongjeon del Palacio Gyeongbokgung · Seúl'},
    'new-york':{ko:'자유의 여신상 · 뉴욕',es:'Estatua de la Libertad · Nueva York'},
    'puerto-plata':{ko:'기자 피라미드 · 기자',es:'Pirámides de Guiza · Guiza'},
    'san-juan':{ko:'구세주 그리스도상 · 리우데자네이루',es:'Cristo Redentor · Río de Janeiro'},
    miami:{ko:'마리나 베이 샌즈 · 싱가포르',es:'Marina Bay Sands · Singapur'},
    newark:{ko:'부르즈 할리파 · 두바이',es:'Burj Khalifa · Dubái'},
    toronto:{ko:'천단 기년전 · 베이징',es:'Templo del Cielo · Pekín'},
  };
  if(slug==='newark'&&routeVersion===5)return language==='ko'?'성심 대성당 · 뉴어크':'Catedral del Sagrado Corazón · Newark';
  if(slug==='incheon')return language==='ko'?'인천국제공항 모티프 · 인천':'Inspirado en el Aeropuerto Internacional de Incheon · Incheon';
  return notes[slug==='dubai'?'newark':slug]?.[language];
}
