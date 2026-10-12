import {lazy, Suspense, useEffect, useState} from 'react';
import type {Language} from '../../core/types';
import {gameCatalog} from '../../games/catalog';
import {Link} from '../../app/Router';
import {landingCopy} from '../../copy/home';
import './game-gallery.css';

const StudioScene = lazy(() => import('./StudioScene'));

export function GameGallery({language}: {language: Language}) {
  const [selected, setSelected] = useState('domino');
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const copy = landingCopy[language], game = gameCatalog.find(item => item.id === selected)!;
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  return <section className="rd-games cs-game-gallery" id="games" aria-labelledby="gallery-title">
    <header><span className="rd-kicker">02 / EIGHT LITTLE WORLDS</span><h2 id="gallery-title">{copy.gamesTitle}</h2><p>{copy.gamesIntro[0]}<br/>{copy.gamesIntro[1]}</p></header>
    <div className="rd-game-stage">
      <div className="rd-game-sculptures"><Suspense fallback={<div className="rd-render-fallback" role="status">PREPARING YOUR GIFT</div>}><StudioScene mode="games" selected={selected} paused={reduced} onSelect={setSelected}/></Suspense></div>
      <div className="rd-game-caption" aria-live="polite"><span>{String(gameCatalog.indexOf(game) + 1).padStart(2, '0')} / 08</span><h3>{game.title[language]}</h3><p>{game.subtitle[language]}</p></div>
    </div>
    <div className="rd-game-choices" role="group" aria-label={copy.navGames}>
      {gameCatalog.map((item, index) => <button type="button" key={item.id} aria-pressed={selected === item.id} data-game={item.id} onClick={() => setSelected(item.id)}><small>{String(index + 1).padStart(2, '0')}</small><span>{item.title[language]}</span><i aria-hidden="true">↗</i></button>)}
    </div>
    <p className="rd-preview-note"><Link className="rd-game-start rd-main-action" href={`/play?game=${selected}`} aria-label={`${game.title[language]} · ${language === 'ko' ? '같이 놀기' : 'Jugar juntos'}`}>{language === 'ko' ? '같이 놀기' : 'Jugar juntos'}<span aria-hidden="true">↗</span></Link></p>
  </section>;
}
