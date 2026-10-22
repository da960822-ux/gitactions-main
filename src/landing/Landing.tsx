import { useEffect, useState } from 'react';
import { Link } from '../app/Router';
import '../styles/landing.css';
import { landingCopy } from '../copy/home';
import { LandingWorldHost } from './LandingWorldHost';
import { gameCatalog } from '../games/catalog';
import './landing-navigation.css';

export function Landing() {
  const [language, setLanguage] = useState<'ko' | 'es'>(() => { try { return localStorage.getItem('dos-language') === 'es' ? 'es' : 'ko'; } catch { return 'ko'; } });
  const [selected, setSelected] = useState(() => { try { const saved = sessionStorage.getItem('folded-selected-game'); return gameCatalog.some(game => game.id === saved) ? saved! : 'domino'; } catch { return 'domino'; } });
  const [pastHero, setPastHero] = useState(false);
  const chooseGame = (id: string) => { if (!gameCatalog.some(game => game.id === id)) return; setSelected(id); try { sessionStorage.setItem('folded-selected-game', id); } catch { /* Storage is optional. */ } };
  const es = language === 'es';
  const copy = landingCopy[language];
  useEffect(() => {
    document.documentElement.lang = language === 'es' ? 'es-DO' : 'ko';
    document.title = 'Yeonseok ♡ Lisbeth';
  }, [language, es]);
  useEffect(() => {
    const initialHash = window.location.hash;
    if (!['#games', '#papi-letter'].includes(initialHash)) return;
    const host = document.querySelector('.landing-world-host');
    if (!host) return;
    let frame = 0;
    let cancelled = false;
    let observer: MutationObserver | undefined;
    const cancelRestore = () => {
      cancelled = true;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', onHashChange);
    };
    const onHashChange = () => {
      if (window.location.hash !== initialHash) cancelRestore();
    };
    const restoreWhenReady = () => {
      if (cancelled) return;
      if (window.location.hash !== initialHash) return cancelRestore();
      if (!host.classList.contains('is-world-ready') && !host.classList.contains('world-unavailable') && !host.classList.contains('is-world-unavailable')) return;
      observer?.disconnect();
      frame = requestAnimationFrame(() => {
        if (!cancelled && window.location.hash === initialHash) document.querySelector(initialHash)?.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
    };
    window.addEventListener('hashchange', onHashChange);
    if (host.classList.contains('is-world-ready') || host.classList.contains('world-unavailable') || host.classList.contains('is-world-unavailable')) restoreWhenReady();
    else {
      observer = new MutationObserver(restoreWhenReady);
      observer.observe(host, { attributes: true, attributeFilter: ['class'] });
    }
    return cancelRestore;
  }, []);
  useEffect(() => {
    const hero = document.querySelector('.across-hero');
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => {
      setPastHero(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  const changeLanguage = (next: 'ko' | 'es') => {
    setLanguage(next);
    try { localStorage.setItem('dos-language', next); } catch { /* Storage is optional. */ }
  };

  return <main className="landing">
    <header className={`landing-nav wrap${pastHero ? ' is-past-hero' : ''}`}>
      <Link href="/" className="couple-brand">
        <span>Yeonseok</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7a4.3 4.3 0 0 1 8.8-1.3 4.3 4.3 0 0 1 8.8 1.3Z"/></svg>
        <span>Lisbeth</span>
      </Link>
      <nav aria-label={es ? 'Navegación' : '메뉴'}>
        <a href="#games">{es ? copy.navGames : '게임 목록'}</a>
        <a href="#papi-letter">{copy.navLetter}</a>
        <Link href="/feedback">{es ? 'Sugerencias' : '건의사항'}</Link>
        <div className="landing-language" role="group" aria-label={es ? 'Idioma' : '언어'}>
          <button type="button" className={language === 'ko' ? 'active' : ''} aria-pressed={language === 'ko'} onClick={() => changeLanguage('ko')}>KO</button>
          <button type="button" className={language === 'es' ? 'active' : ''} aria-pressed={language === 'es'} onClick={() => changeLanguage('es')}>ES · RD</button>
        </div>
      </nav>
    </header>

    <LandingWorldHost language={language} onLanguageChange={changeLanguage} selected={selected} onSelect={chooseGame}/>
    <footer className="home-footer wrap">
      <Link href="/" className="couple-brand"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7a4.3 4.3 0 0 1 8.8-1.3 4.3 4.3 0 0 1 8.8 1.3Z"/></svg><span>{copy.footerBrand}</span></Link>
      <span>{copy.footerCredit}</span>
    </footer>
  </main>;
}
