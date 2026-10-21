import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { feedback, isFeedbackOnline, type FeedbackEntry } from '../core/feedback';
import type { Language } from '../core/types';
import { FeedbackPage } from './FeedbackPage';
import { Link } from './Router';

const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;

export function FeedbackRoute() {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('dos-language') === 'es' ? 'es' : 'ko');
  const [spaceId, setSpaceId] = useState(() => new URLSearchParams(location.search).get('space') || localStorage.getItem('dos-feedback-space') || '');
  const [joinCode, setJoinCode] = useState('');
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [role, setRole] = useState<'p1' | 'p2' | null>(null);
  const [loading, setLoading] = useState(Boolean(spaceId));
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshGeneration = useRef(0);
  const setupPending = useRef(false);
  const es = language === 'es';

  const useSpace = useCallback((id: string) => {
    refreshGeneration.current += 1;
    localStorage.setItem('dos-feedback-space', id);
    history.replaceState(null, '', `/feedback?space=${encodeURIComponent(id)}`);
    setSpaceId(id);
    setEntries([]); setRole(null); setError(null);
    setLoading(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!spaceId) return;
    const generation = ++refreshGeneration.current;
    const isCurrent = () => refreshGeneration.current === generation;
    try {
      let seat = await feedback.getRole(spaceId);
      if (!isCurrent()) return;
      if (!seat) {
        seat = await feedback.joinSpace(spaceId);
        if (!isCurrent()) return;
      }
      const items = await feedback.list(spaceId);
      if (!isCurrent()) return;
      setEntries(items); setRole(seat); setError(null);
    } catch {
      if (!isCurrent()) return;
      setEntries([]); setRole(null);
      setError(copy(language, '초대 공간을 열지 못했어요. 초대 링크가 맞는지, 온라인 공간이 이미 두 사람으로 찼는지 확인해 주세요.', 'No se pudo abrir el espacio. Revisa el enlace o comprueba si ya se unieron dos personas.'));
    } finally { if (isCurrent()) setLoading(false); }
  }, [spaceId, language]);

  useEffect(() => {
    document.documentElement.lang = language === 'es' ? 'es-DO' : 'ko';
    document.title = es ? 'Sugerencias · Yeonseok & Lisbeth' : '건의사항 · Yeonseok & Lisbeth';
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    window.addEventListener('focus', refresh);
    return () => { refreshGeneration.current += 1; clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [refresh, language, es]);

  const createSpace = async () => {
    if (setupPending.current) return;
    setupPending.current = true;
    setWorking(true); setError(null);
    try { useSpace(await feedback.createSpace()); }
    catch { setError(copy(language, '비공개 공간을 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'No se pudo crear el espacio. Inténtalo de nuevo.')); }
    finally { setupPending.current = false; setWorking(false); }
  };

  const joinSpace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const id = joinCode.trim(); if (!id) return;
    if (setupPending.current) return;
    setupPending.current = true;
    setWorking(true); setError(null);
    try { await feedback.joinSpace(id); useSpace(id); }
    catch { setError(copy(language, '이 초대 공간에 참여하지 못했어요. 코드를 확인하거나 새 초대를 요청해 주세요.', 'No se pudo entrar. Revisa el código o pide que te envíen una invitación nueva.')); }
    finally { setupPending.current = false; setWorking(false); }
  };

  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}/feedback?space=${encodeURIComponent(spaceId)}`); setError(null); }
    catch { setError(copy(language, '초대 링크를 복사하지 못했어요. 주소창에서 링크를 복사해 주세요.', 'No se pudo copiar el enlace. Cópialo desde la barra de direcciones.')); }
  };

  return <div className="feedback-route">
    <header className="landing-nav wrap">
      <Link href="/" className="couple-brand">Yeonseok <span className="feedback-brand-heart" aria-hidden="true">♡</span> Lisbeth</Link>
      <nav aria-label={es ? 'Navegación' : '메뉴'}>
        <a href="/#games">{es ? 'Ver los juegos' : '게임 목록'}</a>
        <a href="/#papi-letter">{es ? 'La carta de Papi' : 'Papi의 편지'}</a>
        <a href="/feedback" className="feedback-nav-current" aria-current="page">{es ? 'Sugerencias' : '건의사항'}</a>
        <div className="landing-language" role="group" aria-label={es ? 'Idioma' : '언어'}>{(['ko','es'] as const).map(lang => <button key={lang} className={language === lang ? 'active' : ''} aria-pressed={language === lang} onClick={() => { localStorage.setItem('dos-language',lang); setLanguage(lang); }}>{lang === 'ko' ? 'KO' : 'ES · RD'}</button>)}</div>
      </nav>
    </header>
    {!spaceId ? <main className="wrap feedback-setup">
      <div className="feedback-setup-copy">
        <h1>{copy(language, 'Mami, 다음엔 뭐 만들까?', 'Mami, ¿qué hacemos después?')}</h1>
        <p>{copy(language, '해보고 싶은 게임이나 추가했으면 하는 거 있으면 여기 적어줘.', 'Si hay algún juego que quieras probar o algo que te gustaría añadir, escríbelo aquí.')}</p>
        <p>{copy(language, '불편한 게 있거나 마음에 안 드는 것도 말해줘. Papi가 보고 고쳐볼게.', 'Dime también si algo te incomoda o no te gusta. Papi lo revisa y lo arregla.')}</p>
      </div>
      <section className="feedback-setup-actions" aria-labelledby="feedback-setup-title">
        <h2 id="feedback-setup-title">{copy(language, '우리의 아이디어 공간', 'Nuestro espacio de ideas')}</h2>
        <p>{isFeedbackOnline ? copy(language, '둘만의 비공개 공간을 만들고 Mami에게 초대 링크를 보내줘.', 'Crea nuestro espacio privado y envíale la invitación a Mami.') : copy(language, '떠오른 생각을 적고, 나중에 다시 읽어봐요.', 'Anota lo que se te ocurra y vuelve a leerlo cuando quieras.')}</p>
        {error && <p className="feedback-error" role="alert">{error}</p>}
        <button className="primary-action" disabled={working} onClick={() => void createSpace()}>{working ? copy(language, '만드는 중…', 'Creando…') : copy(language, '우리 공간 만들기', 'Crear nuestro espacio')}</button>
        <form className="feedback-join-form" onSubmit={joinSpace}><label htmlFor="feedback-invite-code">{copy(language, '초대 코드로 참여하기', 'Entrar con invitación')}</label><input id="feedback-invite-code" value={joinCode} onChange={event => setJoinCode(event.target.value)} placeholder={copy(language, '초대 코드 붙여넣기', 'Pega el código')} autoComplete="off"/><button className="secondary-action" disabled={working || !joinCode.trim()}>{copy(language, '참여하기', 'Entrar')}</button></form>
        {!isFeedbackOnline && <p className="feedback-demo-note">{copy(language, '이 브라우저에만 저장돼요. 다른 기기와 공유되지 않고, 7일 뒤 삭제돼요.', 'Solo se guarda en este navegador, no se comparte con otros dispositivos y se elimina a los siete días.')}</p>}
      </section>
    </main> : <>
      <div className="wrap feedback-access-note"><div><b>{isFeedbackOnline ? copy(language, '둘만의 비공개 아이디어 공간', 'Espacio privado de ideas para los dos') : copy(language, '우리의 아이디어 공간', 'Nuestro espacio de ideas')}</b>{isFeedbackOnline && <p>{copy(language, '각 아이디어는 작성한 지 7일이 지나면 삭제돼요.', 'Cada idea se elimina automáticamente siete días después de publicarse.')}</p>}</div><div className="feedback-space-actions"><button className="secondary-action" onClick={() => void refresh()}>{copy(language, '새로고침', 'Actualizar')}</button><button className="secondary-action" onClick={() => void copyInvite()}>{copy(language, '초대 링크 복사', 'Copiar enlace de invitación')}</button></div></div>
      <FeedbackPage language={language} mode={isFeedbackOnline ? 'online' : 'demo'} entries={entries} loading={loading} error={error} canCreate={!isFeedbackOnline || role === 'p2'} canAcknowledge={!isFeedbackOnline || role === 'p1'} onCreate={async (input,requestId) => { const entry = await feedback.create(spaceId,input,requestId); refreshGeneration.current += 1; setEntries(items => [entry, ...items.filter(item => item.id !== entry.id)]); }} onSetStatus={async (id,status) => { await feedback.updateStatus(spaceId,id,status); refreshGeneration.current += 1; setEntries(items => items.map(item => item.id === id ? { ...item, status } : item)); }}/>
    </>}
  </div>;
}
