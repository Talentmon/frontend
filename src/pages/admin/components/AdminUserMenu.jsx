import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import './adminUserMenu.scss';

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 13h6V4H4zM14 20h6v-9h-6zM14 4h6v3h-6zM4 17h6v3H4z" /></svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
);

const ITEMS = [
  { label: 'Dashboard', description: 'Revenue, credits & company overview', to: '/admin', icon: <DashboardIcon /> },
  { label: 'Settings', description: 'Profile, security & platform config', to: '/admin/settings', icon: <SettingsIcon /> },
];

const AdminUserMenu = ({ name = 'Marko Owner', role = 'Owner · Platform admin', email = 'owner@talentmon.rs' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const initial = name?.charAt(0) || 'O';

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref?.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div className={`admin-user-menu${open ? ' open' : ''}`} ref={ref}>
      <button type="button" className="aum-trigger" onClick={() => setOpen((v) => !v)} aria-label="Owner account menu">
        <span className="ut"><b>Owner</b><span>Platform admin</span></span>
        <span className="ua">{initial}</span>
        <span className="aum-chev"><ChevronIcon /></span>
      </button>

      {open && (
        <div className="aum-menu">
          <div className="aum-head">
            <span className="aum-av">{initial}</span>
            <div className="aum-head-t">
              <b>{name}</b>
              <span className="aum-email">{email}</span>
              <span className="aum-plan"><i className="dot" />{role}</span>
            </div>
          </div>

          <div className="aum-items">
            {ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`aum-item${location.pathname === item.to ? ' active' : ''}`}
              >
                <span className="aum-ic">{item.icon}</span>
                <span className="aum-t"><b>{item.label}</b><span>{item.description}</span></span>
              </Link>
            ))}
          </div>

          <div className="aum-foot">
            <button type="button" className="aum-item logout" onClick={handleLogout}>
              <span className="aum-ic"><LogoutIcon /></span>
              <span className="aum-t"><b>Log out</b><span>End current session</span></span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserMenu;
