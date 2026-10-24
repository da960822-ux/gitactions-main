import './across-hero.css';

type Props = {language:'ko'|'es'; ready:boolean; introActive:boolean; onSkip:()=>void};

/** Content only; LandingWorldHost owns the persistent renderer and the scroll clock. */
export function AcrossHero({language,ready,introActive,onSkip}:Props){
 const es=language==='es';
 return <section className={`across-hero folded-playhouse${introActive?' is-intro':''}`} id="home" aria-labelledby="hero-title">
  <div className="across-stage">
   <div className="folded-backdrop" aria-hidden="true"/>
   <img className={`folded-portrait-fallback${ready?' is-ready':''}`} src="/images/approved-couple-room/approved-character-reference.png" alt="" aria-hidden="true" fetchPriority="high"/>
   <div className="across-editorial">
    <p className="folded-dedication">YEONSEOK <span aria-hidden="true">♡</span> LISBETH <i>04.04.2025</i></p>
    <h1 id="hero-title"><span className="across-title-line folded-baby">Baby,</span><span className="across-title-line">{es?'contigo':'너랑 놀 때가'}</span><span className="across-title-line">{es?'me divierto más.':'제일 좋아.'}</span></h1>
    <p className="across-caption">{es?<>Aunque estemos lejos, riámonos juntos.<br/>Eso sí, no dije que te iba a dejar ganar, haha.</>:<>멀리 있어도 같이 웃자.<br/>봐주겠다는 말은 안 했어 ㅋㅋㅋ</>}</p>
    <div className="across-actions"><a className="across-play" href="#games"><span>{es?'Vamos a jugar':'같이 놀자'}</span><span aria-hidden="true">↗</span></a></div>
   </div>
   <div className="folded-side-note" aria-hidden="true"><span>한국</span><i/> <span>República Dominicana</span></div>
   <div className="folded-destination" aria-labelledby="folded-destination-title" inert><h2 id="folded-destination-title">{es?'Baby, juguemos juntos.':'Baby, 같이 놀자.'}</h2><a href="#games">{es?'Vamos a jugar':'같이 놀자'} <span aria-hidden="true">↗</span></a></div>
   <div className="across-bottom"><span>YEONSEOK & LISBETH</span><a href="#games">{es?'Un lugar para los dos':'우리 둘이 노는 곳'}<span aria-hidden="true">↓</span></a><span>TÚ Y YO, BABY.</span></div>
   {introActive&&<button className="folded-skip" type="button" onClick={onSkip}>{es?'Saltar intro':'건너뛰기'} <span aria-hidden="true">↗</span></button>}
  </div>
 </section>;
}
