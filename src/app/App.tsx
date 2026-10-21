import { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from './Router';
import { canEnterPlayRoute, DESKTOP_GAME_QUERY } from '../core/display';
import { DesktopGameNotice } from './DesktopGameNotice';

function currentPath() { return window.location.pathname; }
const Landing = lazy(() => import('../landing/Landing').then(module => ({ default: module.Landing })));
const FeedbackRoute = lazy(() => import('./FeedbackRoute').then(module => ({ default: module.FeedbackRoute })));
const PlayApp = lazy(() => import('./PlayApp').then(module => ({ default: module.PlayApp })));

export function App() {
  const [path, setPath] = useState(currentPath());
  const [canPlay, setCanPlay] = useState(() => window.matchMedia(DESKTOP_GAME_QUERY).matches);
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
  if (path !== '/' && path !== '/feedback' && !canEnterPlayRoute(canPlay, path)) return <DesktopGameNotice language={localStorage.getItem('dos-language') === 'es' ? 'es' : 'ko'}/>;
  const es = localStorage.getItem('dos-language') === 'es';
  const loadingMessage = path === '/feedback'
    ? (es ? 'Abriendo las sugerencias…' : '건의사항을 여는 중…')
    : path === '/' ? (es ? 'Ya casi, Baby…' : '잠깐만, Baby…')
    : (es ? 'Cargando juegos…' : '게임방을 불러오는 중…');
  return <Suspense fallback={<main className="loading-screen"><strong>{es ? 'Nosotros' : '우리 둘'}</strong><span className="loader"/><p>{loadingMessage}</p></main>}>
    {path === '/' ? <Landing/> : path === '/feedback' ? <FeedbackRoute/> : <PlayApp path={path} desktopDisplay={canPlay} />}
  </Suspense>;
}

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  const es = localStorage.getItem('dos-language') === 'es';
  return <header className={`app-header ${compact ? 'compact' : ''}`}><Link href="/" className="brand">{es ? 'Nosotros' : '우리 둘'}</Link><div className="header-right"><Link href="/play" className="header-home">{es ? 'Juegos' : '게임방'} <span>↗</span></Link></div></header>;
}
