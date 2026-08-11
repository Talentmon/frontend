import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import Select from 'components/ui/Select';
import { formatSalary } from '../../candidate-search-dashboard/utils/cvHelpers';
import styles from '../styles/purchased.module.scss';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interviewed', label: 'Interviewed' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' }
];

const STATUS_CLASS = {
  new: 'sNew',
  contacted: 'sContacted',
  interviewed: 'sInterviewed',
  hired: 'sHired',
  rejected: 'sRejected'
};

const PurchasedProfilesTable = ({
  profiles,
  onStatusChange,
  onContactCopy,
  onCvDownload,
  onViewDetails,
  onUpdateNotes,
  activePreviewId = null
}) => {
  const [sortConfig, setSortConfig] = useState({ key: 'unlockedDate', direction: 'desc' });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [notesOpenId, setNotesOpenId] = useState(null);
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');

  const handleToggleNotes = (profile) => {
    if (notesOpenId === profile?.id) {
      setNotesOpenId(null);
      return;
    }
    setNotesOpenId(profile?.id);
    setNotesDraft(profile?.notes || '');
    setEditingNotesId(profile?.notes ? null : profile?.id);
  };

  const handleSaveNotes = (profileId) => {
    onUpdateNotes?.(profileId, notesDraft);
    setEditingNotesId(null);
  };

  const handleDeleteNotes = (profileId) => {
    setNotesDraft('');
    onUpdateNotes?.(profileId, '');
    setEditingNotesId(profileId);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig?.key === key && sortConfig?.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProfiles = React.useMemo(() => {
    let sortableProfiles = [...profiles];
    if (sortConfig?.key) {
      // expectedSalary is a {amount, currency, base, ...} object - always
      // compare its base-EUR value, never the object itself.
      const valueOf = (profile) =>
        sortConfig?.key === 'expectedSalary' ? (profile?.expectedSalary?.base ?? 0) : profile?.[sortConfig?.key];
      sortableProfiles?.sort((a, b) => {
        const av = valueOf(a);
        const bv = valueOf(b);
        if (av < bv) {
          return sortConfig?.direction === 'asc' ? -1 : 1;
        }
        if (av > bv) {
          return sortConfig?.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProfiles;
  }, [profiles, sortConfig]);

  const totalItems = sortedProfiles?.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedProfiles = sortedProfiles?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig?.key !== columnKey) {
      return <Icon name="ArrowUpDown" size={14} />;
    }
    return sortConfig?.direction === 'asc'
      ? <Icon name="ArrowUp" size={14} />
      : <Icon name="ArrowDown" size={14} />;
  };

  return (
    <div className={styles.ptable}>
      <table>
        <thead>
          <tr>
            <th>
              <button className={styles.sortBtn} onClick={() => handleSort('name')}>
                <span>Candidate</span>{getSortIcon('name')}
              </button>
            </th>
            <th>
              <button className={styles.sortBtn} onClick={() => handleSort('position')}>
                <span>Position</span>{getSortIcon('position')}
              </button>
            </th>
            <th>
              <button className={styles.sortBtn} onClick={() => handleSort('experience')}>
                <span>Experience</span>{getSortIcon('experience')}
              </button>
            </th>
            <th>
              <button className={styles.sortBtn} onClick={() => handleSort('expectedSalary')}>
                <span>Salary</span>{getSortIcon('expectedSalary')}
              </button>
            </th>
            <th>
              <button className={styles.sortBtn} onClick={() => handleSort('unlockedDate')}>
                <span>Unlocked</span>{getSortIcon('unlockedDate')}
              </button>
            </th>
            <th>Status</th>
            <th>Contact</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedProfiles?.map((profile) => (
            <React.Fragment key={profile?.id}>
            <tr className={profile?.id === activePreviewId ? styles.rowActive : ''}>
              <td>
                <div className={styles.tcCand}>
                  <span className={styles.tcAv}>
                    <Image src={profile?.avatar} alt={profile?.name} />
                  </span>
                  <div>
                    <b>{profile?.name}</b>
                  </div>
                </div>
              </td>
              <td>
                <div>{profile?.position}</div>
              </td>
              <td>{profile?.experience} years</td>
              <td>{formatSalary(profile?.expectedSalary)}</td>
              <td className={styles.pcDate}>{formatDate(profile?.unlockedDate)}</td>
              <td>
                <span className={`${styles.status} ${styles[STATUS_CLASS?.[profile?.recruitmentStatus]]}`}>
                  <select
                    value={profile?.recruitmentStatus}
                    onChange={(e) => {
                      onStatusChange(profile?.id, e?.target?.value);
                      e?.target?.blur();
                    }}
                  >
                    {STATUS_OPTIONS?.map((opt) => (
                      <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                    ))}
                  </select>
                </span>
              </td>
              <td>
                <div className={styles.tcContact}>
                  <div>
                    <span>{profile?.email}</span>
                    <button className={styles.copyBtn} onClick={() => onContactCopy(profile?.email)} aria-label="Copy email">
                      <Icon name="Copy" size={13} />
                    </button>
                  </div>
                  <div>
                    <span>{profile?.phone}</span>
                    <button className={styles.copyBtn} onClick={() => onContactCopy(profile?.phone)} aria-label="Copy phone">
                      <Icon name="Copy" size={13} />
                    </button>
                  </div>
                </div>
              </td>
              <td>
                <div className={styles.tcAct}>
                  <button
                    className={`${styles.iconBtn} ${profile?.id === activePreviewId ? styles.iconBtnPreview : ''}`}
                    onClick={() => onViewDetails(profile?.id)}
                    title="Preview"
                    aria-pressed={profile?.id === activePreviewId}
                  >
                    <Icon name="Eye" size={15} />
                  </button>
                  <button className={styles.iconBtn} onClick={() => onCvDownload(profile?.id)} title="CV">
                    <Icon name="Download" size={15} />
                  </button>
                  <button
                    className={`${styles.iconBtn} ${profile?.notes ? styles.iconBtnActive : ''}`}
                    onClick={() => handleToggleNotes(profile)}
                    title="Notes"
                    aria-expanded={notesOpenId === profile?.id}
                  >
                    <Icon name="Pencil" size={15} />
                  </button>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={8} className={styles.notesCell}>
                <div className={`${styles.notesWrap} ${notesOpenId === profile?.id ? styles.open : ''}`}>
                  <div className={styles.bcNotesInner}>
                    <div className={styles.notesRow}>
                      <div className={styles.bcNotes}>
                        {editingNotesId === profile?.id ? (
                          <>
                            <textarea
                              value={notesDraft}
                              onChange={(e) => setNotesDraft(e?.target?.value)}
                              placeholder="Add a note about the candidate..."
                              className={styles.bcNotesTextarea}
                              rows={3}
                            />
                            <button className={styles.bcNotesSave} onClick={() => handleSaveNotes(profile?.id)}>
                              <Icon name="Check" size={14} />
                              Save
                            </button>
                          </>
                        ) : (
                          <>
                            <p className={styles.bcNotesText}>{profile?.notes}</p>
                            <div className={styles.bcNotesActions}>
                              <button className={styles.bcNotesEdit} onClick={() => setEditingNotesId(profile?.id)}>
                                <Icon name="Pencil" size={13} />
                                Edit
                              </button>
                              <button
                                className={`${styles.bcNotesDelete} ${styles.tooltip}`}
                                onClick={() => handleDeleteNotes(profile?.id)}
                                data-tooltip="Delete note"
                                aria-label="Delete note"
                              >
                                <Icon name="X" size={15} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {totalItems > 0 && (
        <div className={styles.pagBar}>
          <span className={styles.pagInfo}>
            Showing {rangeStart}–{rangeEnd} of {totalItems} candidates
          </span>
          <div className={styles.pagControls}>
            <Select
              className={styles.pagSizeSelect}
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setCurrentPage(1);
              }}
              options={[
                { value: 5, label: '5 per page' },
                { value: 10, label: '10 per page' },
                { value: 15, label: '15 per page' },
              ]}
            />
            <div className={styles.pagNav}>
              <button
                className={styles.pagArrow}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <Icon name="ChevronLeft" size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)?.map((page) => (
                <button
                  key={page}
                  className={`${styles.pagBtn} ${page === currentPage ? styles.on : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className={styles.pagArrow}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              >
                <Icon name="ChevronRight" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      {profiles?.length === 0 && (
        <div className={styles.emptyState}>
          <Icon name="Users" size={48} />
          <h3>No unlocked profiles</h3>
          <p>Unlocked profiles will appear here after purchase.</p>
        </div>
      )}
    </div>
  );
};

export default PurchasedProfilesTable;
