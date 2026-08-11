import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'components/ui/Select';
import AdminUserMenu from '../components/AdminUserMenu';
import {
  getMe,
  updateMe,
  getSessions,
  updateNotifPrefs,
  getPlatformSettings,
  updatePlatformSettings,
  listCreditPackages,
  updateCreditPackage,
  listAdmins,
  inviteAdmin,
  updateAdminRole,
  removeAdmin,
  TIMEZONE_TO_BACKEND,
  TIMEZONE_TO_FRONTEND,
  CURRENCY_TO_BACKEND,
  CURRENCY_TO_FRONTEND,
  creditValidityToBackend,
  creditValidityToFrontend,
  ROLE_LABEL,
} from '../adminApi';
import './styles.scss';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'sr', label: 'Srpski (latinica)' },
];

const TIMEZONE_OPTIONS = [
  { value: 'be', label: 'Belgrade (UTC+1)' },
  { value: 'ld', label: 'London (UTC+0)' },
];

const CURRENCY_OPTIONS = [
  { value: 'eur', label: 'Euro (€)' },
  { value: 'rsd', label: 'Serbian dinar (RSD)' },
];

const CREDIT_VALIDITY_OPTIONS = [
  { value: 'never', label: 'Never expires' },
  { value: '12', label: '12 months' },
  { value: '24', label: '24 months' },
];

const INVITE_ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'ANALYST', label: 'Analyst (read-only)' },
];

const SIDE_TABS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
    ),
  },
  {
    id: 'security',
    label: 'Security',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /></svg>
    ),
  },
  {
    id: 'platform',
    label: 'Platform',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>
    ),
  },
  {
    id: 'notif',
    label: 'Notifications',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
    ),
  },
  {
    id: 'admins',
    label: 'Admins & roles',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3.5" /><path d="M3 20a6 6 0 0 1 12 0M16 3.5a3.5 3.5 0 0 1 0 7M21 20a6 6 0 0 0-4-5.6" /></svg>
    ),
  },
  {
    id: 'payout',
    label: 'Payout & tax',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
    ),
  },
];

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"><path d="M20 6 9 17l-5-5" /></svg>
);

const NOTIF_ROWS = [
  { key: 'newCompany', label: 'New company sign-up', desc: 'A company creates an account' },
  { key: 'lowCredits', label: 'Company low on credits', desc: 'An account is about to run dry — churn risk / upsell' },
  { key: 'largePurchase', label: 'Large purchase', desc: 'A single order over €500' },
  { key: 'refund', label: 'Refund request', desc: 'A company requests a 30-day refund' },
  { key: 'flagged', label: 'Flagged / low review', desc: 'A company receives a 1–2★ rating or a report' },
];

