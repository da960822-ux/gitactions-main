import {afterEach, describe, expect, it, vi} from 'vitest';
import {getJokerPortraits, getPrivateNoblePortrait} from './private-game-art';

afterEach(() => {vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('private artwork integration', () => {
  it('keeps the existing local joker configuration and rejects remote or traversing env paths', () => {
    vi.stubEnv('VITE_DAVINCI_BLACK_JOKER_IMAGE', '/private-assets/davinci/black-joker.webp');
    vi.stubEnv('VITE_DAVINCI_WHITE_JOKER_IMAGE', 'https://example.com/private-photo.png');
    expect(getJokerPortraits().black).toBe('/private-assets/davinci/black-joker.webp');
    expect(getJokerPortraits().white).toBe('/images/davinci/joker-couple-indoor.webp');
    vi.stubEnv('VITE_DAVINCI_BLACK_JOKER_IMAGE', '/private-assets/davinci/../portrait.webp');
    expect(getJokerPortraits().black).toBe('/images/davinci/joker-couple-waterfront.webp');
  });
  it('uses trusted private-host runtime images while keeping the other local skin', () => {
    vi.stubEnv('VITE_DAVINCI_WHITE_JOKER_IMAGE', '/private-assets/davinci/white-joker.png');
    vi.stubGlobal('window', {__DOS_PRIVATE_GAME_ART__: {davinciJokers: {black: 'blob:private-black'},splendorNobles: {n1: 'blob:private-noble'}}});
    expect(getJokerPortraits()).toEqual({black:'blob:private-black',white:'/private-assets/davinci/white-joker.png'});
    expect(getPrivateNoblePortrait('n1')).toBe('blob:private-noble');
  });
  it('uses approved local artwork without a host override', () => {
    vi.stubEnv('VITE_DAVINCI_BLACK_JOKER_IMAGE', '');vi.stubEnv('VITE_DAVINCI_WHITE_JOKER_IMAGE', '');
    expect(getJokerPortraits().black).toBe('/images/davinci/joker-couple-waterfront.webp');expect(getJokerPortraits().white).toBe('/images/davinci/joker-couple-indoor.webp');expect(getPrivateNoblePortrait('n1')).toBeUndefined();
  });
});
