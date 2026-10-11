import { afterEach, describe, expect, it, vi } from 'vitest';

function installAudioMocks() {
  const oscillators: any[] = [];
  const sources: any[] = [];
  const gains: any[] = [];
  const listeners = new Map<string, () => void>();
  const gain = () => {
    const node = { gain: { setTargetAtTime: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
    gains.push(node);
    return node;
  };
  const context = {
    currentTime: 0,
    sampleRate: 44100,
    state: 'suspended',
    destination: {},
    createGain: vi.fn(gain),
    createOscillator: vi.fn(() => {
      const oscillator = { type: '', frequency: { setValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null as null | (() => void) };
      oscillators.push(oscillator);
      sources.push(oscillator);
      return oscillator;
    }),
    createBuffer: vi.fn((_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) })),
    createBufferSource: vi.fn(() => {
      const source = { buffer: null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null as null | (() => void) };
      sources.push(source);
      return source;
    }),
    createBiquadFilter: vi.fn(() => ({ type: 'lowpass', frequency: { setValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() })),
    resume: vi.fn(async function (this: { state: string }) { this.state = 'running'; }),
    suspend: vi.fn(async function (this: { state: string }) { this.state = 'suspended'; }),
    close: vi.fn(async function (this: { state: string }) { this.state = 'closed'; }),
  };
  class FakeAudioContext { constructor() { return context as unknown as FakeAudioContext; } }
  const storage = new Map<string, string>();
  vi.stubGlobal('window', { AudioContext: FakeAudioContext });
  vi.stubGlobal('document', {
    hidden: false,
    addEventListener: vi.fn((name: string, handler: () => void) => listeners.set(name, handler)),
    removeEventListener: vi.fn((name: string) => listeners.delete(name)),
  });
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  return { context, oscillators, sources, gains, listeners, storage };
}

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('game-specific sound effects', () => {
  it('defaults every game off and loads/clamps each saved preference independently', async () => {
    const { storage } = installAudioMocks();
    storage.set('dos-sfx-v1', JSON.stringify({ davinci: { sfxEnabled: true, sfxVolume: 2 }, marble: { sfxEnabled: 'yes', sfxVolume: -1 } }));
    const audio = await import('./audio');
    expect(audio.getPreferences('davinci')).toEqual({ sfxEnabled: true, sfxVolume: 1 });
    expect(audio.getPreferences('marble')).toEqual({ sfxEnabled: false, sfxVolume: 0 });
    expect(audio.getPreferences('domino')).toEqual({ sfxEnabled: false, sfxVolume: 0.42 });
    expect(audio.getPreferences('rhythm')).toEqual({ sfxEnabled: false, sfxVolume: 0 });
    expect(audio.setPreferences('domino', { sfxEnabled: true, sfxVolume: 0.7 })).toEqual({ sfxEnabled: true, sfxVolume: 0.7 });
    expect(audio.getPreferences('davinci')).toEqual({ sfxEnabled: true, sfxVolume: 1 });
    expect(JSON.parse(storage.get('dos-sfx-v1')!).domino).toEqual({ sfxEnabled: true, sfxVolume: 0.7 });
    expect(audio.setPreferences('rhythm', { sfxEnabled: true, sfxVolume: 1 })).toEqual({ sfxEnabled: false, sfxVolume: 0 });
    audio.dispose();
  });

  it('does not create or play sound on scene selection; gesture unlock is required', async () => {
    const { context, oscillators } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('splendor', { sfxEnabled: true });
    audio.setScene('splendor');
    audio.playCue('splendor', 'buy');
    expect(context.resume).not.toHaveBeenCalled();
    expect(oscillators).toHaveLength(0);
    await audio.unlock();
    audio.playCue('splendor', 'buy');
    expect(oscillators.length).toBeGreaterThan(0);
    audio.dispose();
  });

  it('applies the active game volume only and suppresses Rhythm cues', async () => {
    const { context, gains, sources } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('splendor', { sfxEnabled: true, sfxVolume: 0.3 });
    audio.setPreferences('marble', { sfxEnabled: true, sfxVolume: 0.6 });
    audio.setScene('splendor');
    await audio.unlock();
    expect(gains).toHaveLength(1);
    expect(gains[0].gain.setTargetAtTime.mock.lastCall?.[0]).toBe(0.3);
    audio.setScene('marble');
    expect(gains[0].gain.setTargetAtTime.mock.lastCall?.[0]).toBe(0.6);
    audio.playCue('marble', 'dice');
    const beforeRhythm = sources.length;
    audio.setScene('rhythm');
    audio.playCue('rhythm', 'turn');
    audio.playCue('marble', 'buy');
    expect(gains[0].gain.setTargetAtTime.mock.lastCall?.[0]).toBe(0);
    expect(sources).toHaveLength(beforeRhythm);
    audio.dispose();
  });

  it('stops active voices on hidden tabs, resumes silently, then releases the context/listener', async () => {
    const { context, listeners, sources } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('domino', { sfxEnabled: true });
    audio.setScene('domino');
    await audio.unlock();
    audio.playCue('domino', 'place');
    const count = sources.length;
    (document as unknown as { hidden: boolean }).hidden = true;
    listeners.get('visibilitychange')!();
    expect(context.suspend).toHaveBeenCalledOnce();
    expect(sources.some(node => node.stop.mock.calls.length > 0)).toBe(true);
    (document as unknown as { hidden: boolean }).hidden = false;
    listeners.get('visibilitychange')!();
    await Promise.resolve();
    expect(context.resume).toHaveBeenCalledTimes(2);
    expect(sources).toHaveLength(count);
    audio.dispose();
    expect(context.close).toHaveBeenCalledOnce();
    expect(listeners.has('visibilitychange')).toBe(false);
  });

  it('caps overlapping notes and uses reusable texture bursts for game-specific actions', async () => {
    const { context, oscillators, sources } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('catchmind', { sfxEnabled: true });
    await audio.unlock();
    audio.setScene('catchmind');
    for (let i = 0; i < 8; i++) audio.playCue('catchmind', 'correct');
    expect(sources.length).toBeLessThanOrEqual(8);
    audio.setScene('minhwatu');
    audio.setPreferences('minhwatu', { sfxEnabled: true });
    audio.playCue('minhwatu', 'draw');
    audio.setScene('marble');
    audio.setPreferences('marble', { sfxEnabled: true });
    audio.playCue('marble', 'dice');
    expect(context.createBuffer).toHaveBeenCalledOnce();
    expect(context.createBufferSource).toHaveBeenCalled();
    expect(context.createBiquadFilter).toHaveBeenCalled();
    expect(oscillators.length).toBeGreaterThan(0);
    audio.dispose();
  });

  it('distinguishes Jaipur card/sale and Splendor gem/purchase/reserve cues', async () => {
    const { context, oscillators } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('jaipur', { sfxEnabled: true });
    audio.setPreferences('splendor', { sfxEnabled: true });
    await audio.unlock();
    audio.setScene('jaipur');
    audio.playCue('jaipur', 'place');
    expect(context.createBufferSource).toHaveBeenCalledTimes(2);
    expect(oscillators).toHaveLength(1);
    audio.playCue('jaipur', 'exchange');
    expect(context.createBufferSource).toHaveBeenCalledTimes(4);
    expect(oscillators).toHaveLength(2);
    audio.setScene(null); audio.setScene('jaipur');
    audio.playCue('jaipur', 'camel');
    expect(context.createBufferSource).toHaveBeenCalledTimes(5);
    expect(oscillators).toHaveLength(3);
    audio.setScene(null); audio.setScene('jaipur');
    audio.playCue('jaipur', 'sell');
    expect(oscillators).toHaveLength(6);
    const saleNotes = oscillators.slice(3).map(oscillator => oscillator.frequency.setValueAtTime.mock.calls[0][0]);
    audio.setScene(null); audio.setScene('jaipur');
    audio.playCue('jaipur', 'coin');
    expect(oscillators).toHaveLength(8);
    audio.setScene(null); audio.setScene('jaipur');
    audio.playCue('jaipur', 'bonus');
    expect(oscillators).toHaveLength(11);
    audio.setScene('splendor');
    audio.playCue('splendor', 'select');
    expect(oscillators).toHaveLength(13);
    const gemNotes = oscillators.slice(11).map(oscillator => oscillator.frequency.setValueAtTime.mock.calls[0][0]);
    audio.playCue('splendor', 'buy');
    expect(oscillators).toHaveLength(16);
    const purchaseNotes = oscillators.slice(13).map(oscillator => oscillator.frequency.setValueAtTime.mock.calls[0][0]);
    audio.setScene(null);
    audio.setScene('splendor');
    audio.playCue('splendor', 'place');
    expect(context.createBuffer).toHaveBeenCalledOnce();
    expect(context.createBufferSource).toHaveBeenCalledTimes(6);
    expect(oscillators).toHaveLength(17);
    expect(new Set(saleNotes).size).toBe(3);
    expect(new Set(gemNotes).size).toBe(2);
    expect(new Set(purchaseNotes).size).toBe(3);
    audio.dispose();
  });

  it('gives Splendor noble awards, turns, and wins distinct restrained cues', async () => {
    const { oscillators } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('splendor', { sfxEnabled: true });
    await audio.unlock();
    audio.setScene('splendor');
    audio.playCue('splendor', 'noble');
    expect(oscillators).toHaveLength(3);
    const nobleNotes = oscillators.map(oscillator => oscillator.frequency.setValueAtTime.mock.calls[0][0]);
    audio.setScene(null); audio.setScene('splendor');
    audio.playCue('splendor', 'turn');
    expect(oscillators).toHaveLength(5);
    const turnNotes = oscillators.slice(3).map(oscillator => oscillator.frequency.setValueAtTime.mock.calls[0][0]);
    audio.setScene(null); audio.setScene('splendor');
    audio.playCue('splendor', 'win');
    expect(oscillators).toHaveLength(9);
    expect(new Set(nobleNotes).size).toBe(3);
    expect(new Set(turnNotes).size).toBe(2);
    audio.dispose();
  });

  it('gives Da Vinci separate tile, selection, guess, outcome, turn, and win cues', async () => {
    const { context, oscillators, sources } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('davinci', { sfxEnabled: true });
    await audio.unlock();
    audio.setScene('davinci');
    audio.playCue('davinci', 'place');
    expect(context.createBufferSource).toHaveBeenCalledTimes(1);
    expect(oscillators).toHaveLength(1);
    audio.setScene(null); audio.setScene('davinci');
    audio.playCue('davinci', 'select');
    expect(oscillators).toHaveLength(2);
    audio.setScene(null); audio.setScene('davinci');
    audio.playCue('davinci', 'guess');
    expect(oscillators).toHaveLength(4);
    audio.setScene(null); audio.setScene('davinci');
    audio.playCue('davinci', 'correct');
    expect(oscillators).toHaveLength(6);
    audio.setScene(null); audio.setScene('davinci');
    audio.playCue('davinci', 'error');
    expect(oscillators).toHaveLength(8);
    audio.setScene(null); audio.setScene('davinci');
    audio.playCue('davinci', 'turn');
    expect(oscillators).toHaveLength(10);
    audio.setScene(null); audio.setScene('davinci');
    audio.playCue('davinci', 'win');
    expect(oscillators).toHaveLength(14);
    expect(sources).toHaveLength(15);
    audio.dispose();
  });

  it('uses distinct Marble material cues for movement, building, tolls, loans, and crises', async () => {
    const { context, oscillators, sources } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('marble', { sfxEnabled: true });
    audio.setScene('marble');
    await audio.unlock();
    audio.playCue('marble', 'move');
    expect(context.createBufferSource).toHaveBeenCalledTimes(2);
    expect(oscillators).toHaveLength(1);
    audio.setScene(null); audio.setScene('marble');
    audio.playCue('marble', 'build');
    expect(oscillators).toHaveLength(3);
    audio.setScene(null); audio.setScene('marble');
    audio.playCue('marble', 'toll');
    expect(oscillators).toHaveLength(4);
    audio.setScene(null); audio.setScene('marble');
    audio.playCue('marble', 'loan');
    expect(oscillators).toHaveLength(6);
    audio.setScene(null); audio.setScene('marble');
    audio.playCue('marble', 'crisis');
    expect(oscillators).toHaveLength(8);
    expect(sources.length).toBeGreaterThan(6);
    audio.dispose();
  });

  it('gives Domino selection, pass, tranque, capicúa, paso, turn, and score distinct effects', async () => {
    const { context, oscillators, sources } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('domino', { sfxEnabled: true });
    audio.setScene('domino');
    await audio.unlock();
    audio.playCue('domino', 'select');
    expect(oscillators).toHaveLength(1);
    audio.setScene(null); audio.setScene('domino');
    audio.playCue('domino', 'place');
    expect(context.createBufferSource).toHaveBeenCalledTimes(1);
    audio.setScene(null); audio.setScene('domino');
    audio.playCue('domino', 'pass');
    expect(oscillators).toHaveLength(3);
    audio.setScene(null); audio.setScene('domino');
    audio.playCue('domino', 'tranque');
    expect(oscillators).toHaveLength(5);
    audio.setScene(null); audio.setScene('domino');
    audio.playCue('domino', 'capicua');
    expect(oscillators).toHaveLength(8);
    audio.setScene(null); audio.setScene('domino');
    audio.playCue('domino', 'paso');
    expect(oscillators).toHaveLength(11);
    audio.setScene(null); audio.setScene('domino');
    audio.playCue('domino', 'turn');
    expect(oscillators).toHaveLength(13);
    audio.setScene(null); audio.setScene('domino');
    audio.playCue('domino', 'score');
    expect(oscillators).toHaveLength(15);
    expect(sources.length).toBeGreaterThanOrEqual(4);
    audio.dispose();
  });

  it('gives Minhwatu physical card, draw-flip, capture, earned-special, turn, and result cues', async () => {
    const { context, oscillators } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('minhwatu', { sfxEnabled: true });
    audio.setScene('minhwatu');
    await audio.unlock();
    audio.playCue('minhwatu', 'place');
    expect(context.createBufferSource).toHaveBeenCalledTimes(1);
    expect(oscillators).toHaveLength(1);
    audio.setScene(null); audio.setScene('minhwatu');
    audio.playCue('minhwatu', 'draw');
    expect(context.createBufferSource).toHaveBeenCalledTimes(3);
    expect(oscillators).toHaveLength(2);
    audio.setScene(null); audio.setScene('minhwatu');
    audio.playCue('minhwatu', 'capture');
    expect(context.createBufferSource).toHaveBeenCalledTimes(5);
    expect(oscillators).toHaveLength(3);
    audio.setScene(null); audio.setScene('minhwatu');
    audio.playCue('minhwatu', 'special');
    expect(oscillators).toHaveLength(6);
    const special = oscillators.slice(3).map(node => node.frequency.setValueAtTime.mock.calls[0][0]);
    audio.setScene(null); audio.setScene('minhwatu');
    audio.playCue('minhwatu', 'turn');
    expect(oscillators).toHaveLength(8);
    audio.setScene(null); audio.setScene('minhwatu');
    audio.playCue('minhwatu', 'win');
    expect(oscillators).toHaveLength(12);
    expect(new Set(special).size).toBe(3);
    audio.setScene(null); audio.setScene('minhwatu');
    audio.playCue('minhwatu', 'lose');
    expect(context.createBufferSource).toHaveBeenCalledTimes(7);
    audio.dispose();
  });

  it('lands Minhwatu placement and capture impacts at the 255ms flight arrival', async () => {
    const { sources } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('minhwatu', { sfxEnabled: true });
    audio.setScene('minhwatu');
    await audio.unlock();
    audio.playCue('minhwatu', 'place');
    expect(sources[0].start).toHaveBeenCalledWith(0.255);
    audio.playCue('minhwatu', 'capture');
    expect(sources[2].start).toHaveBeenCalledWith(0.255);
    expect(sources[3].start).toHaveBeenCalledWith(0.31);
    audio.dispose();
  });

  it('plays a compact shuffle only for a confirmed Minhwatu deal cue', async () => {
    const { context, oscillators } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('minhwatu', { sfxEnabled: true });
    audio.setScene('minhwatu');
    await audio.unlock();
    audio.playCue('minhwatu', 'deal');
    expect(context.createBufferSource).toHaveBeenCalledTimes(3);
    expect(oscillators).toHaveLength(2);
    audio.dispose();
  });

  it('leaves Catchmind drawing silent while keeping correct-answer feedback', async () => {
    const { oscillators, sources } = installAudioMocks();
    const audio = await import('./audio');
    audio.setPreferences('catchmind', { sfxEnabled: true });
    await audio.unlock();
    audio.setScene('catchmind');
    audio.playCue('catchmind', 'draw');
    expect(sources).toHaveLength(0);
    audio.playCue('catchmind', 'correct');
    expect(oscillators.length).toBeGreaterThan(0);
    audio.dispose();
  });
});
