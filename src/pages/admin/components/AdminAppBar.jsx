import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import AdminUserMenu from './AdminUserMenu';
import { getMe, getNewSuggestionCount, getPendingMatchCount } from '../adminApi';

// Top bar of every admin page (AdminLayout keeps it mounted between them). The
// Companies link carries the number of "returning company" suggestions waiting
// for a yes/no; the Suggestions link the number of product suggestions still
// marked New. A page that has fresher values passes them in (useAdminBar).
const AdminAppBar = ({ name, pendingMatches, newSuggestions }) => {
  const { pathname } = useLocation();
  const [me, setMe] = useState(null);
  const [fetchedPending, setFetchedPending] = useState(0);
  const [fetchedNew, setFetchedNew] = useState(0);

  // Re-read the name and counts on every page change, as a fresh page load used
  // to (so a name saved in Settings shows on the next page).
  useEffect(() => {
    getMe().then(setMe).catch(() => {});
    getPendingMatchCount().then(setFetchedPending).catch(() => {});
    getNewSuggestionCount().then(setFetchedNew).catch(() => {});
  }, [pathname]);

  const pending = pendingMatches ?? fetchedPending;
  const fresh = newSuggestions ?? fetchedNew;

  return (
    <header className="admin-bar">
      <div className="appbar-in">
        <Link to="/admin" className="brand">
          <span className="mk">
            <img src="/assets/images/talentmon.png" alt="Talentmon" />
          </span>
          <span>Talent<b>mon</b></span>
        </Link>
        <span className="admin-badge">ADMIN</span>
        <nav className="appnav">
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/companies">
            Companies
            {pending > 0 && <span className="nav-count" title={`${pending} possible returning ${pending === 1 ? 'company' : 'companies'}`}>{pending}</span>}
          </NavLink>
          <NavLink to="/admin/suggestions">
            Suggestions
            {fresh > 0 && <span className="nav-count" title={`${fresh} new ${fresh === 1 ? 'suggestion' : 'suggestions'}`}>{fresh}</span>}
          </NavLink>
        </nav>
        <div className="appbar-right">
          <AdminUserMenu name={name || me?.name || undefined} email={me?.email} />
        </div>
      </div>
    </header>
  );
};

export default AdminAppBar;
