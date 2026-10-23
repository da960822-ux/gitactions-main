import { useCallback, useEffect, useRef, useState } from 'react';
import { feedback, isFeedbackOnline, type FeedbackEntry } from '../core/feedback';
import type { Language } from '../core/types';
import { FeedbackPage } from './FeedbackPage';
import { Link } from './Router';
import { readBrowserStorage, writeBrowserStorage } from './browserStorage';

const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;

export function FeedbackRoute() {
  const [initialStorage] = useState(() => {
    const savedLanguage = readBrowserStorage('dos-language');
    const savedSpace = readBrowserStorage('dos-feedback-space');
    return {
      language: savedLanguage.value === 'es' ? 'es' as const : 'ko' as const,
      spaceId: savedSpace.value || '',
      available: savedLanguage.available && savedSpace.available,
    };
  });
  const [language, setLanguage] = useState<Language>(initialStorage.language);
  const [spaceId, setSpaceId] = useState(initialStorage.spaceId);
  const [storageIssue, setStorageIssue] = useState<'read' | 'space' | 'language' | null>(initialStorage.available ? null : 'read');
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [role, setRole] = useState<'p1' | 'p2' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshGeneration = useRef(0);
  const initialization = useRef<Promise<string> | null>(null);
  const es = language === 'es';

  const refresh = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    const isCurrent = () => refreshGeneration.current === generation;
    try {
      let id = spaceId;
      if (!id) {
        // The storage scope is an internal detail, never a setup step for writing.
        initialization.current ??= feedback.createSpace().then(created => {
          if (!writeBrowserStorage('dos-feedback-space', created)) setStorageIssue('space');
          return created;
        }).catch(reason => { initialization.current = null; throw reason; });
        id = await initialization.current;
        if (!isCurrent()) return;
        setSpaceId(id);
      }
      const seat = await feedback.getRole(id);
      if (!isCurrent()) return;
      const items = await feedback.list(id);
      if (!isCurrent()) return;
      setEntries(items); setRole(seat); setError(null);
    } catch {
      if (!isCurrent()) return;
      setError(copy(language, '건의사항을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'No se pudieron cargar las sugerencias. Inténtalo de nuevo.'));
    } finally { if (isCurrent()) setLoading(false); }
  }, [spaceId, language]);

  useEffect(() => {
    document.documentElement.lang = language === 'es' ? 'es-DO' : 'ko';
    document.title = es ? 'Sugerencias · Yeonseok & Lisbeth' : '건의사항 · Yeonseok & Lisbeth';
    // Retire old invitation URLs without discarding saved entries.
    if (location.search) history.replaceState(null, '', '/feedback');
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    window.addEventListener('focus', refresh);
    return () => { refreshGeneration.current += 1; clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [refresh, language, es]);

  return <div className="feedback-route">
    <header className="landing-nav wrap">
      <Link href="/" className="couple-brand">Yeonseok <span className="feedback-brand-heart" aria-hidden="true">♡</span> Lisbeth</Link>
      <nav aria-label={es ? 'Navegación' : '메뉴'}>
        <a href="/#games">{es ? 'Ver los juegos' : '게임 목록'}</a>
        <a href="/feedback" className="feedback-nav-current" aria-current="page">{es ? 'Sugerencias' : '건의사항'}</a>
        <div className="landing-language" role="group" aria-label={es ? 'Idioma' : '언어'}>{(['ko','es'] as const).map(lang => <button key={lang} className={language === lang ? 'active' : ''} aria-pressed={language === lang} onClick={() => { if (!writeBrowserStorage('dos-language', lang)) setStorageIssue('language'); setLanguage(lang); }}>{lang === 'ko' ? 'KO' : 'ES · RD'}</button>)}</div>
      </nav>
    </header>
    <div className="wrap feedback-access-note"><div><b>{copy(language, '우리의 아이디어 공간', 'Nuestro espacio de ideas')}</b>{storageIssue && <p className="feedback-storage-note" role="status">{storageIssue === 'language' ? copy(language, '언어를 바꿨지만 다음 방문을 위해 저장하지 못했어요.', 'Cambiamos el idioma, pero no pudimos guardarlo para la próxima visita.') : copy(language, '브라우저 저장소를 사용할 수 없어 이 공간이나 언어를 다음 방문을 위해 기억하지 못할 수 있어요.', 'El almacenamiento del navegador no está disponible; quizá no podamos recordar este espacio o idioma en tu próxima visita.')}</p>}</div><button className="secondary-action" onClick={() => void refresh()}>{copy(language, '새로고침', 'Actualizar')}</button></div>
    <FeedbackPage language={language} mode={isFeedbackOnline ? 'online' : 'demo'} entries={entries} loading={loading} error={error} canCreate={Boolean(spaceId) && (!isFeedbackOnline || role === 'p1' || role === 'p2')} canAcknowledge={!isFeedbackOnline || role === 'p1'} onCreate={async (input,requestId) => { const entry = await feedback.create(spaceId,input,requestId); refreshGeneration.current += 1; setEntries(items => [entry, ...items.filter(item => item.id !== entry.id)]); }} onSetStatus={async (id,status) => { await feedback.updateStatus(spaceId,id,status); refreshGeneration.current += 1; setEntries(items => items.map(item => item.id === id ? { ...item, status } : item)); }}/>
  </div>;
}
