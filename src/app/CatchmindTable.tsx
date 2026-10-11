import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import { GameValue } from './GameValue';
import type { CatchmindCategoryId } from '../games/catchmindTopics';
import './catchmind-table.css';

type Point = { x: number; y: number };
type Props = {
  view: any;
  playerId: PlayerId;
  language: Language;
  now: number;
  palette: string;
  setPalette: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  runAction: (action: GameAction) => Promise<boolean>;
  onReplay?: () => void | Promise<void>;
  replayPending?: boolean;
};

const colors = ['#202522', '#2f655b', '#67a968', '#dca84b', '#e57f6a', '#b94f42', '#ce6990', '#875a9d', '#5786a1', '#54a7a0'];
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;

function paintStroke(ctx: CanvasRenderingContext2D, stroke: any) {
  const points = stroke.points as Point[];
  if (!points?.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x * 1000, points[0].y * 600);
  for (const point of points.slice(1)) ctx.lineTo(point.x * 1000, point.y * 600);
  ctx.strokeStyle = stroke.color || '#284f49';
  ctx.lineWidth = (stroke.width || 5) * 2.7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function bucketFill(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  const image = ctx.getImageData(0, 0, 1000, 600), { data, width, height } = image;
  const start = (Math.max(0, Math.min(height - 1, Math.round(y))) * width + Math.max(0, Math.min(width - 1, Math.round(x)))) * 4;
  const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
  const fillColor = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16), 255];
  if (target.every((channel, i) => Math.abs(channel - fillColor[i]) < 8)) return false;
  const queue = new Int32Array(width * height), seen = new Uint8Array(width * height);
  let read = 0, write = 0;
  const startPixel = start / 4;
  queue[write++] = startPixel; seen[startPixel] = 1;
  // Every pixel enters this fixed-size queue at most once, including a blank canvas.
  const matches = (pixel: number) => { const at = pixel * 4; return Math.abs(data[at] - target[0]) + Math.abs(data[at + 1] - target[1]) + Math.abs(data[at + 2] - target[2]) < 48 && Math.abs(data[at + 3] - target[3]) < 32; };
  while (read < write) {
    const pixel = queue[read++];
    const px = pixel % width, neighbors = [px > 0 ? pixel - 1 : -1, px + 1 < width ? pixel + 1 : -1, pixel >= width ? pixel - width : -1, pixel + width < width * height ? pixel + width : -1];
    for (const next of neighbors) if (next >= 0 && !seen[next] && matches(next)) { seen[next] = 1; queue[write++] = next; }
  }
  for (let index = 0; index < write; index += 1) {
    const at = queue[index] * 4;
    data[at] = fillColor[0]; data[at + 1] = fillColor[1]; data[at + 2] = fillColor[2]; data[at + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return true;
}

export default function CatchmindTable({ view, playerId, language, now, palette, setPalette, strokeWidth, setStrokeWidth, runAction, onReplay, replayPending = false }: Props) {
  const [activePoints, setActivePoints] = useState<Point[]>([]);
  const [activeColor, setActiveColor] = useState(palette);
  const [secondaryColor, setSecondaryColor] = useState('#fffefa');
  const [tool, setTool] = useState<'brush' | 'fill' | 'pick'>('brush');
  const [settingsDraft, setSettingsDraft] = useState({ category_id: null as CatchmindCategoryId | null, drawTimeSeconds: 80, rounds: 6, choices: 3, hints: 2, customOnly: false });
  const [customWordsText, setCustomWordsText] = useState('');
  const [settingsNotice, setSettingsNotice] = useState('');
  const [toolNotice, setToolNotice] = useState('');
  const fillBusy = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);
  const activeColorRef = useRef(palette);
  const activeWidthRef = useRef(strokeWidth);
  const flushBusy = useRef(false);
  const drawingGeneration = useRef(0);
  const retryAfter = useRef(0);
  const startStrokeCount = useRef(0);
  const board = view?.board ?? {};
  const strokes = Array.isArray(board.strokes) ? board.strokes : [];
  const fills = Array.isArray(board.fills) ? board.fills : [];
  const drawing = view?.turn === playerId && view?.phase === 'drawing';
  const choosing = view?.turn === playerId && view?.phase === 'choosing';
  const activeDrawing = view?.phase === 'drawing';
  const roundOver = view?.phase === 'round-over';
  const finished = view?.phase === 'finished' || !!view?.result;
  const roundSolved = roundOver && (board.guesses ?? []).some((guess: any) => guess.correct);
  const isDrawer = view?.turn === playerId;
  const secondsLeft = view?.deadlineAt ? Math.max(0, Math.ceil((Date.parse(view.deadlineAt) - now) / 1000)) : 80;
  const category = board.settings?.categoryOptions?.find((option: any) => option.id === board.settings?.category_id);
  const phaseLabel = view?.phase === 'choosing'
    ? copy(language, isDrawer ? '제시어 선택' : '상대가 제시어를 고르는 중', isDrawer ? 'Elige una palabra' : 'Tu pareja está eligiendo')
    : activeDrawing
      ? copy(language, isDrawer ? '출제자 · 그리는 중' : '맞히는 사람 · 맞혀 보세요', isDrawer ? 'Dibujas' : 'Adivina')
      : roundOver
        ? copy(language, '라운드 결과', 'Resultado de ronda')
        : finished
          ? copy(language, '최종 결과', 'Resultado final')
          : copy(language, '게임 준비 중', 'Preparando la partida');
  const displayedStrokes = useMemo(() => drawingRef.current && activePoints.length
    ? [...strokes.slice(0, startStrokeCount.current), { by: playerId, points: activePoints, color: activeColor, width: strokeWidth, order: Number.MAX_SAFE_INTEGER }]
    : strokes, [strokes, activePoints, activeColor, strokeWidth, playerId]);
  const allowed = (type: string) => Array.isArray(view?.actions) && view.actions.some((option: any) => option.action?.type === type);

  useEffect(() => {
    const settings = board.settings;
    if (settings) setSettingsDraft({ category_id: settings.category_id ?? null, drawTimeSeconds: settings.drawTimeSeconds, rounds: settings.rounds, choices: settings.choices, hints: settings.hints, customOnly: settings.customOnly });
    const customWords = view?.hand?.settingsCustomWords;
    if (Array.isArray(customWords)) setCustomWordsText(customWords.map((word: any) => `${word.ko}|${word.es}`).join('\n'));
  }, [board.settings, view?.hand?.settingsCustomWords]);

  useEffect(() => {
    drawingGeneration.current++;
    drawingRef.current = false; pointsRef.current = []; setActivePoints([]);
    retryAfter.current = 0; setToolNotice(''); setSettingsNotice('');
  }, [board.round, view?.phase, playerId]);

  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, 1000, 600);
    ctx.fillStyle = '#fffefa'; ctx.fillRect(0, 0, 1000, 600);
    const operations = [...strokes.map((stroke: any) => ({ ...stroke, kind: 'stroke' })), ...fills.map((fill: any) => ({ ...fill, kind: 'fill' }))].sort((a: any, b: any) => a.order - b.order);
    for (const operation of operations) {
      if (operation.kind === 'fill') bucketFill(ctx, operation.x * 1000, operation.y * 600, operation.color);
      else paintStroke(ctx, operation);
    }
    if (displayedStrokes !== strokes) paintStroke(ctx, displayedStrokes.at(-1));
  }, [strokes, fills, displayedStrokes, activePoints, activeColor, strokeWidth]);

  const coordinate = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  };
  const flush = async () => {
    if (flushBusy.current || pointsRef.current.length < 2 || Date.now() < retryAfter.current) return;
    flushBusy.current = true;
    const generation = drawingGeneration.current;
    const batch = pointsRef.current.splice(0, 60);
    if (pointsRef.current.length) pointsRef.current.unshift(batch[batch.length - 1]);
    const ok = await runAction({ type: 'draw', payload: { strokes: [{ points: batch, color: activeColorRef.current, width: activeWidthRef.current }] } });
    if (generation !== drawingGeneration.current) { flushBusy.current = false; return; }
    if (!ok) {
      const overlap = pointsRef.current[0] === batch.at(-1);
      pointsRef.current.unshift(...batch.slice(0, overlap ? -1 : undefined));
      retryAfter.current = Date.now() + 1200;
    } else retryAfter.current = 0;
    flushBusy.current = false;
    if (ok && pointsRef.current.length >= 2) void flush();
    else if (ok && !drawingRef.current) { pointsRef.current = []; setActivePoints([]); }
  };
  useEffect(() => {
    if (!drawing) return;
    const timer = window.setInterval(() => void flush(), 320);
    return () => window.clearInterval(timer);
  }, [drawing, palette, strokeWidth]);

  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const point = coordinate(event);
    const color = event.button === 2 ? secondaryColor : palette;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    startStrokeCount.current = strokes.length;
    activeColorRef.current = color; activeWidthRef.current = strokeWidth; setActiveColor(color);
    pointsRef.current = [point];
    setActivePoints(pointsRef.current);
  };
  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const next = coordinate(event), last = pointsRef.current[pointsRef.current.length - 1];
    if (!last || Math.hypot(next.x - last.x, next.y - last.y) < .003) return;
    pointsRef.current.push(next);
    setActivePoints([...pointsRef.current]);
    if (pointsRef.current.length >= 60) void flush();
  };
  const pointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (pointsRef.current.length === 1) pointsRef.current.push(pointsRef.current[0]);
    void flush();
  };
  const onCanvasPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const point = coordinate(event), x = point.x * 1000, y = point.y * 600;
    const color = event.button === 2 ? secondaryColor : palette;
    const ctx = event.currentTarget.getContext('2d');
    if (tool === 'pick') {
      const pixel = ctx?.getImageData(Math.min(999, Math.round(x)), Math.min(599, Math.round(y)), 1, 1).data;
      if (pixel) setPalette(`#${[pixel[0], pixel[1], pixel[2]].map(value => value.toString(16).padStart(2, '0')).join('')}`);
      setTool('brush');
      return;
    }
    if (tool === 'fill') {
      if (fillBusy.current || !ctx) return;
      const pixel = ctx.getImageData(Math.min(999, Math.round(x)), Math.min(599, Math.round(y)), 1, 1).data;
      const channels = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16));
      if (channels.every((channel, index) => Math.abs(pixel[index] - channel) < 8) && pixel[3] === 255) {
        setToolNotice(copy(language, '이미 같은 색이에요.', 'Ya tiene ese color.')); return;
      }
      fillBusy.current = true;
      setToolNotice(copy(language, '색을 채우는 중…', 'Aplicando el color…'));
      void runAction({ type: 'fill', payload: { x: point.x, y: point.y, color } }).then(ok => {
        setToolNotice(ok ? copy(language, '색을 채웠어요.', 'Color aplicado.') : copy(language, '색을 채우지 못했어요. 다시 시도해 주세요.', 'No se pudo aplicar el color. Inténtalo otra vez.'));
      }).finally(() => { fillBusy.current = false; });
      return;
    }
    pointerDown(event);
  };
  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSettingsNotice('');
    if (!settingsDraft.category_id) {
      setSettingsNotice(copy(language, '주제를 하나 골라 주세요.', 'Elige una categoría.')); return;
    }
    const customWords = customWordsText.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
      const [ko, es, ...extra] = line.split('|');
      return { ko: ko?.trim() ?? '', es: es?.trim() ?? '', invalid: extra.length > 0 };
    });
    if (customWords.some(word => !word.ko || !word.es || word.invalid || [...word.ko].length > 32 || [...word.es].length > 32)) {
      setSettingsNotice(copy(language, '각 줄을 한국어|Español 형식으로, 32자 이내로 적어 주세요.', 'Usa una línea por pareja: 한국어|Español, hasta 32 caracteres.'));
      return;
    }
    if (customWords.length > 30 || settingsDraft.customOnly && customWords.length < settingsDraft.rounds * settingsDraft.choices) {
      setSettingsNotice(copy(language, settingsDraft.customOnly ? '단어 전용 모드는 라운드에 필요한 만큼 단어가 있어야 해요.' : '직접 추가할 수 있는 단어는 최대 30개예요.', settingsDraft.customOnly ? 'El modo solo palabras necesita suficientes términos para todas las rondas.' : 'Puedes añadir hasta 30 palabras.'));
      return;
    }
    const ok = await runAction({ type: 'settings', payload: { settings: { ...settingsDraft, customWords: customWords.map(({ ko, es }) => ({ ko, es })) } } });
    if (!ok) setSettingsNotice(copy(language, '설정을 저장하지 못했어요. 입력을 확인해 주세요.', 'No se pudieron guardar los ajustes. Revisa los datos.'));
  };

  const scores = board.scores ?? {};
  const scoresBySeat = (['p1', 'p2'] as const).map(seat => ({ seat, mine: seat === playerId, score: Number(scores[seat] ?? 0) }));
  const heading = choosing
    ? copy(language, '오늘의 제시어', 'ELIGE UNA PALABRA')
    : drawing
      ? copy(language, '이 그림을 완성해 보세요', 'DIBUJA LA PALABRA')
      : activeDrawing
        ? copy(language, '그림을 보고 맞혀 보세요', 'MIRA Y ADIVINA')
      : roundOver
        ? copy(language, roundSolved ? '정답을 맞혔어요' : '라운드 종료', roundSolved ? '¡RESPUESTA CORRECTA!' : 'RONDA TERMINADA')
        : finished
          ? copy(language, `${board.totalRounds ?? 6}라운드 완료`, `${board.totalRounds ?? 6} RONDAS COMPLETADAS`)
          : copy(language, '그림을 보고 맞혀 보세요', 'MIRA Y ADIVINA');

  return <section className="cm-table" aria-label={copy(language, '캐치마인드 그림 게임', 'Juego de dibujo Catchmind')}>
    <header className="cm-topbar">
      <div className="cm-round-label"><span>{copy(language, '라운드', 'RONDA')}</span><strong>{board.round ?? 1}<i> / {board.totalRounds ?? 6}</i></strong><small>{category?.label[language]}</small><small key={`${board.round}:${view?.phase}:${view?.status}`} className="cm-phase-label" aria-live="polite">{phaseLabel}</small></div>
      <div className="cm-scoreboard" aria-label={copy(language, '점수', 'Puntuación')}>
        {scoresBySeat.map(({ seat, mine, score }) => <div key={seat} className={`cm-score ${mine ? 'is-you' : ''}`}><span className="cm-score-mark" aria-hidden="true">{mine ? '✦' : '♡'}</span><span><small>{mine ? copy(language, '나', 'Tú') : copy(language, '상대', 'Pareja')}</small><strong><GameValue value={score} resetKey={`catchmind:${playerId}:${seat}`} /></strong></span></div>)}
      </div>
      {view?.deadlineAt && !roundOver && !finished && <div className={`cm-timer ${secondsLeft <= 10 ? 'is-low' : ''}`} aria-label={`${secondsLeft} ${copy(language, '초 남음', 'segundos restantes')}`}><span aria-hidden="true">◷</span><b>{secondsLeft}</b><small>{copy(language, '초 남음', 's restantes')}</small></div>}
    </header>

    <div className="cm-play-area">
      <div className={`cm-artboard ${drawing ? 'can-draw' : ''}`}>
        <div className="cm-artboard-head">
          <div><span className="cm-eyebrow">{heading}</span><p>{isDrawer && view?.hand?.answer && drawing ? copy(language, '정답은', 'La palabra es') : roundOver || finished ? copy(language, '이번 제시어', 'La palabra era') : activeDrawing ? copy(language, '상대가 그리고 있어요', 'Tu pareja está dibujando') : copy(language, '함께 맞혀 보세요', 'Adivinen juntos')}</p></div>
          {drawing && view?.hand?.answer && <strong className="cm-secret-word">{view.hand.answer[language]}</strong>}
          {(roundOver || finished) && board.answer && <strong className="cm-secret-word">{board.answer[language]}</strong>}
          {!isDrawer && activeDrawing && board.hintWord && <b key={board.round} className="cm-hint-word" aria-label={copy(language, '한국어 / Español 글자 수', 'Longitud en 한국어 / Español')}><span>{board.hintWord.ko}</span><i aria-hidden="true"> / </i><span>{board.hintWord.es}</span></b>}
        </div>

        {choosing ? <div className="cm-choice-panel">
          <div className="cm-choice-intro"><span aria-hidden="true">✳</span><div><b>{copy(language, '그리고 싶은 단어를 골라 주세요', 'Elige qué quieres dibujar')}</b><small>{copy(language, '상대에게는 정답이 보이지 않아요.', 'La respuesta se mantiene oculta para tu pareja.')}</small></div></div>
          {allowed('settings') && <details className="cm-settings" open={!board.settings?.category_id}><summary>{copy(language, '주제 · 방 설정과 나만의 단어', 'Categoría · ajustes y palabras propias')} <span>⌄</span></summary><form onSubmit={saveSettings}>
            <fieldset className="cm-categories"><legend>{copy(language, '이번 판의 주제 · 하나만 선택', 'Categoría de la partida · elige una')}</legend>{(board.settings?.categoryOptions ?? []).map((category: any) => <label key={category.id}><input type="radio" name="catchmind-category" value={category.id} checked={settingsDraft.category_id === category.id} onChange={() => setSettingsDraft({ ...settingsDraft, category_id: category.id })}/><span>{category.label[language]}</span></label>)}</fieldset>
            <div className="cm-setting-grid">
              <label>{copy(language, '그림 시간 (초)', 'Tiempo (segundos)')}<input type="number" min="30" max="180" value={settingsDraft.drawTimeSeconds} onChange={event => setSettingsDraft({ ...settingsDraft, drawTimeSeconds: Number(event.target.value) })}/></label>
              <label>{copy(language, '라운드', 'Rondas')}<input type="number" min="2" max="12" value={settingsDraft.rounds} onChange={event => setSettingsDraft({ ...settingsDraft, rounds: Number(event.target.value) })}/></label>
              <label>{copy(language, '단어 보기', 'Opciones')}<input type="number" min="3" max="5" value={settingsDraft.choices} onChange={event => setSettingsDraft({ ...settingsDraft, choices: Number(event.target.value) })}/></label>
              <label className="cm-mask-setting">{copy(language, '글자 수 표시', 'Mostrar longitud')}<input type="checkbox" checked={settingsDraft.hints > 0} onChange={event => setSettingsDraft({ ...settingsDraft, hints: event.target.checked ? 2 : 0 })}/></label>
            </div>
            <label className="cm-custom-only"><input type="checkbox" checked={settingsDraft.customOnly} onChange={event => setSettingsDraft({ ...settingsDraft, customOnly: event.target.checked })}/>{copy(language, '직접 입력한 단어만 사용', 'Usar solo mis palabras')}</label>
            <label className="cm-custom-label">{copy(language, '한 줄에 한 쌍 · 한국어|Español', 'Una pareja por línea · 한국어|Español')}<textarea rows={4} maxLength={2400} value={customWordsText} onChange={event => setCustomWordsText(event.target.value)} placeholder={'고양이|gato\n바다|océano'}/></label>
            <div className="cm-settings-foot"><small>{customWordsText.split('\n').filter(line => line.trim()).length}/30 · {copy(language, '각 단어 32자 이내', 'hasta 32 caracteres por palabra')}</small><button type="submit">{copy(language, '설정 저장', 'Guardar ajustes')} ↗</button></div>
            {settingsNotice && <p className="cm-settings-error" role="alert">{settingsNotice}</p>}
          </form></details>}
          <div className="cm-word-choices">{(view.hand?.choices ?? []).map((word: any) => <button type="button" key={word.wordId} disabled={allowed('settings') && settingsDraft.category_id !== board.settings?.category_id} onClick={() => void runAction({ type: 'choose', payload: { wordId: word.wordId } })}><span className="cm-choice-icon" aria-hidden="true">✦</span><span>{word[language]}</span><i aria-hidden="true">↗</i></button>)}{!view.hand?.choices?.length && <p>{copy(language, '호스트가 주제를 선택하고 설정을 저장해 주세요.', 'La persona anfitriona debe elegir y guardar una categoría.')}</p>}</div>
        </div>
        : view?.phase === 'choosing' ? <div className="cm-choice-wait"><span>♡</span><b>{copy(language, '상대가 단어를 고르고 있어요', 'Tu pareja está eligiendo una palabra')}</b><small>{copy(language, '정답은 비밀로 남아 있어요.', 'La respuesta sigue siendo secreta.')}</small></div>
        : <div className={`cm-canvas ${drawing ? 'can-draw' : ''}`} data-testid="catchmind-canvas">
          <canvas ref={canvasRef} width={1000} height={600} role="img" tabIndex={drawing ? 0 : -1} aria-label={drawing ? copy(language, '그림을 그리는 캔버스', 'Lienzo para dibujar') : copy(language, '상대가 그린 그림', 'Dibujo de tu pareja')} onPointerDown={onCanvasPointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onContextMenu={event => event.preventDefault()}/>
          {activeDrawing && !displayedStrokes.length && !fills.length && <div className="cm-canvas-placeholder" aria-hidden="true"><span>＋</span><small>{drawing ? copy(language, '여기에 그려 보세요', 'Dibuja aquí') : copy(language, '첫 선을 기다리고 있어요', 'Esperando el primer trazo')}</small></div>}
          {drawing && tool === 'fill' && <div className="cm-canvas-tip">{copy(language, '채울 영역을 눌러 주세요', 'Toca una región para rellenar')}</div>}
          {!drawing && !choosing && !roundOver && !finished && <div className="cm-wait-overlay" aria-live="polite"><span>♡</span><b>{copy(language, '천천히 살펴봐요', 'Mira con calma')}</b></div>}
        </div>}

        {(activeDrawing || choosing || roundOver || finished) && <div key={`${board.round}:${view?.phase}`} className="cm-bottom-note" aria-live="polite">
          <span>{roundOver ? roundSolved ? copy(language, '정답을 맞혀서 두 사람 모두 점수를 얻었어요.', 'Respuesta correcta: ambos suman puntos.') : copy(language, '라운드가 끝났어요. 정답을 확인하고 다음 그림으로 넘어가요.', 'Terminó la ronda. Mira la respuesta y pasa al siguiente dibujo.') : finished ? copy(language, view.result?.winner === 'draw' ? '멋진 무승부예요.' : view.result?.winner === playerId ? '이번 판에서 이겼어요!' : '상대가 이번 판에서 이겼어요.', view.result?.winner === 'draw' ? 'Un empate estupendo.' : view.result?.winner === playerId ? '¡Ganaste la partida!' : 'Tu pareja ganó esta partida.') : activeDrawing ? copy(language, '그림은 두 사람에게 실시간으로 보여요.', 'El dibujo se comparte en tiempo real.') : choosing ? !view.hand?.choices?.length ? copy(language, '주제를 하나 선택하고 설정을 저장해요.', 'Elige una categoría y guarda los ajustes.') : copy(language, `${board.settings?.choices ?? 3}개 보기 중 하나를 선택해요.`, `Elige una de ${board.settings?.choices ?? 3} palabras.`) : copy(language, '그림이 끝나면 답이 공개돼요.', 'La respuesta se revela al terminar la ronda.')}</span>
          {allowed('pass') && <button type="button" className="cm-text-action" onClick={() => void runAction({ type: 'pass' })}>{copy(language, '이 단어 건너뛰기', 'Pasar palabra')} <span>→</span></button>}
          {allowed('end-round') && <button type="button" className="cm-text-action" onClick={() => void runAction({ type: 'end-round' })}>{roundOver ? copy(language, '다음 라운드', 'Siguiente ronda') : finished ? copy(language, '한 판이 끝났어요', 'Partida finalizada') : copy(language, '라운드 마치기', 'Terminar ronda')} <span>→</span></button>}
        </div>}
      </div>

      <aside className="cm-side-panel">
        <div className="cm-side-heading"><span className="cm-eyebrow">{copy(language, '라운드 상태', 'ESTADO DE RONDA')}</span><b>{finished ? copy(language, '게임 종료', 'Partida terminada') : roundOver ? copy(language, '라운드 종료', 'Ronda terminada') : view?.phase === 'choosing' ? copy(language, '제시어 선택', 'Eligiendo palabra') : isDrawer ? copy(language, '내가 그리고 있어요', 'Tú dibujas') : copy(language, '상대가 그리고 있어요', 'Tu pareja dibuja')}</b></div>
        <div className="cm-player-list">{scoresBySeat.map(({ seat, mine, score }) => <div key={seat} className={`cm-player-row ${mine ? 'is-you' : ''}`}><span className="cm-player-avatar">{mine ? '✦' : '♡'}</span><span><b>{mine ? copy(language, '나', 'Tú') : copy(language, '상대', 'Pareja')}</b><small>{mine === isDrawer ? copy(language, '출제자', 'Dibuja') : copy(language, '맞히는 사람', 'Adivina')}</small></span><strong>{score}<small> {copy(language, '점', 'pts')}</small></strong></div>)}</div>
        <div className="cm-guess-section"><div className="cm-guess-title"><span>{copy(language, '시도', 'INTENTOS')}</span><b>{(board.guesses ?? []).filter((guess: any) => !guess.correct).length}</b></div><div className="cm-guess-list" aria-live="polite">{(board.guesses ?? []).length ? board.guesses.map((guess: any, index: number) => <div className={`cm-guess-row ${guess.correct ? 'is-correct' : ''}`} key={`${guess.by}-${index}`}><span>{guess.correct ? '✓' : '·'}</span><b>{guess.correct ? copy(language, '정답을 맞혔어요!', '¡Respuesta correcta!') : copy(language, '다시 한번 생각해 보세요', 'Prueba otra vez')}</b></div>) : <p>{copy(language, '첫 답을 기다리고 있어요.', 'Esperando la primera respuesta.')}</p>}</div></div>
        {drawing && <div className="cm-tools">
          <p className="cm-tool-notice" role="status">{toolNotice}</p><div className="cm-tools-head"><span className="cm-eyebrow">{copy(language, '그리기 도구', 'HERRAMIENTAS')}</span><span>{copy(language, tool === 'brush' ? '펜' : tool === 'fill' ? '채우기' : '색 선택', tool === 'brush' ? 'PINCEL' : tool === 'fill' ? 'RELLENAR' : 'COLOR')}</span></div>
          <div className="cm-tool-modes" role="group" aria-label={copy(language, '도구 선택', 'Herramientas')}>
            <button type="button" className={tool === 'brush' ? 'active' : ''} aria-pressed={tool === 'brush'} onClick={() => setTool('brush')}><ToolIcon tool="brush"/> <span>{copy(language, '펜', 'Pincel')}</span></button>
            <button type="button" className={tool === 'fill' ? 'active' : ''} aria-pressed={tool === 'fill'} onClick={() => setTool('fill')}><ToolIcon tool="fill"/> <span>{copy(language, '채우기', 'Rellenar')}</span></button>
            <button type="button" className={tool === 'pick' ? 'active' : ''} aria-pressed={tool === 'pick'} onClick={() => setTool('pick')}><ToolIcon tool="pick"/> <span>{copy(language, '색 선택', 'Elegir color')}</span></button>
          </div>
          <div className="cm-color-grid" role="group" aria-label={copy(language, '펜 색상 · 오른쪽 클릭은 보조 색', 'Color · clic derecho para color secundario')}>{colors.map(color => <button type="button" key={color} className={`cm-color ${palette === color ? 'active' : ''} ${secondaryColor === color ? 'secondary' : ''}`} style={{ '--cm-color': color } as CSSProperties} aria-label={`${copy(language, '색상', 'Color')} ${color}`} aria-pressed={palette === color} onClick={() => setPalette(color)} onContextMenu={event => { event.preventDefault(); setSecondaryColor(color); }} />)}</div>
          <div className="cm-secondary-row"><span><i style={{ backgroundColor: palette }} />{copy(language, '기본', 'Principal')}</span><button type="button" className="cm-swap-colors" aria-label={copy(language, '색 바꾸기', 'Intercambiar colores')} onClick={() => { setSecondaryColor(palette); setPalette(secondaryColor); }}>↔</button><span><i style={{ backgroundColor: secondaryColor }} />{copy(language, '보조 · 오른쪽 클릭', 'Secundario · clic derecho')}</span></div>
          <button type="button" className={`cm-eraser ${palette === '#fffefa' ? 'active' : ''}`} aria-pressed={palette === '#fffefa'} onClick={() => { setPalette('#fffefa'); setTool('brush'); }}><span aria-hidden="true">▱</span>{copy(language, '지우개', 'Borrador')}</button>
          <label className="cm-width-control"><span>{copy(language, '굵기', 'Grosor')} <b>{strokeWidth}</b></span><input type="range" min="2" max="18" value={strokeWidth} onChange={event => setStrokeWidth(Number(event.target.value))} aria-label={copy(language, '펜 굵기', 'Grosor del pincel')}/></label>
          <div className="cm-tool-actions">{allowed('undo') && <button type="button" onClick={() => void runAction({ type: 'undo' })}>{copy(language, '실행 취소', 'Deshacer')}</button>}{allowed('clear') && <button type="button" onClick={() => void runAction({ type: 'clear' })}>{copy(language, '모두 지우기', 'Borrar todo')}</button>}</div>
        </div>}
        {!drawing && !choosing && !roundOver && !finished && <div className="cm-side-tip"><span>✳</span><p>{copy(language, '정답은 출제자만 볼 수 있어요. 답이 맞으면 자동으로 공개돼요.', 'Solo quien dibuja ve la respuesta. Se revela al acertar.')}</p></div>}
        {finished && <div className="cm-finish-card"><span aria-hidden="true">✦</span><b>{copy(language, view.result?.winner === 'draw' ? '같은 점수예요' : view.result?.winner === playerId ? '오늘의 승리' : '다음 판을 노려봐요', view.result?.winner === 'draw' ? 'Mismo puntaje' : view.result?.winner === playerId ? 'Victoria de hoy' : 'Habrá revancha')}</b><small>{copy(language, `${Number(scores.p1 ?? 0)}점 · ${Number(scores.p2 ?? 0)}점`, `${Number(scores.p1 ?? 0)} pts · ${Number(scores.p2 ?? 0)} pts`)}</small>{onReplay && <><button type="button" onClick={() => void onReplay()}>{copy(language, replayPending ? '같이 다시 시작하기' : '다시 하기', replayPending ? 'Aceptar revancha' : 'Volver a jugar')}</button><small role="status">{copy(language, replayPending ? '두 사람이 모두 수락하면 새 판을 시작해요.' : '다시 하기는 두 사람의 동의가 필요해요.', replayPending ? 'La nueva partida comienza cuando ambos aceptan.' : 'La revancha necesita el acuerdo de ambos.')}</small></>}</div>}
      </aside>
    </div>
  </section>;
}

function ToolIcon({ tool }: { tool: 'brush' | 'fill' | 'pick' }) {
  return <svg className="cm-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {tool === 'brush' ? <><path d="m14 4 6 6-9 9-6-6zM5 13l-2 8 8-2"/><path d="m12 6 6 6"/></> : tool === 'fill' ? <><path d="m10 3 9 9-7 7-9-9zM7 6l5 5M3 14h14"/><path d="M20 15s-2 3-2 4a2 2 0 0 0 4 0c0-1-2-4-2-4Z"/></> : <><path d="m15 3 6 6-3 3-6-6zM13 7l-9 9v4h4l9-9M9 15l-3-3"/></>}
  </svg>;
}
