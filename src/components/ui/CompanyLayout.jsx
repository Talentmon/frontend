import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import { APP_SCROLL_ID } from './appScroll';

/**
 * Shell of every company page: the header stays mounted while you move between
 * pages, and only the area under it scrolls, so its scrollbar starts under the
 * header. The window itself never scrolls here.
 */
const CompanyLayout = () => {
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
    <div className="h-dvh flex flex-col overflow-hidden">
      <Header />
      <div
        id={APP_SCROLL_ID}
        ref={scrollRef}
        tabIndex={-1}
        className="flex-1 min-h-0 overflow-y-auto outline-none"
      >
        <Outlet />
      </div>
    </div>
  );
};

export default CompanyLayout;
