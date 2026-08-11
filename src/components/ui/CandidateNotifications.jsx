import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getNotifications, markRead as storeMarkRead, markAllRead as storeMarkAllRead, subscribeNotifications } from '../../utils/notificationStore';

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const UnlockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const CandidateNotifications = () => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(() => getNotifications('candidate'));
  const ref = useRef(null);
  const location = useLocation();

  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    const onOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    const refresh = () => setNotifs(getNotifications('candidate'));
    return subscribeNotifications(refresh);
  }, []);

  const markAllRead = () => storeMarkAllRead('candidate');

  const markRead = id => storeMarkRead('candidate', id);

  return (
    <div className="cn-root" ref={ref}>
      <button
        className={`cn-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon />
        {unread > 0 && <span className="cn-badge">{unread}</span>}
      </button>

      {open && (
        <div className="cn-menu" role="dialog" aria-label="Notifications">
          <div className="cn-head">
            <span className="cn-title">Notifications</span>
            {unread > 0 && (
              <button className="cn-mark-all" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="cn-list">
            {notifs.length === 0 ? (
              <div className="cn-empty">No new notifications.</div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  className={`cn-item${n.read ? ' cn-read' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className={`cn-icon cn-icon-${n.type}`}>
                    {n.type === 'unlock' ? <UnlockIcon /> : <StarIcon />}
                  </div>
                  <div className="cn-body">
                    <b>{n.title}</b>
                    <span>{n.desc}</span>
                    <time>{n.time}</time>
                  </div>
                  {!n.read && <div className="cn-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateNotifications;
