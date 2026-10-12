import approvedArt from '../../public/images/personalization/manifest.json';

/** Approved generated portraits are local assets; host overrides never enter room state. */
export type JokerPortraits = Partial<Record<'black' | 'white', string>>;

declare global {
  interface Window {
    __DOS_PRIVATE_GAME_ART__?: { davinciJokers?: JokerPortraits; splendorNobles?: Record<string, string> };
  }
}

export function getJokerPortraits(): JokerPortraits {
  const portraits = typeof window === 'undefined' ? {} : window.__DOS_PRIVATE_GAME_ART__?.davinciJokers ?? {};
  const local = (value: unknown) => typeof value === 'string' && /^\/private-assets\/davinci\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g)$/.test(value) ? value : undefined;
  return {
    black: portraits.black ?? local(import.meta.env.VITE_DAVINCI_BLACK_JOKER_IMAGE) ?? approvedArt.davinciJokers.black,
    white: portraits.white ?? local(import.meta.env.VITE_DAVINCI_WHITE_JOKER_IMAGE) ?? approvedArt.davinciJokers.white,
  };
}

export function getPrivateNoblePortrait(id: unknown): string | undefined {
  return typeof window === 'undefined' ? undefined : window.__DOS_PRIVATE_GAME_ART__?.splendorNobles?.[String(id)];
}
