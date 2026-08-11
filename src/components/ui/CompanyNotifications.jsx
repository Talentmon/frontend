import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import { getNotifications, markRead as storeMarkRead, markAllRead as storeMarkAllRead, subscribeNotifications } from '../../utils/notificationStore';

const CompanyNotifications = () => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(() => getNotifications('company'));
  const ref = useRef(null);
  const location = useLocation();

  const unread = notifs?.filter((n) => !n?.read)?.length;

  useEffect(() => {
    const onOutside = (e) => {
      if (ref?.current && !ref?.current?.contains(e?.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    const refresh = () => setNotifs(getNotifications('company'));
    return subscribeNotifications(refresh);
  }, []);

  const markAllRead = () => storeMarkAllRead('company');
  const markRead = (id) => storeMarkRead('company', id);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
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
                  onClick={() => markRead(n?.id)}
                  className={`flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                    n?.read ? 'opacity-70' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#EBF3FF] text-[#2c5fa8]">
                    <Icon name={n?.type === 'unlock' ? 'Unlock' : 'Bell'} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm text-popover-foreground ${n?.read ? 'font-medium' : 'font-semibold'}`}>
                      {n?.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{n?.desc}</div>
                    <div className="text-xs text-muted-foreground/70 mt-1">{n?.time}</div>
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
