import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
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
  const [inviteSpace, setInviteSpace] = useState(() => new URLSearchParams(window.location.search).get('space')?.trim() || '');
  const [joinCode, setJoinCode] = useState(() => new URLSearchParams(window.location.search).get('space')?.trim() || '');
  const [storageIssue, setStorageIssue] = useState<'read' | 'space' | 'language' | null>(initialStorage.available ? null : 'read');
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [role, setRole] = useState<'p1' | 'p2' | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const refreshGeneration = useRef(0);
  const joinGeneration = useRef(0);
  const initialization = useRef<Promise<string> | null>(null);
  const activeSpace = useRef(spaceId);
  const es = language === 'es';

  const refresh = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    const isCurrent = () => refreshGeneration.current === generation;
    try {
      let id = spaceId;
      if (!id) {
        if (inviteSpace) return;
        // The storage scope is an internal detail, never a setup step for writing.
        initialization.current ??= feedback.createSpace().catch(reason => { initialization.current = null; throw reason; });
        id = await initialization.current;
        if (!isCurrent()) return;
        activeSpace.current = id;
        if (!writeBrowserStorage('dos-feedback-space', id)) setStorageIssue('space');
        setSpaceId(id);
      }
      const seat = await feedback.getRole(id);
      if (!isCurrent()) return;
      if (!seat) throw new Error('feedback_not_member');
      const [items, members] = await Promise.all([feedback.list(id), feedback.memberCount(id)]);
      if (!isCurrent()) return;
      setEntries(items); setRole(seat); setMemberCount(members); setError(null);
      if (inviteSpace === id) { history.replaceState(null, '', '/feedback'); setInviteSpace(''); }
    } catch (reason) {
      if (!isCurrent()) return;
      setRole(null); setMemberCount(null);
      if (reason instanceof Error && reason.message === 'feedback_not_member') setEntries([]);
      setError(reason instanceof Error && reason.message === 'feedback_not_member'
        ? copy(language, '이 브라우저 계정은 저장된 공간의 참여자가 아니에요. 참여 링크로 다시 연결해 주세요.', 'Esta cuenta del navegador no pertenece al espacio guardado. Vuelve a entrar con una invitación.')
        : copy(language, '건의사항을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'No se pudieron cargar las sugerencias. Inténtalo de nuevo.'));
    } finally { if (isCurrent()) setLoading(false); }
  }, [spaceId, inviteSpace, language]);

  useEffect(() => {
    document.documentElement.lang = language === 'es' ? 'es-DO' : 'ko';
    document.title = es ? 'Sugerencias · Yeonseok & Lisbeth' : '건의사항 · Yeonseok & Lisbeth';
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    window.addEventListener('focus', refresh);
    return () => { refreshGeneration.current += 1; clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [refresh, language, es]);
  useEffect(() => () => { joinGeneration.current += 1; }, []);

  const joinSpace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = joinCode.trim();
    if (!id || joining) return;
    if (document.querySelector<HTMLTextAreaElement>('#feedback-body')?.value.trim()
      && !window.confirm(copy(language, '공간을 바꾸면 작성 중인 글이 이 화면에서 사라져요. 계속할까요?', 'Si cambias de espacio, el borrador desaparecerá de esta pantalla. ¿Continuar?'))) return;
    const generation = joinGeneration.current;
    setJoining(true); setJoinError(null);
    try {
      const seat = await feedback.joinSpace(id);
      if (joinGeneration.current !== generation) return;
      refreshGeneration.current += 1;
      activeSpace.current = id;
      if (!writeBrowserStorage('dos-feedback-space', id)) setStorageIssue('space');
      history.replaceState(null, '', '/feedback');
      setInviteSpace(''); setJoinCode(''); setSpaceId(id); setEntries([]); setRole(seat); setMemberCount(null); setLoading(true); setError(null);
    } catch {
      if (joinGeneration.current === generation) setJoinError(copy(language, '이 공간에 참여하지 못했어요. 링크를 확인하거나 새 초대를 요청해 주세요.', 'No se pudo entrar en este espacio. Revisa el enlace o pide otra invitación.'));
    } finally { if (joinGeneration.current === generation) setJoining(false); }
  };

  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}/feedback?space=${encodeURIComponent(spaceId)}`); setJoinError(null); }
    catch { setJoinError(copy(language, '링크를 복사하지 못했어요. 다시 시도해 주세요.', 'No se pudo copiar el enlace. Inténtalo de nuevo.')); }
  };

  return <div className="feedback-route">
    <header className="landing-nav wrap">
      <Link href="/" className="couple-brand">Yeonseok <span className="feedback-brand-heart" aria-hidden="true">♡</span> Lisbeth</Link>
      <nav aria-label={es ? 'Navegación' : '메뉴'}>
        <a href="/#games">{es ? 'Ver los juegos' : '게임 목록'}</a>
        <a href="/feedback" className="feedback-nav-current" aria-current="page">{es ? 'Sugerencias' : '건의사항'}</a>
        <div className="landing-language" role="group" aria-label={es ? 'Idioma' : '언어'}>{(['ko','es'] as const).map(lang => <button key={lang} className={language === lang ? 'active' : ''} aria-pressed={language === lang} onClick={() => { if (!writeBrowserStorage('dos-language', lang)) setStorageIssue('language'); setLanguage(lang); }}>{lang === 'ko' ? 'KO' : 'ES · RD'}</button>)}</div>
      </nav>
    </header>
    <div className="wrap feedback-access-note"><div><b>{copy(language, '아이디어 공간', 'Espacio de ideas')}</b>{memberCount !== null && <p role="status">{memberCount === 1 ? copy(language, '현재 이 공간에 참여한 계정은 1개예요. 다른 사람에게 참여 링크를 보내야 함께 볼 수 있어요.', 'Hay una cuenta en este espacio. Comparte la invitación para que otra persona pueda verlo.') : copy(language, '현재 이 공간에 참여한 계정은 2개예요.', 'Hay dos cuentas en este espacio.')}</p>}{role && memberCount === 1 && <p>{copy(language, '이 링크를 가진 사람이 참여할 수 있어요. 원하는 상대에게만 비공개로 공유하세요.', 'Quien tenga este enlace puede unirse. Compártelo en privado solo con la persona prevista.')}</p>}{storageIssue && <p className="feedback-storage-note" role="status">{storageIssue === 'language' ? copy(language, '언어를 바꿨지만 다음 방문을 위해 저장하지 못했어요.', 'Cambiamos el idioma, pero no pudimos guardarlo para la próxima visita.') : copy(language, '브라우저 저장소를 사용할 수 없어 이 공간이나 언어를 다음 방문을 위해 기억하지 못할 수 있어요.', 'El almacenamiento del navegador no está disponible; quizá no podamos recordar este espacio o idioma en tu próxima visita.')}</p>}</div><div className="feedback-space-actions"><button className="secondary-action" onClick={() => void refresh()}>{copy(language, '새로고침', 'Actualizar')}</button>{role && isFeedbackOnline && <button className="secondary-action" onClick={() => void copyInvite()}>{copy(language, '이 공간 링크 복사', 'Copiar enlace de este espacio')}</button>}</div></div>
    {isFeedbackOnline && <form className="wrap feedback-join-form" onSubmit={joinSpace}><label htmlFor="feedback-invite-code">{copy(language, '다른 아이디어 공간에 참여하기', 'Entrar en otro espacio de ideas')}</label>{inviteSpace && <p>{copy(language, '참여 링크가 열렸어요. 아래에서 참여를 눌러 연결하세요.', 'Abriste una invitación. Pulsa Entrar para conectarte.')}</p>}{spaceId && <p>{copy(language, '참여하면 이 브라우저에 표시되는 공간이 바뀌어요. 기존 아이디어는 이전 공간에 남으니, 돌아오려면 먼저 그 공간의 링크를 보관하세요.', 'Al entrar, este navegador mostrará otro espacio. Tus ideas anteriores seguirán en el espacio previo; guarda su enlace si quieres volver.')}</p>}<input id="feedback-invite-code" value={joinCode} onChange={event => setJoinCode(event.target.value)} placeholder={copy(language, '참여 코드 붙여넣기', 'Pega el código de invitación')} autoComplete="off" disabled={joining}/><button className="secondary-action" disabled={joining || !joinCode.trim()}>{joining ? copy(language, '연결 중…', 'Conectando…') : copy(language, '참여하기', 'Entrar')}</button>{inviteSpace && <button type="button" className="secondary-action" disabled={joining} onClick={() => { history.replaceState(null, '', '/feedback'); setInviteSpace(''); setJoinCode(''); }}>{copy(language, '초대 닫기', 'Cerrar invitación')}</button>}{joinError && <p className="feedback-error" role="alert">{joinError}</p>}</form>}
    {!inviteSpace && <FeedbackPage key={spaceId} language={language} mode={isFeedbackOnline ? 'online' : 'demo'} entries={entries} loading={loading} error={error} canCreate={Boolean(spaceId) && (!isFeedbackOnline || role === 'p1' || role === 'p2')} canAcknowledge={!isFeedbackOnline || role === 'p1'} onCreate={async (input,requestId) => { const id = spaceId; const entry = await feedback.create(id,input,requestId); if (activeSpace.current !== id) return; refreshGeneration.current += 1; setEntries(items => [entry, ...items.filter(item => item.id !== entry.id)]); return entry; }} onSetStatus={async (id,status) => { const currentSpace = spaceId; await feedback.updateStatus(currentSpace,id,status); if (activeSpace.current !== currentSpace) return; refreshGeneration.current += 1; setEntries(items => items.map(item => item.id === id ? { ...item, status } : item)); }}/>
    }
  </div>;
}
