import {useState,type ReactNode} from 'react';
import {landingCopy} from '../../copy/home';
import type {LocalEventState} from './LocalEventRig';
import {RoseGiftFinale} from './RoseGiftFinale';
import './ending-chapter.css';

type Props={language:'ko'|'es';playHref?:string;embedded?:boolean;state:LocalEventState;detailsOpen?:boolean;pactAccepted?:boolean;reducedMotion?:boolean;onReadLetter:()=>void;children?:ReactNode};

export function EndingChapter({language,playHref,embedded=false,detailsOpen=false,pactAccepted=false,reducedMotion=false,onReadLetter,children}:Props){
 const ko=language==='ko',copy=landingCopy[language];
 const [giftReceived,setGiftReceived]=useState(false);
 return <section id="together-again" className={`ending-chapter has-rose-gift${detailsOpen?' has-detail':''}`} aria-labelledby="rose-gift-title">
  <div className="ec-closing" hidden={detailsOpen}>
   <div className="ec-rose-finale"><RoseGiftFinale language={language} reducedMotion={reducedMotion} pactAccepted={pactAccepted} onReceived={()=>setGiftReceived(true)}/><div className="ec-actions ec-finale-actions" hidden={!giftReceived}><a className="primary-button" href={playHref??'/#games'}>{playHref?copy.primaryAction:ko?'게임 고르기':'Elegir un juego'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M6 5h13v13"/></svg></a><a className="text-button" href="/feedback">{ko?'Mami의 아이디어':'Ideas de Mami'}</a></div></div>
   <div className="ec-letter-return">
    <p className="ec-date"><span>{ko?'우리 시작':'Desde el'}</span><time dateTime="2025-04-04">2025.04.04</time></p>
    <a className="text-button ec-read-again" href="#papi-letter" onClick={onReadLetter}>{ko?'편지 다시 읽기':'Volver a leer la carta'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 7-7 7 7M12 6v14"/></svg></a>
   </div>
  </div>
  {children}
  <footer className="ec-footer"><span>Yeonseok <span aria-hidden="true">♡</span> Lisbeth</span><a href={embedded?'#home':'#intro'}>{ko?'처음으로':'Volver arriba'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 7-7 7 7M12 6v14"/></svg></a></footer>
 </section>;
}
