import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentPath, roomHref } from './Router';
import { roomIdentifier } from './PlayApp';

afterEach(() => vi.unstubAllGlobals());

describe('static-host room invitations', () => {
  it('opens a room through the existing play entry and preserves encoded room IDs', () => {
    const href = roomHref('room with/+symbols');
    const location = new URL(href, 'https://games.example');
    vi.stubGlobal('window', { location });
    expect(location.pathname).toBe('/play');
    expect(currentPath()).toBe('/room/room%20with%2F%2Bsymbols');
    expect(roomIdentifier(location.href)).toBe('room with/+symbols');
  });

  it('keeps game selection in the lobby and preserves legacy routes', () => {
    for (const [href, path] of [['/play?game=domino', '/play'], ['/play?room=', '/play'], ['/room/old-room', '/room/old-room'], ['/?room=ignored', '/']]) {
      vi.stubGlobal('window', { location: new URL(href, 'https://games.example') });
      expect(currentPath()).toBe(path);
    }
  });

  it('accepts both invitation formats and plain room codes in the join field', () => {
    vi.stubGlobal('window', { location: new URL('https://games.example') });
    for (const invite of ['https://games.example/play?room=abc-123', '/play?room=abc-123', 'https://games.example/room/abc-123', ' abc-123 ']) {
      expect(roomIdentifier(invite)).toBe('abc-123');
    }
  });
});
