import { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from './Router';
import { canEnterPlayRoute, DESKTOP_GAME_QUERY } from '../core/display';
import { DesktopGameNotice } from './DesktopGameNotice';
import { readBrowserStorage } from './browserStorage';

function currentPath() { return window.location.pathname; }
const Landing = lazy(() => import('../landing/Landing').then(module => ({ default: module.Landing })));
const FeedbackRoute = lazy(() => import('./FeedbackRoute').then(module => ({ default: module.FeedbackRoute })));
const PlayApp = lazy(() => import('./PlayApp').then(module => ({ default: module.PlayApp })));

export function App() {
  const [path, setPath] = useState(currentPath());
  const [canPlay, setCanPlay] = useState(() => window.matchMedia(DESKTOP_GAME_QUERY).matches);
  const languagePreference = readBrowserStorage('dos-language');
  // Supabase Auth probes this key while the feedback chunk is evaluated.
  const feedbackStorage = readBrowserStorage('supabase.gotrue-js.locks.debug');
  useEffect(() => {
    const display = window.matchMedia(DESKTOP_GAME_QUERY);
    const update = () => setCanPlay(display.matches);
    display.addEventListener('change', update);
    return () => display.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const onPop = () => setPath(currentPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  if (path !== '/' && path !== '/feedback' && !canEnterPlayRoute(canPlay, path)) return <DesktopGameNotice language={readBrowserStorage('dos-language').value === 'es' ? 'es' : 'ko'}/>;
  const es = languagePreference.value === 'es';
  if (path === '/feedback' && !feedbackStorage.available) return <main className="desktop-game-notice" aria-labelledby="feedback-storage-title">
    <a className="desktop-game-brand" href="/">Yeonseok ♡ Lisbeth</a>
    <div className="desktop-game-copy">
      <h1 id="feedback-storage-title">{es ? 'El almacenamiento del navegador no está disponible' : '브라우저 저장소를 사용할 수 없어요'}</h1>
      <p>{es ? 'No podemos abrir las sugerencias en este navegador. Permite el almacenamiento para este sitio y vuelve a intentarlo.' : '이 브라우저에서는 건의사항을 열 수 없어요. 이 사이트의 저장소를 허용한 뒤 다시 시도해 주세요.'}</p>
      <div className="feedback-storage-actions">
        <button type="button" className="desktop-game-return" onClick={() => window.location.reload()}>{es ? 'Intentar de nuevo' : '다시 시도'}</button>
        <a className="desktop-game-return" href="/">{es ? 'Ir al inicio' : '홈으로'}</a>
        <a className="desktop-game-return" href="/#games">{es ? 'Ver juegos' : '게임 목록'}</a>
      </div>
    </div>
  </main>;
  const loadingMessage = path === '/feedback'
    ? (es ? 'Abriendo las sugerencias…' : '건의사항을 여는 중…')
    : path === '/' ? (es ? 'Ya casi, Baby…' : '잠깐만, Baby…')
    : (es ? 'Cargando juegos…' : '게임방을 불러오는 중…');
  return <Suspense fallback={<main className="loading-screen"><strong>{es ? 'Nosotros' : '우리 둘'}</strong><span className="loader"/><p>{loadingMessage}</p></main>}>
    {path === '/' ? <Landing/> : path === '/feedback' ? <FeedbackRoute/> : <PlayApp path={path} desktopDisplay={canPlay} />}
  </Suspense>;
}

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  const es = readBrowserStorage('dos-language').value === 'es';
  return <header className={`app-header ${compact ? 'compact' : ''}`}><Link href="/" className="brand">{es ? 'Nosotros' : '우리 둘'}</Link><div className="header-right"><Link href="/play" className="header-home">{es ? 'Juegos' : '게임방'} <span>↗</span></Link></div></header>;
}
