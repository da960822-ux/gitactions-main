/** Optional browser preferences must never prevent the page from rendering. */
export function readBrowserStorage(key: string): { value: string | null; available: boolean } {
  try {
    return { value: globalThis.localStorage.getItem(key), available: true };
  } catch {
    return { value: null, available: false };
  }
}

export function writeBrowserStorage(key: string, value: string): boolean {
  try {
    globalThis.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
