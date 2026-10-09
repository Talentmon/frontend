import React, { useCallback, useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import { useCurrentUser } from 'lib/CurrentUserContext';
import { listTeam, getTeamSeats, inviteTeamMember, resendTeamInvite, removeTeamMember } from '../companyApi';
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

const TeamManagementTab = ({ fireToast }) => {
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

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>Team members</div>
        <div className={styles.cardSub}>
          Everyone shares this company profile and credit balance, but each person signs in with their own account — and
          every unlock, bookmark and purchase shows who made it.
        </div>

        {loading ? (
          <div className={styles.emptyTeam}>Loading…</div>
        ) : team.length === 0 ? (
          <div className={styles.emptyTeam}>No team members yet.</div>
        ) : (
          team.map((member) => {
            const isOwner = member.role === 'Owner';
            const meta = metaLine(member);
            return (
              <div className={styles.teamRow} key={member.id}>
                <div className={`${styles.teamAvatar}${isOwner ? ` ${styles.owner}` : ''}`}>
                  {initials(member.name || member.email)}
                </div>
                <div className={styles.teamInfo}>
                  <div className={styles.teamName}>
                    {member.name || member.email}
                    {member.isYou && <span className={styles.youTag}>(you)</span>}
                  </div>
                  {member.name && <div className={styles.teamEmail}>{member.email}</div>}
                  {meta && (
                    <div className={`${styles.teamMeta}${member.status === 'expired' ? ` ${styles.expired}` : ''}`}>{meta}</div>
                  )}
                </div>
                <div className={styles.teamBadges}>
                  <span className={`${styles.roleBadge}${isOwner ? ` ${styles.owner}` : ''}`}>{member.role}</span>
                  <span className={`${styles.statusBadge} ${styles[member.status]}`}>{STATUS_LABEL[member.status]}</span>
                  {isCompanyOwner && member.status !== 'active' && (
                    <button
                      type="button"
                      className={styles.teamAction}
                      disabled={busyId === member.id}
                      onClick={() => handleResend(member)}
                    >
                      Resend
                    </button>
                  )}
                  {isCompanyOwner && !isOwner && (
                    <button
                      type="button"
                      className={styles.teamRemove}
                      title={member.status === 'active' ? 'Remove member' : 'Cancel invite'}
                      disabled={busyId === member.id}
                      onClick={() => handleRemove(member)}
                    >
                      <Icon name="Trash2" size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isCompanyOwner ? (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Invite member</div>
          <div className={styles.cardSub}>
            They&apos;ll get an email with a link to set their name and password and join this company — the link is valid for
            7 days. Each person can belong to only one company.
          </div>

          {seatLimit !== undefined && (
            <div className={`${styles.seatInfo}${seatsFull ? ` ${styles.full}` : ''}`}>
              <Icon name="Users" size={15} />
              {seatLimit === null ? (
                <span>Companies with 1000+ employees can add as many team accounts as they need.</span>
              ) : seatsFull ? (
                <span>
                  <b>{team.length} of {seatLimit}</b> team accounts used — the maximum for a company with {SIZE_RANGE[company?.size] || 'your'} employees.
                  Cancel a pending invite or remove a member to add someone new.
                </span>
              ) : (
                <span>
                  <b>{team.length} of {seatLimit}</b> team accounts used (pending invites included) — you can invite{' '}
                  <b>{seatLimit - team.length}</b> more.
                </span>
              )}
            </div>
          )}

          <form className={styles.inviteRow} onSubmit={handleInvite}>
            <div className={styles.field}>
              <label className={styles.flabel}>Email</label>
              <input
                className={styles.finput}
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                disabled={seatsFull}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); }}
              />
            </div>
            <div className={styles.field} style={{ maxWidth: 180 }}>
              <label className={styles.flabel}>Role</label>
              <div className={styles.roleStatic}>Recruiter</div>
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={inviteBusy || seatsFull}>
              <Icon name="Send" size={15} />{inviteBusy ? 'Sending…' : 'Send'}
            </button>
          </form>
          {inviteError && <div className={styles.counter} style={{ color: '#cf4b4b', textAlign: 'left', marginTop: 8 }}>{inviteError}</div>}
          {justInvited && !inviteError && (
            <div className={styles.counter} style={{ color: '#2f9e69', textAlign: 'left', marginTop: 8 }}>Invite sent to {justInvited}.</div>
          )}
        </div>
      ) : (
        <div className={styles.readOnlyNote}>
          <Icon name="Lock" size={15} />
          Only the account owner can invite or remove team members.
        </div>
      )}
    </div>
  );
};

export default TeamManagementTab;
