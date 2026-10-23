import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.resetModules(); });

it('waits for loadeddata after the Ruffle load promise resolves', async () => {
  const { waitForRuffleReady } = await import('./RhythmBoard');
  const player = new EventTarget() as unknown as HTMLElement;
  let finishLoad!: () => void;
  const load = vi.fn(() => new Promise<void>(resolve => { finishLoad = resolve; }));
  let ready = false;
  const promise = waitForRuffleReady(player, load, new AbortController().signal).then(() => { ready = true; });

  expect(load).toHaveBeenCalledOnce();
  finishLoad();
  await Promise.resolve();
  expect(ready).toBe(false);

  player.dispatchEvent(new Event('loadeddata'));
  await expect(promise).resolves.toBeUndefined();
  expect(ready).toBe(true);
});

it('uses the error path when loadeddata never arrives', async () => {
  vi.useFakeTimers();
  const { waitForRuffleReady } = await import('./RhythmBoard');
  const player = new EventTarget() as unknown as HTMLElement;
  const promise = waitForRuffleReady(player, () => Promise.resolve(), new AbortController().signal);
  const rejection = expect(promise).rejects.toThrow('Ruffle did not load data in time');

  await vi.advanceTimersByTimeAsync(15_000);
  await rejection;
  expect(vi.getTimerCount()).toBe(0);
});

it('cleans up the listener and timeout when the effect is cancelled', async () => {
  vi.useFakeTimers();
  const { waitForRuffleReady } = await import('./RhythmBoard');
  const player = new EventTarget() as unknown as HTMLElement;
  const controller = new AbortController();
  const promise = waitForRuffleReady(player, () => new Promise<void>(() => {}), controller.signal);
  const rejection = expect(promise).rejects.toThrow('Ruffle load cancelled');

  controller.abort();
  await rejection;
  expect(vi.getTimerCount()).toBe(0);

  player.dispatchEvent(new Event('loadeddata'));
  await vi.advanceTimersByTimeAsync(15_000);
  expect(vi.getTimerCount()).toBe(0);
});

it('shares the pending Ruffle load across StrictMode mounts and maps the exact companion URL', async () => {
  const scripts: { src: string; onload: null | (() => void); onerror: null | (() => void) }[] = [];
  vi.stubGlobal('window', { location: { href: 'https://dos.example/room' } });
  vi.stubGlobal('document', { createElement: () => {
    const script = { src: '', onload: null, onerror: null };
    scripts.push(script);
    return script;
  }, head: { appendChild: vi.fn() } });
  const { loadRuffle } = await import('./RhythmBoard');

  const firstMount = loadRuffle();
  const strictModeMount = loadRuffle();
  expect(strictModeMount).toBe(firstMount);
  expect(scripts).toHaveLength(1);
  expect(scripts[0].src).toBe('/rhythm/ruffle/ruffle.js');

  const config = (window as unknown as { RufflePlayer: { config: { urlRewriteRules: [string, string][] } } }).RufflePlayer.config;
  expect(config.urlRewriteRules).toEqual([[
    'http://images.hangame.co.kr/static/flash/flashgame/game/lang/Music_RES.swf',
    'https://dos.example/rhythm/Music_RES.swf',
  ]]);
  scripts[0].onload?.();
  await expect(Promise.all([firstMount, strictModeMount])).resolves.toEqual([undefined, undefined]);
});

it('pulses matching keycaps without canceling the original keyboard event and clears them on release', async () => {
  const { observeRhythmKeys } = await import('./RhythmBoard');
  const player = new EventTarget();
  const pressed = new Set<string>();
  const keycap = { classList: {
    add: (name: string) => pressed.add(name),
    remove: (name: string) => pressed.delete(name),
  } } as unknown as Pick<HTMLElement, 'classList'>;
  const cleanup = observeRhythmKeys(player as HTMLElement, code => code === 'ArrowLeft' ? keycap : null);
  const event = (type: string, key: string, code: string) => {
    const result = new Event(type, { cancelable: true });
    Object.defineProperties(result, { key: { value: key }, code: { value: code } });
    return result;
  };

  const down = event('keydown', 'ArrowLeft', 'ArrowLeft');
  player.dispatchEvent(down);
  expect(pressed.has('is-pressed')).toBe(true);
  expect(down.defaultPrevented).toBe(false);

  player.dispatchEvent(event('keyup', 'ArrowLeft', 'ArrowLeft'));
  expect(pressed.has('is-pressed')).toBe(false);
  cleanup();
});
