import type { GameId } from '../core/types';

export type AudioCue = 'select' | 'place' | 'draw' | 'sell' | 'buy' | 'build' | 'move' | 'toll' | 'loan' | 'crisis' | 'warning' | 'pass' | 'tranque' | 'capicua' | 'score' | 'paso' | 'reveal' | 'noble' | 'guess' | 'correct' | 'error' | 'turn' | 'win' | 'lose' | 'dice' | 'event' | 'exchange' | 'camel' | 'coin' | 'bonus' | 'capture' | 'special' | 'deal';
export type AudioPreferences = { sfxEnabled: boolean; sfxVolume: number };

const STORAGE_KEY = 'dos-sfx-v1';
const games: GameId[] = ['davinci', 'catchmind', 'domino', 'jaipur', 'splendor', 'minhwatu', 'marble'];
const defaultVolumes: Record<GameId, number> = { davinci: 0.4, catchmind: 0.35, domino: 0.42, jaipur: 0.42, splendor: 0.38, minhwatu: 0.36, marble: 0.42, rhythm: 0 };
const profiles: Partial<Record<GameId, { wave: OscillatorType; root: number }>> = {
  davinci: { wave: 'triangle', root: 246.94 },
  catchmind: { wave: 'sine', root: 392 },
  domino: { wave: 'triangle', root: 196 },
  jaipur: { wave: 'sine', root: 293.66 },
  splendor: { wave: 'sine', root: 261.63 },
  minhwatu: { wave: 'triangle', root: 329.63 },
  marble: { wave: 'sine', root: 220 },
};
const cueSteps: Record<AudioCue, number[]> = {
  select: [12], place: [0], draw: [7], sell: [7, 12], buy: [0, 7], build: [-7, 0], move: [-12, -7], toll: [-12, -5], loan: [-5, 2], crisis: [-12, -8], warning: [-12], pass: [-7, -10], tranque: [-12, -9], capicua: [12, 16, 19], score: [0, 7], paso: [0, 4, 7], reveal: [7, 12], noble: [0, 7, 12], guess: [0, -1], correct: [0, 4, 7], error: [0, -2], turn: [7], win: [0, 4, 7, 12], lose: [7, 3, 0], dice: [12, 7, 4], event: [0, 7, 12], exchange: [7, 12], camel: [-5, 0], coin: [19, 24], bonus: [12, 19, 24], capture: [0, 7], special: [7, 12, 19], deal: [0, 7, 12],
};

let preferences = readPreferences();
let activeScene: GameId | null = null;
let audioContext: AudioContext | undefined;
let sfxGain: GainNode | undefined;
let textureBuffer: AudioBuffer | undefined;
let gestureUnlocked = false;
const voices = new Set<AudioScheduledSourceNode>();
let visibilityListener: (() => void) | undefined;

function readPreferences(): Partial<Record<GameId, AudioPreferences>> {
  try {
    const value: unknown = JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) ?? 'null');
    if (!value || typeof value !== 'object') return {};
    const stored = value as Partial<Record<GameId, Partial<AudioPreferences>>>;
    return Object.fromEntries(games.flatMap(game => {
      const candidate = stored[game];
      if (!candidate || typeof candidate !== 'object') return [];
      return [[game, {
        sfxEnabled: typeof candidate.sfxEnabled === 'boolean' ? candidate.sfxEnabled : false,
        sfxVolume: volume(candidate.sfxVolume, defaultVolumes[game]),
      }]];
    }));
  } catch { return {}; }
}

function volume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
}

function ensureGraph(): AudioContext | undefined {
  if (audioContext) return audioContext;
  if (typeof window === 'undefined') return undefined;
  const Constructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Constructor) return undefined;
  try {
    audioContext = new Constructor();
    sfxGain = audioContext.createGain();
    textureBuffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * 0.18), audioContext.sampleRate);
    const texture = textureBuffer.getChannelData(0);
    for (let i = 0; i < texture.length; i++) texture[i] = Math.random() * 2 - 1;
    sfxGain.connect(audioContext.destination);
    applyGain();
    visibilityListener = () => {
      if (!audioContext) return;
      if (document.hidden) {
        stopVoices();
        void audioContext.suspend().catch(() => {});
      } else if (gestureUnlocked) {
        void audioContext.resume().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', visibilityListener);
    return audioContext;
  } catch {
    if (audioContext) void audioContext.close().catch(() => {});
    audioContext = undefined;
    sfxGain = undefined;
    return undefined;
  }
}

function applyGain() {
  if (!audioContext) return;
  const current = activeScene ? getPreferences(activeScene) : null;
  sfxGain?.gain.setTargetAtTime(current?.sfxEnabled ? current.sfxVolume : 0, audioContext.currentTime, 0.015);
}

