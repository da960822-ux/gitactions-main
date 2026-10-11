export const DESKTOP_GAME_QUERY = '(min-width: 1024px) and (pointer: fine)';

export const canEnterPlayRoute = (desktop: boolean, path: string) => desktop || path === '/play' || /^\/room\/[^/]+\/?$/.test(path);
export const canPlayGameOnDisplay = (desktop: boolean, gameId: string | null) => desktop || gameId === 'jaipur';
export const canViewRoomOnDisplay = (desktop: boolean, gameId: string | null) => gameId === null || canPlayGameOnDisplay(desktop, gameId);
