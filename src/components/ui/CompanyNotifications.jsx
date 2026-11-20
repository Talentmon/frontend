import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import apiClient from '../../lib/apiClient';
import CreditsIcon from './CreditsIcon';
import { HEADER_FOCUS, headerTray } from './headerStyles';

// Icon and tint per notification type.
const TYPE_LOOK = {
  unlock: { icon: 'LockOpen', bg: '#FDF3E1', fg: '#9A6410' },
  'first-credits': { icon: CreditsIcon, bg: '#E7F4EC', fg: '#1C6B45' },
  'low-credits': { icon: 'AlertTriangle', bg: '#FDF0E4', fg: '#B5530F' },
  'out-of-credits': { icon: 'AlertTriangle', bg: '#FDECEC', fg: '#B42318' },
  'bookmark-bonus': { icon: 'Bookmark', bg: '#EAF2FE', fg: '#2C5FA8' },
  team: { icon: 'Users', bg: '#EEF1F5', fg: '#3E4C5E' },
  suggestion: { icon: 'Lightbulb', bg: '#EFEBFE', fg: '#5B3FD1' },
  'suggestion-status': { icon: 'Lightbulb', bg: '#EFEBFE', fg: '#5B3FD1' },
};
const FALLBACK_LOOK = { icon: 'Bell', bg: '#EEF1F5', fg: '#3E4C5E' };

// The link under each notification, named after where it goes.
const ACTION_LABEL = {
  unlock: 'Open in Purchased',
  'bookmark-bonus': 'Open Bookmarked',
  team: 'Open company profile',
  'low-credits': 'Buy credits',
  'out-of-credits': 'Buy credits',
  'first-credits': 'Get credits',
  suggestion: 'View suggestion',
  'suggestion-status': 'View suggestion',
};

// The part of the title shown in bold (the backend titles follow these shapes).
const EMPHASIS = {
  unlock: /^(.*? unlocked )(.+)$/,
  'suggestion-status': /^(Your suggestion is now )(.+)$/,
  suggestion: /^(New suggestion · )(.+)$/,
  team: /^()(.+?)( is now the account owner)$/,
};

const splitTitle = (n) => {
  const m = EMPHASIS[n?.type]?.exec(n?.title || '');
  return m ? { lead: m[1], strong: m[2], tail: m[3] || '' } : { lead: n?.title || '', strong: '', tail: '' };
};

// Unlocks from before they carried a link still open the Purchased page.
const linkOf = (n) => n?.link || (n?.type === 'unlock' ? '/purchased-profiles' : null);

const relativeTime = (iso) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// "This month", then one group per earlier month ("October", "December 2025").
const groupLabel = (iso, now) => {
  const d = new Date(iso);
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) return 'This month';
  const month = d.toLocaleDateString('en-GB', { month: 'long' });
  return d.getFullYear() === now.getFullYear() ? month : `${month} ${d.getFullYear()}`;
};

const groupByMonth = (list) => {
  const now = new Date();
  const groups = [];
  list.forEach((n) => {
    const label = groupLabel(n?.createdAt, now);
    let g = groups[groups.length - 1];
    if (!g || g.label !== label) {
      g = { label, items: [] };
      groups.push(g);
    }
    g.items.push(n);
  });
  return groups;
};

// An unread row keeps room on the right for its dot (pr-9 instead of pr-3.5).
// With nothing unread no row needs it, so the panel opens narrower.
const PANEL_WIDTH = 352;
const PANEL_WIDTH_ALL_READ = 320;
// Side of the rotated square that draws the arrow: its (rounded) tip ends 2px under
// the bell, with the panel 20px under it — 29 / √2 minus the 4px rounding ≈ 19 above
// the panel's top edge.
const ARROW_SIZE = 29;

/**
 * The company's shared notification feed (GET /notifications) — one feed for
 * the whole team. Loading it is also what triggers the bookmark-bonus expiry
 * notices on the backend (BookmarkAllowanceService.reconcile).
 */
