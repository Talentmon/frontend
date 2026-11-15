import React, { useCallback, useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import { useCurrentUser } from 'lib/CurrentUserContext';
import {
  listTeam,
  getTeamSeats,
  inviteTeamMember,
  resendTeamInvite,
  removeTeamMember,
  getTransferPreview,
  transferOwnership,
} from '../companyApi';
import SectionHead from './SectionHead';
import TransferOwnershipModal from './TransferOwnershipModal';
import styles from '../styles/company.module.scss';

const initials = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
};

const shortDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/** Backend TeamRole/TeamMemberStatus are uppercase enums — mapped here to the display shape this tab renders. */
const memberToFrontend = (m) => ({
  id: m.id,
  name: m.name || '',
  email: m.email,
  role: m.role === 'OWNER' ? 'Owner' : 'Recruiter',
  status: m.status === 'PENDING' ? (m.inviteExpired ? 'expired' : 'pending') : 'active',
  isYou: !!m.isYou,
  invitedAt: m.invitedAt,
  inviteExpiresAt: m.inviteExpiresAt,
  joinedAt: m.joinedAt,
});

const STATUS_LABEL = { active: 'Active', pending: 'Pending', expired: 'Expired' };

const SIZE_RANGE = { SMALL: '1–50', MID: '51–200', LARGE: '201–1000', ENTERPRISE: '1000+' };

