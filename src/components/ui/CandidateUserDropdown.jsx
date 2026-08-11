import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { loadProfile } from '../../pages/candidate/candidate-profile/profileStore';

const CandidateUserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useClerk();

  const profile = loadProfile();
  const name = profile?.basics?.name || 'Candidate';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const menuItems = [
    {
      label: 'Settings',
      path: '/candidate-settings',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
      desc: 'Account, privacy, security'
    },
    {
      label: 'Help & support',
      path: '/candidate-settings?tab=help',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.9.4-1.4 1-1.4 2.2" strokeLinecap="round"/>
          <path d="M12 17h.01"/>
        </svg>
      ),
      desc: 'Documentation and contact'
    }
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <div className="cud-root" ref={dropdownRef}>
      <button
        className={`cud-trigger${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen(v => !v)}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <span className="cud-name">{name}</span>
        <span className="cud-avatar">{initials}</span>
        <svg className="cud-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="cud-menu" role="menu">
          <div className="cud-header">
            <span className="cud-hav">{initials}</span>
            <div className="cud-hinfo">
              <strong>{name}</strong>
              <span>Candidate</span>
            </div>
          </div>

          <div className="cud-items">
            {menuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`cud-item${location.pathname === item.path.split('?')[0] ? ' active' : ''}`}
                role="menuitem"
              >
                <span className="cud-item-ic">{item.icon}</span>
                <span className="cud-item-txt">
                  <b>{item.label}</b>
                  <span>{item.desc}</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="cud-footer">
            <button className="cud-signout" onClick={handleSignOut} role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="cud-item-txt">
                <b>Sign out</b>
                <span>End the current session</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateUserDropdown;
