import type {ReactNode} from 'react';
import {landingCopy} from '../../src/copy/home';
import type {LocalEventState} from './LocalEventRig';
import {PartnerPact} from './PartnerPact';
import './ending-chapter.css';

type Props={language:'ko'|'es';playHref?:string;embedded?:boolean;state:LocalEventState;detailsOpen?:boolean;onReadLetter:()=>void;children?:ReactNode};

export function EndingChapter({language,playHref,embedded=false,detailsOpen=false,onReadLetter,children}:Props){
 const ko=language==='ko',copy=landingCopy[language];
 return <section id="together-again" className={`chapter ending ending-chapter${detailsOpen?' has-detail':''}`} data-pose="1" aria-labelledby="ending-title">
  <div className="ec-closing" hidden={detailsOpen}>
   <div className="ec-invitation">
    <h2 id="ending-title">{ko?<>자, 이제 같이 놀자,<br/><em>Baby.</em></>:<>Ahora sí,<br/>vamos a jugar,<br/><em>baby.</em></>}</h2>
    <div className="ec-actions">
     <a className="primary-button" href={playHref??'/#games'}>{playHref?copy.primaryAction:ko?'게임 고르기':'Elegir un juego'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M6 5h13v13"/></svg></a>
     <a className="text-button" href="/feedback">{ko?'Mami의 아이디어':'Ideas de Mami'}</a>
    </div>
   </div>
   <div className="ec-artifact-window" data-ending-artifact-window="true">
    <PartnerPact language={language}/>
   </div>
   <div className="ec-letter-return">
    <p className="ec-date"><span>{ko?'우리 시작':'Desde el'}</span><time dateTime="2025-04-04">2025.04.04</time></p>
    <a className="text-button ec-read-again" href="#papi-letter" onClick={onReadLetter}>{ko?'편지 다시 읽기':'Volver a leer la carta'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 7-7 7 7M12 6v14"/></svg></a>
   </div>
  </div>
  {children}
  <footer className="ec-footer"><span>Yeonseok <span aria-hidden="true">♡</span> Lisbeth</span><a href={embedded?'#home':'#intro'}>{ko?'처음으로':'Volver arriba'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 7-7 7 7M12 6v14"/></svg></a></footer>
 </section>;
}
