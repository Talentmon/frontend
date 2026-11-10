import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import AdminUserMenu from './AdminUserMenu';
import { getNewSuggestionCount, getPendingMatchCount } from '../adminApi';

// Shared top bar of every admin page. The Companies link carries the number
// of "returning company" suggestions waiting for a yes/no; the Suggestions
// link the number of product suggestions still marked New.
const AdminAppBar = ({ name, email, pendingMatches, newSuggestions }) => {
  const [fetchedPending, setFetchedPending] = useState(0);
  const [fetchedNew, setFetchedNew] = useState(0);

  useEffect(() => {
    if (pendingMatches !== undefined) return;
    getPendingMatchCount().then(setFetchedPending).catch(() => {});
  }, [pendingMatches]);

  useEffect(() => {
    if (newSuggestions !== undefined) return;
    getNewSuggestionCount().then(setFetchedNew).catch(() => {});
  }, [newSuggestions]);

  const pending = pendingMatches ?? fetchedPending;
  const fresh = newSuggestions ?? fetchedNew;

  return (
    <header className="appbar">
      <div className="wrap appbar-in">
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
          <AdminUserMenu name={name} email={email} />
        </div>
      </div>
    </header>
  );
};

export default AdminAppBar;
