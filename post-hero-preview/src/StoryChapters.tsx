import {useEffect,useState} from 'react';
import {STORY_START_DATE,storyDistanceKm,relationshipDays} from '../../src/landing/coupleStoryFacts';
import {DuelIllustration} from './DuelIllustration';
import {CountryCompanions} from './CountryCompanions';
import {StoryTimeInteraction} from './StoryTimeInteraction';
import './story-chapters.css';

export function StoryChapters({language}:{language:'ko'|'es'}){
 const ko=language==='ko';
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer);},[]);
 const distance=new Intl.NumberFormat(ko?'ko-KR':'es-DO').format(Math.round(storyDistanceKm)),days=new Intl.NumberFormat(ko?'ko-KR':'es-DO').format(relationshipDays(now));
 return <>
  <section id="distance" className="story-chapter story-distance" data-pose="0" aria-labelledby="story-distance-title">
   <CountryCompanions language={language}><div className="story-distance-copy"><h2 id="story-distance-title">{ko?'우리 사이, 이만큼.':'Entre tú y yo.'}</h2></div><div className="story-distance-facts"><p className="story-distance-number"><span>{ko?'약':'Unos'}</span>{distance}<small>km</small></p><p className="story-reference">{ko?'광주에서 산토도밍고까지, 도시 중심을 잇는 직선거리야.':'Distancia aproximada entre los centros de Gwangju y Santo Domingo.'}</p></div></CountryCompanions>
   <p className="story-distance-reason">{ko?'도미니카에서는 한국 리듬게임에 접속이 안 됐잖아. 그래서 우리 둘이 같이 놀 곳을 만들었어.':'Desde República Dominicana no podías entrar al juego de ritmo de Corea. Por eso hice un lugar para que juguemos juntos.'}</p>
   <a className="text-button story-next" href="#time-difference">{ko?'시간도 다르잖아':'También cambia la hora'}<span aria-hidden="true">↓</span></a>
  </section>
  <section id="time-difference" className="story-chapter story-time" data-pose=".16" aria-labelledby="story-time-title">
   <div className="story-time-intro"><h2 id="story-time-title">{ko?<>너의 지금,<br/>나의 지금.</>:<>Tu ahora.<br/>Mi ahora.</>}</h2><p>{ko?'한국이 13시간 빨라. 말도, 시간도 다르지만 같이 놀 시간은 고를 수 있잖아.':'Corea va 13 horas por delante. Hablamos distinto, pero podemos buscar nuestra hora para jugar.'}</p></div>
   <StoryTimeInteraction language={language} now={now}/>
   <a className="text-button story-next" href="#shared-place">{ko?'그래도, 너랑 나':'Y aun así, tú y yo'}<span aria-hidden="true">↓</span></a>
  </section>
  <section id="shared-place" className="story-chapter story-shared-place" data-pose=".32" aria-labelledby="story-place-title">
   <div className="story-couple-copy"><h2 id="story-place-title">{ko?<>그 많은 사람 중,<br/>너랑 나.</>:<>Entre tantas personas,<br/>tú y yo.</>}</h2><p className="story-since"><time dateTime={STORY_START_DATE}>2025.04.04</time><span>{ko?`그날로부터 ${days}일`:`${days} días desde entonces`}</span></p><p className="story-duel-question">{ko?'Baby, 이번엔 누가 이길까?':'Baby, ¿quién gana esta vez?'}</p><a className="text-button story-couple-play" href="#games">{ko?'같이 놀자, Baby':'Vamos a jugar, baby'}<span aria-hidden="true">↓</span></a></div>
   <DuelIllustration language={language}/>
   <span id="toy-table" className="story-internal-anchor" aria-hidden="true"/>
   <span className="gallery-arrival" data-pose=".45" aria-hidden="true"/>
  </section>
 </>;
}
