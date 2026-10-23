import { useId } from 'react';
import './asset-discoveries.css';

export default function PrismDomino({angle,language}:{angle:0|1|2;language:'ko'|'es'}){
 const id=useId().replace(/:/g,'');
 return <svg className={`asset-prism angle-${angle}`} viewBox="0 0 420 230" role="img" data-prism-aligned={angle===1} aria-label={language==='ko'?(angle===1?'두 조각이 맞춰진 3·5 도미노':'같은 3·5 도미노의 어긋난 두 조각'):(angle===1?'Las dos partes forman un dominó de tres y cinco':'Dos partes desalineadas del mismo dominó de tres y cinco')}>
  <defs>
   <g id={`${id}-tile`}><rect x="174" y="43" width="72" height="144" rx="8" fill="#c7ab8d"/><rect x="174" y="39" width="72" height="144" rx="8" fill="#f4e8d2" stroke="#bb9678" strokeWidth="1.4"/><rect x="179" y="44" width="62" height="134" rx="5" fill="none" stroke="#e0cbb0"/>
    <path d="M181 111H239" stroke="#ab8a71" strokeWidth="1.4"/>
    {[[193,61],[210,77],[227,93],[193,129],[227,129],[210,145],[193,161],[227,161]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="#402935"/>)}
   </g>
   <clipPath id={`${id}-left`}><path d="M165 30H255V195Z"/></clipPath>
   <clipPath id={`${id}-right`}><path d="M165 30 255 195H165Z"/></clipPath>
  </defs>
  <ellipse cx="210" cy="204" rx="85" ry="9" fill="#100a12" opacity=".3"/>
  <g className="asset-prism-fragment fragment-left"><use href={`#${id}-tile`} clipPath={`url(#${id}-left)`}/></g>
  <g className="asset-prism-fragment fragment-right"><use href={`#${id}-tile`} clipPath={`url(#${id}-right)`}/></g>
 </svg>;
}
