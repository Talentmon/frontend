import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import apiClient from '../../lib/apiClient';

const TYPE_ICON = { unlock: 'Unlock', 'bookmark-bonus': 'Bookmark' };

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

/**
 * The company's shared notification feed (GET /notifications) — one feed for
 * the whole team. Loading it is also what triggers the bookmark-bonus expiry
 * notices on the backend (BookmarkAllowanceService.reconcile).
 */
const CompanyNotifications = () => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const ref = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const unread = notifs?.filter((n) => !n?.read)?.length;

  const load = useCallback(() => {
    apiClient
      .get('/notifications')
      .then(({ data }) => setNotifs(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onOutside = (e) => {
      if (ref?.current && !ref?.current?.contains(e?.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const toggle = () => {
    if (!open) load();
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
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className={`relative flex items-center justify-center w-10 h-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors ${
          open ? 'bg-white/10 text-white' : ''
        }`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Icon name="Bell" size={18} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#E6A93C] text-[#1a0e00] text-[10px] font-bold flex items-center justify-center leading-none border-2 border-[#0B1A2C]">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-elevation-3 z-[1100] animate-slide-up overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-medium text-popover-foreground">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-[#C98A1F] hover:text-[#a87018] transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {notifs?.length === 0 ? (
              <div className="text-center py-8 px-4 text-sm text-muted-foreground">
                No new notifications.
              </div>
            ) : (
              notifs?.map((n) => (
                <div
                  key={n?.id}
                  onClick={() => openNotification(n)}
                  className={`flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                    n?.read ? 'opacity-70' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#EBF3FF] text-[#2c5fa8]">
                    <Icon name={TYPE_ICON[n?.type] || 'Bell'} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm text-popover-foreground ${n?.read ? 'font-medium' : 'font-semibold'}`}>
                      {n?.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{n?.description}</div>
                    <div className="text-xs text-muted-foreground/70 mt-1">{relativeTime(n?.createdAt)}</div>
                  </div>
                  {!n?.read && <div className="w-2 h-2 rounded-full bg-[#E6A93C] flex-shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyNotifications;
