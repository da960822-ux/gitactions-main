import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { createDominoState, isDominoChainComplete, loadPreferences, placeDominoTile, savePreferences } from './interaction';
import './details.css';
import AssetPlayground from './AssetPlayground';

type Props = { language: 'ko' | 'es'; reducedMotion: boolean; onEffect: (name: string, value?: number) => void };
type Point = { x: number; y: number };
const copy = {
  ko: { title: '작은 장난들', intro: '원하는 것만 눌러서 놀아봐.', domino: '도미노 맞추기', balance: '균형 잡기', draw: '종이에 그려보기', rhythm: '리듬 따라 누르기', bridge: '종이 조각 맞추기', details: '종이와 빛', left: '왼쪽', right: '오른쪽', tip: '실제 게임 점수와는 별개의 작은 놀이야.', flip: '카드로 뒤집기', clear: '지우기', shape: '마름모', line: '선', play: '따라 누르기', show: '신호 보기', reset: '다시 놓기', turn: '돌리기', bridgeDone: '통로가 이어졌어.', stamp: '도장 찍기', wind: '바람 보내기', pocket: '종이 주머니 펼치기', prism: '빛 각도 바꾸기', effects: '장식 효과', off: '끄기', on: '켜기', saved: '이 기기에 선택 저장', mismatch: '이 끝 숫자와 맞지 않아.', phrase: '양면 문구', phraseKo: '같이 놀자', phraseEs: 'Vamos a jugar', decor: '작은 장식', gem: '보석', clip: '종이 클립', playGame: 'Catchmind 열기' },
  es: { title: 'Pequeños juegos', intro: 'Elige algo y juega un rato.', domino: 'Unir dominós', balance: 'Equilibrar', draw: 'Dibujar en papel', rhythm: 'Seguir el ritmo', bridge: 'Unir piezas de papel', details: 'Papel y luz', left: 'Izquierda', right: 'Derecha', tip: 'Es un juego pequeño, aparte de las partidas reales.', flip: 'Voltear a tarjeta', clear: 'Borrar', shape: 'Rombo', line: 'Línea', play: 'Repetir', show: 'Ver señal', reset: 'Reiniciar', turn: 'Girar', bridgeDone: 'El paso está conectado.', stamp: 'Poner un sello', wind: 'Mover aire', pocket: 'Abrir el pliegue', prism: 'Cambiar el ángulo de luz', effects: 'Efectos decorativos', off: 'Apagar', on: 'Encender', saved: 'Preferencias guardadas en este dispositivo', mismatch: 'Ese extremo no coincide.', phrase: 'Frase por ambos lados', phraseKo: '같이 놀자', phraseEs: 'Vamos a jugar', decor: 'Detalle pequeño', gem: 'Gema', clip: 'Clip de papel', playGame: 'Abrir Catchmind' },
};
const dominoSupply: readonly (readonly [number, number])[] = [[4, 5], [2, 1], [2, 3], [4, 3]];
const rhythm = [0, 2, 1];
const PREF_KEY = 'post-hero-preview:v1';

function save(prefs: { effectsEnabled: boolean; stamp: 'YL' | 'heart'; decor?: 'gem' | 'clip' }) {
  try { return savePreferences(window.localStorage, PREF_KEY, {...readPrefs(),...prefs}); } catch { return false; }
}
function readPrefs() {
  try { return loadPreferences(window.localStorage, PREF_KEY); } catch { return {}; }
}
function buttonClass() { return 'egg-button'; }

