import { useEffect, useState } from 'react';
import { Link } from '../app/Router';
import '../styles/landing.css';
import { landingCopy } from '../copy/home';
import { HeroScene } from './HeroScene';
import { GameRail } from './GameRail';
import { LandingMoments } from './LandingMoments';

export function Landing() {
  const [language, setLanguage] = useState<'ko' | 'es'>(() => typeof window !== 'undefined' && localStorage.getItem('dos-language') === 'es' ? 'es' : 'ko');
  const es = language === 'es';
  const copy = landingCopy[language];
  useEffect(() => {
    document.documentElement.lang = language === 'es' ? 'es-DO' : 'ko';
    document.title = 'Yeonseok ♡ Lisbeth';
  }, [language, es]);
  useEffect(() => {
    if (!['#games', '#papi-letter'].includes(window.location.hash)) return;
    const frame = requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView({ behavior: 'instant', block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, []);
  const changeLanguage = (next: 'ko' | 'es') => {
    setLanguage(next);
    localStorage.setItem('dos-language', next);
  };

  return <main className="landing">
    <header className="landing-nav wrap">
      <Link href="/" className="couple-brand">
        <span>Yeonseok</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7a4.3 4.3 0 0 1 8.8-1.3 4.3 4.3 0 0 1 8.8 1.3Z"/></svg>
        <span>Lisbeth</span>
      </Link>
      <nav aria-label={es ? 'Navegación' : '메뉴'}>
        <a href="#games">{copy.navGames}</a>
        <a href="#papi-letter">{copy.navLetter}</a>
        <Link href="/feedback">{copy.navFeedback}</Link>
        <div className="landing-language" role="group" aria-label={es ? 'Idioma' : '언어'}>
          <button type="button" className={language === 'ko' ? 'active' : ''} aria-pressed={language === 'ko'} onClick={() => changeLanguage('ko')}>KO</button>
          <button type="button" className={language === 'es' ? 'active' : ''} aria-pressed={language === 'es'} onClick={() => changeLanguage('es')}>ES · RD</button>
        </div>
      </nav>
    </header>

    <HeroScene backgroundSrc="/images/our-universe-scene.webp" envelopeSrc="/images/lisbeth-letter-envelope.webp" portraitSrc="/images/yeonseok-lisbeth-cutout.webp" portraitAlt={es ? 'Yeonseok y Lisbeth juntos' : '함께 있는 연석과 리스벳'} language={language}>
      <div className="hero-copy">
        <p className="hero-dedication">{copy.heroKicker}</p>
        <h1 id="hero-title">{copy.heroTitle[0]}<br/>{copy.heroTitle[1]}</h1>
        <p>{copy.heroBody}</p>
        <div className="hero-actions">
          <a href="#games" className="primary-action">{copy.primaryAction} <span aria-hidden="true">↓</span></a>
          <a href="#papi-letter" className="secondary-action">{copy.secondaryAction} <span aria-hidden="true">↓</span></a>
        </div>

      </div>
    </HeroScene>

    <div className="home-content wrap">
      <section className="game-picker" id="games" aria-labelledby="games-title">
        <header className="picker-head personal-picker-head">
          <h2 id="games-title">{copy.gamesTitle}</h2>
          <p>{copy.gamesIntro[0]}<br/>{copy.gamesIntro[1]}</p>
        </header>
        <GameRail language={language} />
      </section>

    </div>
    <LandingMoments language={language} />
    <footer className="home-footer wrap">
      <Link href="/" className="couple-brand"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7a4.3 4.3 0 0 1 8.8-1.3 4.3 4.3 0 0 1 8.8 1.3Z"/></svg><span>{copy.footerBrand}</span></Link>
      <span>{copy.footerCredit}</span>
    </footer>
  </main>;
}
