import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import Icon from 'components/AppIcon';
import '../../styles/publicNavMenu.scss';

const isPageLink = (href) => href.startsWith('/') && !href.includes('#');

/**
 * The public pages' menu for phones and tablets: a hamburger that turns into an X,
 * and a panel that drops down under the nav. It sits inside the page's <nav>,
 * which is sticky, so the panel hangs from the bar's bottom edge. The page decides
 * from which width the button shows (.pnm-toggle is hidden by default).
 *
 * `groups` is a list of link lists, drawn with a line between them:
 * [[{ label, href, icon }], ...]. Links to other pages go through the router,
 * "#section" links scroll this page. The menu closes on a link, a tap outside,
 * Esc, a page change, and when the button hides again on a wider screen.
 */
const PublicNavMenu = ({ groups }) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const panelId = useId();
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onResize = () => {
      if (buttonRef.current && getComputedStyle(buttonRef.current).display === 'none') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`pnm-toggle${open ? ' open' : ''}`}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>

      <div id={panelId} className={`pnm-panel${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="pnm-inner">
          {groups.map((group, index) => (
            <ul key={index} className="pnm-group">
              {group.map((item) => {
                const content = (
                  <>
                    <span className="pnm-icon"><Icon name={item.icon} size={17} /></span>
                    <span>{item.label}</span>
                  </>
                );
                return (
                  <li key={item.href}>
                    {isPageLink(item.href) ? (
                      <Link
                        to={item.href}
                        className="pnm-link"
                        aria-current={pathname === item.href ? 'page' : undefined}
                        tabIndex={open ? undefined : -1}
                        onClick={close}
                      >
                        {content}
                      </Link>
                    ) : (
                      <a href={item.href} className="pnm-link" tabIndex={open ? undefined : -1} onClick={close}>
                        {content}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>

      {/* Dims the page under the bar; a tap on it closes the menu. In <body>, because
          the nav's backdrop blur would otherwise pin a fixed layer to the nav itself. */}
      {open && createPortal(<div className="pnm-scrim" onClick={close} aria-hidden="true" />, document.body)}
    </>
  );
};

export default PublicNavMenu;
