import { useCallback, useEffect, useRef, useState } from 'react';
import { feedback, type FeedbackEntry } from '../core/feedback';
import type { Language } from '../core/types';
import { FeedbackPage } from './FeedbackPage';
import { FeedbackImport } from './FeedbackImport';
import { Link } from './Router';
import { readBrowserStorage, writeBrowserStorage } from './browserStorage';

const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;

export function FeedbackRoute() {
  const [language, setLanguage] = useState<Language>(() => readBrowserStorage('dos-language').value === 'es' ? 'es' : 'ko');
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [canAcknowledge, setCanAcknowledge] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [languageStorageIssue, setLanguageStorageIssue] = useState(false);
  const refreshGeneration = useRef(0);
  const es = language === 'es';
  const importRequested = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('import') === 'legacy';

  const refresh = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    try {
      const board = await feedback.list();
      if (generation !== refreshGeneration.current) return;
      setEntries(board.entries); setCanAcknowledge(board.canAcknowledge); setError(null);
    } catch {
      if (generation !== refreshGeneration.current) return;
      setEntries([]); setCanAcknowledge(false);
      setError(copy(language, '공용 아이디어 보관함을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'No se pudo abrir el buzón compartido. Inténtalo de nuevo.'));
    } finally { if (generation === refreshGeneration.current) setLoading(false); }
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = es ? 'es-DO' : 'ko';
    document.title = es ? 'Sugerencias · Yeonseok & Lisbeth' : '건의사항 · Yeonseok & Lisbeth';
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    window.addEventListener('focus', refresh);
    return () => { refreshGeneration.current += 1; clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [refresh, es]);

  return <div className="feedback-route">
    <header className="landing-nav wrap">
      <Link href="/" className="couple-brand">Yeonseok <span className="feedback-brand-heart" aria-hidden="true">♡</span> Lisbeth</Link>
      <nav aria-label={es ? 'Navegación' : '메뉴'}>
        <a href="/#games">{es ? 'Ver los juegos' : '게임 목록'}</a>
        <a href="/feedback" className="feedback-nav-current" aria-current="page">{es ? 'Sugerencias' : '건의사항'}</a>
        <div className="landing-language" role="group" aria-label={es ? 'Idioma' : '언어'}>{(['ko','es'] as const).map(lang => <button key={lang} className={language === lang ? 'active' : ''} aria-pressed={language === lang} onClick={() => { if (!writeBrowserStorage('dos-language', lang)) setLanguageStorageIssue(true); setLanguage(lang); }}>{lang === 'ko' ? 'KO' : 'ES · RD'}</button>)}</div>
      </nav>
    </header>
    <div className="wrap feedback-access-note"><div><b>{copy(language, '우리의 아이디어 보관함', 'Nuestro buzón de ideas')}</b><p>{copy(language, '이 비공개 사이트에 접속할 수 있는 두 사람이 같은 글을 봐요.', 'Las dos personas con acceso a este sitio privado ven las mismas ideas.')}</p>{languageStorageIssue && <p className="feedback-storage-note" role="status">{copy(language, '언어를 바꿨지만 다음 방문을 위해 저장하지 못했어요.', 'Cambiamos el idioma, pero no pudimos guardarlo para la próxima visita.')}</p>}</div><div className="feedback-refresh-action"><button className="secondary-action" onClick={() => void refresh()}>{copy(language, '새로고침', 'Actualizar')}</button></div></div>
    {importRequested && canAcknowledge && <FeedbackImport language={language} onImported={() => void refresh()}/>}
    <FeedbackPage language={language} entries={entries} loading={loading} error={error} canCreate canAcknowledge={canAcknowledge} onCreate={async (input,requestId) => { const entry = await feedback.create(input,requestId); refreshGeneration.current += 1; setEntries(items => [entry, ...items.filter(item => item.id !== entry.id)]); return entry; }} onSetStatus={async (id,status) => { await feedback.updateStatus(id,status); refreshGeneration.current += 1; setEntries(items => items.map(item => item.id === id ? { ...item, status } : item)); }}/>
  </div>;
}
