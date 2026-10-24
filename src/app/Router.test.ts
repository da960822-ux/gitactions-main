import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentPath, roomHref } from './Router';

afterEach(() => vi.unstubAllGlobals());

describe('static-host room invitations', () => {
  it('opens a room through the existing play entry and preserves encoded room IDs', () => {
    const href = roomHref('room with/+symbols');
    const location = new URL(href, 'https://games.example');
    vi.stubGlobal('window', { location });
    expect(location.pathname).toBe('/play');
    expect(currentPath()).toBe('/room/room%20with%2F%2Bsymbols');
  });

  it('keeps game selection in the lobby and preserves legacy routes', () => {
    for (const [href, path] of [['/play?game=domino', '/play'], ['/play?room=', '/play'], ['/room/old-room', '/room/old-room'], ['/?room=ignored', '/']]) {
      vi.stubGlobal('window', { location: new URL(href, 'https://games.example') });
      expect(currentPath()).toBe(path);
    }
  });

});
