import { useRef, useState, type FormEvent } from 'react';
import type { Language } from '../core/types';
import type { FeedbackCategory, FeedbackEntry, FeedbackInput, FeedbackStatus } from '../core/feedback';
import '../styles/feedback.css';

type FeedbackPageProps = {
  language: Language;
  mode: 'demo' | 'online';
  entries: FeedbackEntry[];
  loading: boolean;
  error?: string | null;
  canCreate: boolean;
  canAcknowledge: boolean;
  onCreate: (input: FeedbackInput, requestId: string) => Promise<FeedbackEntry | void>;
  onSetStatus: (id: string, status: FeedbackStatus) => Promise<void>;
};

const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const categoryText = (category: FeedbackCategory, language: Language) => ({
  message: copy(language, '이야기', 'Mensaje'),
  feature: copy(language, '기능 제안', 'Sugerencia para la página'),
  game: copy(language, '게임 제안', 'Idea de juego'),
  complaint: copy(language, '불편한 점', 'Algo que molesta'),
  other: copy(language, '기타', 'Otra idea'),
}[category]);
const statusText = (status: FeedbackStatus, language: Language) => ({
  new: copy(language, '접수', 'Recibida'),
  read: copy(language, '접수', 'Recibida'),
  planned: copy(language, '진행', 'En curso'),
  done: copy(language, '완료', 'Hecho'),
}[status]);
const statusChoices: FeedbackStatus[] = ['new', 'planned', 'done'];