function stopVoices() {
  for (const voice of voices) {
    try { voice.stop(); } catch { /* already stopped */ }
  }
  voices.clear();
}

function playTone(destination: GainNode | undefined, gameId: GameId, semitone: number, duration: number, level: number, delay = 0) {
  const context = audioContext;
  const profile = profiles[gameId];
  if (!context || !destination || !profile || context.state !== 'running' || document.hidden || voices.size >= 8) return;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const start = context.currentTime + delay;
  const end = start + duration;
  oscillator.type = profile.wave;
  oscillator.frequency.setValueAtTime(profile.root * 2 ** (semitone / 12), start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.linearRampToValueAtTime(level, start + Math.min(0.035, duration / 4));
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(envelope);
  envelope.connect(destination);
  voices.add(oscillator);
  oscillator.onended = () => {
    voices.delete(oscillator);
    oscillator.disconnect();
    envelope.disconnect();
  };
  oscillator.start(start);
  oscillator.stop(end + 0.01);
}

function playTexture(duration: number, level: number, cutoff: number, delay = 0) {
  const context = audioContext;
  if (!context || !sfxGain || !textureBuffer || context.state !== 'running' || document.hidden || voices.size >= 8) return;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  const start = context.currentTime + delay;
  const end = start + duration;
  source.buffer = textureBuffer;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.linearRampToValueAtTime(level, start + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(sfxGain);
  voices.add(source);
  source.onended = () => {
    voices.delete(source);
    source.disconnect();
    filter.disconnect();
    envelope.disconnect();
  };
  source.start(start);
  source.stop(end + 0.01);
}

export function getPreferences(gameId: GameId): AudioPreferences {
  if (gameId === 'rhythm') return { sfxEnabled: false, sfxVolume: 0 };
  return { sfxEnabled: preferences[gameId]?.sfxEnabled ?? false, sfxVolume: volume(preferences[gameId]?.sfxVolume, defaultVolumes[gameId]) };
}

export function setPreferences(gameId: GameId, partial: Partial<AudioPreferences>): AudioPreferences {
  if (gameId === 'rhythm') return getPreferences(gameId);
  const current = getPreferences(gameId);
  preferences[gameId] = {
    sfxEnabled: typeof partial.sfxEnabled === 'boolean' ? partial.sfxEnabled : current.sfxEnabled,
    sfxVolume: partial.sfxVolume === undefined ? current.sfxVolume : volume(partial.sfxVolume, current.sfxVolume),
  };
  try { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch { /* sound still works for this session */ }
  if (activeScene === gameId) applyGain();
  return getPreferences(gameId);
}

export async function unlock(): Promise<void> {
  const context = ensureGraph();
  if (!context) return;
  try {
    await context.resume();
    gestureUnlocked = context.state === 'running';
    if (gestureUnlocked) applyGain();
  } catch { gestureUnlocked = false; }
}

export function setScene(gameId: GameId | null): void {
  if (activeScene === gameId) return;
  activeScene = gameId;
  stopVoices();
  applyGain();
}

export function playCue(gameId: GameId, cue: AudioCue): void {
  if (!gestureUnlocked || activeScene !== gameId || gameId === 'rhythm' || !getPreferences(gameId).sfxEnabled || !audioContext || audioContext.state !== 'running') return;
  const steps = cueSteps[cue];
  if (!steps) return;
  if (gameId === 'jaipur' && cue === 'place') {
    playTexture(0.05, 0.1, 2300);
    playTexture(0.045, 0.075, 1600, 0.045);
    playTone(sfxGain, gameId, 4, 0.09, 0.06, 0.018);
    return;
  }
  if (gameId === 'jaipur' && cue === 'select') {
    playTone(sfxGain, gameId, 19, 0.06, 0.055);
    return;
  }
  if (gameId === 'jaipur' && cue === 'exchange') {
    playTexture(0.035, 0.08, 1900);
    playTexture(0.03, 0.075, 2400, 0.07);
    playTone(sfxGain, gameId, 7, 0.11, 0.065, 0.045);
    return;
  }
  if (gameId === 'jaipur' && cue === 'camel') {
    playTexture(0.065, 0.11, 760);
    playTone(sfxGain, gameId, -5, 0.16, 0.07, 0.03);
    return;
  }
  if (gameId === 'jaipur' && cue === 'draw') {
    playTexture(0.04, 0.07, 1750);
    playTone(sfxGain, gameId, 2, 0.07, 0.05, 0.03);
    return;
  }
  if (gameId === 'jaipur' && cue === 'sell') {
    [14, 19, 24].forEach((step, index) => playTone(sfxGain, gameId, step, 0.13, 0.14, index * 0.055));
    return;
  }
  if (gameId === 'jaipur' && cue === 'coin') {
    [19, 26].forEach((step, index) => playTone(sfxGain, gameId, step, 0.105, 0.08, index * 0.045));
    return;
  }
  if (gameId === 'jaipur' && cue === 'bonus') {
    [7, 14, 19].forEach((step, index) => playTone(sfxGain, gameId, step, 0.17, 0.09, index * 0.05));
    return;
  }
  if (gameId === 'splendor' && cue === 'select') {
    [19, 24].forEach((step, index) => playTone(sfxGain, gameId, step, 0.105, 0.14, index * 0.028));
    return;
  }
  if (gameId === 'splendor' && cue === 'buy') {
    [7, 12, 19].forEach((step, index) => playTone(sfxGain, gameId, step, 0.17, 0.13, index * 0.06));
    return;
  }
  if (gameId === 'splendor' && cue === 'place') {
    playTexture(0.055, 0.085, 1800);
    playTone(sfxGain, gameId, -7, 0.12, 0.1, 0.025);
    return;
  }
  if (gameId === 'splendor' && cue === 'noble') {
    [0, 7, 12].forEach((step, index) => playTone(sfxGain, gameId, step, 0.22, 0.12, index * 0.045));
    return;
  }
  if (gameId === 'splendor' && cue === 'turn') {
    [12, 19].forEach((step, index) => playTone(sfxGain, gameId, step, 0.11, 0.075, index * 0.045));
    return;
  }
  if (gameId === 'splendor' && cue === 'win') {
    [0, 4, 7, 12].forEach((step, index) => playTone(sfxGain, gameId, step, 0.24, 0.14, index * 0.065));
    return;
  }
  if (gameId === 'davinci') {
    if (cue === 'draw' || cue === 'place') {
      playTexture(0.045, 0.09, 1700);
      playTone(sfxGain, gameId, 5, 0.095, 0.08, 0.018);
      return;
    }
    if (cue === 'select') {
      playTone(sfxGain, gameId, 19, 0.075, 0.075);
      return;
    }
    if (cue === 'guess') {
      playTone(sfxGain, gameId, -5, 0.16, 0.075);
      playTone(sfxGain, gameId, -7, 0.19, 0.06, 0.075);
      return;
    }
    if (cue === 'correct') {
      [12, 19].forEach((step, index) => playTone(sfxGain, gameId, step, 0.2, 0.12, index * 0.07));
      return;
    }
    if (cue === 'error') {
      [0, -4].forEach((step, index) => playTone(sfxGain, gameId, step, 0.2, 0.1, index * 0.075));
      return;
    }
    if (cue === 'turn') {
      [7, 12].forEach((step, index) => playTone(sfxGain, gameId, step, 0.12, 0.075, index * 0.05));
      return;
    }
    if (cue === 'win') {
      [0, 4, 7, 12].forEach((step, index) => playTone(sfxGain, gameId, step, 0.25, 0.14, index * 0.065));
      return;
    }
  }
  if (gameId === 'domino' && cue === 'place') {
    playTexture(0.055, 0.18, 900);
    playTone(sfxGain, gameId, -7, 0.105, 0.13);
    return;
  }
  if (gameId === 'domino' && cue === 'select') {
    playTone(sfxGain, gameId, 14, 0.065, 0.07);
    return;
  }
  if (gameId === 'domino' && cue === 'pass') {
    playTexture(0.035, 0.07, 1050);
    playTone(sfxGain, gameId, -7, 0.12, 0.08, 0.015);
    return;
  }
  if (gameId === 'domino' && cue === 'turn') {
    [5, 12].forEach((step, index) => playTone(sfxGain, gameId, step, 0.09, 0.075, index * 0.055));
    return;
  }
  if (gameId === 'domino' && cue === 'tranque') {
    playTexture(0.09, 0.15, 430);
    [-12, -9].forEach((step, index) => playTone(sfxGain, gameId, step, 0.19, 0.11, 0.075 + index * 0.06));
    return;
  }
  if (gameId === 'domino' && cue === 'capicua') {
    [12, 16, 19].forEach((step, index) => playTone(sfxGain, gameId, step, 0.14, 0.12, index * 0.055));
    return;
  }
  if (gameId === 'domino' && cue === 'paso') {
    playTexture(0.045, 0.07, 1450);
    [0, 4, 7].forEach((step, index) => playTone(sfxGain, gameId, step, 0.12, 0.1, index * 0.05));
    return;
  }
  if (gameId === 'domino' && cue === 'score') {
    [0, 7].forEach((step, index) => playTone(sfxGain, gameId, step, 0.16, 0.09, index * 0.065));
    return;
  }
  if (gameId === 'minhwatu' && cue === 'place') {
    playTexture(0.047, 0.18, 1050, 0.255);
    playTone(sfxGain, gameId, -12, 0.075, 0.13, 0.267);
    return;
  }
  if (gameId === 'minhwatu' && cue === 'deal') {
    playTexture(0.065, 0.07, 2800);
    playTexture(0.075, 0.075, 1900, 0.07);
    playTexture(0.085, 0.08, 1250, 0.15);
    [7, 12].forEach((step, index) => playTone(sfxGain, gameId, step, 0.12, 0.055, 0.11 + index * 0.07));
    return;
  }
  if (gameId === 'minhwatu' && cue === 'draw') {
    playTexture(0.035, 0.07, 2600);
    playTexture(0.06, 0.1, 1850, 0.045);
    playTone(sfxGain, gameId, 7, 0.12, 0.075, 0.08);
    return;
  }
  if (gameId === 'minhwatu' && cue === 'capture') {
    playTexture(0.052, 0.11, 1750, 0.255);
    playTexture(0.045, 0.08, 1150, 0.31);
    playTone(sfxGain, gameId, 4, 0.1, 0.075, 0.28);
    return;
  }
  if (gameId === 'minhwatu' && cue === 'special') {
    [7, 12, 19].forEach((step, index) => playTone(sfxGain, gameId, step, 0.18, 0.09, index * 0.052));
    playTexture(0.05, 0.045, 3400, 0.04);
    return;
  }
  if (gameId === 'minhwatu' && cue === 'turn') {
    playTone(sfxGain, gameId, 12, 0.085, 0.075);
    playTone(sfxGain, gameId, 19, 0.1, 0.065, 0.065);
    return;
  }
  if (gameId === 'minhwatu' && cue === 'win') {
    [0, 7, 12, 19].forEach((step, index) => playTone(sfxGain, gameId, step, 0.21, 0.105, index * 0.06));
    return;
  }
  if (gameId === 'minhwatu' && cue === 'lose') {
    playTexture(0.11, 0.075, 560);
    [0, -5].forEach((step, index) => playTone(sfxGain, gameId, step, 0.18, 0.07, index * 0.09));
    return;
  }
  if (gameId === 'marble' && cue === 'dice') {
    playTexture(0.06, 0.12, 2600);
    playTexture(0.055, 0.11, 1900, 0.07);
    playTexture(0.075, 0.13, 1250, 0.14);
    return;
  }
  if (gameId === 'marble' && cue === 'event') {
    playTexture(0.075, 0.12, 780);
    playTone(sfxGain, gameId, -5, 0.15, 0.13, 0.035);
    return;
  }
  if (gameId === 'marble' && cue === 'move') {
    playTexture(0.075, 0.13, 980);
    playTexture(0.045, 0.08, 1450, 0.075);
    playTone(sfxGain, gameId, -12, 0.14, 0.09, 0.045);
    return;
  }
  if (gameId === 'marble' && cue === 'buy') {
    playTexture(0.045, 0.07, 1800);
    [0, 7].forEach((step, index) => playTone(sfxGain, gameId, step, 0.16, 0.12, index * 0.075));
    return;
  }
  if (gameId === 'marble' && cue === 'build') {
    playTexture(0.065, 0.15, 720);
    playTone(sfxGain, gameId, -7, 0.11, 0.1, 0.035);
    playTone(sfxGain, gameId, 0, 0.15, 0.1, 0.12);
    return;
  }
  if (gameId === 'marble' && cue === 'toll') {
    playTexture(0.055, 0.1, 1150);
    playTone(sfxGain, gameId, -12, 0.19, 0.12, 0.025);
    return;
  }
  if (gameId === 'marble' && cue === 'loan') {
    playTexture(0.05, 0.075, 620);
    [2, 7].forEach((step, index) => playTone(sfxGain, gameId, step, 0.16, 0.1, index * 0.085));
    return;
  }
  if (gameId === 'marble' && (cue === 'crisis' || cue === 'warning')) {
    playTexture(0.11, 0.14, cue === 'warning' ? 520 : 360);
    playTone(sfxGain, gameId, -12, 0.24, 0.11, 0.025);
    if (cue === 'crisis') playTone(sfxGain, gameId, -8, 0.2, 0.09, 0.14);
    return;
  }
  if (gameId === 'catchmind' && cue === 'draw') return;
  const base = cue === 'select' || cue === 'place' || cue === 'draw' || cue === 'turn' ? 0.14 : 0.18;
  steps.forEach((step, index) => playTone(sfxGain, gameId, step, cue === 'place' || cue === 'draw' ? 0.09 : 0.19, base, index * 0.085));
}

export function dispose(): void {
  stopVoices();
  if (visibilityListener && typeof document !== 'undefined') document.removeEventListener('visibilitychange', visibilityListener);
  visibilityListener = undefined;
  const context = audioContext;
  audioContext = undefined;
  sfxGain = undefined;
  textureBuffer = undefined;
  activeScene = null;
  gestureUnlocked = false;
  if (context) void context.close().catch(() => {});
}
