import { useRef, useState, type FormEvent } from 'react';
import type { Language } from '../core/types';
import type { FeedbackCategory, FeedbackEntry, FeedbackInput, FeedbackStatus } from '../core/feedback';
import '../styles/feedback.css';

type FeedbackPageProps = {
  language: Language;
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
const feedbackPageSize = 25;

export function FeedbackPage({ language, entries, loading, error, canCreate, canAcknowledge, onCreate, onSetStatus }: FeedbackPageProps) {
  const [category, setCategory] = useState<FeedbackCategory>('game');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [saved, setSaved] = useState(false);
  const [visibleEntries, setVisibleEntries] = useState(feedbackPageSize);
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
      const entry = await onCreate({ category, title: Array.from(cleanBody.replace(/\s+/g, ' ')).slice(0, 60).join(''), body: cleanBody }, request.current.id);
      if (!entry) return;
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
          <h1>{copy(language, 'Mami, 다음엔 뭐 하고 놀까?', 'Mami, ¿a qué jugamos después?')}</h1>
          <p>{copy(language, '같이 해보고 싶은 게임이나 있으면 좋겠는 걸 적어줘. 엉뚱한 아이디어도 환영이야.', 'Cuéntame qué juego te gustaría probar conmigo o qué añadirías. Las ideas un poco locas también valen.')}</p>
          <p>{copy(language, '불편한 것도 편하게 말해줘. 예쁜 말만 적는 곳은 아니니까. 읽고 어떻게 고칠지 생각해 볼게.', 'Dime también lo que no te guste. Aquí no hace falta decir solo cosas bonitas. Lo leeré y veré cómo mejorarlo.')}</p>
        </div>
        <span className="feedback-mode">{copy(language, '공용 비공개 보관함', 'Buzón privado compartido')}</span>
      </header>


      <div className={`feedback-layout${canCreate ? '' : ' feedback-layout-readonly'}`}>
        <section className="feedback-list-section" aria-labelledby="feedback-list-title">
          <div className="feedback-list-head">
            <div><h2 id="feedback-list-title">{copy(language, '우리의 아이디어', 'Nuestras ideas')}</h2></div>
            <span className="feedback-count">{entries.length.toLocaleString(language === 'ko' ? 'ko-KR' : 'es-DO')} <small>{copy(language, '개', 'total')}</small></span>
          </div>

          {!canCreate && (error || actionError) && <p className="feedback-error" role="alert">{error || actionError}</p>}
          {loading ? <div className="feedback-empty" role="status"><span className="feedback-loader" aria-hidden="true" />{copy(language, '아이디어를 불러오는 중…', 'Cargando las ideas…')}</div>
            : entries.length === 0 && !error ? <div className="feedback-empty"><b>{copy(language, '첫 아이디어를 기다리고 있어요.', 'Aquí hay sitio para tu primera idea.')}</b><small>{copy(language, '생각나면 한 줄만 남겨줘. 멋지게 정리하지 않아도 돼.', 'Cuando se te ocurra algo, déjame una línea. No tiene que estar perfectamente explicado.')}</small></div>
              : <div className="feedback-list">{entries.slice(0, visibleEntries).map(entry => <article className="feedback-entry" key={entry.id}>
                <div className="feedback-entry-top"><span className={`feedback-category category-${entry.category}`}>{categoryText(entry.category, language)}</span><span className={`feedback-status status-${entry.status}`}>{statusText(entry.status, language)}</span></div>
                {!entry.body.replace(/\s+/g, ' ').startsWith(entry.title) && <h3>{entry.title}</h3>}
                <p className="feedback-entry-body">{entry.body}</p>
                <footer className="feedback-entry-foot"><time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
                  {canAcknowledge && <label className="feedback-status-control"><span className="sr-only">{copy(language, '아이디어 상태', 'Estado de la idea')}</span><select value={entry.status === 'read' ? 'new' : entry.status} disabled={Boolean(savingStatus) || loading || Boolean(error)} onChange={event => void setStatus(entry.id, event.target.value as FeedbackStatus)}>
                    {statusChoices.map(status => <option value={status} key={status}>{statusText(status, language)}</option>)}
                  </select></label>}
                </footer>
              </article>)}</div>}
          {!loading && entries.length > visibleEntries && <button type="button" className="feedback-list-more" onClick={() => setVisibleEntries(count => Math.min(entries.length, count + feedbackPageSize))}>{copy(language, `더 보기 (${(entries.length - visibleEntries).toLocaleString('ko-KR')}개 남음)`, `Ver más (${(entries.length - visibleEntries).toLocaleString('es-DO')} restantes)`)}</button>}
        </section>

        {canCreate && <aside className="feedback-compose" aria-labelledby="feedback-compose-title">
          <div className="feedback-compose-head"><h2 id="feedback-compose-title">{copy(language, '무슨 생각 했어?', '¿Qué se te ocurrió?')}</h2><p>{copy(language, '편하게 적어줘. 읽어볼게 ♡', 'Escríbeme con confianza. Lo leeré con cariño ♡')}</p></div>
          <form onSubmit={submit} aria-busy={saving || loading}>
            <fieldset className="feedback-categories" disabled={saving || loading || Boolean(error)}><legend>{copy(language, '종류', 'Tipo')}</legend>{(['game', 'complaint', 'other'] as const).map(value => <button type="button" key={value} className={category === value ? 'active' : ''} aria-pressed={category === value} onClick={() => { setCategory(value); setSaved(false); }}>{categoryText(value, language)}</button>)}</fieldset>
            <label className="feedback-field-label" htmlFor="feedback-body">{copy(language, '내용', 'Mensaje')}</label>
            <textarea id="feedback-body" className="feedback-input feedback-textarea" required maxLength={4000} rows={5} disabled={saving || loading || Boolean(error)} value={body} onChange={event => { setBody(event.target.value); setSaved(false); }} placeholder={copy(language, '같이 해보고 싶은 건…', 'Me gustaría que probáramos…')} />
            {(error || actionError) && <p className="feedback-error" role="alert">{error || actionError}</p>}
            {saved && <p className="feedback-saved" role="status">{copy(language, '아이디어를 저장했어요. 남겨줘서 고마워요 ♡', 'Tu idea quedó guardada. Gracias por dejarla aquí ♡')}</p>}
            <div className="feedback-compose-bottom"><small>{copy(language, '저장하면 이 비공개 사이트에 접속하는 두 사람이 함께 볼 수 있어요.', 'Al guardar, las dos personas con acceso a este sitio privado podrán verlo.')}</small><button className="feedback-submit" disabled={saving || loading || Boolean(error) || !body.trim()}>{saving ? copy(language, '저장하는 중…', 'Guardando…') : copy(language, '아이디어 저장하기', 'Guardar idea')}</button></div>
          </form>
        </aside>}
      </div>
    </div>
  </main>;
}

export default FeedbackPage;
