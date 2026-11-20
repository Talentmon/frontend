import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { APP_SCROLL_ID } from './appScroll';

/**
 * Shell of the signed-in pages (company, candidate, admin): the bar passed as
 * `header` stays on top, and only the area under it scrolls, so its scrollbar
 * starts under the bar. The window itself never scrolls here.
 *
 * As a route element it keeps the bar mounted while you move between that
 * section's pages and renders the page in <Outlet />. A page with its own bar
 * (the CV editor's toolbar) can wrap itself instead, passing `children`.
 */
const AppLayout = ({ header, className = '', children }) => {
  const scrollRef = useRef(null);
  const { pathname } = useLocation();

  // Page Down, Space and the arrow keys scroll the focused element's scroll
  // area. With the window no longer scrolling, a fresh page (or a click on a
  // header link) would leave them dead until you click into the page, so the
  // page area takes focus, unless the page already focused something inside.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className={`h-dvh flex flex-col overflow-hidden ${className}`}>
      {header}
      <div
        id={APP_SCROLL_ID}
        ref={scrollRef}
        tabIndex={-1}
        className="flex-1 min-h-0 overflow-y-auto outline-none"
      >
        {children ?? <Outlet />}
      </div>
    </div>
  );
};

export default AppLayout;
