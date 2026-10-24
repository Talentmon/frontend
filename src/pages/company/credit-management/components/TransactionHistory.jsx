import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import { creditWord } from 'utils/formatCredits';
import { formatPrice, getTransactions, transactionToFrontend } from '../creditsApi';
import styles from '../styles/credits.module.scss';

const TYPE_TO_BACKEND = { purchase: 'PURCHASE', unlock: 'UNLOCK' };
const PAGE_SIZE = 20;
// The backend's max page size — the CSV export walks every page at this size.
const EXPORT_PAGE_SIZE = 100;

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'unlock', label: 'Unlocks' }
];

const sortOptions = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'amount-desc', label: 'Highest amount' },
  { value: 'amount-asc', label: 'Lowest amount' }
];

const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

const actorLabel = (actor) => actor && `by ${actor.name}${actor.removed ? ' (former member)' : ''}`;

/** Consecutive rows from the same day under one date heading — the list is already sorted by date. */
const groupByDay = (items) =>
  items.reduce((groups, t) => {
    const day = dayFormat.format(t.date);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(t);
    else groups.push({ day, items: [t] });
    return groups;
  }, []);

const csvCell = (value) => {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const pad = (n) => String(n).padStart(2, '0');
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const downloadCsv = (rows) => {
  const header = ['Date', 'Time', 'Type', 'Description', 'Credits', 'Amount', 'Currency', 'Balance', 'By'];
  const lines = rows.map((t) => [
    isoDay(t.date),
    timeFormat.format(t.date),
    t.type === 'purchase' ? 'Purchase' : 'Unlock',
    t.description,
    t.amount,
    t.cost ?? '',
    t.cost ? t.currency : '',
    t.balanceAfter,
    t.actor?.name ?? ''
  ]);
  // BOM so Excel opens it as UTF-8 (names with č, ć, š…).
  const csv = '﻿' + [header, ...lines].map((line) => line.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `talentmon-transactions-${isoDay(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const TransactionHistory = ({ balance }) => {
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);

  const query = { type: TYPE_TO_BACKEND[filterType], sort: sortBy };

  useEffect(() => {
    let stale = false;
    setLoading(true);
    getTransactions({ ...query, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        if (stale) return;
        setTransactions(data.items.map(transactionToFrontend));
        setTotal(data.total);
        setPage(1);
        setSummary(data.summary);
      })
      .catch(() => {})
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [filterType, sortBy]);

  const loadMore = () => {
    setLoadingMore(true);
    getTransactions({ ...query, page: page + 1, limit: PAGE_SIZE })
      .then((data) => {
        setTransactions((prev) => [...prev, ...data.items.map(transactionToFrontend)]);
        setPage(page + 1);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = [];
      for (let p = 1, totalPages = 1; p <= totalPages; p++) {
        const data = await getTransactions({ ...query, page: p, limit: EXPORT_PAGE_SIZE });
        rows.push(...data.items.map(transactionToFrontend));
        totalPages = data.totalPages;
      }
      downloadCsv(rows);
    } catch {
      // Nothing downloaded — the button is ready to try again.
    } finally {
      setExporting(false);
    }
  };

  // Amount sorts mix days, so the date moves from a group heading into each row.
  const byDate = sortBy.startsWith('date');
  const groups = byDate ? groupByDay(transactions) : [{ day: null, items: transactions }];

  const renderRow = (t) => {
    const isPurchase = t.type === 'purchase';
    const tone = isPurchase ? (t.bundle ? styles.gold : styles.buy) : styles.spend;
    const when = byDate ? timeFormat.format(t.date) : `${dayFormat.format(t.date)}, ${timeFormat.format(t.date)}`;

    return (
      <tr key={t.id} className={styles.htRow}>
        <td className={styles.htMainCell}>
          <div className={styles.htMain}>
            <span className={`${styles.hi} ${tone}`} aria-hidden="true">
              <Icon name={isPurchase ? 'Plus' : 'Unlock'} size={18} />
            </span>
            <span className={styles.htText}>
              <span className={styles.htName}>
                <b>{t.description}</b>
                <span className={`${styles.htBadge} ${isPurchase ? styles.buy : styles.spend}`}>
                  {isPurchase ? 'Purchase' : 'Unlock'}
                </span>
              </span>
              <span className={styles.htMeta}>
                {[when, actorLabel(t.actor)].filter(Boolean).join(' · ')}
              </span>
            </span>
          </div>
        </td>
        <td className={`${styles.htNum} ${styles.htCredits} ${isPurchase ? styles.buy : styles.spend}`}>
          {t.amount > 0 ? '+' : '−'}{Math.abs(t.amount)}
        </td>
        <td className={`${styles.htNum} ${styles.htAmount} ${t.cost ? '' : styles.htNoAmount}`}>
          {t.cost ? formatPrice(t.cost, t.currency) : '—'}
        </td>
        <td className={`${styles.htNum} ${styles.htBalance}`}>
          <span className={styles.htMobileLabel}>Balance </span>{t.balanceAfter}
        </td>
      </tr>
    );
  };

  return (
    <div>
      <div className={styles.histTitle}>
        <h2>Transaction history</h2>
        <p>Overview of all Credit purchases and unlocks</p>
      </div>

      <div className={styles.histStats}>
        <div className={`${styles.histStat} ${styles.histStatDark}`}>
          <span className={styles.histStatLabel}>Current balance</span>
          <span className={styles.histStatValue}>
            {balance ?? 0}
            <span className={styles.histStatUnit}>{creditWord(balance ?? 0)}</span>
          </span>
        </div>
        <div className={styles.histStat}>
          <span className={styles.histStatLabel}>Credits purchased</span>
          <span className={styles.histStatValue}>
            {summary ? summary.purchasedCredits : '—'}
            {summary && (
              <span className={styles.histStatUnit}>
                in {summary.purchaseCount} {summary.purchaseCount === 1 ? 'purchase' : 'purchases'}
              </span>
            )}
          </span>
        </div>
        <div className={styles.histStat}>
          <span className={styles.histStatLabel}>Total spent</span>
          <span className={styles.histStatValue}>
            {summary ? formatPrice(summary.spentCents / 100, summary.currency) : '—'}
          </span>
        </div>
      </div>

      {summary?.byMember?.length > 0 && (
        <section className={`${styles.memberCard} ${styles.histMembers}`} aria-labelledby="purchases-by-member-title">
          <h3 className={styles.memberCardTitle} id="purchases-by-member-title">Purchases by member</h3>
          <p className={styles.memberCardSub}>Who on your team bought Credits, and what they paid</p>
          <div className={styles.memberTableWrap}>
            <table className={styles.memberTable}>
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col" className={styles.memberNum}>Purchases</th>
                  <th scope="col" className={styles.memberNum}>Credits</th>
                  <th scope="col" className={styles.memberNum}>Paid</th>
                </tr>
              </thead>
              <tbody>
                {summary.byMember.map((member) => (
                  <tr key={member.id ?? 'not-recorded'}>
                    <td>
                      {member.name}
                      {member.removed && <span className={styles.memberFormer}> (former member)</span>}
                    </td>
                    <td className={styles.memberNum} data-label="Purchases">{member.purchases}</td>
                    <td className={styles.memberNum} data-label="Credits">{member.credits}</td>
                    <td className={styles.memberNum} data-label="Paid">{formatPrice(member.paidCents / 100, summary.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className={styles.histCard}>
        <div className={styles.histHead}>
          <div className={styles.histSeg} role="group" aria-label="Show">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.histSegBtn} ${filterType === option.value ? styles.on : ''}`}
                aria-pressed={filterType === option.value}
                onClick={() => setFilterType(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={styles.histSort}>
            <label htmlFor="history-sort">Sort</label>
            <Select id="history-sort" className={styles.histSortSelect} value={sortBy} onChange={setSortBy} options={sortOptions} />
          </div>
        </div>

        {loading ? (
          <div className={styles.histEmpty}>
            <p>Loading…</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className={styles.histEmpty}>
            <Icon name="Receipt" size={48} />
            <p>No transactions to display</p>
          </div>
        ) : (
          <table className={styles.htTable}>
            <thead>
              <tr className={styles.htCols}>
                <th scope="col">Transaction</th>
                <th scope="col" className={styles.htNum}>Credits</th>
                <th scope="col" className={styles.htNum}>Amount</th>
                <th scope="col" className={styles.htNum}>Balance</th>
              </tr>
            </thead>
            {groups.map((group) => (
              <tbody key={group.day ?? 'all'} className={styles.htGroup}>
                {group.day && (
                  <tr className={styles.htDay}>
                    <th scope="rowgroup" colSpan={4}>{group.day}</th>
                  </tr>
                )}
                {group.items.map(renderRow)}
              </tbody>
            ))}
          </table>
        )}

        {!loading && transactions.length > 0 && (
          <div className={styles.histFoot}>
            <span className={styles.histFootCount}>
              Showing {transactions.length} of {total} {total === 1 ? 'transaction' : 'transactions'}
              {transactions.length < total && (
                <button type="button" className={styles.histMore} onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              )}
            </span>
            <button type="button" className={styles.histExport} onClick={exportCsv} disabled={exporting}>
              <Icon name="Download" size={16} />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
