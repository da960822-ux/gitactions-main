import {lazy, Suspense, useEffect, useState} from 'react';
import type {Language} from '../../core/types';
import {gameCatalog} from '../../games/catalog';
import {Link} from '../../app/Router';
import {landingCopy} from '../../copy/home';
import './game-gallery.css';

const StudioScene = lazy(() => import('./StudioScene'));

type Props = {language: Language; selected?: string; onSelect?: (id: string) => void; sharedScene?: boolean};

export function GameGallery({language, selected: controlledSelected, onSelect, sharedScene = false}: Props) {
  const [localSelected, setLocalSelected] = useState('domino');
  const selected = controlledSelected ?? localSelected;
  const setSelected = onSelect ?? setLocalSelected;
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const copy = landingCopy[language], game = gameCatalog.find(item => item.id === selected)!;
  useEffect(() => { try { localStorage.setItem('dos-language', language); } catch { /* Storage is optional. */ } }, [language]);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  return <section className="rd-games cs-game-gallery" id="games" aria-labelledby="gallery-title">
    <header><h2 id="gallery-title">{language === 'ko' ? 'Baby, 뭐부터 할까?' : 'Baby, ¿a qué jugamos?'}</h2><p>{language === 'ko' ? '게임 조각을 눌러 골라봐.' : 'Toca una pieza para elegir.'}</p></header>
    <div className="rd-game-stage">
      <div className="rd-game-sculptures" aria-label={language === 'ko' ? '게임 조각을 눌러 골라 봐' : 'Toca una pieza para elegir'}>{!sharedScene && <Suspense fallback={<div className="rd-render-fallback" role="status">{language === 'ko' ? '게임을 준비하는 중…' : 'Preparando los juegos…'}</div>}><StudioScene mode="games" loadingLabel={language === 'ko' ? '게임을 준비하는 중…' : 'Preparando los juegos…'} selected={selected} paused={reduced} onSelect={setSelected}/></Suspense>}</div>
      <div className="rd-game-caption"><div className="rd-game-description" aria-live="polite"><span>{String(gameCatalog.indexOf(game) + 1).padStart(2, '0')} / 08</span><h3>{game.title[language]}</h3><p>{game.subtitle[language]}</p></div><Link className="rd-game-start rd-main-action" href={`/play?game=${selected}`} aria-label={`${game.title[language]} · ${language === 'ko' ? '같이 놀기' : 'Jugar juntos'}`}>{language === 'ko' ? '같이 놀기' : 'Jugar juntos'}<span aria-hidden="true">↗</span></Link></div>
    </div>
    <div className="rd-game-choices" role="group" aria-label={copy.navGames} onKeyDown={event => {
      const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
      if (!step && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const index = gameCatalog.findIndex(item => item.id === selected);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? gameCatalog.length - 1 : (index + step + gameCatalog.length) % gameCatalog.length;
      setSelected(gameCatalog[next].id);
      event.currentTarget.querySelector<HTMLButtonElement>(`[data-game="${gameCatalog[next].id}"]`)?.focus();
    }}>
      {gameCatalog.map((item, index) => <button type="button" key={item.id} aria-pressed={selected === item.id} data-game={item.id} onClick={() => setSelected(item.id)}><small>{String(index + 1).padStart(2, '0')}</small><span>{item.title[language]}</span></button>)}
    </div>
  </section>;
}