const CompanyNotifications = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const [notifs, setNotifs] = useState([]);
  const [place, setPlace] = useState(null);
  const ref = useRef(null);
  const bellRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const unread = notifs?.filter((n) => !n?.read)?.length;
  const shown = tab === 'unread' ? notifs.filter((n) => !n?.read) : notifs;

  const load = useCallback(() => {
    apiClient
      .get('/notifications')
      .then(({ data }) => setNotifs(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onOutside = (e) => {
      if (ref?.current && !ref?.current?.contains(e?.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // Escape closes the panel and puts focus back on the bell.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      bellRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // The panel stays inside the window (the profile button's width depends on
  // the company name) and its arrow points at the bell. Its width is set when
  // it opens, so marking things read doesn't make it jump.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const fullWidth = unread > 0 ? PANEL_WIDTH : PANEL_WIDTH_ALL_READ;
    const measure = () => {
      const box = ref.current?.getBoundingClientRect();
      const bell = bellRef.current?.getBoundingClientRect();
      if (!box || !bell) return;
      const vw = document.documentElement.clientWidth;
      const gutter = vw < 640 ? 12 : 24;
      const width = Math.min(fullWidth, vw - 2 * gutter);
      // Centred under the bell (arrow in the middle), unless that would leave the window.
      const right = Math.min(bell.left + bell.width / 2 + width / 2, vw - gutter);
      const left = Math.max(gutter, right - width);
      // The arrow is placed inside the panel's 1px border.
      setPlace({ left: left - box.left, width, arrow: bell.left + bell.width / 2 - left - ARROW_SIZE / 2 - 1 });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- width is decided once per opening
  }, [open]);

  // The header stays mounted between company pages (AppLayout): each page
  // change closes the list and re-reads the feed, as a fresh page load used to.
  useEffect(() => {
    setOpen(false);
    load();
  }, [location.pathname, load]);

  const toggle = () => {
    if (!open) {
      load();
      setTab('all');
    }
    setOpen((v) => !v);
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    apiClient.patch('/notifications/read-all').catch(load);
  };

  const openNotification = (n) => {
    if (!n.read) {
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      apiClient.patch(`/notifications/${n.id}/read`).catch(load);
    }
    const link = linkOf(n);
    if (link) navigate(link);
  };

  const tabClass = (on) => `flex-1 h-[30px] inline-flex items-center justify-center gap-1.5 rounded-lg text-[13px] leading-[18px] font-semibold transition-colors ${
    on ? 'bg-white text-[#0b1a2c] shadow-[0_1px_2px_rgba(11,26,44,0.14)]' : 'text-[#5B6573] hover:text-[#0b1a2c]'
  } ${HEADER_FOCUS}`;

  return (
    <div className="relative" ref={ref}>
      <button
        ref={bellRef}
        type="button"
        onClick={toggle}
        className={`group relative flex-none inline-flex items-center justify-center w-[46px] h-[46px] rounded-xl border transition-colors ${headerTray(open)} ${
          open ? 'border-[rgba(230,169,60,0.55)]' : 'border-white/[0.06]'
        } ${HEADER_FOCUS}`}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? 'notif-panel' : undefined}
      >
        <Icon name="Bell" size={20} strokeWidth={1.9} />
        {unread > 0 && (
          // The ring matches the tray behind it, also when that lightens on hover or while open.
          <span
            aria-hidden="true"
            className={`absolute top-[5px] right-[5px] min-w-[18px] h-[18px] px-[5px] rounded-full bg-[#E6A93C] text-[#1B2330] text-[10px] leading-[14px] font-extrabold text-center border-2 transition-colors ${
              open ? 'border-[#364152]' : 'border-[#2B3646] group-hover:border-[#364152]'
            }`}
          >
            {unread}
          </span>
        )}
      </button>

      {open && place && (
        <div
          id="notif-panel"
          role="dialog"
          aria-labelledby="notif-title"
          style={{ left: place.left, width: place.width }}
          // drop-shadow (not box-shadow) follows the outline with the arrow, so the
          // panel reads as one bubble; the first one also shades the top edge.
          // It sits 10px below the bar (the arrow's tip on the bar's edge), so that shadow lands on the page.
          className="absolute top-[calc(100%+20px)] z-[1100] bg-white border border-[#E4E7EA] rounded-2xl [filter:drop-shadow(0_-2px_8px_rgba(11,26,44,0.16))_drop-shadow(0_16px_22px_rgba(11,26,44,0.18))] text-[#0b1a2c] animate-slide-up"
        >
          <span
            aria-hidden="true"
            style={{ left: place.arrow, top: -ARROW_SIZE / 2, width: ARROW_SIZE, height: ARROW_SIZE }}
            // Only the upper half (plus ~1px to hide the panel's border under it) is drawn,
            // so the lower half doesn't cover the panel's header.
            className="absolute bg-white border-l border-t border-[#E4E7EA] rounded-tl-[4px] rotate-45 [clip-path:polygon(0_0,100%_0,100%_6%,6%_100%,0_100%)]"
          />

          <div className="flex flex-col gap-3 pt-4 pr-3.5 pb-3 pl-[18px] border-b border-[#EEF0F3]">
            <div className="flex items-center gap-2.5">
              <h2 id="notif-title" className="m-0 text-base leading-[22px] font-bold text-[#0b1a2c]">Notifications</h2>
              {unread > 0 && (
                <span className="h-[22px] inline-flex items-center px-2 rounded-full whitespace-nowrap bg-[#FDF3E1] text-[#9A6410] text-xs leading-4 font-bold">
                  {unread} new
                </span>
              )}
              <span className="flex-1" />
              <button
                type="button"
                onClick={markAllRead}
                disabled={unread === 0}
                className={`h-[30px] inline-flex items-center gap-1.5 px-2 rounded-lg whitespace-nowrap text-[13px] leading-[18px] font-semibold text-[#9A6410] hover:bg-[#FDF3E1] disabled:text-[#A0A8B3] disabled:bg-transparent disabled:cursor-default transition-colors ${HEADER_FOCUS}`}
              >
                {/* On a phone the row has no room for the icon too. */}
                <Icon name="CheckCheck" size={15} strokeWidth={2.2} className="hidden sm:block" />
                Mark all as read
              </button>
            </div>

            <div role="tablist" aria-label="Show" className="flex gap-0.5 p-[3px] bg-[#F1F3F6] rounded-[10px]">
              <button type="button" role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')} className={tabClass(tab === 'all')}>
                All<span className="font-medium text-[#8693a0]">{notifs.length}</span>
              </button>
              <button type="button" role="tab" aria-selected={tab === 'unread'} onClick={() => setTab('unread')} className={tabClass(tab === 'unread')}>
                Unread<span className="font-medium text-[#8693a0]">{unread}</span>
              </button>
            </div>
          </div>

          <div className="max-h-[min(470px,calc(100vh-200px))] overflow-y-auto px-1.5 pt-1.5 pb-2 [scrollbar-width:thin] [scrollbar-color:#CBD2DA_transparent]">
            {shown.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 px-5 pt-9 pb-8 text-center">
                <span aria-hidden="true" className="w-11 h-11 rounded-full bg-[#E7F4EC] text-[#1C6B45] flex items-center justify-center">
                  <Icon name="Check" size={20} strokeWidth={2.6} />
                </span>
                <p className="m-0 text-sm leading-5 font-bold text-[#0b1a2c]">You’re all caught up</p>
                <p className="m-0 text-[13px] leading-[18px] text-[#5B6573]">New notifications will show up here.</p>
              </div>
            ) : (
              groupByMonth(shown).map((g) => (
                <section key={g.label} aria-label={g.label}>
                  <p className="mt-2 mx-3 mb-1 font-mono text-[11px] leading-4 font-semibold tracking-[0.1em] uppercase text-[#6B7482]">
                    {g.label}
                  </p>
                  <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
                    {g.items.map((n) => {
                      const look = TYPE_LOOK[n?.type] || FALLBACK_LOOK;
                      const { lead, strong, tail } = splitTitle(n);
                      const time = relativeTime(n?.createdAt);
                      const action = linkOf(n) ? ACTION_LABEL[n?.type] || 'Open' : null;
                      return (
                        <li key={n?.id}>
                          <button
                            type="button"
                            onClick={() => openNotification(n)}
                            aria-label={`${n?.read ? '' : 'Unread. '}${n?.title}. ${n?.description}, ${time}.${action ? ` ${action}` : ''}`}
                            // Only an unread row keeps room on the right for its dot; a read one lets the text run on.
                            className={`group/row relative w-full flex items-start gap-3 py-3 pl-3.5 rounded-xl text-left transition-colors hover:bg-[#F4F6F8] ${
                              n?.read ? 'pr-3.5 bg-transparent' : 'pr-9 bg-[#FFFBF3]'
                            } focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#E6A93C]`}
                          >
                            <span
                              aria-hidden="true"
                              style={{ background: look.bg, color: look.fg }}
                              className="flex-none w-[38px] h-[38px] rounded-[11px] flex items-center justify-center"
                            >
                              {typeof look.icon === 'string'
                                ? <Icon name={look.icon} size={18} strokeWidth={2} />
                                : React.createElement(look.icon, { size: 18, strokeWidth: 2 })}
                            </span>
                            <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                              <span className={`text-sm leading-[19px] text-[#0b1a2c] break-words ${n?.read ? 'font-medium' : 'font-semibold'}`}>
                                {lead}
                                {strong && <strong className="font-bold">{strong}</strong>}
                                {tail}
                              </span>
                              <span className="text-[12.5px] leading-[17px] text-[#5B6573] break-words">
                                {n?.description}
                                <span aria-hidden="true" className="mx-1.5 text-[#B8C0C9]">·</span>
                                <span className="whitespace-nowrap">{time}</span>
                              </span>
                              {action && (
                                <span className="mt-[3px] inline-flex items-center gap-1 text-[12.5px] leading-[17px] font-semibold text-[#9A6410] group-hover/row:text-[#7A4E0A] group-hover/row:underline underline-offset-2">
                                  {action}
                                  <Icon name="ArrowRight" size={12} strokeWidth={2.4} />
                                </span>
                              )}
                            </span>
                            {!n?.read && (
                              <span
                                aria-hidden="true"
                                className="absolute top-[18px] right-3.5 w-2 h-2 rounded-full bg-[#E6A93C] shadow-[0_0_0_3px_rgba(230,169,60,0.18)]"
                              />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyNotifications;
