import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import CandidateHeader from 'components/ui/CandidateHeader';
import Select from 'components/ui/Select';
import apiClient from 'lib/apiClient';
import { useCurrentUser } from 'lib/CurrentUserContext';
import { useMyCandidateProfile } from 'hooks/useMyCandidateProfile';
import {
  getAccountPreferences,
  updateAccountPreferences,
  getPrivacy,
  updatePrivacy,
  listBlockedCompanies,
  addBlockedCompany,
  removeBlockedCompany,
  searchCompanies,
  listHiddenEmployers,
  addHiddenEmployer,
  removeHiddenEmployer,
  getNotificationPrefs,
  updateNotificationPrefs,
  pauseAccount,
  deleteAccount,
} from './settingsApi';
import s from './styles/settings.module.scss';

// ── Helpers ───────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 6 12 12M18 6 6 18"/>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>
  </svg>
);

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ msg, show }) => (
  <div className={`${s.toast}${show ? ` ${s.show}` : ''}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
    {msg}
  </div>
);

function useToast() {
  const [state, setState] = useState({ msg: '', show: false });
  const timerRef = useRef(null);

  const fire = useCallback((msg) => {
    clearTimeout(timerRef.current);
    setState({ msg, show: true });
    timerRef.current = setTimeout(() => setState(p => ({ ...p, show: false })), 2400);
  }, []);

  return [state, fire];
}

// ── Toggle ────────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <label className={s.toggle}>
    <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
    <span className={s.tk} />
  </label>
);

// ── Ncheck ────────────────────────────────────────────────────────────────────
const Ncheck = ({ checked, onChange, label }) => (
  <label className={s.ncheck}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className={s.bx}><CheckIcon /></span>
    {label}
  </label>
);

// ── NAV TABS ──────────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'account', label: 'Account', sub: 'Email, password, language',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>
  },
  {
    id: 'privacy', label: 'Privacy & visibility', sub: 'Who can see and find you',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5z"/></svg>
  },
  {
    id: 'notif', label: 'Notifications', sub: 'Channels, type, frequency',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
  },
  {
    id: 'security', label: 'Security', sub: '2FA, sessions, logins',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
  },
  {
    id: 'data', label: 'Data & privacy', sub: 'Export, consents, deletion',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>
  },
  {
    id: 'appearance', label: 'Appearance & accessibility', sub: 'Theme, text size',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/></svg>
  },
  {
    id: 'help', label: 'Help & legal', sub: 'Support, terms, policy',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.9.4-1 1-1 2.2" strokeLinecap="round"/><path d="M12 17h.01"/></svg>
  },
];

// ── ACCOUNT TAB ───────────────────────────────────────────────────────────────
const TIMEZONE_OPTIONS = [
  { value: 'Europe/Belgrade', label: 'Belgrade (UTC+1)' },
  { value: 'Europe/London', label: 'London (UTC+0)' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
];

const AccountTab = ({ prefs, onSavePrefs, fireToast }) => {
  const { user } = useCurrentUser();
  const { candidate, refetch: refetchCandidate } = useMyCandidateProfile();
  const clerk = useClerk();
  const [phone, setPhone] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (candidate) setPhone(candidate.phone || '');
  }, [candidate]);

  const savePhone = async () => {
    setPhoneSaving(true);
    try {
      await apiClient.patch('/candidates/me', { phone });
      await refetchCandidate();
      fireToast('Phone number saved');
    } catch {
      fireToast('Could not save phone number — please try again.');
    } finally {
      setPhoneSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pwCurrent || !pwNew) return;
    setPwBusy(true);
    try {
      await clerk.user.updatePassword({ currentPassword: pwCurrent, newPassword: pwNew, signOutOfOtherSessions: false });
      setPwCurrent('');
      setPwNew('');
      fireToast('Password updated');
    } catch (err) {
      fireToast(err?.errors?.[0]?.message || 'Could not update password — check your current password.');
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <>
      <div className={s.card}>
        <h3>Contact details</h3>
        <div className={s.csub}>Used for login and communication with companies</div>
        <div className={s.form2}>
          <div className={s.field}>
            <label className={s.flabel}>Email</label>
            <input className={s.finput} value={user?.email || ''} disabled />
          </div>
          <div className={s.field}>
            <label className={s.flabel}>Phone</label>
            <input className={s.finput} value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button
            className={s.btnSm}
            disabled={phoneSaving || phone === (candidate?.phone || '')}
            onClick={savePhone}
          >
            {phoneSaving ? 'Saving…' : 'Save phone'}
          </button>
        </div>
      </div>

      <div className={s.card}>
        <h3>Password</h3>
        <div className={s.csub}>Change your password regularly to keep your account secure</div>
        <div className={s.form2}>
          <div className={s.field}>
            <label className={s.flabel}>Current password</label>
            <input className={s.finput} type="password" placeholder="Enter current password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} />
          </div>
          <div className={s.field}>
            <label className={s.flabel}>New password</label>
            <input className={s.finput} type="password" placeholder="Enter new password" value={pwNew} onChange={e => setPwNew(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className={s.btnSm} disabled={pwBusy || !pwCurrent || !pwNew} onClick={changePassword}>
            {pwBusy ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </div>

      <div className={s.card}>
        <h3>Language & region</h3>
        <div className={s.csub}>How the platform looks for you</div>
        <div className={s.form2}>
          <div className={s.field}>
            <label className={s.flabel}>Interface language</label>
            <Select
              value={prefs?.language || 'en'}
              onChange={v => onSavePrefs({ language: v })}
              options={[
                { value: 'en', label: 'English' },
                { value: 'sr-lat', label: 'Serbian (Latin)' },
                { value: 'sr-cir', label: 'Serbian (Cyrillic)' },
              ]}
            />
          </div>
          <div className={s.field}>
            <label className={s.flabel}>Time zone</label>
            <Select
              value={prefs?.timezone || 'Europe/Belgrade'}
              onChange={v => onSavePrefs({ timezone: v })}
              options={TIMEZONE_OPTIONS}
            />
          </div>
        </div>
      </div>

    </>
  );
};

// ── PRIVACY TAB ───────────────────────────────────────────────────────────────
const VISIBILITY_TO_BACKEND = { all: 'ALL_COMPANIES', new: 'EXCLUDE_WORKED_FOR', manual: 'HIDDEN' };
const VISIBILITY_TO_FRONTEND = { ALL_COMPANIES: 'all', EXCLUDE_WORKED_FOR: 'new', HIDDEN: 'manual' };

const PrivacyTab = ({ fireToast }) => {
  const [privacy, setPrivacy] = useState(null);
  const [blockedFirms, setBlockedFirms] = useState([]);
  const [blockInput, setBlockInput] = useState('');
  const [blockError, setBlockError] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [employers, setEmployers] = useState([]);
  const [empInput, setEmpInput] = useState('');
  const [empBusy, setEmpBusy] = useState(false);

  useEffect(() => {
    getPrivacy().then(setPrivacy).catch(() => {});
    listBlockedCompanies().then(setBlockedFirms).catch(() => {});
    listHiddenEmployers().then(setEmployers).catch(() => {});
  }, []);

  const visibility = privacy ? VISIBILITY_TO_FRONTEND[privacy.visibility] || 'all' : 'all';
  const setVisibility = (v) => {
    setPrivacy((p) => ({ ...p, visibility: VISIBILITY_TO_BACKEND[v] }));
    updatePrivacy({ visibility: VISIBILITY_TO_BACKEND[v] }).catch(() => fireToast('Could not save visibility — please try again.'));
  };

  const isDomain = (v) => v.startsWith('@');

  const addBlocked = async () => {
    const v = blockInput.trim();
    if (!v || blockBusy) return;
    setBlockBusy(true);
    try {
      if (isDomain(v)) {
        const row = await addBlockedCompany({ blockedDomain: v });
        setBlockedFirms((p) => [...p, row]);
        setBlockInput('');
        setBlockError(false);
        return;
      }
      const { items } = await searchCompanies(v);
      const match = items?.[0];
      if (!match) {
        setBlockError(true);
        return;
      }
      const row = await addBlockedCompany({ companyId: match.id });
      setBlockedFirms((p) => [...p, { ...row, companyName: match.name }]);
      setBlockInput('');
      setBlockError(false);
    } catch {
      setBlockError(true);
    } finally {
      setBlockBusy(false);
    }
  };

  const removeBlocked = async (id) => {
    setBlockedFirms((p) => p.filter((f) => f.id !== id));
    try {
      await removeBlockedCompany(id);
    } catch {
      fireToast('Could not remove — please refresh and try again.');
    }
  };

  const addEmployer = async () => {
    const v = empInput.trim();
    if (!v || empBusy) return;
    setEmpBusy(true);
    try {
      const row = await addHiddenEmployer(v);
      setEmployers((p) => [...p, row]);
      setEmpInput('');
    } catch {
      fireToast('Could not add employer — please try again.');
    } finally {
      setEmpBusy(false);
    }
  };

  const removeEmployer = async (id) => {
    setEmployers((p) => p.filter((e) => e.id !== id));
    try {
      await removeHiddenEmployer(id);
    } catch {
      fireToast('Could not remove — please refresh and try again.');
    }
  };

  const setUnlock = (key, backendKey) => (e) => {
    const checked = e.target.checked;
    setPrivacy((p) => ({ ...p, [backendKey]: checked }));
    updatePrivacy({ [backendKey]: checked }).catch(() => fireToast('Could not save — please try again.'));
  };

  return (
    <>
      <div className={s.card}>
        <h3>Who can find you</h3>
        <div className={s.csub}>Controls your visibility in company search</div>
        <div className={`${s.field} ${s.full}`}>
          <label className={s.flabel}>Profile visibility</label>
          <Select
            value={visibility}
            onChange={setVisibility}
            options={[
              { value: 'all', label: 'All companies' },
              { value: 'new', label: "Only companies you haven't worked for" },
              { value: 'manual', label: 'Completely hidden' },
            ]}
          />
        </div>
        <div className={s.note}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>
          {visibility === 'new' ? (
            <span>Companies you've been employed by can't find you in search. Other companies only discover your name and contact info once they unlock your profile with credits.</span>
          ) : visibility === 'manual' ? (
            <span>Your profile won't appear in company search.</span>
          ) : (
            <span>Your profile is visible to all companies in search. Companies only discover your name and contact info once they unlock your profile with credits.</span>
          )}
        </div>
      </div>

      <div className={s.card}>
        <h3>Blocked companies</h3>
        <div className={s.csub}>These companies can never see your profile.</div>
        <div className={s.chipRow}>
          {blockedFirms.map((f) => (
            <span key={f.id} className={s.chip}>
              {f.companyName || f.blockedDomain}
              <button className={s.chipRm} onClick={() => removeBlocked(f.id)}>
                <XIcon />
              </button>
            </span>
          ))}
        </div>
        <div className={s.chipAdd}>
          <input
            className={s.finput}
            style={blockError ? { borderColor: '#cf4b4b', boxShadow: '0 0 0 3px rgba(207,75,75,.15)' } : undefined}
            placeholder={blockError ? 'Company not found — check the name, or use @domain.com' : 'Company name, or domain (e.g. @company.com)'}
            value={blockInput}
            onChange={e => { setBlockInput(e.target.value); setBlockError(false); }}
            onKeyDown={e => e.key === 'Enter' && addBlocked()}
          />
          <button className={s.btnSm} disabled={blockBusy} onClick={addBlocked}>Block</button>
        </div>
        <div className={s.fhint}>Blocking by domain also blocks employees using a personal account on the same domain.</div>
      </div>

      <div className={s.card}>
        <h3>Current employers you're hiding from</h3>
        <div className={s.csub}>These companies will never see that you're job hunting, regardless of your availability status</div>
        <div className={s.employerList}>
          {employers.map((e) => (
            <div key={e.id} className={s.employerRow}>
              <input value={e.employerName} readOnly />
              <button className={s.employerRm} onClick={() => removeEmployer(e.id)}>
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
        <div className={s.chipAdd}>
          <input
            className={s.finput}
            placeholder="Add another employer"
            value={empInput}
            onChange={e => setEmpInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEmployer()}
          />
          <button className={s.btnSm} disabled={empBusy} onClick={addEmployer}>Add</button>
        </div>
      </div>

      <div className={s.card}>
        <h3>What unlocks with a credit</h3>
        <div className={s.csub}>Set which fields a company sees after unlocking your profile</div>
        <div className={s.toggleRow}>
          <Toggle checked disabled />
          <div className={s.trTxt}><b>Full name</b><span>Always unlocked together with the profile.</span></div>
        </div>
        <div className={s.toggleRow}>
          <Toggle checked={privacy?.unlockPhoneAllowed ?? true} onChange={setUnlock('phone', 'unlockPhoneAllowed')} />
          <div className={s.trTxt}><b>Phone</b><span>Hidden until you approve direct contact from a company.</span></div>
        </div>
        <div className={s.toggleRow}>
          <Toggle checked={privacy?.unlockEmailAllowed ?? true} onChange={setUnlock('email', 'unlockEmailAllowed')} />
          <div className={s.trTxt}><b>Email</b><span>Visible once the profile is unlocked.</span></div>
        </div>
      </div>
    </>
  );
};

// ── NOTIFICATIONS TAB ─────────────────────────────────────────────────────────
// `notification-prefs` has no server-side defaults (freeform JSON blob) — this
// is what a first-time candidate sees before saving anything.
const DEFAULT_NOTIF = {
  unlockEmail: true,  unlockSms: false, unlockPush: true,
  savedEmail:  true,  savedSms:  false, savedPush:  false,
  msgEmail:    true,  msgSms:    true,  msgPush:    true,
  statusEmail: true,  statusSms: false, statusPush: true,
  rateEmail:   true,  rateSms:   false, ratePush:   false,
  newsEmail:   false, newsSms:   false, newsPush:   false,
  quietOn: true, quietFrom: '22:00', quietTo: '08:00',
  unlockFreq: 'daily', msgFreq: 'now', newsFreq: 'weekly',
  consent: { marketing: false, analytics: true, behavioral: false },
};

const NotifTab = ({ notif, onSaveNotif }) => {
  const n = notif || {};
  const set = key => e => onSaveNotif({ [key]: e.target.checked });
  const setFreq = key => value => onSaveNotif({ [key]: value });

  return (
    <>
      <div className={s.card}>
        <h3>Notifications</h3>
        <div className={s.csub}>By channel, type, and frequency</div>

        <div className={s.notifGrp}>
          <div className={s.notifGrpHead}>
            Companies & unlocks
            <Select
              value={n.unlockFreq || 'daily'}
              onChange={setFreq('unlockFreq')}
              options={[
                { value: 'now', label: 'Immediately' },
                { value: 'daily', label: 'Daily digest' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'off', label: 'Off' },
              ]}
            />
          </div>
          <div className={s.notifRow}><span>A new company unlocked you</span><div className={s.notifCh}><Ncheck checked={!!n.unlockEmail} onChange={set('unlockEmail')} label="Email"/><Ncheck checked={!!n.unlockSms} onChange={set('unlockSms')} label="SMS"/><Ncheck checked={!!n.unlockPush} onChange={set('unlockPush')} label="Push"/></div></div>
          <div className={s.notifRow}><span>Company saved/viewed profile (summary)</span><div className={s.notifCh}><Ncheck checked={!!n.savedEmail} onChange={set('savedEmail')} label="Email"/><Ncheck checked={!!n.savedSms} onChange={set('savedSms')} label="SMS"/><Ncheck checked={!!n.savedPush} onChange={set('savedPush')} label="Push"/></div></div>
        </div>

        <div className={s.notifGrp}>
          <div className={s.notifGrpHead}>
            Messages & process
            <Select
              value={n.msgFreq || 'now'}
              onChange={setFreq('msgFreq')}
              options={[
                { value: 'now', label: 'Immediately' },
                { value: 'daily', label: 'Daily digest' },
                { value: 'off', label: 'Off' },
              ]}
            />
          </div>
          <div className={s.notifRow}><span>New message</span><div className={s.notifCh}><Ncheck checked={!!n.msgEmail} onChange={set('msgEmail')} label="Email"/><Ncheck checked={!!n.msgSms} onChange={set('msgSms')} label="SMS"/><Ncheck checked={!!n.msgPush} onChange={set('msgPush')} label="Push"/></div></div>
          <div className={s.notifRow}><span>Application/interview status update</span><div className={s.notifCh}><Ncheck checked={!!n.statusEmail} onChange={set('statusEmail')} label="Email"/><Ncheck checked={!!n.statusSms} onChange={set('statusSms')} label="SMS"/><Ncheck checked={!!n.statusPush} onChange={set('statusPush')} label="Push"/></div></div>
          <div className={s.notifRow}><span>Reminder to rate a company</span><div className={s.notifCh}><Ncheck checked={!!n.rateEmail} onChange={set('rateEmail')} label="Email"/><Ncheck checked={!!n.rateSms} onChange={set('rateSms')} label="SMS"/><Ncheck checked={!!n.ratePush} onChange={set('ratePush')} label="Push"/></div></div>
        </div>

        <div className={s.notifGrp}>
          <div className={s.notifGrpHead}>
            Account & marketing
            <Select
              value={n.newsFreq || 'weekly'}
              onChange={setFreq('newsFreq')}
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'now', label: 'Immediately' },
                { value: 'off', label: 'Off' },
              ]}
            />
          </div>
          <div className={s.notifRow}><span>Tips and platform news</span><div className={s.notifCh}><Ncheck checked={!!n.newsEmail} onChange={set('newsEmail')} label="Email"/><Ncheck checked={!!n.newsSms} onChange={set('newsSms')} label="SMS"/><Ncheck checked={!!n.newsPush} onChange={set('newsPush')} label="Push"/></div></div>
        </div>
      </div>

      <div className={s.card}>
        <h3>Quiet hours</h3>
        <div className={s.csub}>Don't send push/SMS notifications during this period</div>
        <div className={s.toggleRow} style={{ borderTop: 'none', paddingTop: 0 }}>
          <Toggle checked={!!n.quietOn} onChange={set('quietOn')} />
          <div className={s.trTxt}><b>Enable quiet hours</b><span>Email notifications still arrive, just without sound/vibration.</span></div>
        </div>
        <div className={s.quietRow}>
          <span className={s.quietTime}>
            From <input type="time" value={n.quietFrom || '22:00'} disabled={!n.quietOn} style={{ opacity: n.quietOn ? 1 : .5 }} onChange={e => onSaveNotif({ quietFrom: e.target.value })} />
          </span>
          <span className={s.quietTime}>
            To <input type="time" value={n.quietTo || '08:00'} disabled={!n.quietOn} style={{ opacity: n.quietOn ? 1 : .5 }} onChange={e => onSaveNotif({ quietTo: e.target.value })} />
          </span>
        </div>
      </div>
    </>
  );
};

// ── SECURITY TAB ──────────────────────────────────────────────────────────────
// NOTE: 2FA/session/login-history management belongs to Clerk (auth identity
// provider) and isn't wired up yet — this stays a visual mock until that's
// scoped as its own piece of work.
const SecurityTab = () => {
  const [twoFA, setTwoFA]       = useState(false);
  const [loginAlert, setLogin]  = useState(true);

  return (
    <>
      <div className={s.card}>
        <h3>Two-factor authentication</h3>
        <div className={s.csub}>An extra layer of protection when logging in</div>
        <div className={s.toggleRow} style={{ borderTop: 'none', paddingTop: 0 }}>
          <Toggle checked={twoFA} onChange={e => setTwoFA(e.target.checked)} />
          <div className={s.trTxt}><b>Enable 2FA</b><span>Authenticator app, SMS, or passkey.</span></div>
        </div>
        <div className={s.toggleRow}>
          <Toggle checked={loginAlert} onChange={e => setLogin(e.target.checked)} />
          <div className={s.trTxt}><b>Login alerts</b><span>Let me know when someone logs into my account.</span></div>
        </div>
      </div>

      <div className={s.card}>
        <h3>Active sessions</h3>
        <div className={s.csub}>Devices currently logged into your account</div>

        <div className={s.sessionRow}>
          <span className={s.sessionIc}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></span>
          <div className={s.sessionT}><b>Chrome · Windows — Belgrade</b><span className={s.now}>Current session</span></div>
        </div>
        <div className={s.sessionRow}>
          <span className={s.sessionIc}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg></span>
          <div className={s.sessionT}><b>Talentmon app · iPhone</b><span>Last active 2 days ago</span></div>
          <button className={s.btnSm}>Log out</button>
        </div>
        <div className={s.sessionRow}>
          <span className={s.sessionIc}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></span>
          <div className={s.sessionT}><b>Safari · MacBook — Novi Sad</b><span>Last active 9 days ago</span></div>
          <button className={s.btnSm}>Log out</button>
        </div>
        <div className={s.dangerRow} style={{ borderTop: '1px solid #E5E8EC', marginTop: 6 }}>
          <div><b>Log out of all other devices</b><span>Keeps only the current session active.</span></div>
          <button className={s.btnSm}>Log out others</button>
        </div>
      </div>

      <div className={s.card}>
        <h3>Login history</h3>
        <div className={s.csub}>Last 5 logins to your account</div>
        {[
          { action: 'Successful login',  detail: 'Chrome · Windows — Belgrade, RS',  time: 'Today, 09:14' },
          { action: 'Successful login',  detail: 'Talentmon app · iPhone',       time: 'Jul 1, 2026, 21:02' },
          { action: 'Failed attempt',    detail: 'Unknown device — Sofia, BG',       time: 'Jun 28, 2026, 03:47' },
          { action: 'Successful login',  detail: 'Safari · MacBook — Novi Sad, RS',  time: 'Jun 24, 2026, 17:30' },
        ].map((l, i) => (
          <div key={i} className={s.logRow}>
            <div className={s.logT}><b>{l.action}</b><span>{l.detail}</span></div>
            <time className={s.logTime}>{l.time}</time>
          </div>
        ))}
      </div>
    </>
  );
};

// ── DATA TAB ──────────────────────────────────────────────────────────────────
const DataTab = ({ notif, onSaveNotif, onDeleteRequest, fireToast }) => {
  const [showUnlockLog, setShowUnlockLog] = useState(false);
  const [pausing, setPausing] = useState(false);
  const consent = notif?.consent || {};
  const setConsent = key => e => onSaveNotif({ consent: { ...consent, [key]: e.target.checked } });

  const handlePause = async () => {
    setPausing(true);
    try {
      await pauseAccount();
      fireToast('Account paused — hidden from company search');
    } catch {
      fireToast('Could not pause account — please try again.');
    } finally {
      setPausing(false);
    }
  };

  return (
    <>
      <div className={s.card}>
        <h3>Data</h3>
        <div className={s.csub}>Downloads and privacy-related activity log</div>
        <div className={s.dangerRow}>
          <div><b>Unlock log</b><span>Who unlocked you and when — last 90 days.</span></div>
          <button className={s.btnSm} onClick={() => setShowUnlockLog(true)}>View</button>
        </div>
      </div>

      <div className={s.card}>
        <h3>Consents</h3>
        <div className={s.csub}>Marketing and tracking</div>
        <div className={s.toggleRow} style={{ borderTop: 'none', paddingTop: 0 }}>
          <Toggle checked={!!consent.marketing} onChange={setConsent('marketing')} />
          <div className={s.trTxt}><b>Marketing communication</b><span>Offers, news, and tips from Talentmon.</span></div>
        </div>
        <div className={s.toggleRow}>
          <Toggle checked={!!consent.analytics} onChange={setConsent('analytics')} />
          <div className={s.trTxt}><b>Analytics cookies</b><span>Help us improve the platform.</span></div>
        </div>
        <div className={s.toggleRow}>
          <Toggle checked={!!consent.behavioral} onChange={setConsent('behavioral')} />
          <div className={s.trTxt}><b>Personalized recommendations by behavior</b><span>Uses your browsing history for better job suggestions.</span></div>
        </div>
      </div>

      <div className={s.card}>
        <h3>Danger zone</h3>
        <div className={s.csub}>These actions affect your account's visibility and existence</div>
        <div className={s.dangerRow}>
          <div><b>Pause account</b><span>Temporarily hide your profile from companies. You can come back anytime.</span></div>
          <button className={s.btnSm} disabled={pausing} onClick={handlePause}>{pausing ? 'Pausing…' : 'Pause'}</button>
        </div>
        <div className={`${s.dangerRow} ${s.dangerDel}`}>
          <div><b>Delete account</b><span>Permanently deletes your profile, ratings, and login history — cannot be undone.</span></div>
          <button className={`${s.btnSm} ${s.btnRed}`} onClick={onDeleteRequest}>Delete account</button>
        </div>
      </div>

      {showUnlockLog && <UnlockLogModal onClose={() => setShowUnlockLog(false)} />}
    </>
  );
};

// ── APPEARANCE TAB ────────────────────────────────────────────────────────────
const THEME_TO_BACKEND = { light: 'LIGHT', dark: 'DARK', sys: 'SYSTEM' };
const THEME_TO_FRONTEND = { LIGHT: 'light', DARK: 'dark', SYSTEM: 'sys' };

const AppearanceTab = ({ prefs, onSavePrefs }) => {
  const theme = prefs ? THEME_TO_FRONTEND[prefs.theme] || 'sys' : 'sys';
  const [textSize, setTextSize] = useState(100);

  useEffect(() => {
    if (prefs?.textSize) setTextSize(prefs.textSize);
  }, [prefs?.textSize]);

  const THEMES = [
    { id: 'light', label: 'Light', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round"/></svg> },
    { id: 'dark',  label: 'Dark',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg> },
    { id: 'sys',   label: 'System', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg> },
  ];

  return (
    <>
      <div className={s.card}>
        <h3>Theme</h3>
        <div className={s.csub}>Interface appearance</div>
        <div className={s.seg}>
          {THEMES.map(t => (
            <button key={t.id} className={theme === t.id ? s.on : undefined} onClick={() => onSavePrefs({ theme: THEME_TO_BACKEND[t.id] })}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={s.card}>
        <h3>Motion & animations</h3>
        <div className={s.csub}>For motion sensitivity</div>
        <div className={s.toggleRow} style={{ borderTop: 'none', paddingTop: 0 }}>
          <Toggle checked={!!prefs?.reduceMotion} onChange={e => onSavePrefs({ reduceMotion: e.target.checked })} />
          <div className={s.trTxt}><b>Reduce animations</b><span>Turns off transitions and motion effects across the platform.</span></div>
        </div>
      </div>

      <div className={s.card}>
        <h3>Text size</h3>
        <div className={s.csub}>Adjust interface readability</div>
        <div className={s.rangeRow}>
          <span style={{ fontSize: '.78rem', color: '#566776' }}>A</span>
          <input
            type="range"
            min="80"
            max="130"
            value={textSize}
            onChange={e => setTextSize(Number(e.target.value))}
            onMouseUp={() => onSavePrefs({ textSize })}
            onTouchEnd={() => onSavePrefs({ textSize })}
          />
          <span style={{ fontSize: '1.1rem', color: '#566776' }}>A</span>
          <span className={s.rv}>{textSize}%</span>
        </div>
      </div>
    </>
  );
};

// ── HELP TAB ──────────────────────────────────────────────────────────────────
const HelpTab = () => {
  const links = [
    { label: 'Help center',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.9.4-1 1-1 2.2" strokeLinecap="round"/><path d="M12 17h.01"/></svg> },
    { label: 'Terms of service', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4zM8 4v16M4 9h4"/></svg> },
    { label: 'Privacy policy',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5z"/></svg> },
    { label: 'Report a problem', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg> },
    { label: 'Contact support',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg> },
  ];

  const ChevronRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6"/>
    </svg>
  );

  return (
    <div className={s.card}>
      <h3>Help & legal</h3>
      <div className={s.csub}>Support, terms of service, and privacy policy</div>
      {links.map(l => (
        <div key={l.label} className={s.linkRow}>
          <span className={s.linkL}>{l.icon}{l.label}</span>
          <span className={s.linkGo}><ChevronRight /></span>
        </div>
      ))}
    </div>
  );
};

// ── UNLOCK LOG MODAL ──────────────────────────────────────────────────────────
// NOTE: mock data — there's no candidate-facing "who unlocked me" endpoint yet.
const UNLOCK_LOG = [
  { company: 'Nordwave', date: 'Jul 2, 2026', position: 'Senior Frontend Developer' },
  { company: 'HR Plus Agency', date: 'Jun 28, 2026', position: 'Full Stack Engineer' },
  { company: 'Banca Intesa', date: 'Jun 20, 2026', position: 'IT Specialist' },
  { company: 'Levi9 Serbia', date: 'Jun 14, 2026', position: 'React Developer' },
  { company: 'Comtrade Group', date: 'Jun 5, 2026', position: 'Software Engineer' },
];

const UnlockLogModal = ({ onClose }) => {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.modalHead}>
          <div>
            <h3>Unlock log</h3>
            <p>Companies that unlocked your profile in the last 90 days.</p>
          </div>
          <button className={s.modalClose} onClick={onClose}><XIcon /></button>
        </div>
        <div className={s.modalBody}>
          {UNLOCK_LOG.length === 0 ? (
            <p style={{ color: '#8693A0', fontSize: '.9rem', textAlign: 'center', padding: '24px 0' }}>
              No unlocks in the last 90 days.
            </p>
          ) : (
            <div className={s.unlockList}>
              {UNLOCK_LOG.map((entry, i) => (
                <div key={i} className={s.unlockRow}>
                  <div className={s.unlockAvatar}>{entry.company[0]}</div>
                  <div className={s.unlockInfo}>
                    <b>{entry.company}</b>
                    <span>{entry.position}</span>
                  </div>
                  <div className={s.unlockDate}>{entry.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── DELETE MODAL ──────────────────────────────────────────────────────────────
const DeleteModal = ({ onClose, onConfirm, busy }) => {
  const [input, setInput] = useState('');
  const CONFIRM_WORD = 'DELETE';
  const ready = input.trim() === CONFIRM_WORD;

  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.modalHead}>
          <div>
            <h3>Delete account</h3>
            <p>This action is permanent and cannot be undone.</p>
          </div>
          <button className={s.modalClose} onClick={onClose}><XIcon /></button>
        </div>
        <div className={s.modalBody}>
          <div className={s.warnBox}>
            Deleting your account permanently removes your profile, company ratings, application history, and messages.
            Companies that already unlocked you keep the CV they downloaded.
          </div>
          <p>To confirm, type <b>{CONFIRM_WORD}</b> in the field below.</p>
          <input
            className={s.finput}
            placeholder={CONFIRM_WORD}
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
          />
          <div className={s.modalFoot}>
            <button className={s.btnGhost} onClick={onClose}>Cancel</button>
            <button className={`${s.btnSm} ${s.btnRed}`} disabled={!ready || busy} onClick={onConfirm}>
              {busy ? 'Deleting…' : 'Permanently delete account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── PAGE ──────────────────────────────────────────────────────────────────────
const CandidateSettings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const clerk = useClerk();
  const [toast, fireToast] = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [search, setSearch] = useState('');

  // Shared across Account+Appearance (same `account-preferences` resource) and
  // Notifications+Data-consents (same `notification-prefs` resource) so both
  // tabs read/write one in-memory copy instead of racing separate fetches.
  const [prefs, setPrefs] = useState(null);
  const [notif, setNotif] = useState(null);

  useEffect(() => {
    getAccountPreferences().then(setPrefs).catch(() => {});
    // `notification-prefs` is a freeform JSON blob with no server-side
    // defaults — a first-time candidate gets `{}` back, so sensible defaults
    // are merged in here rather than everything rendering as switched off.
    getNotificationPrefs().then((data) => setNotif({ ...DEFAULT_NOTIF, ...data })).catch(() => {});
  }, []);

  const savePrefs = (patch) => {
    setPrefs((p) => ({ ...p, ...patch }));
    updateAccountPreferences(patch).catch(() => fireToast('Could not save — please try again.'));
  };
  const saveNotif = (patch) => {
    setNotif((p) => ({ ...p, ...patch }));
    updateNotificationPrefs(patch).catch(() => fireToast('Could not save — please try again.'));
  };

  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return TABS.find(t => t.id === tab) ? tab : 'account';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setShowDelete(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const filteredTabs = TABS.filter(t =>
    !search || t.label.toLowerCase().includes(search.toLowerCase()) || t.sub.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = async () => {
    setDeleteBusy(true);
    try {
      await deleteAccount();
      await clerk.signOut();
      navigate('/');
    } catch {
      setDeleteBusy(false);
      fireToast('Could not delete account — please try again.');
    }
  };

  return (
    <div className={s.page}>
      <Helmet><title>Settings · Talentmon</title></Helmet>
      <CandidateHeader />

      <div className={s.wrap}>
        <div className={s.phead}>
          <div>
            <h1>Settings</h1>
            <p>Account, privacy, notifications, and security — separate from your profile content.</p>
          </div>
          <button className={s.btnPrimary} onClick={() => fireToast('All changes saved')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <path d="M5 4h11l3 3v13H5zM9 4v5h6V4"/>
            </svg>
            Save all
          </button>
        </div>

        <div className={s.layout}>
          <nav className={s.sidenav} aria-label="Settings navigation">
            <div className={s.snavSearch}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5" strokeLinecap="round"/></svg>
              <input placeholder="Search settings…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {filteredTabs.map(tab => (
              <button
                key={tab.id}
                className={`${s.snav}${activeTab === tab.id ? ` ${s.active}` : ''}`}
                onClick={() => { setActiveTab(tab.id); setSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <span className={s.snavIc}>{tab.icon}</span>
                <span className={s.snavLabel}>
                  <b>{tab.label}</b>
                  <span className={s.snavSub}>{tab.sub}</span>
                </span>
              </button>
            ))}
          </nav>

          <div>
            {activeTab === 'account'    && <AccountTab prefs={prefs} onSavePrefs={savePrefs} fireToast={fireToast} />}
            {activeTab === 'privacy'    && <PrivacyTab fireToast={fireToast} />}
            {activeTab === 'notif'      && <NotifTab notif={notif} onSaveNotif={saveNotif} />}
            {activeTab === 'security'   && <SecurityTab />}
            {activeTab === 'data'       && <DataTab notif={notif} onSaveNotif={saveNotif} onDeleteRequest={() => setShowDelete(true)} fireToast={fireToast} />}
            {activeTab === 'appearance' && <AppearanceTab prefs={prefs} onSavePrefs={savePrefs} />}
            {activeTab === 'help'       && <HelpTab />}
          </div>
        </div>
      </div>

      {showDelete && (
        <DeleteModal
          onClose={() => setShowDelete(false)}
          onConfirm={handleDeleteConfirm}
          busy={deleteBusy}
        />
      )}

      <Toast msg={toast.msg} show={toast.show} />
    </div>
  );
};

export default CandidateSettings;