export function FeedbackPage({ language, mode, entries, loading, error, canCreate, canAcknowledge, onCreate, onSetStatus }: FeedbackPageProps) {
  const [category, setCategory] = useState<FeedbackCategory>('game');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [saved, setSaved] = useState(false);
  const submission = useRef(false);
  const statusPending = useRef(false);
  const request = useRef<{ key: string; id: string } | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanBody = body.trim();
    if (submission.current || !canCreate || loading || error || !cleanBody || cleanBody.length > 4000) return;
    const key = JSON.stringify([category, cleanBody]);
    if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
    submission.current = true;
    setSaving(true); setActionError(''); setSaved(false);
    try {
      await onCreate({ category, title: Array.from(cleanBody.replace(/\s+/g, ' ')).slice(0, 60).join(''), body: cleanBody }, request.current.id);
      setBody(''); setCategory('game'); request.current = null; setSaved(true);
    } catch {
      setActionError(copy(language, '아이디어를 보내지 못했어요. 다시 시도해 주세요.', 'No se pudo enviar la idea. Inténtalo de nuevo.'));
    } finally { submission.current = false; setSaving(false); }
  };

  const setStatus = async (id: string, status: FeedbackStatus) => {
    if (statusPending.current || !canAcknowledge || loading || error) return;
    statusPending.current = true;
    setSavingStatus(id); setActionError('');
    try { await onSetStatus(id, status); }
    catch { setActionError(copy(language, '아이디어 상태를 저장하지 못했어요. 다시 시도해 주세요.', 'No se pudo actualizar el estado de la idea. Inténtalo de nuevo.')); }
    finally { statusPending.current = false; setSavingStatus(null); }
  };

  const formatDate = (createdAt: string) => {
    const date = new Date(createdAt);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'es-DO', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  };

  return <main className="feedback-page">
    <div className="feedback-wrap">
      <header className="feedback-heading">
        <div className="feedback-heading-copy">
          <h1>{copy(language, 'Mami, 다음엔 뭐 만들까?', 'Mami, ¿qué hacemos después?')}</h1>
          <p>{copy(language, '해보고 싶은 게임이나 추가했으면 하는 거 있으면 여기 적어줘.', 'Si hay algún juego que quieras probar o algo que te gustaría añadir, escríbelo aquí.')}</p>
          <p>{copy(language, '불편한 게 있거나 마음에 안 드는 것도 말해줘. Papi가 보고 고쳐볼게.', 'Dime también si algo te incomoda o no te gusta. Papi lo revisa y lo arregla.')}</p>
        </div>
        <span className={`feedback-mode ${mode}`}>{mode === 'online' ? copy(language, '비공개 보관함', 'Espacio privado') : copy(language, '같은 브라우저 데모', 'Demo en este navegador')}</span>
      </header>

      {mode === 'demo' && <p className="feedback-demo-note">{copy(language, '이 데모 내용은 이 브라우저에서만 보여요.', 'Este demo solo se ve en este navegador.')}</p>}

      <div className="feedback-layout">
        <section className="feedback-list-section" aria-labelledby="feedback-list-title">
          <div className="feedback-list-head">
            <div><h2 id="feedback-list-title">{copy(language, 'Mami의 아이디어', 'Ideas de Mami')}</h2></div>
            <span className="feedback-count">{entries.length.toLocaleString(language === 'ko' ? 'ko-KR' : 'es-DO')} <small>{copy(language, '개', 'total')}</small></span>
          </div>

          {!canCreate && (error || actionError) && <p className="feedback-error" role="alert">{error || actionError}</p>}
          {loading ? <div className="feedback-empty" role="status"><span className="feedback-loader" aria-hidden="true" />{copy(language, '아이디어를 불러오는 중…', 'Cargando las ideas…')}</div>
            : entries.length === 0 && !error ? <div className="feedback-empty"><b>{copy(language, '아직 아이디어가 없어요.', 'Todavía no hay ideas.')}</b><small>{copy(language, 'Mami, 생각난 걸 언제든 남겨줘.', 'Mami, cuéntame tu idea cuando quieras.')}</small></div>
              : <div className="feedback-list">{entries.map(entry => <article className="feedback-entry" key={entry.id}>
                <div className="feedback-entry-top"><span className={`feedback-category category-${entry.category}`}>{categoryText(entry.category, language)}</span><span className={`feedback-status status-${entry.status}`}>{statusText(entry.status, language)}{entry.status === 'planned' && <small> · {copy(language, '해볼게요', 'Lo anoto')}</small>}</span></div>
                {!entry.body.startsWith(entry.title) && <h3>{entry.title}</h3>}
                <p className="feedback-entry-body">{entry.body}</p>
                <footer className="feedback-entry-foot"><time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
                  {canAcknowledge && <label className="feedback-status-control"><span className="sr-only">{copy(language, '아이디어 상태', 'Estado de la idea')}</span><select value={entry.status === 'read' ? 'new' : entry.status} disabled={Boolean(savingStatus) || loading || Boolean(error)} onChange={event => void setStatus(entry.id, event.target.value as FeedbackStatus)}>
                    {statusChoices.map(status => <option value={status} key={status}>{statusText(status, language)}</option>)}
                  </select></label>}
                </footer>
              </article>)}</div>}
        </section>

        {canCreate && <aside className="feedback-compose" aria-labelledby="feedback-compose-title">
          <div className="feedback-compose-head"><h2 id="feedback-compose-title">{copy(language, 'Mami, 편하게 적어줘', 'Mami, escríbeme con confianza')}</h2><p>{copy(language, 'Papi가 읽어볼게.', 'Papi va a leerlo con cariño.')}</p></div>
          <form onSubmit={submit} aria-busy={saving || loading}>
            <fieldset className="feedback-categories" disabled={saving || loading || Boolean(error)}><legend>{copy(language, '종류', 'Tipo')}</legend>{(['game', 'complaint', 'other'] as const).map(value => <button type="button" key={value} className={category === value ? 'active' : ''} aria-pressed={category === value} onClick={() => { setCategory(value); setSaved(false); }}>{categoryText(value, language)}</button>)}</fieldset>
            <label className="feedback-field-label" htmlFor="feedback-body">{copy(language, '내용', 'Mensaje')}</label>
            <textarea id="feedback-body" className="feedback-input feedback-textarea" required maxLength={4000} rows={5} disabled={saving || loading || Boolean(error)} value={body} onChange={event => { setBody(event.target.value); setSaved(false); }} placeholder={copy(language, 'Baby, 여기 적어줘 ♡', 'Baby, escríbelo aquí ♡')} />
            {(error || actionError) && <p className="feedback-error" role="alert">{error || actionError}</p>}
            {saved && <p className="feedback-saved" role="status">{copy(language, '아이디어를 저장했어요.', 'Tu idea quedó guardada.')}</p>}
            <div className="feedback-compose-bottom"><small>{mode === 'online' ? copy(language, '우리 둘의 비공개 공간에 저장돼요.', 'Se guarda en nuestro espacio privado.') : copy(language, '이 브라우저에만 저장돼요.', 'Solo en este navegador.')}</small><button className="feedback-submit" disabled={saving || loading || Boolean(error) || !body.trim()}>{saving ? copy(language, '보내는 중…', 'Enviando…') : copy(language, 'Papi한테 보내기', 'Enviar a Papi')}</button></div>
          </form>
        </aside>}
      </div>
      <p className="feedback-retention">{mode === 'online'
        ? copy(language, '각 아이디어는 작성한 지 7일이 지나면 자동 삭제돼요. 비공개 공간은 계속 유지돼요.', 'Cada idea se elimina automáticamente siete días después de publicarse.')
        : copy(language, '데모 아이디어는 이 브라우저에만 저장돼요. 다른 기기와 공유되지 않고 작성한 지 7일 뒤 삭제돼요.', 'Las ideas del demo solo se guardan en este navegador. No se comparten con otros dispositivos y se eliminan a los siete días.')}</p>
    </div>
  </main>;
}

export default FeedbackPage;
