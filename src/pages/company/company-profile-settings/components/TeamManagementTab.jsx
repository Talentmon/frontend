import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import { listTeam, inviteTeamMember, removeTeamMember } from '../companyApi';
import styles from '../styles/company.module.scss';

const initials = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
};

/** Backend TeamRole/TeamMemberStatus are uppercase enums — mapped here to the display shape this tab was already built around. */
const memberToFrontend = (m) => ({
  id: m.id,
  name: m.name || '',
  email: m.email,
  role: m.role === 'OWNER' ? 'Owner' : 'Recruiter',
  status: m.status === 'PENDING' ? 'pending' : 'active',
});

const TeamManagementTab = ({ companyData, fireToast }) => {
  const [team, setTeam] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const inviteRole = 'Recruiter';
  const [inviteError, setInviteError] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [justInvited, setJustInvited] = useState('');

  useEffect(() => {
    listTeam().then((rows) => setTeam(rows.map(memberToFrontend))).catch(() => {});
  }, []);

  const handleInvite = async (e) => {
    e?.preventDefault();
    const email = inviteEmail.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      setInviteError('Enter a valid email address.');
      return;
    }
    if (team.some((m) => (m.email || '').toLowerCase() === email)) {
      setInviteError('This person is already on the team.');
      return;
    }

    setInviteBusy(true);
    try {
      const row = await inviteTeamMember(email);
      setTeam((prev) => [...prev, memberToFrontend(row)]);
      setInviteEmail('');
      setInviteError('');
      setJustInvited(email);
      setTimeout(() => setJustInvited(''), 3000);
    } catch (err) {
      setInviteError(err?.response?.data?.message || 'Could not send invite — please try again.');
    } finally {
      setInviteBusy(false);
    }
  };

  const handleRemove = async (id) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
    try {
      await removeTeamMember(id);
    } catch {
      fireToast?.('Could not remove — please refresh and try again.');
    }
  };

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>Company ID</div>
        <div className={styles.cardSub}>Colleagues join through an invite tied to this ID — never by guessing your email domain</div>
        <div className={styles.companyIdChip}>
          <Icon name="Fingerprint" size={15} />
          {companyData?.companyId || '—'}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Team members</div>
        <div className={styles.cardSub}>Everyone with access to this company's account</div>

        {team.length === 0 ? (
          <div className={styles.emptyTeam}>No team members yet.</div>
        ) : (
          team.map((member) => {
            const isOwner = member.role === 'Owner';
            return (
              <div className={styles.teamRow} key={member.id}>
                <div className={`${styles.teamAvatar}${isOwner ? ` ${styles.owner}` : ''}`}>
                  {initials(member.name || member.email)}
                </div>
                <div className={styles.teamInfo}>
                  <div className={styles.teamName}>{member.name || member.email}</div>
                  {member.name && <div className={styles.teamEmail}>{member.email}</div>}
                </div>
                <div className={styles.teamBadges}>
                  <span className={`${styles.roleBadge}${isOwner ? ` ${styles.owner}` : ''}`}>{member.role}</span>
                  <span className={`${styles.statusBadge} ${styles[member.status]}`}>
                    {member.status === 'pending' ? 'Pending' : 'Active'}
                  </span>
                  {!isOwner && (
                    <button
                      type="button"
                      className={styles.teamRemove}
                      title={member.status === 'pending' ? 'Cancel invite' : 'Remove member'}
                      onClick={() => handleRemove(member.id)}
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

      <div className={styles.card}>
        <div className={styles.cardTitle}>Invite member</div>
        <div className={styles.cardSub}>They'll get an email to accept, set a password, and join this company automatically</div>

        <form className={styles.inviteRow} onSubmit={handleInvite}>
          <div className={styles.field}>
            <label className={styles.flabel}>Email</label>
            <input
              className={styles.finput}
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); }}
            />
          </div>
          <div className={styles.field} style={{ maxWidth: 180 }}>
            <label className={styles.flabel}>Role</label>
            <div className={styles.roleStatic}>{inviteRole}</div>
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={inviteBusy}>
            <Icon name="Send" size={15} />{inviteBusy ? 'Sending…' : 'Send'}
          </button>
        </form>
        {inviteError && <div className={styles.counter} style={{ color: '#cf4b4b', textAlign: 'left', marginTop: 8 }}>{inviteError}</div>}
        {justInvited && !inviteError && (
          <div className={styles.counter} style={{ color: '#2f9e69', textAlign: 'left', marginTop: 8 }}>Invite sent to {justInvited}.</div>
        )}
      </div>
    </div>
  );
};

export default TeamManagementTab;
