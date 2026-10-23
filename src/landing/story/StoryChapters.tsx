import {useEffect,useState} from 'react';
import {STORY_START_DATE,storyDistanceKm,relationshipDays,previewPlayHour} from '../coupleStoryFacts';
import {DuelIllustration} from './DuelIllustration';
import {FirstConversation} from '../FirstConversation';
import {CountryCompanions} from './CountryCompanions';
import {StoryTimeInteraction} from './StoryTimeInteraction';
import './story-chapters.css';

export function StoryChapters({language}:{language:'ko'|'es'}){
 const ko=language==='ko';
 const [now,setNow]=useState(()=>new Date()),[koreanHour,setKoreanHour]=useState(20),[choseTime,setChoseTime]=useState(false);
 useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer);},[]);
 const chosen=previewPlayHour(koreanHour),pad=(value:number)=>String(value).padStart(2,'0');
 const distance=new Intl.NumberFormat(ko?'ko-KR':'es-DO').format(Math.round(storyDistanceKm)),days=new Intl.NumberFormat(ko?'ko-KR':'es-DO').format(relationshipDays(now));
 return <div className="story-connection">
  <div data-pose="0"><FirstConversation language={language}/></div>
  <section id="distance" className="story-chapter story-distance" data-pose=".08" aria-labelledby="story-distance-title">
   <div className="story-distance-copy"><h2 id="story-distance-title">{ko?'우리 사이, 이만큼.':'Entre tú y yo.'}</h2><div className="story-distance-facts"><p className="story-distance-number"><span>{ko?'약':'Unos'}</span>{distance}<small>km</small></p><p className="story-reference">{ko?'광주에서 산토도밍고까지, 도시 중심을 잇는 직선거리야.':'Distancia aproximada entre los centros de Gwangju y Santo Domingo.'}</p></div>
   <p className="story-distance-reason">{ko?'한국 리듬게임에 접속이 안 됐잖아. 바로 옆에 갈 수는 없어도 너랑 같이 놀고 싶어서 우리 둘이 놀 곳을 만들었어.':'Desde República Dominicana no podías entrar al juego de ritmo de Corea. No puedo ir a verte así de fácil, pero sí quiero pasar tiempo contigo. Por eso hice esto para nosotros.'}</p></div>
   <CountryCompanions language={language}/>
   <a className="text-button story-next" href="#time-difference">{ko?'같이 놀 시간도 골라볼까?':'Busquemos nuestra hora para jugar'}<span aria-hidden="true">↓</span></a>
  </section>
  <section id="time-difference" className="story-chapter story-time" data-pose=".16" aria-labelledby="story-time-title">
   <div className="story-time-intro"><h2 id="story-time-title">{ko?'그래서, 같이 놀 시간.':'Busquemos nuestra hora.'}</h2><p>{ko?'한국이 13시간 빨라. 내 저녁이 네 아침이네. 둘 다 졸리지 않을 시간으로 한번 골라보자, Baby.':'Corea va trece horas por delante. Mi noche es tu mañana. Busquemos una hora en la que ninguno se esté durmiendo, Baby.'}</p></div>
   <StoryTimeInteraction language={language} now={now} koreanHour={koreanHour} onHourChange={value=>{setKoreanHour(value);setChoseTime(true);}}/>
   <a className="text-button story-next" href="#shared-place">{ko?'이제 같이 놀자, Baby':'Ahora sí, a jugar, baby'}<span aria-hidden="true">↓</span></a>
  </section>
  <section id="shared-place" className="story-chapter story-shared-place" data-pose=".32" aria-labelledby="story-place-title">
   <div className="story-couple-copy"><h2 id="story-place-title" data-language={language}>{ko?<>그 많은 사람 중,<br/>너랑 나.</>:<><span className="story-title-line">Entre tantas personas,</span><span className="story-title-line">tú y yo.</span></>}</h2><p className="story-since"><time dateTime={STORY_START_DATE}>2025.04.04</time><span>{ko?`그날로부터 ${days}일`:`${days} días desde entonces`}</span></p>{choseTime&&<p className="story-selected-time" data-selected-play-hour={chosen.koHour}><span>{ko?'골라본 시간':'La hora que probaste'}</span>{ko?'광주':'Gwangju'} {pad(chosen.koHour)}:00 · Santo Domingo {pad(chosen.drHour)}:00{chosen.drDayOffset<0?` (${ko?'전날':'el día anterior'})`:''}</p>}<p className="story-duel-question">{ko?'Baby, 이번엔 누가 이길까?':'Baby, ¿quién gana esta vez?'}</p><a className="text-button story-couple-play" href="#games">{ko?'같이 놀자, Baby':'Vamos a jugar, baby'}<span aria-hidden="true">↓</span></a></div>
   <DuelIllustration language={language}/>
   <span id="toy-table" className="story-internal-anchor" aria-hidden="true"/>
   <span className="gallery-arrival" data-pose=".45" aria-hidden="true"/>
  </section>
 </div>;
}