const formatSessionTime = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'active now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const AdminSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState({ name: '', phone: '', language: 'en', timezone: 'be', twoFactorEnabled: false, loginNotifications: true });
  const [sessions, setSessions] = useState([]);
  const [notifPrefs, setNotifPrefs] = useState({});
  const [platform, setPlatform] = useState({ vatRatePercent: 20, currency: 'eur', creditValidity: 'never', firstUnlockFree: true, bookmarkLimitPerSeat: 10, bookmarkCapPerCompany: 200, autoExpireBookmarkDays: 30 });
  const [creditPackages, setCreditPackages] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ADMIN');
  const [managingUserId, setManagingUserId] = useState(null);
  const [saving, setSaving] = useState(false);

  const isOwner = me?.role === 'OWNER';

  const showToast = (message) => {
    setToastMsg(message);
    clearTimeout(toastTimer?.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400);
  };

  useEffect(() => {
    Promise.all([getMe(), getSessions(), getPlatformSettings(), listCreditPackages(), listAdmins()])
      .then(([meRow, sessionRows, platformRow, packageRows, adminRows]) => {
        setMe(meRow);
        setProfile({
          name: meRow.name || '',
          phone: meRow.phone || '',
          language: meRow.language || 'en',
          timezone: TIMEZONE_TO_FRONTEND[meRow.timezone] || 'be',
          twoFactorEnabled: !!meRow.twoFactorEnabled,
          loginNotifications: meRow.loginNotifications !== false,
        });
        setNotifPrefs(meRow.notifPrefs || {});
        setSessions(sessionRows);
        setPlatform({
          vatRatePercent: platformRow.vatRatePercent,
          currency: CURRENCY_TO_FRONTEND[platformRow.currency] || 'eur',
          creditValidity: creditValidityToFrontend(platformRow.creditValidityMonths),
          firstUnlockFree: platformRow.firstUnlockFree,
          bookmarkLimitPerSeat: platformRow.bookmarkLimitPerSeat,
          bookmarkCapPerCompany: platformRow.bookmarkCapPerCompany,
          autoExpireBookmarkDays: platformRow.autoExpireBookmarkDays,
        });
        setCreditPackages(packageRows);
        setAdmins(adminRows);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleProfileField = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      if (activeTab === 'profile') {
        const updated = await updateMe({ name: profile.name, phone: profile.phone, language: profile.language, timezone: TIMEZONE_TO_BACKEND[profile.timezone] });
        setProfile((p) => ({ ...p, name: updated.name || '', phone: updated.phone || '' }));
      } else if (activeTab === 'security') {
        await updateMe({ twoFactorEnabled: profile.twoFactorEnabled, loginNotifications: profile.loginNotifications });
      } else if (activeTab === 'platform') {
        const updated = await updatePlatformSettings({
          vatRatePercent: Number(platform.vatRatePercent),
          currency: CURRENCY_TO_BACKEND[platform.currency],
          creditValidityMonths: creditValidityToBackend(platform.creditValidity),
          firstUnlockFree: platform.firstUnlockFree,
          bookmarkLimitPerSeat: Number(platform.bookmarkLimitPerSeat),
          bookmarkCapPerCompany: Number(platform.bookmarkCapPerCompany),
          autoExpireBookmarkDays: Number(platform.autoExpireBookmarkDays),
        });
        setPlatform((prev) => ({ ...prev, vatRatePercent: updated.vatRatePercent, firstUnlockFree: updated.firstUnlockFree }));
      } else if (activeTab === 'notif') {
        const updated = await updateNotifPrefs(notifPrefs);
        setNotifPrefs(updated);
      }
      showToast('Changes saved');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not save — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePackagePriceBlur = async (pkg, priceEuro) => {
    const priceCents = Math.round(Number(priceEuro) * 100);
    if (!Number.isFinite(priceCents) || priceCents === pkg.priceCents) return;
    try {
      const updated = await updateCreditPackage(pkg.id, { priceCents });
      setCreditPackages((prev) => prev.map((p) => (p.id === pkg.id ? updated : p)));
      showToast(`${updated.name} price updated`);
    } catch {
      showToast('Could not update package price — please try again.');
    }
  };

  const handleNotifToggle = (key, channel, checked) => {
    setNotifPrefs((prev) => ({ ...prev, [`${key}${channel}`]: checked }));
  };

  const handleInviteSubmit = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const created = await inviteAdmin({ email: inviteEmail.trim(), role: inviteRole });
      setAdmins((prev) => [...prev, { ...created, email: inviteEmail.trim() }]);
      setInviteOpen(false);
      setInviteEmail('');
      showToast(`${inviteEmail.trim()} is now an admin`);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not invite admin — please try again.');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const updated = await updateAdminRole(userId, role);
      setAdmins((prev) => prev.map((a) => (a.userId === userId ? { ...a, role: updated.role } : a)));
      showToast('Role updated');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not update role — please try again.');
    }
  };

  const handleRemoveAdmin = async (userId, email) => {
    if (!window.confirm(`Remove admin access for ${email}?`)) return;
    try {
      await removeAdmin(userId);
      setAdmins((prev) => prev.filter((a) => a.userId !== userId));
      setManagingUserId(null);
      showToast(`${email} removed`);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not remove admin — please try again.');
    }
  };

  const avatarInitial = (profile.name || me?.email || 'A').trim().charAt(0).toUpperCase();

  return (
    <div className="admin-settings">
      <Helmet>
        <title>Owner settings · Talentmon Admin</title>
      </Helmet>

      <header className="appbar">
        <div className="appbar-in">
          <Link to="/admin" className="brand">
            <span className="mk">
              <img src="/assets/images/talentmon.png" alt="Talentmon" />
            </span>
            <span>Talent<b>mon</b></span>
          </Link>
          <span className="admin-badge">ADMIN</span>
          <nav className="appnav"><Link to="/admin">Dashboard</Link></nav>
          <div className="appbar-right">
            <AdminUserMenu name={profile.name || undefined} email={me?.email} role={me?.role ? ROLE_LABEL[me.role] : undefined} />
          </div>
        </div>
      </header>

      <main className="page">
        <div className="wrap">
          <div className="phead">
            <div><h1>Settings</h1><p>Your owner account, security and platform configuration.</p></div>
            {activeTab !== 'admins' && activeTab !== 'payout' && (
              <button type="button" className="btn-primary" onClick={handleSaveChanges} disabled={saving || loading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4h11l3 3v13H5zM9 4v5h6V4" strokeLinejoin="round" /></svg>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            )}
          </div>

          <div className="layout">
            {/* SIDEBAR */}
            <nav className="sidenav">
              {SIDE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`snav${activeTab === tab.id ? ' on' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="ni">{tab.icon}</span>{tab.label}
                </button>
              ))}
              <div className="snav-sep" />
              <button type="button" className="snav logout" onClick={() => navigate('/login')}>
                <span className="ni"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg></span>
                Log out
              </button>
            </nav>

            <div className="content">
              {/* PROFILE */}
              <section className={`panel${activeTab === 'profile' ? ' on' : ''}`}>
                <div className="card">
                  <h3>Owner profile</h3><div className="csub">Your personal account details</div>
                  <div className="av-row">
                    <div className="av-big">{avatarInitial}</div>
                    <div className="av-hint">Only you and other admins can see this.</div>
                  </div>
                  <div className="form2">
                    <div className="field"><label className="flabel">Full name</label><input className="finput" value={profile.name} onChange={(e) => handleProfileField('name', e.target.value)} /></div>
                    <div className="field"><label className="flabel">Email</label><input className="finput" type="email" value={me?.email || ''} disabled /></div>
                    <div className="field"><label className="flabel">Phone</label><input className="finput" value={profile.phone} onChange={(e) => handleProfileField('phone', e.target.value)} /></div>
                    <div className="field"><label className="flabel">Role</label><input className="finput" value={me?.role ? ROLE_LABEL[me.role] : ''} disabled /></div>
                    <div className="field">
                      <label className="flabel">Language</label>
                      <Select className="admin-select" options={LANGUAGE_OPTIONS} value={profile.language} onChange={(v) => handleProfileField('language', v)} />
                    </div>
                    <div className="field">
                      <label className="flabel">Time zone</label>
                      <Select className="admin-select" options={TIMEZONE_OPTIONS} value={profile.timezone} onChange={(v) => handleProfileField('timezone', v)} />
                    </div>
                  </div>
                </div>
              </section>

              {/* SECURITY */}
              <section className={`panel${activeTab === 'security' ? ' on' : ''}`}>
                <div className="card">
                  <h3>Two-factor &amp; sign-in</h3><div className="csub">Extra protection for the account that controls the platform</div>
                  <div className="toggle-row">
                    <label className="toggle"><input type="checkbox" checked={profile.twoFactorEnabled} onChange={(e) => handleProfileField('twoFactorEnabled', e.target.checked)} /><span className="tk" /></label>
                    <div className="tr-txt"><b>Two-factor authentication (2FA)<span className="rec">RECOMMENDED</span></b><span>Require an authenticator code at every sign-in.</span></div>
                  </div>
                  <div className="toggle-row">
                    <label className="toggle"><input type="checkbox" checked={profile.loginNotifications} onChange={(e) => handleProfileField('loginNotifications', e.target.checked)} /><span className="tk" /></label>
                    <div className="tr-txt"><b>Login notifications</b><span>Email me whenever someone signs in to the owner account.</span></div>
                  </div>
                </div>
                <div className="card">
                  <h3>Recent sign-ins</h3><div className="csub">Login activity for your account</div>
                  {sessions.length === 0 ? (
                    <p className="csub">No recorded sign-ins yet.</p>
                  ) : sessions.map((s) => (
                    <div className="sess" key={s.id}>
                      <span className="sic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg></span>
                      <div className="sd"><b>{s.action}{s.deviceInfo ? ` · ${s.deviceInfo}` : ''}</b><span>{[s.location, formatSessionTime(s.createdAt)].filter(Boolean).join(' · ')}</span></div>
                    </div>
                  ))}
                </div>
              </section>

              {/* PLATFORM */}
              <section className={`panel${activeTab === 'platform' ? ' on' : ''}`}>
                {!isOwner && <p className="csub" style={{ marginBottom: 10 }}>Only the Owner can change pricing and platform rules — you can view them here.</p>}
                <div className="card">
                  <h3>Credit packages &amp; pricing</h3><div className="csub">What companies pay to buy credits — this is your revenue</div>
                  {creditPackages.map((pkg) => (
                    <div className="pack" key={pkg.id}>
                      <div className="pn"><b>{pkg.name}</b><span>{pkg.popular ? 'most popular' : pkg.code}</span></div>
                      <span className="pcredits">{pkg.credits} credit{pkg.credits === 1 ? '' : 's'}</span>
                      <div className="pre-wrap pprice">
                        <span className="p">€</span>
                        <input
                          className="finput pre"
                          type="number"
                          defaultValue={(pkg.priceCents / 100).toFixed(2)}
                          disabled={!isOwner}
                          onBlur={(e) => handlePackagePriceBlur(pkg, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h3>Rules &amp; economics</h3><div className="csub">Global settings that shape the credit model</div>
                  <div className="form2" style={{ marginBottom: 6 }}>
                    <div className="field">
                      <label className="flabel">VAT rate</label>
                      <div className="pre-wrap"><input className="finput" value={platform.vatRatePercent} disabled={!isOwner} onChange={(e) => setPlatform((p) => ({ ...p, vatRatePercent: e.target.value }))} /><span className="p" style={{ left: 'auto', right: '.85em' }}>%</span></div>
                    </div>
                    <div className="field">
                      <label className="flabel">Currency</label>
                      <Select className="admin-select" options={CURRENCY_OPTIONS} value={platform.currency} onChange={(v) => setPlatform((p) => ({ ...p, currency: v }))} disabled={!isOwner} />
                    </div>
                    <div className="field">
                      <label className="flabel">Credit validity</label>
                      <Select className="admin-select" options={CREDIT_VALIDITY_OPTIONS} value={platform.creditValidity} onChange={(v) => setPlatform((p) => ({ ...p, creditValidity: v }))} disabled={!isOwner} />
                    </div>
                    <div className="field"><label className="flabel">Cost per unlock</label><input className="finput" defaultValue="1 credit" disabled /></div>
                  </div>
                  <div className="toggle-row" style={{ borderTop: '1px solid var(--adp-line)', marginTop: 10 }}>
                    <label className="toggle"><input type="checkbox" checked={platform.firstUnlockFree} disabled={!isOwner} onChange={(e) => setPlatform((p) => ({ ...p, firstUnlockFree: e.target.checked }))} /><span className="tk" /></label>
                    <div className="tr-txt"><b>First unlock free</b><span>New companies get their first candidate unlock at no cost.</span></div>
                  </div>
                </div>
                <div className="card">
                  <h3>Shortlist (bookmark) limits</h3><div className="csub">Per HR seat, with a company-wide cap</div>
                  <div className="form2" style={{ marginBottom: 6 }}>
                    <div className="field"><label className="flabel">Bookmarks per HR seat</label><input className="finput" value={platform.bookmarkLimitPerSeat} disabled={!isOwner} onChange={(e) => setPlatform((p) => ({ ...p, bookmarkLimitPerSeat: e.target.value }))} /></div>
                    <div className="field"><label className="flabel">Cap per company</label><input className="finput" value={platform.bookmarkCapPerCompany} disabled={!isOwner} onChange={(e) => setPlatform((p) => ({ ...p, bookmarkCapPerCompany: e.target.value }))} /></div>
                  </div>
                  <div className="toggle-row" style={{ borderTop: '1px solid var(--adp-line)', marginTop: 10 }}>
                    <div className="tr-txt" style={{ marginLeft: 0 }}>
                      <label className="flabel">Auto-expire bookmarks after (days)</label>
                      <input className="finput" style={{ maxWidth: 120, marginTop: 6 }} value={platform.autoExpireBookmarkDays} disabled={!isOwner} onChange={(e) => setPlatform((p) => ({ ...p, autoExpireBookmarkDays: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </section>

              {/* NOTIFICATIONS */}
              <section className={`panel${activeTab === 'notif' ? ' on' : ''}`}>
                <div className="card">
                  <h3>Owner alerts</h3><div className="csub">The events worth interrupting you for</div>
                  {NOTIF_ROWS.map((row) => (
                    <div className="notif-row" key={row.key}>
                      <div className="nl"><b>{row.label}</b><span>{row.desc}</span></div>
                      <div className="notif-ch">
                        <label className="ncheck"><input type="checkbox" checked={!!notifPrefs[`${row.key}Email`]} onChange={(e) => handleNotifToggle(row.key, 'Email', e.target.checked)} /><span className="bx"><CheckIcon /></span>Email</label>
                        <label className="ncheck"><input type="checkbox" checked={!!notifPrefs[`${row.key}Push`]} onChange={(e) => handleNotifToggle(row.key, 'Push', e.target.checked)} /><span className="bx"><CheckIcon /></span>Push</label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h3>Business reports</h3><div className="csub">Scheduled summaries by email</div>
                  <div className="toggle-row">
                    <label className="toggle"><input type="checkbox" checked={!!notifPrefs.weeklySummary} onChange={(e) => setNotifPrefs((p) => ({ ...p, weeklySummary: e.target.checked }))} /><span className="tk" /></label>
                    <div className="tr-txt"><b>Weekly business summary</b><span>Revenue, unlocks, new companies and churn risk — every Monday.</span></div>
                  </div>
                  <div className="toggle-row">
                    <label className="toggle"><input type="checkbox" checked={!!notifPrefs.monthlyFinanceReport} onChange={(e) => setNotifPrefs((p) => ({ ...p, monthlyFinanceReport: e.target.checked }))} /><span className="tk" /></label>
                    <div className="tr-txt"><b>Monthly finance report</b><span>Recognized vs deferred revenue, VAT and refunds — for your bookkeeper.</span></div>
                  </div>
                </div>
              </section>

              {/* ADMINS */}
              <section className={`panel${activeTab === 'admins' ? ' on' : ''}`}>
                <div className="card">
                  <h3>Admins &amp; roles</h3><div className="csub">Who can access this owner panel</div>
                  <div className="tbl-scroll">
                    <table>
                      <thead><tr><th>User</th><th>Role</th><th /></tr></thead>
                      <tbody>
                        {admins.map((a) => (
                          <React.Fragment key={a.userId}>
                            <tr>
                              <td><div className="adm"><span className="aav" style={{ background: 'linear-gradient(140deg,#e6a93c,#c98a1f)' }}>{(a.name || a.email || '?').charAt(0).toUpperCase()}</span><div><b>{a.name || a.email}</b><span>{a.email}</span></div></div></td>
                              <td><span className={`rolepill ${a.role?.toLowerCase()}`}>{ROLE_LABEL[a.role] || a.role}</span></td>
                              <td style={{ textAlign: 'right' }}>
                                {a.userId === me?.userId ? (
                                  <span style={{ color: 'var(--adp-slate-2)', fontSize: '.8rem' }}>You</span>
                                ) : isOwner ? (
                                  <button type="button" className="rowbtn" onClick={() => setManagingUserId((id) => (id === a.userId ? null : a.userId))}>
                                    {managingUserId === a.userId ? 'Close' : 'Manage'}
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                            {managingUserId === a.userId && (
                              <tr>
                                <td colSpan={3}>
                                  <div className="form2" style={{ padding: '10px 0' }}>
                                    <div className="field">
                                      <label className="flabel">Role</label>
                                      <Select className="admin-select" options={[{ value: 'OWNER', label: 'Owner' }, ...INVITE_ROLE_OPTIONS]} value={a.role} onChange={(v) => handleRoleChange(a.userId, v)} />
                                    </div>
                                    <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                      <button type="button" className="rowbtn" style={{ color: 'var(--adp-red)' }} onClick={() => handleRemoveAdmin(a.userId, a.email)}>
                                        Remove admin access
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {isOwner && (
                    inviteOpen ? (
                      <div className="form2" style={{ marginTop: 14 }}>
                        <div className="field"><label className="flabel">Email</label><input className="finput" type="email" placeholder="name@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div>
                        <div className="field">
                          <label className="flabel">Role</label>
                          <Select className="admin-select" options={INVITE_ROLE_OPTIONS} value={inviteRole} onChange={setInviteRole} />
                        </div>
                        <div className="field" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                          <button type="button" className="btn-primary" onClick={handleInviteSubmit}>Send invite</button>
                          <button type="button" className="btn-ghost" onClick={() => { setInviteOpen(false); setInviteEmail(''); }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" className="add-admin" onClick={() => setInviteOpen(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        Invite admin
                      </button>
                    )
                  )}
                  <p className="csub" style={{ marginTop: 10 }}>The invited person must have signed in at least once already — invites promote an existing account, they don't create one.</p>
                </div>
                <div className="card">
                  <h3>What each role can do</h3><div className="csub">Keep sensitive controls to the Owner</div>
                  <div className="toggle-row" style={{ border: 'none', padding: '6px 0' }}>
                    <div className="tr-txt" style={{ marginLeft: 0 }}><b>Owner</b><span>Full access — pricing, payouts, admins and all data.</span></div>
                  </div>
                  <div className="toggle-row" style={{ padding: '6px 0' }}>
                    <div className="tr-txt"><b>Admin</b><span>Manage companies, candidates and reviews. No pricing or payout access.</span></div>
                  </div>
                  <div className="toggle-row" style={{ padding: '6px 0' }}>
                    <div className="tr-txt"><b>Analyst</b><span>View dashboards and export reports. Cannot change anything.</span></div>
                  </div>
                </div>
              </section>

              {/* PAYOUT — demo data, no payment/invoicing backend exists yet */}
              <section className={`panel${activeTab === 'payout' ? ' on' : ''}`}>
                <div className="card">
                  <h3>Payout account</h3><div className="csub">Where your credit-sales revenue is settled</div>
                  <div className="payline">
                    <span className="pic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M4 21V10l8-5 8 5v11M9 21v-6h6v6" /></svg></span>
                    <div className="pd"><b>Komercijalna banka · •••• 4021</b><span>Talentmon d.o.o. · RSD settlement</span></div>
                    <span className="verified"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" /></svg>Verified</span>
                  </div>
                  <div style={{ marginTop: 12 }}><button type="button" className="btn-ghost">Change payout account</button></div>
                </div>
                <div className="card">
                  <h3>Company &amp; tax details</h3><div className="csub">Appears on invoices issued to companies</div>
                  <div className="form2">
                    <div className="field"><label className="flabel">Legal name</label><input className="finput" defaultValue="Talentmon d.o.o." /></div>
                    <div className="field"><label className="flabel">Address</label><input className="finput" defaultValue="Bulevar kralja Aleksandra 1, Belgrade" /></div>
                    <div className="field"><label className="flabel">Tax ID (PIB)</label><input className="finput" defaultValue="112233445" /></div>
                    <div className="field"><label className="flabel">Company no. (MB)</label><input className="finput" defaultValue="21234567" /></div>
                  </div>
                </div>
                <div className="card">
                  <h3>Statements</h3><div className="csub">Download for your accountant</div>
                  <div className="dl-row">
                    <button type="button" className="dl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>Revenue ledger (CSV)</button>
                    <button type="button" className="dl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /></svg>VAT report</button>
                    <button type="button" className="dl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /></svg>Payout statements</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <div className={`toast${toastMsg ? ' show' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" /></svg>
        <span>{toastMsg}</span>
      </div>
    </div>
  );
};

export default AdminSettings;
