import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loadProfile } from '../../pages/candidate/candidate-profile/profileStore';
import CandidateUserDropdown from './CandidateUserDropdown';
import CandidateNotifications from './CandidateNotifications';
import '../../styles/candidateHeader.scss';

const NAV_ITEMS = [
  { label: 'My CV',       path: '/candidate-profile' },
  { label: 'Companies',   path: '/company-list' },
  { label: 'My Ratings',  path: '/my-ratings' },
];

const CandidateHeader = () => {
  const location = useLocation();

  const isActive = (path) =>
    path === '/candidate-profile'
      ? location.pathname.startsWith('/candidate-profile')
      : location.pathname === path;

  return (
    <header className="appbar">
      <div className="appbar-in">
        <Link to="/candidate-profile" className="brand">
          <span className="mk"><img src="/assets/images/talentmon.png" alt="Talentmon" /></span>
          <span>Talent<b>mon</b></span>
        </Link>

        <nav className="appnav" aria-label="Candidate navigation">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={isActive(item.path) ? 'on' : undefined}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="appbar-right">
          <CandidateNotifications />
          <CandidateUserDropdown />
        </div>
      </div>
    </header>
  );
};

export default CandidateHeader;
