import {useEffect,useState} from 'react';
import {previewCopy} from './copy';
import {landingCopy} from '../copy/home';
import {GameRail} from '../landing/GameRail';
import {Link} from '../app/Router';
import CoupleSpaceScene from './CoupleSpaceScene';
import {SpaceLetter} from './SpaceLetter';
import '../styles/landing.css';
import './preview.css';
import './couple-space.css';

export function LandingPreview({connected=false}:{connected?:boolean}) {
 const [language,setLanguage]=useState<'ko'|'es'>(()=>localStorage.getItem('dos-language')==='es'?'es':'ko');
 const [open,setOpen]=useState(false),[paused,setPaused]=useState(false),[unavailable,setUnavailable]=useState(false);
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const copy=previewCopy[language],home=landingCopy[language];
 useEffect(()=>{document.documentElement.lang=language==='es'?'es-DO':'ko';document.title='Yeonseok ♡ Lisbeth';localStorage.setItem('dos-language',language);},[language]);
 useEffect(()=>{if(!connected)return;const target=({'#games':'gift-games','#papi-letter':'gift-letter','#gift-games':'gift-games','#gift-letter':'gift-letter'} as Record<string,string>)[location.hash];if(!target)return;let frame=0,active=true;document.fonts.ready.then(()=>{if(active)frame=requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({behavior:'instant',block:'start'}));});return()=>{active=false;cancelAnimationFrame(frame);};},[connected]);
 useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 const go=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:paused||reduced?'instant':'smooth'});
 const openLetter=()=>{document.getElementById('gift-letter')?.scrollIntoView({behavior:'instant',block:'start'});setOpen(true);};
 return <main className={`landing rd-page cs-page ${unavailable?'cs-no-webgl':''} ${paused||reduced?'rd-still':''}`}>
  {!unavailable&&<CoupleSpaceScene paused={paused} reduced={reduced} open={open} onUnavailable={()=>setUnavailable(true)}/>}
  <header className="landing-nav wrap"><a href="#home" className="couple-brand"><span>Yeonseok</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7a4.3 4.3 0 0 1 8.8-1.3 4.3 4.3 0 0 1 8.8 1.3Z"/></svg><span>Lisbeth</span></a><nav aria-label={language==='ko'?'선물 메뉴':'Menú del regalo'}><button onClick={()=>go('gift-games')}>{home.navGames}</button><button onClick={openLetter}>{home.navLetter}</button>{connected&&<Link href="/feedback">{home.navFeedback}</Link>}<div className="landing-language"><button aria-pressed={language==='ko'} className={language==='ko'?'active':''} onClick={()=>setLanguage('ko')}>KO</button><button aria-pressed={language==='es'} className={language==='es'?'active':''} onClick={()=>setLanguage('es')}>ES · RD</button></div></nav></header>
  <section className="cs-hero" id="home" aria-labelledby="hero-title"><div className="cs-stage">
   <figure className="cs-portrait"><img src="/images/yeonseok-lisbeth-cutout.webp" width="1254" height="1254" alt={language==='ko'?'함께 있는 연석과 리스벳':'Yeonseok y Lisbeth juntos'}/></figure>
   <div className="cs-hero-copy"><p className="cs-dedication">{home.heroKicker}</p><h1 id="hero-title"><span>{home.heroTitle[0]}</span>{home.heroTitle[1]}</h1><p className="cs-body">{home.heroBody}</p><div className="cs-actions"><button className="primary-action" onClick={()=>go('gift-games')}>{home.primaryAction}<span aria-hidden="true">↓</span></button><button className="secondary-action" onClick={openLetter}>{home.secondaryAction}<span aria-hidden="true">↗</span></button></div></div>
   <p className="cs-space-caption">YEONSEOK ♡ LISBETH<span>{language==='ko'?'풍선을 움직여봐, baby. 우리 공간이야.':'Mueve los globos, baby. Este es nuestro espacio.'}</span></p>
  </div></section>
  <div className="home-content wrap"><section className="game-picker" id="gift-games" aria-labelledby="restored-games-title"><header className="picker-head personal-picker-head"><h2 id="restored-games-title">{home.gamesTitle}</h2><p>{home.gamesIntro[0]}<br/>{home.gamesIntro[1]}</p></header><GameRail language={language}/><p className="cs-mobile-note">{home.mobileGameNote}</p></section></div>
  <section className="cs-story"><p className="cs-kicker">FOR THE TWO OF US</p><h2>{copy.storyTitle}</h2><p>{copy.story}</p><p>{copy.bridge}</p></section>
  <SpaceLetter language={language} open={open} onOpen={openLetter} onClose={()=>setOpen(false)}/>
  <footer className="rd-footer"><span>Yeonseok <i>♡</i> Lisbeth<small>{language==='ko'?'2025년 4월 4일부터, 우리 둘.':'Desde el 4 de abril de 2025, tú y yo.'}</small></span><button className="rd-line-action" aria-pressed={!paused&&!reduced} disabled={reduced} onClick={()=>setPaused(value=>!value)}>{reduced?copy.motionReduced:paused?copy.motionOff:copy.motionOn}</button><span>Made by your Papi.</span></footer>
 </main>;
}