const metaLine = (member) => {
  if (member.status === 'pending') return `Invited ${shortDate(member.invitedAt)} · link valid until ${shortDate(member.inviteExpiresAt)}`;
  if (member.status === 'expired') return 'Invite link expired — resend it to send a new one';
  if (member.role !== 'Owner' && member.joinedAt) return `Joined ${shortDate(member.joinedAt)}`;
  return '';
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// `onOpenAccount`: switches to Account settings, where you add your own name.
const TeamManagementTab = ({ fireToast, onOwnershipTransferred, onOpenAccount }) => {
  const { isCompanyOwner, company } = useCurrentUser();
  // undefined until loaded; null = no cap (1000+ employees). Used seats = the list itself (active + pending).
  const [seatLimit, setSeatLimit] = useState(undefined);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [justInvited, setJustInvited] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [transferTo, setTransferTo] = useState(null);
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferFit, setTransferFit] = useState(null);

  const loadTeam = useCallback(
    () =>
      listTeam()
        .then((rows) => setTeam(rows.map(memberToFrontend)))
        .catch(() => fireToast?.('Could not load your team — please refresh.')),
    [fireToast],
  );

  useEffect(() => {
    loadTeam().finally(() => setLoading(false));
    if (isCompanyOwner) getTeamSeats().then(({ limit }) => setSeatLimit(limit)).catch(() => {});
  }, [loadTeam, isCompanyOwner]);

  const seatsFull = typeof seatLimit === 'number' && team.length >= seatLimit;
  const seatsLeft = typeof seatLimit === 'number' ? Math.max(0, seatLimit - team.length) : null;

  const handleInvite = async (e) => {
    e?.preventDefault();
    const email = inviteEmail.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      setInviteError('Enter a valid email address.');
      return;
    }
    if (team.some((m) => (m.email || '').toLowerCase() === email)) {
      setInviteError('This person is already on the team or has an invite.');
      return;
    }

    setInviteBusy(true);
    try {
      const row = await inviteTeamMember(email);
      setTeam((prev) => [...prev, memberToFrontend(row)]);
      setInviteEmail('');
      setInviteError('');
      setJustInvited(email);
      setTimeout(() => setJustInvited(''), 4000);
    } catch (err) {
      setInviteError(err?.response?.data?.message || 'Could not send invite — please try again.');
    } finally {
      setInviteBusy(false);
    }
  };

  const handleResend = async (member) => {
    setBusyId(member.id);
    try {
      const row = await resendTeamInvite(member.id);
      setTeam((prev) => prev.map((m) => (m.id === member.id ? memberToFrontend(row) : m)));
      fireToast?.(`New invite sent to ${member.email}`);
    } catch (err) {
      fireToast?.(err?.response?.data?.message || 'Could not resend the invite — please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (member) => {
    const isInvite = member.status !== 'active';
    const confirmed = window.confirm(
      isInvite
        ? `Cancel the invite for ${member.email}? The link in their email stops working.`
        : `Remove ${member.name || member.email} from the team?\n\nThey lose access right away and their login is deleted. Everything they unlocked stays with the company. Their personal bookmarks move to the company list — any that don't fit are removed, oldest first.`,
    );
    if (!confirmed) return;

    setBusyId(member.id);
    try {
      const { bookmarksRemoved } = await removeTeamMember(member.id);
      setTeam((prev) => prev.filter((m) => m.id !== member.id));
      fireToast?.(
        isInvite
          ? `Invite for ${member.email} cancelled`
          : `${member.name || member.email} removed from the team` +
              (bookmarksRemoved > 0 ? ` · ${bookmarksRemoved} of their bookmarks didn't fit the company list and were removed` : ''),
      );
    } catch (err) {
      fireToast?.(err?.response?.data?.message || 'Could not remove — please try again.');
      loadTeam();
    } finally {
      setBusyId(null);
    }
  };

  const openTransfer = (member) => {
    setTransferError('');
    setTransferFit(null);
    setTransferTo(member);
    getTransferPreview(member.id)
      .then(setTransferFit)
      .catch((err) => setTransferError(err?.response?.data?.message || 'Could not check their bookmarks — please try again.'));
  };

  const handleTransfer = async (password) => {
    setTransferBusy(true);
    setTransferError('');
    try {
      await transferOwnership(transferTo.id, password);
      fireToast?.(`${transferTo.name || transferTo.email} is now the account owner`);
      setTransferTo(null);
      loadTeam();
      onOwnershipTransferred?.();
    } catch (err) {
      setTransferError(err?.response?.data?.message || 'Could not transfer ownership — please try again.');
    } finally {
      setTransferBusy(false);
    }
  };

  // Seats used, beside the Team members title — the owner's view only (the seats call is owner-only).
  let seatMeter = null;
  if (isCompanyOwner && typeof seatLimit === 'number') {
    seatMeter = (
      <div
        className={styles.seatMeter}
        role="meter"
        aria-label="Team seats used"
        aria-valuemin={0}
        aria-valuemax={seatLimit}
        aria-valuenow={Math.min(team.length, seatLimit)}
      >
        <span className={`${styles.seatDots}${seatLimit > 5 ? ` ${styles.seatDotsMany}` : ''}`} aria-hidden="true">
          {Array.from({ length: seatLimit }, (_, i) => (
            <span key={i} className={i < team.length ? styles.seatOn : undefined} />
          ))}
        </span>
        <span><b>{team.length} of {seatLimit}</b> seats used</span>
      </div>
    );
  } else if (isCompanyOwner && seatLimit === null) {
    seatMeter = (
      <div className={styles.seatMeter}>
        <span><b>{plural(team.length, 'person', 'people')}</b> · no seat limit</span>
      </div>
    );
  }

  let inviteSubtitle = 'They join this company with their own login.';
  if (seatLimit === null) inviteSubtitle = 'Companies with 1000+ employees can add as many people as they need.';
  else if (seatsLeft === 0) inviteSubtitle = 'All seats are taken.';
  else if (seatsLeft !== null) inviteSubtitle = `You can invite ${plural(seatsLeft, 'more person', 'more people')}.`;

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <SectionHead icon="Users" title="Team members" subtitle="People who work in this company account." aside={seatMeter} />

        <p className={styles.teamIntro}>
          Everyone shares this company profile and credit balance, but signs in with their own account. Every unlock,
          bookmark and purchase shows who made it.
        </p>

        <ul className={styles.memberList} aria-label="Team members">
          {loading ? (
            <li className={styles.emptyTeam}>Loading…</li>
          ) : team.length === 0 ? (
            <li className={styles.emptyTeam}>No team members yet.</li>
          ) : (
            team.map((member) => {
              const isOwner = member.role === 'Owner';
              const invited = member.status !== 'active';
              const meta = metaLine(member);
              const busy = busyId === member.id;
              return (
                <li className={styles.teamRow} key={member.id}>
                  <span
                    className={`${styles.teamAvatar}${isOwner ? ` ${styles.owner}` : ''}${invited ? ` ${styles.invited}` : ''}`}
                    aria-hidden="true"
                  >
                    {invited ? <Icon name="Mail" size={17} /> : initials(member.name || member.email)}
                  </span>
                  <div className={styles.teamInfo}>
                    <div className={styles.teamName}>
                      <span className={styles.teamNameText}>{member.name || member.email}</span>
                      {member.isYou && <span className={styles.youTag}>(you)</span>}
                    </div>
                    {member.name && <div className={styles.teamEmail}>{member.email}</div>}
                    {member.isYou && !member.name && (
                      <div className={styles.teamMeta}>
                        No name yet.{' '}
                        <button type="button" className={styles.fhintLink} onClick={onOpenAccount}>Add your name</button>
                      </div>
                    )}
                    {meta && (
                      <div className={`${styles.teamMeta}${member.status === 'expired' ? ` ${styles.expired}` : ''}`}>{meta}</div>
                    )}
                  </div>
                  <div className={styles.teamBadges}>
                    <span className={`${styles.roleBadge}${isOwner ? ` ${styles.owner}` : ''}`}>{member.role}</span>
                    <span className={`${styles.statusBadge} ${styles[member.status]}`}>{STATUS_LABEL[member.status]}</span>
                    {isCompanyOwner && invited && (
                      <button
                        type="button"
                        className={styles.teamIconBtn}
                        title="Resend invite"
                        aria-label={`Resend invite to ${member.email}`}
                        disabled={busy}
                        onClick={() => handleResend(member)}
                      >
                        <Icon name="RotateCw" size={15} strokeWidth={2.1} />
                      </button>
                    )}
                    {isCompanyOwner && !isOwner && !invited && (
                      <button
                        type="button"
                        className={styles.teamAction}
                        title="Hand the company account over to this person"
                        disabled={busy}
                        onClick={() => openTransfer(member)}
                      >
                        Make owner
                      </button>
                    )}
                    {isCompanyOwner && !isOwner && (
                      <button
                        type="button"
                        className={invited ? styles.teamIconBtn : styles.teamRemove}
                        title={invited ? 'Cancel invite' : 'Remove member'}
                        aria-label={invited ? `Cancel invite for ${member.email}` : `Remove ${member.name || member.email}`}
                        disabled={busy}
                        onClick={() => handleRemove(member)}
                      >
                        <Icon name={invited ? 'X' : 'Trash2'} size={15} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {isCompanyOwner ? (
        <div className={styles.card}>
          <SectionHead icon="UserPlus" title="Invite a teammate" subtitle={inviteSubtitle} />

          <form className={styles.inviteRow} onSubmit={handleInvite}>
            <div className={styles.field}>
              <label className={styles.flabel} htmlFor="inviteEmail">Email</label>
              <div className={styles.inputIcon}>
                <Icon name="Mail" size={16} />
                <input
                  id="inviteEmail"
                  className={inviteError ? `${styles.finput} ${styles.finvalid}` : styles.finput}
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  disabled={seatsFull}
                  aria-invalid={!!inviteError}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); }}
                />
              </div>
            </div>
            <div className={styles.field}>
              <span className={styles.flabel}>Role</span>
              <div className={styles.roleStatic} title="Everyone you invite joins as a Recruiter">
                Recruiter
                <span className={styles.inputLock}><Icon name="Lock" size={15} /></span>
              </div>
            </div>
            <button type="submit" className={styles.btnGold} disabled={inviteBusy || seatsFull}>
              <Icon name="Send" size={16} strokeWidth={2.2} />{inviteBusy ? 'Sending…' : 'Send invite'}
            </button>
          </form>

          {inviteError && (
            <span className={styles.ferr}>
              <Icon name="AlertCircle" size={13} strokeWidth={2.2} />
              {inviteError}
            </span>
          )}
          {justInvited && !inviteError && (
            <p className={styles.okMsg} role="status">
              <Icon name="Check" size={14} strokeWidth={2.6} />
              Invite sent to {justInvited}
            </p>
          )}

          {seatsFull && (
            <p className={styles.seatFull} role="status">
              <Icon name="Info" size={15} />
              All {seatLimit} seats are taken — the maximum for a company with {SIZE_RANGE[company?.size] || 'your'} employees.
              Cancel a pending invite or remove a member to free one up.
            </p>
          )}

          <ul className={styles.bullets}>
            <li>They get an email with a link to set their name and password. The link works for 7 days.</li>
            <li>Each person can belong to only one company.</li>
            {typeof seatLimit === 'number' && <li>Pending invites count toward your {seatLimit} seats.</li>}
          </ul>
        </div>
      ) : (
        <div className={styles.readOnlyNote}>
          <Icon name="Lock" size={15} />
          Only the account owner can invite or remove team members.
        </div>
      )}

      <TransferOwnershipModal
        member={transferTo}
        fit={transferFit}
        busy={transferBusy}
        error={transferError}
        onClose={() => setTransferTo(null)}
        onConfirm={handleTransfer}
      />
    </div>
  );
};

export default TeamManagementTab;
