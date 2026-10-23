import type { AnchorHTMLAttributes, MouseEvent } from 'react';

export const roomHref = (roomId: string) => `/play?room=${encodeURIComponent(roomId)}`;

export function currentPath() {
  const { pathname, search } = window.location;
  const room = pathname === '/play' ? new URLSearchParams(search).get('room') : null;
  return room ? `/room/${encodeURIComponent(room)}` : pathname;
}

export function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function Link({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !href.startsWith('#')) {
      event.preventDefault(); navigate(href);
    }
  };
  return <a href={href} onClick={handleClick} {...props} />;
}
