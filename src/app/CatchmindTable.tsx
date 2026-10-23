import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import { GameValue } from './GameValue';
import type { CatchmindCategoryId } from '../games/catchmindTopics';
import './catchmind-table.css';

type Point = { x: number; y: number };
type Props = {
  roomId?: string;
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

const colors = [
  { value: '#202522', ko: '짙은 회색', es: 'gris oscuro' }, { value: '#2f655b', ko: '짙은 초록', es: 'verde oscuro' },
  { value: '#67a968', ko: '초록', es: 'verde' }, { value: '#dca84b', ko: '노랑', es: 'amarillo' },
  { value: '#e57f6a', ko: '산호색', es: 'coral' }, { value: '#b94f42', ko: '빨강', es: 'rojo' },
  { value: '#ce6990', ko: '분홍', es: 'rosa' }, { value: '#875a9d', ko: '보라', es: 'morado' },
  { value: '#5786a1', ko: '파랑', es: 'azul' }, { value: '#54a7a0', ko: '청록', es: 'turquesa' },
];
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
export function moveCatchmindCursor(point: Point, key: string) {
  const steps: Record<string, Point> = { ArrowLeft: { x: -.02, y: 0 }, ArrowRight: { x: .02, y: 0 }, ArrowUp: { x: 0, y: -.02 }, ArrowDown: { x: 0, y: .02 } };
  const step = steps[key];
  return step ? { x: Math.max(0, Math.min(1, point.x + step.x)), y: Math.max(0, Math.min(1, point.y + step.y)) } : point;
}
export function catchmindChoicesNeedSettingsSave(canEdit: boolean, draftCategory: CatchmindCategoryId | null, savedCategory: CatchmindCategoryId | null) {
  return canEdit && draftCategory !== savedCategory;
}

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

export function catchmindPersistedSettingsKey(identity: string, settings: unknown, words: unknown) {
  return `${identity}:${JSON.stringify(settings ?? null)}:${JSON.stringify(words ?? null)}`;
}

export function restoreCatchmindPenColor(color: string) { return color === '#fffefa' ? '#284f49' : color; }

type DrawBatch = { points: Point[]; color: string; width: number; strokeId: string; segmentIndex: number; round: number; identity?: string };

export async function sendDrawQueue(queue: DrawBatch[], send: (batch: DrawBatch) => Promise<boolean>) {
  try {
    while (queue.length) {
      const batch = queue[0];
      if (!await send(batch)) return false;
      const index = queue.indexOf(batch);
      if (index >= 0) queue.splice(index, 1);
    }
    return true;
  } catch { return false; }
}

export function composeDisplayedStrokes(strokes: any[], pending: DrawBatch[], active: { points: Point[]; color: string; width: number; by: PlayerId } | null) {
  return [
    ...strokes,
    ...pending.filter(batch => !strokes.some(stroke => stroke.strokeId === batch.strokeId && (stroke.segmentIndex ?? -1) >= batch.segmentIndex))
      .map(batch => ({ ...batch, order: Number.MAX_SAFE_INTEGER })),
    ...(active?.points.length ? [{ ...active, order: Number.MAX_SAFE_INTEGER }] : []),
  ];
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

export default function CatchmindTable({ roomId, view, playerId, language, now, palette, setPalette, strokeWidth, setStrokeWidth, runAction, onReplay, replayPending = false }: Props) {
  const board = view?.board ?? {};
  const [activePoints, setActivePoints] = useState<Point[]>([]);
  const [pendingVisual, setPendingVisual] = useState<DrawBatch[]>([]);
  const [keyboardCursor, setKeyboardCursor] = useState<Point>({ x: .5, y: .5 });
  const [keyboardActive, setKeyboardActive] = useState(false);
  const [keyboardPenDown, setKeyboardPenDown] = useState(false);
  const [activeColor, setActiveColor] = useState(palette);
  const [secondaryColor, setSecondaryColor] = useState('#fffefa');
  const [colorTarget, setColorTarget] = useState<'primary' | 'secondary'>('primary');
  const [eraser, setEraser] = useState(false);
  const lastDrawingColor = useRef(palette === '#fffefa' ? '#284f49' : palette);
  const [tool, setTool] = useState<'brush' | 'fill' | 'pick'>('brush');
  const [settingsDraft, setSettingsDraft] = useState({ category_id: null as CatchmindCategoryId | null, drawTimeSeconds: 80, rounds: 6, choices: 3, hints: 2, customOnly: false });
  const [customWordsText, setCustomWordsText] = useState('');
  const persistedSettings = board.settings;
  const persistedWords = view?.hand?.settingsCustomWords;
  const persistedIdentity = `${roomId ?? view?.roomId ?? view?.room?.id ?? ''}:${playerId}`;
  const appliedSettings = useRef('');
  const [settingsNotice, setSettingsNotice] = useState('');
  const [toolNotice, setToolNotice] = useState('');
  const fillBusy = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keyboardCursorRef = useRef<Point>({ x: .5, y: .5 });
  const drawingRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);
  const sendQueue = useRef<DrawBatch[]>([]);
  const currentRound = useRef(1);
  const observedIdentity = useRef('');
  const drawingIdentity = `${persistedIdentity}:${board.round ?? 1}:${view?.phase ?? ''}:${view?.deadlineAt ?? ''}`;
  const currentIdentity = useRef(drawingIdentity);
  currentIdentity.current = drawingIdentity;
  const strokeId = useRef('');
  const nextSegment = useRef(0);
  const [sendError, setSendError] = useState(false);
  const [staleDrawNotice, setStaleDrawNotice] = useState(false);
  const sendErrorRef = useRef(false);
  const activeColorRef = useRef(palette);
  const activeWidthRef = useRef(strokeWidth);
  const flushBusy = useRef(false);
  const flushWaiters = useRef<Array<() => void>>([]);
  const strokes = Array.isArray(board.strokes) ? board.strokes : [];
  const fills = Array.isArray(board.fills) ? board.fills : [];
  currentRound.current = board.round ?? 1;
  const isDrawer = (view?.turn ?? board.drawer) === playerId;
  const drawing = isDrawer && view?.phase === 'drawing';
  const choosing = isDrawer && view?.phase === 'choosing';
  const choosingPhase = view?.phase === 'choosing';
  const activeDrawing = view?.phase === 'drawing';
  const roundOver = view?.phase === 'round-over';
  const finished = view?.phase === 'finished' || !!view?.result;
  const roundSolved = roundOver && (board.guesses ?? []).some((guess: any) => guess.correct);
  const secondsLeft = view?.deadlineAt ? Math.max(0, Math.ceil((Date.parse(view.deadlineAt) - now) / 1000)) : 80;
  const category = board.settings?.categoryOptions?.find((option: any) => option.id === board.settings?.category_id);
  const phaseLabel = choosingPhase
    ? copy(language, isDrawer ? '제시어 선택' : '상대가 제시어를 고르는 중', isDrawer ? 'Elige una palabra' : 'Tu pareja está eligiendo')
    : activeDrawing
      ? copy(language, isDrawer ? '출제자 · 그리는 중' : '맞히는 사람 · 맞혀 보세요', isDrawer ? 'Dibujas' : 'Adivina')
      : roundOver
        ? copy(language, '라운드 결과', 'Resultado de ronda')
        : finished
          ? copy(language, '최종 결과', 'Resultado final')
          : copy(language, '게임 준비 중', 'Preparando la partida');
  const displayedStrokes = useMemo(() => composeDisplayedStrokes(
    strokes,
    pendingVisual,
    drawingRef.current && activePoints.length ? { by: playerId, points: activePoints, color: activeColorRef.current, width: activeWidthRef.current } : null,
  ), [strokes, pendingVisual, activePoints, activeColor, strokeWidth, playerId]);
  const allowed = (type: string) => Array.isArray(view?.actions) && view.actions.some((option: any) => option.action?.type === type);

  useEffect(() => {
    const key = catchmindPersistedSettingsKey(persistedIdentity, persistedSettings, persistedWords);
    if (appliedSettings.current === key) return;
    appliedSettings.current = key;
    if (persistedSettings) setSettingsDraft({ category_id: persistedSettings.category_id ?? null, drawTimeSeconds: persistedSettings.drawTimeSeconds, rounds: persistedSettings.rounds, choices: persistedSettings.choices, hints: persistedSettings.hints, customOnly: persistedSettings.customOnly });
    if (Array.isArray(persistedWords)) setCustomWordsText(persistedWords.map((word: any) => `${word.ko}|${word.es}`).join('\n'));
    setSettingsNotice('');
  }, [persistedIdentity, persistedSettings, persistedWords]);

  useEffect(() => {
    if (observedIdentity.current === drawingIdentity) return;
    if (sendQueue.current.length || pointsRef.current.length > 1) setStaleDrawNotice(true);
    observedIdentity.current = drawingIdentity;
    drawingRef.current = false; sendQueue.current = []; pointsRef.current = [];
    setPendingVisual([]); setActivePoints([]); sendErrorRef.current = false; setSendError(false);
    setKeyboardPenDown(false); setKeyboardActive(false);
    setToolNotice('');
  }, [drawingIdentity]);

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
    for (const stroke of displayedStrokes.slice(strokes.length)) paintStroke(ctx, stroke);
  }, [strokes, fills, displayedStrokes, activePoints, activeColor, strokeWidth]);

  useEffect(() => {
    if (!pendingVisual.length) return;
    const confirmed = (batch: DrawBatch) => strokes.some((stroke: any) => stroke.strokeId === batch.strokeId && (stroke.segmentIndex ?? -1) >= batch.segmentIndex);
    for (let index = sendQueue.current.length - 1; index >= 0; index--) if (confirmed(sendQueue.current[index])) sendQueue.current.splice(index, 1);
    const next = pendingVisual.filter(batch => !confirmed(batch));
    if (next.length !== pendingVisual.length) setPendingVisual(next);
  }, [strokes, pendingVisual]);

  const coordinate = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  };
  const flush = async () => {
    if (pointsRef.current.length >= 2) {
      const batch = pointsRef.current.splice(0, 60);
      if (pointsRef.current.length || drawingRef.current) pointsRef.current.unshift(batch.at(-1)!);
      const advances = nextSegment.current === 0 || batch.slice(1).some(point => point.x !== batch[0].x || point.y !== batch[0].y);
      if (advances) {
        const queued = { points: batch, color: activeColorRef.current, width: activeWidthRef.current, strokeId: strokeId.current, segmentIndex: nextSegment.current++, round: currentRound.current, identity: currentIdentity.current };
        sendQueue.current.push(queued);
        setPendingVisual(current => [...current, queued]);
      }
      setActivePoints([...pointsRef.current]);
    }
    if (flushBusy.current || sendErrorRef.current || !sendQueue.current.length) return;
    flushBusy.current = true;
    const queue = sendQueue.current;
    try {
      const sent = await sendDrawQueue(queue, async batch => {
        if (batch.round !== currentRound.current || batch.identity !== currentIdentity.current) return false;
        const ok = await runAction({ type: 'draw', payload: { strokes: [{ points: batch.points, color: batch.color, width: batch.width, strokeId: batch.strokeId, segmentIndex: batch.segmentIndex }] } });
        return ok;
      });
      if (queue !== sendQueue.current) return;
      if (!sent) { sendErrorRef.current = true; setSendError(true); }
    } finally {
      flushBusy.current = false;
      flushWaiters.current.splice(0).forEach(resolve => resolve());
    }
    if (!sendQueue.current.length && !drawingRef.current && pointsRef.current.length < 2) { pointsRef.current = []; setActivePoints([]); sendErrorRef.current = false; setSendError(false); }
  };
  const retryDraws = () => { sendErrorRef.current = false; setSendError(false); void flush(); };
  const flushAndWait = async () => {
    await flush();
    while (flushBusy.current) await new Promise<void>(resolve => flushWaiters.current.push(resolve));
    return !sendErrorRef.current && !sendQueue.current.length;
  };
  const runAfterDraws = async (action: GameAction) => {
    const identity = currentIdentity.current;
    const flushed = await flushAndWait();
    if (identity !== currentIdentity.current) return false;
    if (!flushed) { sendErrorRef.current = true; setSendError(true); return false; }
    try { return await runAction(action); } catch { return false; }
  };
  const beginStroke = (point: Point, color: string) => {
    if (!drawing || fillBusy.current) return;
    drawingRef.current = true;
    strokeId.current = crypto.randomUUID(); nextSegment.current = 0;
    activeColorRef.current = color; activeWidthRef.current = strokeWidth; setActiveColor(color);
    pointsRef.current = [point]; setActivePoints([point]);
  };
  const appendStrokePoint = (point: Point) => {
    if (!drawingRef.current) return;
    const last = pointsRef.current.at(-1);
    if (last && Math.hypot(point.x - last.x, point.y - last.y) < .003) return;
    pointsRef.current.push(point); setActivePoints([...pointsRef.current]);
    if (pointsRef.current.length >= 60) void flush();
  };
  const finishStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (pointsRef.current.length === 1) pointsRef.current.push(pointsRef.current[0]);
    setKeyboardPenDown(false);
    void flush();
  };
  const applyCanvasPoint = (point: Point, color: string) => {
    if (!drawing || fillBusy.current) return;
    const ctx = canvasRef.current?.getContext('2d'), x = point.x * 1000, y = point.y * 600;
    if (tool === 'pick') {
      const pixel = ctx?.getImageData(Math.min(999, Math.round(x)), Math.min(599, Math.round(y)), 1, 1).data;
      if (pixel) { const picked = `#${[pixel[0], pixel[1], pixel[2]].map(value => value.toString(16).padStart(2, '0')).join('')}`; lastDrawingColor.current = restoreCatchmindPenColor(picked); setEraser(false); setPalette(picked); }
      setTool('brush'); return;
    }
    if (tool === 'fill') {
      if (!ctx) return;
      const pixel = ctx.getImageData(Math.min(999, Math.round(x)), Math.min(599, Math.round(y)), 1, 1).data;
      const channels = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16));
      if (channels.every((channel, index) => Math.abs(pixel[index] - channel) < 8) && pixel[3] === 255) {
        setToolNotice(copy(language, '이미 같은 색이에요.', 'Ya tiene ese color.')); return;
      }
      fillBusy.current = true; setToolNotice(copy(language, '색을 채우는 중…', 'Aplicando el color…'));
      void runAfterDraws({ type: 'fill', payload: { x: point.x, y: point.y, color } }).then(ok => {
        setToolNotice(ok ? copy(language, '색을 채웠어요.', 'Color aplicado.') : copy(language, '색을 채우지 못했어요. 다시 시도해 주세요.', 'No se pudo aplicar el color. Inténtalo otra vez.'));
      }).catch(() => setToolNotice(copy(language, '색을 채우지 못했어요. 다시 시도해 주세요.', 'No se pudo aplicar el color. Inténtalo otra vez.'))).finally(() => { fillBusy.current = false; });
      return;
    }
    beginStroke(point, color);
  };
  const onCanvasKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (!drawing || fillBusy.current) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); setKeyboardActive(true);
      const next = moveCatchmindCursor(keyboardCursorRef.current, event.key);
      keyboardCursorRef.current = next; setKeyboardCursor(next);
      appendStrokePoint(next); return;
    }
    if (event.key === ' ' || event.key === 'Enter' || event.key === 'Escape') event.preventDefault();
    if (event.repeat) return;
    setKeyboardActive(true);
    if (event.key === ' ') {
      if (drawingRef.current) finishStroke();
      else { beginStroke(keyboardCursorRef.current, palette); setKeyboardPenDown(true); }
    } else if (event.key === 'Enter') {
      if (tool === 'brush') {
        if (!drawingRef.current) beginStroke(keyboardCursorRef.current, palette);
        appendStrokePoint(keyboardCursorRef.current); finishStroke();
      } else applyCanvasPoint(keyboardCursorRef.current, palette);
    } else if (event.key === 'Escape') finishStroke();
  };
  const clearDrawing = async () => {
    if (fillBusy.current) return;
    const identity = currentIdentity.current;
    fillBusy.current = true; drawingRef.current = false;
    while (flushBusy.current) await new Promise<void>(resolve => flushWaiters.current.push(resolve));
    if (identity !== currentIdentity.current) { fillBusy.current = false; return; }
    flushBusy.current = true;
    try {
      const ok = await runAction({ type: 'clear' });
      if (identity !== currentIdentity.current) return;
      if (!ok) { setToolNotice(copy(language, '그림을 지우지 못했어요. 다시 시도해 주세요.', 'No se pudo borrar el dibujo. Inténtalo otra vez.')); return; }
      pointsRef.current = []; sendQueue.current = []; setActivePoints([]); setPendingVisual([]);
      sendErrorRef.current = false; setSendError(false);
    } catch { if (identity === currentIdentity.current) setToolNotice(copy(language, '그림을 지우지 못했어요. 다시 시도해 주세요.', 'No se pudo borrar el dibujo. Inténtalo otra vez.')); }
    finally { fillBusy.current = false; flushBusy.current = false; flushWaiters.current.splice(0).forEach(resolve => resolve()); }
  };
  useEffect(() => {
    if (!drawing) return;
    const timer = window.setInterval(() => void flush(), 320);
    return () => window.clearInterval(timer);
  }, [drawing, palette, strokeWidth]);

  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || fillBusy.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    beginStroke(coordinate(event), event.button === 2 ? secondaryColor : palette);
  };
  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || (event.buttons & 3) === 0) return;
    appendStrokePoint(coordinate(event));
  };
  const pointerUp = () => finishStroke();
  const onCanvasPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || fillBusy.current) return;
    if (drawingRef.current) finishStroke();
    setKeyboardActive(false);
    if (tool === 'brush') pointerDown(event);
    else applyCanvasPoint(coordinate(event), event.button === 2 ? secondaryColor : palette);
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
  const categoryChoicesLocked = catchmindChoicesNeedSettingsSave(allowed('settings'), settingsDraft.category_id, board.settings?.category_id ?? null);
  const colorLabel = (color: string) => colors.find(option => option.value === color)?.[language] ?? (color === '#fffefa' ? copy(language, '흰색', 'blanco') : color === '#284f49' ? copy(language, '짙은 초록', 'verde oscuro') : copy(language, '직접 선택한 색', 'color elegido'));
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
            <details className="cm-advanced-settings"><summary>{copy(language, '시간 · 라운드 · 나만의 단어', 'Tiempo · rondas · palabras propias')} <span>⌄</span></summary><div className="cm-advanced-content">
              <div className="cm-setting-grid">
                <label>{copy(language, '그림 시간 (초)', 'Tiempo (segundos)')}<input type="number" min="30" max="180" value={settingsDraft.drawTimeSeconds} onChange={event => setSettingsDraft({ ...settingsDraft, drawTimeSeconds: Number(event.target.value) })}/></label>
                <label>{copy(language, '라운드', 'Rondas')}<input type="number" min="2" max="12" value={settingsDraft.rounds} onChange={event => setSettingsDraft({ ...settingsDraft, rounds: Number(event.target.value) })}/></label>
                <label>{copy(language, '단어 보기', 'Opciones')}<input type="number" min="3" max="5" value={settingsDraft.choices} onChange={event => setSettingsDraft({ ...settingsDraft, choices: Number(event.target.value) })}/></label>
                <label className="cm-mask-setting">{copy(language, '글자 수 표시', 'Mostrar longitud')}<input type="checkbox" checked={settingsDraft.hints > 0} onChange={event => setSettingsDraft({ ...settingsDraft, hints: event.target.checked ? 2 : 0 })}/></label>
              </div>
              <label className="cm-custom-only"><input type="checkbox" checked={settingsDraft.customOnly} onChange={event => setSettingsDraft({ ...settingsDraft, customOnly: event.target.checked })}/>{copy(language, '직접 입력한 단어만 사용', 'Usar solo mis palabras')}</label>
              <label className="cm-custom-label">{copy(language, '한 줄에 한 쌍 · 한국어|Español', 'Una pareja por línea · 한국어|Español')}<textarea rows={4} maxLength={2400} value={customWordsText} onChange={event => setCustomWordsText(event.target.value)} placeholder={'고양이|gato\n바다|océano'}/></label>
              <small className="cm-custom-count">{customWordsText.split('\n').filter(line => line.trim()).length}/30 · {copy(language, '각 단어 32자 이내', 'hasta 32 caracteres por palabra')}</small>
            </div></details>
            <div className="cm-settings-foot"><button type="submit">{copy(language, '설정 저장', 'Guardar ajustes')} ↗</button></div>
            {settingsNotice && <p className="cm-settings-error" role="alert">{settingsNotice}</p>}
          </form></details>}
          <div className="cm-word-choices">{categoryChoicesLocked && <p className="cm-choice-lock-note" role="status">{copy(language, '주제 설정을 저장하면 단어를 고를 수 있어요.', 'Guarda la categoría para poder elegir una palabra.')}</p>}{(view.hand?.choices ?? []).map((word: any) => <button type="button" key={word.wordId} disabled={categoryChoicesLocked} onClick={() => void runAction({ type: 'choose', payload: { wordId: word.wordId } })}><span className="cm-choice-icon" aria-hidden="true">✦</span><span>{word[language]}</span><i aria-hidden="true">↗</i></button>)}{!view.hand?.choices?.length && <p>{copy(language, '호스트가 주제를 선택하고 설정을 저장해 주세요.', 'La persona anfitriona debe elegir y guardar una categoría.')}</p>}</div>
        </div>
        : view?.phase === 'choosing' ? <div className="cm-choice-wait"><span>♡</span><b>{copy(language, '상대가 단어를 고르고 있어요', 'Tu pareja está eligiendo una palabra')}</b><small>{copy(language, '정답은 비밀로 남아 있어요.', 'La respuesta sigue siendo secreta.')}</small></div>
        : <div className={`cm-canvas ${drawing ? 'can-draw' : ''}`} data-testid="catchmind-canvas">
          <canvas ref={canvasRef} width={1000} height={600} role="group" tabIndex={drawing ? 0 : -1} aria-label={drawing ? copy(language, '그림 그리기 캔버스', 'Lienzo para dibujar') : copy(language, '상대가 그린 그림', 'Dibujo de tu pareja')} aria-describedby={drawing ? 'cm-keyboard-instructions' : undefined} aria-keyshortcuts={drawing ? 'ArrowLeft ArrowRight ArrowUp ArrowDown Space Enter Escape' : undefined} onKeyDown={onCanvasKeyDown} onFocus={() => { setKeyboardCursor(keyboardCursorRef.current); setKeyboardActive(true); }} onBlur={() => { finishStroke(); setKeyboardActive(false); }} onPointerDown={onCanvasPointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onContextMenu={event => event.preventDefault()}/>
          {drawing && <><span className={`cm-keyboard-cursor${keyboardActive ? ' is-visible' : ''}${keyboardPenDown ? ' is-down' : ''}`} style={{ left: `${keyboardCursor.x * 100}%`, top: `${keyboardCursor.y * 100}%` }} aria-hidden="true"/><p id="cm-keyboard-instructions" className="cm-keyboard-hint">{copy(language, '키보드: 화살표 이동 · Space 펜 켜기/끄기 · Enter 채우기/색 선택/점 · Esc 선 마침', 'Teclado: flechas mueven · Espacio activa/desactiva el trazo · Enter rellena/elige color/punto · Esc termina el trazo')}</p></>}
          {activeDrawing && !displayedStrokes.length && !fills.length && <div className="cm-canvas-placeholder" aria-hidden="true"><span>＋</span><small>{drawing ? copy(language, '여기에 그려 보세요', 'Dibuja aquí') : copy(language, '첫 선을 기다리고 있어요', 'Esperando el primer trazo')}</small></div>}
          {drawing && tool === 'fill' && <div className="cm-canvas-tip">{copy(language, '채울 영역을 눌러 주세요', 'Toca una región para rellenar')}</div>}
          {!drawing && !choosing && !roundOver && !finished && <div className="cm-wait-overlay" aria-live="polite"><span>♡</span><b>{copy(language, '천천히 살펴봐요', 'Mira con calma')}</b></div>}
        </div>}

        {(activeDrawing || choosing || roundOver || finished) && <div key={`${board.round}:${view?.phase}`} className="cm-bottom-note" aria-live="polite">
          <span>{roundOver ? roundSolved ? copy(language, '정답을 맞혀서 두 사람 모두 점수를 얻었어요.', 'Respuesta correcta: ambos suman puntos.') : copy(language, '라운드가 끝났어요. 정답을 확인하고 다음 그림으로 넘어가요.', 'Terminó la ronda. Mira la respuesta y pasa al siguiente dibujo.') : finished ? copy(language, view.result?.winner === 'draw' ? '멋진 무승부예요.' : view.result?.winner === playerId ? '이번 판에서 이겼어요!' : '상대가 이번 판에서 이겼어요.', view.result?.winner === 'draw' ? 'Un empate estupendo.' : view.result?.winner === playerId ? '¡Ganaste la partida!' : 'Tu pareja ganó esta partida.') : activeDrawing ? copy(language, '그림은 두 사람에게 실시간으로 보여요.', 'El dibujo se comparte en tiempo real.') : choosing ? !view.hand?.choices?.length ? copy(language, '주제를 하나 선택하고 설정을 저장해요.', 'Elige una categoría y guarda los ajustes.') : copy(language, `${board.settings?.choices ?? 3}개 보기 중 하나를 선택해요.`, `Elige una de ${board.settings?.choices ?? 3} palabras.`) : copy(language, '그림이 끝나면 답이 공개돼요.', 'La respuesta se revela al terminar la ronda.')}</span>
          {allowed('pass') && <button type="button" className="cm-text-action" onClick={() => void runAction({ type: 'pass' })}><ToolIcon tool="skip"/>{copy(language, '이 단어 건너뛰기', 'Pasar palabra')} <span>→</span></button>}
          {allowed('end-round') && <button type="button" className="cm-text-action" onClick={() => void runAction({ type: 'end-round' })}><ToolIcon tool="round-end"/>{roundOver ? copy(language, '다음 라운드', 'Siguiente ronda') : finished ? copy(language, '한 판이 끝났어요', 'Partida finalizada') : copy(language, '라운드 마치기', 'Terminar ronda')} <span>→</span></button>}
        </div>}
      </div>

      <aside className="cm-side-panel">
        <div className="cm-side-heading"><span className="cm-eyebrow">{copy(language, '라운드 상태', 'ESTADO DE RONDA')}</span><b>{finished ? copy(language, '게임 종료', 'Partida terminada') : roundOver ? copy(language, '라운드 종료', 'Ronda terminada') : view?.phase === 'choosing' ? copy(language, '제시어 선택', 'Eligiendo palabra') : isDrawer ? copy(language, '내가 그리고 있어요', 'Tú dibujas') : copy(language, '상대가 그리고 있어요', 'Tu pareja dibuja')}</b></div>
        <div className="cm-player-list">{scoresBySeat.map(({ seat, mine, score }) => <div key={seat} className={`cm-player-row ${mine ? 'is-you' : ''}`}><span className="cm-player-avatar">{mine ? '✦' : '♡'}</span><span><b>{mine ? copy(language, '나', 'Tú') : copy(language, '상대', 'Pareja')}</b><small>{mine === isDrawer ? copy(language, '출제자', 'Dibuja') : copy(language, '맞히는 사람', 'Adivina')}</small></span><strong>{score}<small> {copy(language, '점', 'pts')}</small></strong></div>)}</div>
        <div className="cm-guess-section"><div className="cm-guess-title"><span>{copy(language, '시도', 'INTENTOS')}</span><b>{(board.guesses ?? []).filter((guess: any) => !guess.correct).length}</b></div><div className="cm-guess-list" aria-live="polite">{(board.guesses ?? []).length ? board.guesses.map((guess: any, index: number) => <div className={`cm-guess-row ${guess.correct ? 'is-correct' : ''}`} key={`${guess.by}-${index}`}><span>{guess.correct ? '✓' : '·'}</span><b>{guess.correct ? copy(language, '정답을 맞혔어요!', '¡Respuesta correcta!') : copy(language, '다시 한번 생각해 보세요', 'Prueba otra vez')}</b></div>) : <p>{copy(language, '첫 답을 기다리고 있어요.', 'Esperando la primera respuesta.')}</p>}</div></div>
        {drawing && <div className="cm-tools">
          {sendError && <div className="cm-send-error" role="alert"><span>{copy(language, '그림 전송에 실패했어요. 선은 보존돼 있어요.', 'No se pudo enviar el dibujo. Tus trazos se conservaron.')}</span><button type="button" onClick={retryDraws}>{copy(language, '그림 다시 보내기', 'Reintentar dibujo')}</button></div>}
          {staleDrawNotice && <p className="cm-tool-notice" role="status">{copy(language, '지난 그림의 미전송 선은 새 라운드에 보내지 않아요.', 'Los trazos pendientes anteriores no se envían a la nueva ronda.')}</p>}
          <p className="cm-tool-notice" role="status">{toolNotice}</p><div className="cm-tools-head"><span className="cm-eyebrow">{copy(language, '그리기 도구', 'HERRAMIENTAS')}</span><span>{copy(language, tool === 'brush' ? '펜' : tool === 'fill' ? '채우기' : '색 선택', tool === 'brush' ? 'PINCEL' : tool === 'fill' ? 'RELLENAR' : 'COLOR')}</span></div>
          <div className="cm-tool-modes" role="group" aria-label={copy(language, '도구 선택', 'Herramientas')}>
            <button type="button" className={tool === 'brush' ? 'active' : ''} aria-pressed={tool === 'brush'} onClick={() => { setEraser(false); setPalette(lastDrawingColor.current); setTool('brush'); }}><ToolIcon tool="brush"/> <span>{copy(language, '펜', 'Pincel')}</span></button>
            <button type="button" className={tool === 'fill' ? 'active' : ''} aria-pressed={tool === 'fill'} onClick={() => setTool('fill')}><ToolIcon tool="fill"/> <span>{copy(language, '채우기', 'Rellenar')}</span></button>
            <button type="button" className={tool === 'pick' ? 'active' : ''} aria-pressed={tool === 'pick'} onClick={() => setTool('pick')}><ToolIcon tool="pick"/> <span>{copy(language, '색 선택', 'Elegir color')}</span></button>
          </div>
          <div className="cm-color-target" role="group" aria-label={copy(language, '색상 선택 대상', 'Color que vas a cambiar')}>
            <button type="button" aria-pressed={colorTarget === 'primary'} onClick={() => setColorTarget('primary')}>{copy(language, '기본 색', 'Color principal')}</button>
            <button type="button" aria-pressed={colorTarget === 'secondary'} onClick={() => setColorTarget('secondary')}>{copy(language, '보조 색', 'Color secundario')}</button>
          </div>
          <div className="cm-color-grid" role="group" aria-label={copy(language, colorTarget === 'primary' ? '기본 색 선택' : '보조 색 선택', colorTarget === 'primary' ? 'Elige el color principal' : 'Elige el color secundario')}>{colors.map(({ value, ko, es }) => {
            const selected = colorTarget === 'primary' ? palette === value : secondaryColor === value;
            return <button type="button" key={value} className={`cm-color ${palette === value ? 'active' : ''} ${secondaryColor === value ? 'secondary' : ''}`} style={{ '--cm-color': value } as CSSProperties} aria-label={`${language === 'ko' ? ko : es} · ${selected ? copy(language, '선택됨', 'seleccionado') : colorTarget === 'primary' ? copy(language, '기본 색으로 선택', 'Elegir como color principal') : copy(language, '보조 색으로 선택', 'Elegir como color secundario')}`} aria-pressed={selected} onClick={() => {
              setEraser(false);
              if (colorTarget === 'primary') { lastDrawingColor.current = value; setPalette(value); }
              else setSecondaryColor(value);
            }} />;
          })}</div>
          <div className="cm-secondary-row"><span><i style={{ backgroundColor: palette }} />{copy(language, '기본', 'Principal')}: {colorLabel(palette)}</span><button type="button" className="cm-swap-colors" aria-label={copy(language, '색 바꾸기', 'Intercambiar colores')} onClick={() => { setSecondaryColor(palette); setPalette(secondaryColor); }}><ToolIcon tool="swap"/></button><span><i style={{ backgroundColor: secondaryColor }} />{copy(language, '보조', 'Secundario')}: {colorLabel(secondaryColor)}</span></div>
          <button type="button" className={`cm-eraser ${eraser ? 'active' : ''}`} aria-pressed={eraser} onClick={() => { if (!eraser) { lastDrawingColor.current = restoreCatchmindPenColor(palette); setPalette('#fffefa'); } else setPalette(lastDrawingColor.current); setEraser(!eraser); setTool('brush'); }}><ToolIcon tool="eraser"/>{copy(language, '지우개', 'Borrador')}</button>
          <label className="cm-width-control"><span>{copy(language, '굵기', 'Grosor')} <b>{strokeWidth}</b></span><input type="range" min="2" max="18" value={strokeWidth} onChange={event => setStrokeWidth(Number(event.target.value))} aria-label={copy(language, '펜 굵기', 'Grosor del pincel')}/></label>
          <div className="cm-tool-actions">{allowed('undo') && <button type="button" onClick={() => void runAfterDraws({ type: 'undo' })}><ToolIcon tool="undo"/>{copy(language, '실행 취소', 'Deshacer')}</button>}{allowed('clear') && <button type="button" onClick={() => void clearDrawing()}><ToolIcon tool="clear"/>{copy(language, '모두 지우기', 'Borrar todo')}</button>}</div>
        </div>}
        {!drawing && !choosing && !roundOver && !finished && <div className="cm-side-tip"><span>✳</span><p>{copy(language, '정답은 출제자만 볼 수 있어요. 답이 맞으면 자동으로 공개돼요.', 'Solo quien dibuja ve la respuesta. Se revela al acertar.')}</p></div>}
        {finished && <div className="cm-finish-card"><span aria-hidden="true">✦</span><b>{copy(language, view.result?.winner === 'draw' ? '같은 점수예요' : view.result?.winner === playerId ? '오늘의 승리' : '다음 판을 노려봐요', view.result?.winner === 'draw' ? 'Mismo puntaje' : view.result?.winner === playerId ? 'Victoria de hoy' : 'Habrá revancha')}</b><small>{copy(language, `${Number(scores.p1 ?? 0)}점 · ${Number(scores.p2 ?? 0)}점`, `${Number(scores.p1 ?? 0)} pts · ${Number(scores.p2 ?? 0)} pts`)}</small>{onReplay && <><button type="button" onClick={() => void onReplay()}>{copy(language, replayPending ? '같이 다시 시작하기' : '다시 하기', replayPending ? 'Aceptar revancha' : 'Volver a jugar')}</button><small role="status">{copy(language, replayPending ? '두 사람이 모두 수락하면 새 판을 시작해요.' : '다시 하기는 두 사람의 동의가 필요해요.', replayPending ? 'La nueva partida comienza cuando ambos aceptan.' : 'La revancha necesita el acuerdo de ambos.')}</small></>}</div>}
      </aside>
    </div>
  </section>;
}

function ToolIcon({ tool }: { tool: 'brush' | 'fill' | 'pick' | 'eraser' | 'undo' | 'clear' | 'swap' | 'skip' | 'round-end' }) {
  return <svg className="cm-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {tool === 'pick' ? <><path d="m15 3 6 6-3 3-6-6zM13 7l-9 9v4h4l9-9M9 15l-3-3"/></> : <use href={`/images/catchmind/tool-icons.svg#${tool === 'brush' ? 'pen' : tool}`}/>}
  </svg>;
}
