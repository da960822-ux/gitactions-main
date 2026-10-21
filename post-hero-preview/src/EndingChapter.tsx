import type {ReactNode} from 'react';
import {landingCopy} from '../../src/copy/home';
import {approvedPawns,pawnSource,type LocalEventState} from './LocalEventRig';
import './ending-chapter.css';

type Props={language:'ko'|'es';playHref?:string;embedded?:boolean;state:LocalEventState;detailsOpen?:boolean;onReadLetter:()=>void;children?:ReactNode};

export function EndingChapter({language,playHref,embedded=false,state,detailsOpen=false,onReadLetter,children}:Props){
 const ko=language==='ko',copy=landingCopy[language];
 const hasDrawing=state.strokes.some(line=>line.length>0);
 const pawn=approvedPawns[state.decorPawn]??approvedPawns[0];
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
    {(hasDrawing||state.hasSavedDecor)&&<figure className="ec-keepsake">
     {hasDrawing&&<svg className="ec-drawing" viewBox="0 0 100 60" role="img" aria-label={ko?'네가 그린 그림':'Tu dibujo'}>{state.strokes.map((line,i)=>line.length===1?<circle key={i} cx={line[0].x} cy={line[0].y} r=".8"/>:<polyline key={i} points={line.map(point=>`${point.x},${point.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>)}</svg>}
     {state.hasSavedDecor&&(state.decorKind==='pawn'?<img className="ec-decor ec-pawn" src={pawnSource(state.decorPawn)} alt={`${ko?'네가 고른 게임말':'La figura que elegiste'}: ${pawn[language]}`}/>:<svg className="ec-decor" viewBox="0 0 44 44" role="img" aria-label={state.decorKind==='gem'?(ko?'네가 고른 보석':'La gema que elegiste'):(ko?'네가 고른 종이 클립':'El clip que elegiste')}>{state.decorKind==='gem'?<><path d="M22 5 36 21 22 39 8 21Z" fill="#e6b58d"/><path d="M22 5V39L8 21Z" fill="#bc7e68"/><path d="M22 5 36 21 22 18Z" fill="#f9d5ac"/></>:<path d="M29 10 15 25a5 5 0 0 0 7 7l13-14a8 8 0 0 0-12-11L10 21a11 11 0 0 0 16 15" fill="none" stroke="#dbb7a3" strokeWidth="3" strokeLinecap="round"/>}</svg>)}
     <figcaption>{hasDrawing?(ko?'네가 그린 카드':'Tu tarjeta'):(ko?'네가 고른 작은 장식':'El detalle que elegiste')}</figcaption>
    </figure>}
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
