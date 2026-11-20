import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { APP_SCROLL_ID, getAppScroller } from './appScroll';
import '../../styles/publicScroll.scss';

/** Class for the root of a public page that puts everything under its nav in <PublicScroll>. */
export const PUBLIC_SHELL = 'public-shell';

/**
 * Public pages (landings, About, legal): wraps everything under the page's nav.
 * On a computer only this area scrolls, and its scrollbar starts under the nav,
 * as in the app. In Chrome, Edge and Safari the area runs under the see-through
 * nav, so the page still slides beneath it. Touch screens keep the window
 * scroll: their scrollbar floats over the page anyway, and a scroll area would
 * keep the browser's address bar from tucking away.
 */
const PublicScroll = ({ children }) => {
  const ref = useRef(null);

  // The nav's height (--public-nav-h): the room left above the page, and where
  // the scrollbar's track starts (styles/publicScroll.scss).
  useLayoutEffect(() => {
    const el = ref.current;
    const nav = el?.previousElementSibling;
    if (!el || !nav) return undefined;
    const update = () => el.style.setProperty('--public-nav-h', `${nav.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  // Page Down, Space and the arrow keys scroll the focused element's scroll
  // area, so on a computer this area takes focus when the page opens, and
  // again after a nav link that moves within the page (#pricing, the logo),
  // which would otherwise keep the focus up in the nav.
  useEffect(() => {
    const el = ref.current;
    if (!el || getAppScroller() !== el) return undefined;
    if (!el.contains(document.activeElement)) el.focus({ preventScroll: true });
    const nav = el.previousElementSibling;
    const onNavClick = (e) => {
      if (e.target.closest?.('a[href^="#"]')) requestAnimationFrame(() => el.focus({ preventScroll: true }));
    };
    nav?.addEventListener('click', onNavClick);
    return () => nav?.removeEventListener('click', onNavClick);
  }, []);

  return (
    <div id={APP_SCROLL_ID} ref={ref} tabIndex={-1} className="public-scroll">
      {children}
    </div>
  );
};

export default PublicScroll;
