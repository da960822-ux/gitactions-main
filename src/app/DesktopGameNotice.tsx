import { useEffect } from 'react';
import { landingCopy } from '../copy/home';
import type { Language } from '../core/types';
import { Link } from './Router';
import '../styles/desktop-game-notice.css';

export function DesktopGameNotice({ language }: { language: Language }) {
  const copy = landingCopy[language];
  useEffect(() => {
    document.documentElement.lang = language === 'es' ? 'es-DO' : 'ko';
    document.title = `${copy.desktopOnlyTitle} · Yeonseok ♡ Lisbeth`;
  }, [language, copy.desktopOnlyTitle]);

  return <main className="desktop-game-notice" aria-labelledby="desktop-game-title">
    <Link href="/" className="desktop-game-brand">Yeonseok ♡ Lisbeth</Link>
    <div className="desktop-game-copy">
      <svg viewBox="0 0 64 56" aria-hidden="true"><rect x="5" y="5" width="54" height="35" rx="5"/><path d="M24 40v10m16-10v10M17 50h30M32 31s-12-7-12-13a6 6 0 0 1 12-1 6 6 0 0 1 12 1c0 6-12 13-12 13Z"/></svg>
      <h1 id="desktop-game-title">{copy.desktopOnlyTitle}</h1>
      <p>{copy.desktopOnlyBody}</p>
      <Link href="/" className="desktop-game-return">{copy.desktopOnlyAction} <span aria-hidden="true">↗</span></Link>
    </div>
  </main>;
}
