import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {gameCatalog} from '../games/catalog';
import {previewCopy} from './copy';
import {attachHeroMotion} from './heroMotion';
const StudioScene=lazy(()=>import('./StudioScene'));
export function LandingPreview(){
 const [language,setLanguage]=useState<'ko'|'es'>(()=>localStorage.getItem('dos-language')==='es'?'es':'ko');
 const [selected,setSelected]=useState('domino'),[open,setOpen]=useState(false),[paused,setPaused]=useState(false),[impulse,setImpulse]=useState(0);
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const hero=useRef<HTMLElement>(null);
 const envelope=useRef<HTMLButtonElement>(null),close=useRef<HTMLButtonElement>(null),wasOpen=useRef(false),stage=useRef<HTMLDivElement>(null),object=useRef<HTMLDivElement>(null),paper=useRef<HTMLElement>(null),letterText=useRef<HTMLDivElement>(null);const [scrollLetter,setScrollLetter]=useState(false);const copy=previewCopy[language],game=gameCatalog.find(g=>g.id===selected)!;
 useEffect(()=>{document.documentElement.lang=language==='es'?'es-DO':'ko';localStorage.setItem('dos-language',language);},[language]);
 useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 useEffect(()=>attachHeroMotion(hero.current!,paused||reduced),[paused,reduced]);
 useEffect(()=>{if(open)close.current?.focus({preventScroll:true});else if(wasOpen.current)envelope.current?.focus({preventScroll:true});wasOpen.current=open;},[open]);
 useEffect(()=>{const measure=()=>{const area=stage.current,body=object.current,sheet=paper.current;if(!area||!body||!sheet||!letterText.current)return;const overlap=innerWidth<=750?42:innerWidth>1100?12:55;const scale=Math.min(1,(area.clientHeight-24)/(sheet.offsetHeight+body.offsetHeight-overlap));area.style.setProperty('--unit-scale',String(scale));area.style.setProperty('--open-y',`${12+(sheet.offsetHeight-overlap)*scale}px`);area.style.setProperty('--paper-overlap',`${overlap}px`);area.dataset.ready='true';setScrollLetter(letterText.current!.scrollHeight>letterText.current!.clientHeight+1);};const observer=new ResizeObserver(measure);observer.observe(stage.current!);observer.observe(paper.current!);observer.observe(letterText.current!);document.fonts.ready.then(measure);measure();return()=>observer.disconnect();},[language]);
 const go=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:paused||reduced?'instant':'smooth',block:'start'});
 const openLetter=()=>{document.getElementById('gift-letter')?.scrollIntoView({behavior:'instant',block:'start'});setOpen(true);};
 const closeLetter=()=>setOpen(false);
 return <main className={`rd-page ${reduced||paused?'rd-still':''}`}>
  <header className="rd-nav"><a href="#gift-top" className="rd-brand">Y <i>♡</i> L</a><nav aria-label={language==='ko'?'선물 메뉴':'Menú del regalo'}><button onClick={()=>go('gift-games')}>{copy.games}</button><button onClick={openLetter}>{copy.letter}</button><div className="rd-languages"><button aria-pressed={language==='ko'} onClick={()=>setLanguage('ko')}>KO</button><button aria-pressed={language==='es'} onClick={()=>setLanguage('es')}>ES</button></div></nav></header>
  <section ref={hero} className="rd-hero" id="gift-top">
   <div className="rd-scene-space" aria-hidden="true"><div className="rd-scene-light"><div/></div><div className="rd-scene-fill"/><div className="rd-scene-shadow"/><div className="rd-scene-floor-light"/></div>
   <div className="rd-hero-stage"><Suspense fallback={<div className="rd-render-fallback" role="status">PREPARING YOUR GIFT</div>}><StudioScene mode="hearts" paused={paused||reduced} impulse={impulse}/></Suspense></div>
   <figure className="rd-couple"><div className="rd-couple-drift"><div className="rd-couple-art"><img src="/images/yeonseok-lisbeth-cutout.webp" width="1254" height="1254" fetchPriority="high" loading="eager" decoding="async" alt={language==='ko'?'연석과 Lisbeth의 기존 커플 캐리커처':'La caricatura de Yeonseok y Lisbeth'}/></div></div><figcaption><span>YEONSEOK <i>♡</i> LISBETH</span><small>{language==='ko'?'우리 둘, 같은 편.':'Tú y yo, del mismo lado.'}</small></figcaption></figure>
   <div className="rd-hero-copy"><span className="rd-kicker">FOR MY BABY, LISBETH</span><h1><span className="rd-baby-plane"><span className="rd-baby-arrival">{copy.title[0]}</span></span><span className="rd-message-plane"><span className="rd-message-arrival">{language==='ko'?<>이제 같이<span className="rd-mobile-break"><br/></span> 놀자.</>:<>juguemos<span className="rd-mobile-break"><br/></span> juntos.</>}</span></span></h1><p>{copy.body}</p><div className="rd-actions"><button className="rd-main-action" onClick={()=>go('gift-games')}>{copy.primary}<span>↗</span></button><button className="rd-line-action" onClick={openLetter}>{copy.secondary}<span>↗</span></button></div></div>
   <div className="rd-hero-floor"><span>01 / FOR THE TWO OF US</span><div><button disabled={paused||reduced} onClick={()=>setImpulse(i=>i+1)}>{copy.nudge}</button><button aria-pressed={!paused&&!reduced} disabled={reduced} onClick={()=>setPaused(p=>!p)}>{reduced?copy.motionReduced:paused?copy.motionOff:copy.motionOn}</button></div><span className="rd-preview-badge">{copy.badge}</span></div>
  </section>
  <section className="rd-story"><span className="rd-kicker">A PLACE WHERE WE UNDERSTAND EACH OTHER</span><h2>{copy.storyTitle}</h2><div><p>{copy.story}</p><p><b>한국어 <i>↔</i> Español</b>{copy.bridge}</p></div></section>
  <section className="rd-games" id="gift-games"><header><span className="rd-kicker">02 / EIGHT LITTLE WORLDS</span><h2>{copy.gamesTitle}</h2><p>{copy.gamesBody}</p></header>
   <div className="rd-game-stage"><div className="rd-game-sculptures"><Suspense fallback={<div className="rd-render-fallback" role="status">PREPARING YOUR GIFT</div>}><StudioScene mode="games" selected={selected} paused={paused||reduced} onSelect={setSelected}/></Suspense></div><div className="rd-game-caption" aria-live="polite"><span>{String(gameCatalog.indexOf(game)+1).padStart(2,'0')} / 08</span><h3>{game.title[language]}</h3><p>{game.subtitle[language]}</p></div></div>
   <div className="rd-game-choices" role="group" aria-label={copy.games}>{gameCatalog.map((item,i)=><button key={item.id} aria-pressed={selected===item.id} onClick={()=>setSelected(item.id)}><small>{String(i+1).padStart(2,'0')}</small><span>{item.title[language]}</span><i>↗</i></button>)}</div>
   <p className="rd-preview-note">{copy.previewNote}</p>
  </section>
  <section className={`rd-letter-section ${open?'is-open':''}`} id="gift-letter" aria-labelledby="gift-letter-heading" onKeyDown={e=>{if(e.key==='Escape'&&open){e.preventDefault();closeLetter();}}}>
   <header><span className="rd-kicker">03 / SEALED WITH LOVE</span><h2 id="gift-letter-heading">{copy.letterTitle}</h2><p>{language==='ko'?'실링을 눌러, baby. 이 편지는 너한테만.':'Toca el sello, baby. Esta carta es solo para ti.'}</p></header>
   <div ref={stage} className="rd-envelope-stage"><div ref={object} className="rd-envelope-object">
    <div className="rd-envelope-back"/>
    <div className="rd-letter-track"><article ref={paper} id="gift-paper" className="rd-paper" aria-hidden={!open} inert={!open}><span className="rd-paper-top">YEONSEOK → LISBETH <i>♡</i></span><p className="rd-paper-address">{copy.address}</p><h3>{copy.letterTitle}</h3><div ref={letterText} className="rd-letter-text" tabIndex={open?0:-1}>{copy.letterBody.map(p=><p key={p}>{p}</p>)}</div>{scrollLetter&&<span className="rd-paper-scroll-note">{language==='ko'?'편지를 내려서 계속 읽어줘 ↓':'Desliza la carta para seguir leyendo ↓'}</span>}<span className="rd-paper-signature">{copy.signature} ♡</span></article></div>
    <div className="rd-envelope-flap"><div className="rd-flap-front"/><div className="rd-flap-back"/></div>
    <div className="rd-envelope-pocket"><div className="rd-pocket-left"/><div className="rd-pocket-right"/><div className="rd-pocket-bottom"/><span className="rd-envelope-engraving">FOR MY BABY / LISBETH</span></div>
    <button ref={envelope} className="rd-seal" aria-label={copy.secondary} aria-expanded={open} aria-controls="gift-paper" disabled={open} onClick={openLetter}><span>Y <i>♡</i> L</span><small>{language==='ko'?'너에게':'PARA TI'}</small></button>
   </div><figure className="rd-rose-gift"><img src="/images/landing-preview/organic-rose-generated.png" width="1024" height="1536" loading="lazy" decoding="async" alt={copy.rose}/><figcaption>{language==='ko'?'너에게, 장미 한 송이.':'Una rosa para ti, mami.'}</figcaption></figure></div>
   <div className="rd-letter-controls"><button ref={close} hidden={!open} className="rd-letter-close rd-line-action" onClick={closeLetter}>{copy.close}<span>×</span></button></div>
  </section>
  <footer className="rd-footer"><span>Yeonseok <i>♡</i> Lisbeth</span><span>Made by your Papi.</span></footer>
 </main>;
}