export default function Details({ language, reducedMotion, onEffect }: Props) {
  const t = copy[language];
  const [domino, setDomino] = useState(createDominoState);
  const [tiles, setTiles] = useState([...dominoSupply]);
  const [selectedTile, setSelectedTile] = useState(1);
  const [dominoMismatch, setDominoMismatch] = useState(false);
  const [tilt, setTilt] = useState(4);
  const [settled, setSettled] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [flipped, setFlipped] = useState(false);
  const [rhythmInput, setRhythmInput] = useState<number[]>([]);
  const [signalShown, setSignalShown] = useState(false);
  const [patches, setPatches] = useState([0, 0, 0]);
  const [stamp, setStamp] = useState<'YL' | 'heart'>(() => readPrefs().stamp ?? 'YL');
  const [effects, setEffects] = useState(() => readPrefs().effectsEnabled ?? true);
  const [wind, setWind] = useState(false);
  const [pocket, setPocket] = useState(false);
  const [prism, setPrism] = useState(0);
  const [phraseFlipped, setPhraseFlipped] = useState(false);
  const [decor, setDecor] = useState<'gem' | 'clip'>(() => readPrefs().decor ?? 'gem');
  const [waxPressed, setWaxPressed] = useState(false);
  const [saved, setSaved] = useState(false);
  const drawing = useRef(false);
  const activeEffect = useRef<string | null>(null);
  const emit = (name: string, value = 1) => {
    if (!effects) return;
    onEffect(name, value);
    if (value === 0 && activeEffect.current === name) activeEffect.current = null;
    else if (value !== 0) activeEffect.current = name;
  };
  const svg = useRef<SVGSVGElement>(null);

  const dominoDone = isDominoChainComplete(domino);
  const selected = tiles[selectedTile];
  const bridgeDone = patches.every((turn, i) => turn === [1, 2, 0][i]);

  useEffect(() => { emit('balance', tilt); }, [tilt, effects, onEffect]);
  useEffect(() => { emit('balance-settled', settled ? 1 : 0); }, [settled, effects, onEffect]);
  useEffect(() => { emit('domino-chain', dominoDone ? 1 : 0); }, [dominoDone, effects, onEffect]);
  useEffect(() => { emit('paper-bridge', bridgeDone ? 1 : 0); }, [bridgeDone, effects, onEffect]);

  function saveSetting(next: { effectsEnabled: boolean; stamp: 'YL' | 'heart'; decor?: 'gem' | 'clip' }) {
    setSaved(save(next));
  }
  function placeSelectedDomino() {
    if (!selected) return;
    const next = placeDominoTile(domino, selected);
    if (!next) { setDominoMismatch(true); return; }
    setDomino(next); setDominoMismatch(false); setTiles((current) => current.filter((_, i) => i !== selectedTile));
    setSelectedTile((i) => Math.max(0, Math.min(i, tiles.length - 2)));
  }
  function resetDomino() { setDomino(createDominoState()); setTiles([...dominoSupply]); setSelectedTile(1); setDominoMismatch(false); }
  function stopWax() { setWaxPressed(false); emit('wax-press', 0); }
  function saveDecor(next: 'gem' | 'clip') { setDecor(next); saveSetting({ stamp, effectsEnabled: effects, decor: next }); }
  function stopEffects() {
    const active = activeEffect.current;
    if (effects && active) onEffect(active, 0);
    activeEffect.current = null;
    setWaxPressed(false); setPocket(false); setWind(false); setSettled(false);
  }
  function point(event: PointerEvent<SVGSVGElement>): Point {
    const box = svg.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(100, (event.clientX - box.left) / box.width * 100)), y: Math.max(0, Math.min(60, (event.clientY - box.top) / box.height * 60)) };
  }
  function startDraw(event: PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = strokes.reduce((n, stroke) => n + stroke.length, 0) < 200;
    if (drawing.current) setStrokes([...strokes, [point(event)]]);
  }
  function addShape(points: Point[]) {
    setStrokes((current) => current.reduce((n, stroke) => n + stroke.length, 0) + points.length <= 200 ? [...current, points] : current);
  }
  function moveDraw(event: PointerEvent<SVGSVGElement>) {
    if (!drawing.current) return;
    const next = point(event);
    setStrokes((current) => current.map((line, i) => i === current.length - 1 && current.reduce((n, stroke) => n + stroke.length, 0) < 200 ? [...line, next] : line));
  }
  function endDraw() { drawing.current = false; }
  function pressRhythm(index: number) {
    const next = [...rhythmInput, index]; setRhythmInput(next);
    if (next.length === rhythm.length) {
      const correct = next.every((value, i) => value === rhythm[i]);
      if (correct) emit('rhythm-bridge', 1);
    }
  }

  return <section className="details-eggs" aria-labelledby="details-title">
    <div className="details-heading"><p className="details-kicker">{language === 'ko' ? '테이블 위에서' : 'Sobre la mesa'}</p><h2 id="details-title">{t.title}</h2><p>{t.intro}</p></div>
    <div className="egg-grid">
      <article className="egg-card domino-card"><h3>{t.domino}</h3><p>{language === 'ko' ? '끝 숫자 하나를 맞춰 놓고 연쇄를 눌러봐.' : 'Une un número y luego inicia la cadena.'}</p>
        <div className="domino-row" aria-label={language === 'ko' ? '실제로 놓은 도미노' : 'Dominós colocados'}>{domino.placed.map(([a, b], index) => <div className={`domino-tile ${index < domino.placed.length - 1 ? 'fallen' : ''}`} key={index}><span>{a}</span><i /><span>{b}</span></div>)}</div>
        <div className="domino-pickers" role="group" aria-label={language === 'ko' ? '놓을 실제 타일 선택' : 'Elegir una ficha'}>{tiles.map((tile, index) => <button key={`${tile[0]}-${tile[1]}`} className={buttonClass()} aria-pressed={selectedTile === index} onClick={() => { setSelectedTile(index); setDominoMismatch(false); }}>{tile[0]} · {tile[1]}</button>)}</div>
        <button className="egg-button egg-primary" disabled={!selected || dominoDone} onClick={placeSelectedDomino}>{dominoDone ? (language === 'ko' ? '연쇄 완성' : 'Cadena completa') : language === 'ko' ? '선택한 타일 놓기' : 'Colocar ficha elegida'}</button>
        {dominoMismatch && <p className="egg-reward" role="status">{t.mismatch}</p>}
        <button className={buttonClass()} onClick={resetDomino}>{t.reset}</button>{dominoDone && <p className="egg-reward">{language === 'ko' ? '맞췄네 haha' : 'Encajó, haha.'}</p>}
      </article>

      <article className="egg-card balance-card"><h3>{t.balance}</h3><p>{language === 'ko' ? '구슬을 가운데 홈에 두어봐.' : 'Lleva la bolita al centro.'}</p>
        <div className={`balance-tray ${settled ? 'settled' : ''}`} style={{ transform: `rotate(${tilt * 1.1}deg)`, transitionDuration: reducedMotion ? '0ms' : '260ms' }}><span className="tray-groove" /><span className="balance-ball" style={{ left: `${50 + tilt * 3}%` }}>●</span></div>
        <div className="egg-actions"><button className={buttonClass()} onClick={() => { setTilt((n) => Math.max(-8, n - 1)); setSettled(false); }}>{t.left}</button><button className={buttonClass()} onClick={() => { setTilt((n) => Math.min(8, n + 1)); setSettled(false); }}>{t.right}</button><button className="egg-button egg-primary" onClick={() => setSettled(Math.abs(tilt) <= 1)} disabled={Math.abs(tilt) > 1}>{language === 'ko' ? '가운데 놓기' : 'Centrar'}</button></div>
        {settled && <div className="balance-window" aria-live="polite"><span>◦</span><span>◇</span><span>◦</span></div>}
      </article>

      <article className="egg-card drawing-card"><h3>{t.draw}</h3><p>{language === 'ko' ? '직접 그린 선은 이 화면에만 남아.' : 'Tu dibujo se queda solo en esta pantalla.'}</p>
        {!flipped ? <svg ref={svg} className="drawing-paper" viewBox="0 0 100 60" preserveAspectRatio="none" role="img" aria-label={language === 'ko' ? '그림판' : 'Área para dibujar'} onPointerDown={startDraw} onPointerMove={moveDraw} onPointerUp={endDraw} onPointerCancel={endDraw}>{strokes.map((line, i) => <polyline key={i} points={line.map(({ x, y }) => `${x},${y}`).join(' ')} fill="none" stroke="#7b293d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />)}</svg> : <div className="drawing-paper drawing-card-face"><svg className="flipped-drawing" viewBox="0 0 100 60" aria-hidden="true">{strokes.map((line, i) => <polyline key={i} points={line.map(({ x, y }) => `${x},${y}`).join(' ')} fill="none" stroke="#7b293d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />)}</svg><small>{language === 'ko' ? '내가 그린 카드' : 'Mi tarjeta dibujada'}</small></div>}
        <div className="egg-actions"><button className={buttonClass()} onClick={() => addShape([{ x: 18, y: 30 }, { x: 50, y: 12 }, { x: 82, y: 30 }, { x: 50, y: 50 }, { x: 18, y: 30 }])}>{t.shape}</button><button className={buttonClass()} onClick={() => addShape([{ x: 15, y: 45 }, { x: 85, y: 15 }])}>{t.line}</button><button className={buttonClass()} onClick={() => setStrokes([])}>{t.clear}</button><button className={buttonClass()} onClick={() => setFlipped((v) => !v)}>{t.flip}</button></div>
      </article>

      <article className="egg-card rhythm-card"><h3>{t.rhythm}</h3><p>{language === 'ko' ? '신호를 보고 같은 순서로 세 막대를 눌러.' : 'Mira la señal y pulsa las tres barras en orden.'}</p>
        <div className="rhythm-bars" aria-label={signalShown ? rhythm.map((v) => v + 1).join(', ') : undefined}>{[0, 1, 2].map((bar) => <button key={bar} className={`rhythm-bar bar-${bar} ${signalShown && rhythm.includes(bar) ? 'signal' : ''} ${rhythmInput.includes(bar) ? 'pressed' : ''}`} onClick={() => pressRhythm(bar)} aria-label={`${language === 'ko' ? '막대' : 'Barra'} ${bar + 1}`}><span />{signalShown && rhythm.indexOf(bar) >= 0 && <b className="signal-order">{rhythm.indexOf(bar) + 1}</b>}</button>)}</div>
        <div className="egg-actions"><button className={buttonClass()} onClick={() => { setSignalShown((v) => !v); setRhythmInput([]); }}>{t.show}</button><button className="egg-button egg-primary" onClick={() => { if (rhythmInput.join() === rhythm.join()) emit('rhythm-bridge', 1); setRhythmInput([]); }}>{t.play}</button><button className={buttonClass()} onClick={() => { setRhythmInput([]); emit('rhythm-bridge', 0); }}>{t.reset}</button></div>
        {rhythmInput.length === rhythm.length && rhythmInput.every((v, i) => v === rhythm[i]) && <p className="egg-reward" aria-live="polite">{language === 'ko' ? '막대가 작은 다리로 이어졌어.' : 'Las barras forman un pequeño puente.'}</p>}
      </article>

      <article className="egg-card bridge-card"><h3>{t.bridge}</h3><p>{language === 'ko' ? '각 조각을 돌려 접힌 길을 이어봐.' : 'Gira cada pieza para conectar el camino.'}</p>
        <div className={`paper-bridge ${bridgeDone ? 'complete' : ''}`} aria-label={bridgeDone ? t.bridgeDone : t.bridge}><span className="bridge-start">✉</span>{patches.map((turn, i) => <button key={i} className="patch-piece" style={{ transform: `rotate(${turn * 90}deg)`, transitionDuration: reducedMotion ? '0ms' : '220ms' }} onClick={() => setPatches((p) => p.map((v, index) => index === i ? (v + 1) % 4 : v))} aria-label={`${t.turn} ${i + 1}`}>⌜</button>)}<span className="bridge-end">◇</span></div>
        <div className="egg-actions"><button className={buttonClass()} onClick={() => setPatches([0, 0, 0])}>{t.reset}</button>{bridgeDone && <span className="egg-reward">{t.bridgeDone}</span>}</div>
      </article>

      <article className="egg-card details-card"><h3>{t.details}</h3><p>{language === 'ko' ? '작은 조각으로 눌러 보고 빛을 움직여봐.' : 'Prueba un sello y mueve la luz.'}</p>
        <div className={`wax-sample ${waxPressed ? 'pressed' : ''}`} aria-label={stamp === 'YL' ? 'YL' : language === 'ko' ? '하트' : 'Corazón'}>{stamp === 'YL' ? 'YL' : '♡'}</div>
        <div className="egg-actions"><button className={buttonClass()} aria-pressed={stamp === 'YL'} onClick={() => { setStamp('YL'); saveSetting({ stamp: 'YL', effectsEnabled: effects }); emit('wax-stamp', 0); }}>{language === 'ko' ? 'YL' : 'YL'}</button><button className={buttonClass()} aria-pressed={stamp === 'heart'} onClick={() => { setStamp('heart'); saveSetting({ stamp: 'heart', effectsEnabled: effects }); emit('wax-stamp', 1); }}>♡</button><button className={`egg-button egg-primary ${waxPressed ? 'pressing' : ''}`} aria-pressed={waxPressed} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setWaxPressed(true); emit('wax-press', 1); }} onPointerUp={stopWax} onPointerCancel={stopWax} onPointerLeave={stopWax} onKeyDown={(event) => { if ((event.key === ' ' || event.key === 'Enter') && !waxPressed) { event.preventDefault(); setWaxPressed(true); emit('wax-press', 1); } }} onKeyUp={(event) => { if (event.key === ' ' || event.key === 'Enter') stopWax(); }} onBlur={stopWax}>{t.stamp}</button></div>
        <div className={`pocket-fold ${pocket ? 'open' : ''}`}><span>◇</span><span>□</span></div>
        <div className="egg-actions"><button className={buttonClass()} onClick={() => { setPocket((v) => !v); emit('paper-pocket', pocket ? 0 : 1); }}>{t.pocket}</button><button className={buttonClass()} onClick={() => { setWind((v) => !v); emit('paper-wind', wind ? 0 : 1); }}>{t.wind}</button><button className={buttonClass()} onClick={() => { setPrism((v) => (v + 1) % 3); emit('prism-angle', (prism + 1) % 3); }}>{t.prism} {prism + 1}/3</button></div>
        <div className={`prism-preview angle-${prism}`} aria-label={language === 'ko' ? '프리즘 문양' : 'Figura del prisma'}><span className="prism-fragment prism-left">◢</span><span className="prism-fragment prism-right">◣</span>{prism === 1 && <b aria-hidden="true">◇</b>}</div>
        {prism === 1 && <a className="egg-button prism-game-link" href="/play?game=catchmind">{t.playGame}</a>}
        <div className="egg-actions"><span>{t.phrase}</span><button className={buttonClass()} onClick={() => setPhraseFlipped((v) => !v)} aria-label={t.phrase}>{phraseFlipped ? (language === 'ko' ? t.phraseEs : t.phraseKo) : (language === 'ko' ? t.phraseKo : t.phraseEs)}</button></div>
        <div className="phrase-card" lang={phraseFlipped ? (language === 'ko' ? 'es' : 'ko') : language}>{phraseFlipped ? (language === 'ko' ? t.phraseEs : t.phraseKo) : (language === 'ko' ? t.phraseKo : t.phraseEs)}</div>
        <div className="egg-actions decor-choices"><span>{t.decor}</span><button className={buttonClass()} aria-pressed={decor === 'gem'} onClick={() => saveDecor('gem')}>{t.gem} ◇</button><button className={buttonClass()} aria-pressed={decor === 'clip'} onClick={() => saveDecor('clip')}>{t.clip} ⌇</button><span className={`decor-preview ${decor}`}>{decor === 'gem' ? '◇' : '⌇'}</span></div>
        <div className={`loose-paper ${wind ? 'lifted' : ''}`}>◇</div><div className="egg-actions effects-setting"><span>{t.effects}</span><button className={buttonClass()} aria-pressed={effects} onClick={() => { const next = !effects; if (!next) stopEffects(); setEffects(next); saveSetting({ stamp, effectsEnabled: next }); }}>{effects ? t.on : t.off}</button></div>
        {saved && <small>{t.saved}</small>}
      </article>
    </div>
    <AssetPlayground language={language} reducedMotion={reducedMotion}/>
    <p className="details-footnote">{t.tip}</p>
  </section>;
}
