import {afterEach, describe, expect, it, vi} from 'vitest';
import {getPrivateJokerPortraits, getPrivateNoblePortrait} from './private-game-art';

afterEach(() => {vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('private artwork integration', () => {
  it('keeps the existing local joker configuration and rejects remote or traversing env paths', () => {
    vi.stubEnv('VITE_DAVINCI_BLACK_JOKER_IMAGE', '/private-assets/davinci/black-joker.webp');
    vi.stubEnv('VITE_DAVINCI_WHITE_JOKER_IMAGE', 'https://example.com/private-photo.png');
    expect(getPrivateJokerPortraits().black).toBe('/private-assets/davinci/black-joker.webp');
    expect(getPrivateJokerPortraits().white).toBeUndefined();
    vi.stubEnv('VITE_DAVINCI_BLACK_JOKER_IMAGE', '/private-assets/davinci/../portrait.webp');
    expect(getPrivateJokerPortraits().black).toBeUndefined();
  });
  it('uses trusted private-host runtime images while keeping the other local skin', () => {
    vi.stubEnv('VITE_DAVINCI_WHITE_JOKER_IMAGE', '/private-assets/davinci/white-joker.png');
    vi.stubGlobal('window', {__DOS_PRIVATE_GAME_ART__: {davinciJokers: {black: 'blob:private-black'},splendorNobles: {n1: 'blob:private-noble'}}});
    expect(getPrivateJokerPortraits()).toEqual({black:'blob:private-black',white:'/private-assets/davinci/white-joker.png'});
    expect(getPrivateNoblePortrait('n1')).toBe('blob:private-noble');
  });
  it('has no private image source without a host or supplied bytes', () => {
    vi.stubEnv('VITE_DAVINCI_BLACK_JOKER_IMAGE', '');vi.stubEnv('VITE_DAVINCI_WHITE_JOKER_IMAGE', '');
    expect(getPrivateJokerPortraits().black).toBeUndefined();expect(getPrivateJokerPortraits().white).toBeUndefined();expect(getPrivateNoblePortrait('n1')).toBeUndefined();
  });
});
