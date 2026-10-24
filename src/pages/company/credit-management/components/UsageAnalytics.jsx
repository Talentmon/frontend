import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from 'components/AppIcon';
import { creditWord } from 'utils/formatCredits';
import { formatPrice, getUsageAnalytics } from '../creditsApi';
import styles from '../styles/credits.module.scss';

// months: 0 = all time.
const PERIODS = [
  { months: 3, label: '3 months' },
  { months: 6, label: '6 months' },
  { months: 12, label: '12 months' },
  { months: 0, label: 'All time' }
];

// Same order, names and colors as the status picker and "Candidate status" chart on the Purchased page.
const STAGES = [
  { key: 'NEW', label: 'New', tone: 'stageNew' },
  { key: 'CONTACTED', label: 'Contacted', tone: 'stageContacted' },
  { key: 'INTERVIEWED', label: 'Interviewed', tone: 'stageInterviewed' },
  { key: 'HIRED', label: 'Hired', tone: 'stageHired' },
  { key: 'REJECTED', label: 'Rejected', tone: 'stageRejected' }
];

// Unlocked in the neutral ink, so blue keeps meaning "Interviewed"; green = hired on both cards.
const UNLOCKED_COLOR = '#10243a';
const HIRED_COLOR = '#2f9e69';
const AXIS = { fill: '#566776', fontSize: 12 };

const percent = (share) => `${Math.round(share * 100)}%`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const runwayText = (months) =>
  months < 1 ? 'less than a month' : months >= 12 ? 'over a year' : `about ${plural(Math.round(months), 'month')}`;

const paceText = ({ perMonth, runwayMonths }, balance) => {
  if (!perMonth) return 'No profiles unlocked in this period';
  const average = `Avg. ${perMonth} ${perMonth === 1 ? 'unlock' : 'unlocks'} a month`;
  if (!balance || runwayMonths === null) return average;
  return `${average} · your ${balance} ${creditWord(balance)} will last ${runwayText(runwayMonths)} at this pace`;
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.anTip}>
      <b>{label}</b>
      {payload.map((p) => (
        <span key={p.dataKey}>
          <i style={{ background: p.color }} />
          {p.name}
          <strong>{p.value}</strong>
        </span>
      ))}
    </div>
  );
};

const Kpi = ({ label, value, unit, hint, dark }) => (
  <div className={`${styles.anKpi} ${dark ? styles.anKpiDark : ''}`}>
    <span className={styles.anKpiLabel}>{label}</span>
    <span className={styles.anKpiValue}>
      {value}
      {unit && <span className={styles.anKpiUnit}>{unit}</span>}
    </span>
    <span className={styles.anKpiHint}>{hint}</span>
  </div>
);

const UsageAnalytics = () => {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stale = false;
    setLoading(true);
    setFailed(false);
    getUsageAnalytics(months)
      .then((d) => { if (!stale) setData(d); })
      .catch(() => { if (!stale) setFailed(true); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [months]);

  const isEmpty = data?.allTime.unlocked === 0;

  const renderBody = () => {
    const { totals, stages, monthly, pace, team, staleNew, balance, currency } = data;
    const notHired = totals.unlocked - totals.hires;

    return (
      // The previous period stays on screen, dimmed, while the next one loads.
      <div className={loading ? styles.anBusy : ''}>
        {staleNew.count > 0 && (
          <div className={styles.anNotice}>
            <span className={styles.anNoticeIcon} aria-hidden="true"><Icon name="Clock" size={18} /></span>
            <p>
              <b>{plural(staleNew.count, 'unlocked profile')}</b> {staleNew.count === 1 ? 'has' : 'have'} been at New for over {staleNew.days} days.
            </p>
            <Link to="/purchased-profiles?status=new" className={styles.anNoticeLink}>
              Review<Icon name="ChevronRight" size={16} />
            </Link>
          </div>
        )}

        <div className={styles.anKpis}>
          <Kpi
            dark
            label="Hire rate"
            value={totals.hireRate === null ? '—' : percent(totals.hireRate)}
            hint={totals.unlocked ? `${totals.hires} of ${plural(totals.unlocked, 'profile')} hired` : 'No profiles unlocked yet'}
          />
          <Kpi
            label="Profiles unlocked"
            value={totals.unlocked}
            hint={totals.spent !== null ? `${formatPrice(totals.spent, currency)} in Credits` : `${totals.unlocked} ${creditWord(totals.unlocked)} spent`}
          />
          <Kpi
            label="Hires"
            value={totals.hires}
            hint={totals.hires ? 'Marked Hired so far' : <Link to="/purchased-profiles">Mark hires on Purchased</Link>}
          />
          <Kpi
            label="Cost per hire"
            value={totals.costPerHire === null ? '—' : formatPrice(totals.costPerHire, currency)}
            hint={totals.hires ? 'Credits spent ÷ hires' : 'Shown after your first hire'}
          />
          <Kpi
            label="Time to hire"
            value={totals.medianDaysToHire ?? '—'}
            unit={totals.medianDaysToHire === null ? null : (totals.medianDaysToHire === 1 ? 'day' : 'days')}
            hint={totals.medianDaysToHire === null ? 'Shown after your first hire' : 'Median, unlock to hire'}
          />
        </div>

        <div className={styles.anGrid}>
          <section className={styles.anCard} aria-labelledby="an-monthly-title">
            <div className={styles.anCardHead}>
              <div>
                <h3 className={styles.anCardTitle} id="an-monthly-title">Unlocked profiles by month</h3>
                <p className={styles.anCardSub}>{paceText(pace, balance)}</p>
              </div>
              <ul className={styles.anLegend}>
                <li><i style={{ background: UNLOCKED_COLOR }} />Unlocked</li>
                <li><i style={{ background: HIRED_COLOR }} />Hired so far</li>
              </ul>
            </div>

            <div className={styles.anChart} aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} barGap={2} barCategoryGap="22%" margin={{ top: 6, right: 4, bottom: 0, left: -14 }}>
                  <CartesianGrid vertical={false} stroke="#E4E7EA" />
                  <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#D5DAE0' }} tick={AXIS} tickMargin={8} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS} width={44} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(11, 26, 44, 0.04)' }} />
                  <Bar dataKey="unlocked" name="Unlocked" fill={UNLOCKED_COLOR} radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="hired" name="Hired so far" fill={HIRED_COLOR} radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <table className="sr-only">
              <caption>Unlocked profiles and hires by month</caption>
              <thead>
                <tr><th scope="col">Month</th><th scope="col">Unlocked</th><th scope="col">Hired so far</th></tr>
              </thead>
              <tbody>
                {monthly.map((m, i) => (
                  <tr key={i}><th scope="row">{m.month}</th><td>{m.unlocked}</td><td>{m.hired}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={styles.anCard} aria-labelledby="an-stages-title">
            <h3 className={styles.anCardTitle} id="an-stages-title">Where your unlocked profiles are</h3>
            <p className={styles.anCardSub}>
              {totals.unlocked ? `Current stage of the ${plural(totals.unlocked, 'profile')} unlocked in this period` : 'No profiles unlocked in this period'}
            </p>

            {totals.unlocked > 0 && (
              <>
                <ul className={styles.anStages}>
                  {STAGES.map((stage) => {
                    const count = stages[stage.key];
                    const share = count / totals.unlocked;
                    return (
                      <li key={stage.key} className={styles.anStage}>
                        <span className={styles.anStageLabel}>{stage.label}</span>
                        <span className={styles.anStageTrack}>
                          <span className={`${styles.anStageFill} ${styles[stage.tone]}`} style={{ width: percent(share) }} />
                        </span>
                        <span className={styles.anStageCount}>
                          {count}<small>{percent(share)}</small>
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {notHired > 0 && (
                  <p className={styles.anFoot}>
                    <Icon name="FolderOpen" size={17} aria-hidden="true" />
                    <span>
                      <b>{plural(notHired, 'profile')}</b> not hired {notHired === 1 ? 'stays' : 'stay'} on your Purchased page, worth a look when a new position opens.
                    </span>
                    <Link to="/purchased-profiles">Open</Link>
                  </p>
                )}
              </>
            )}
          </section>
        </div>

        {team && (
          <section className={styles.memberCard} aria-labelledby="an-team-title">
            <h3 className={styles.memberCardTitle} id="an-team-title">Team activity</h3>
            <p className={styles.memberCardSub}>
              Profiles each person unlocked in this period, how many were hired, and what those Credits were worth
            </p>
            <div className={styles.memberTableWrap}>
              <table className={styles.memberTable}>
                <thead>
                  <tr>
                    <th scope="col">Member</th>
                    <th scope="col" className={styles.memberNum}>Unlocked</th>
                    <th scope="col" className={styles.memberNum}>Hired</th>
                    <th scope="col" className={styles.memberNum}>Hire rate</th>
                    <th scope="col" className={styles.memberNum}>Credits value</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member) => (
                    <tr key={member.id}>
                      <td>
                        {member.name}
                        {member.removed && <span className={styles.memberFormer}> (former member)</span>}
                      </td>
                      <td className={styles.memberNum} data-label="Unlocked">{member.unlocked}</td>
                      <td className={styles.memberNum} data-label="Hired">{member.hired}</td>
                      <td className={styles.memberNum} data-label="Hire rate">
                        {member.unlocked ? percent(member.hired / member.unlocked) : '—'}
                      </td>
                      <td className={styles.memberNum} data-label="Credits value">
                        {member.spent === null ? '—' : formatPrice(member.spent, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className={styles.anHead}>
        <div>
          <h2>Hiring analytics</h2>
          <p>The profiles you unlocked and what came of them</p>
        </div>

        {!isEmpty && (
          <div className={`${styles.histSeg} ${styles.anPeriod}`} role="group" aria-label="Period">
            {PERIODS.map((period) => (
              <button
                key={period.months}
                type="button"
                className={`${styles.histSegBtn} ${months === period.months ? styles.on : ''}`}
                aria-pressed={months === period.months}
                onClick={() => setMonths(period.months)}
              >
                {period.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {failed ? (
        <div className={styles.anCard}>
          <p className={styles.anMuted}>Couldn't load analytics. Please try again in a moment.</p>
        </div>
      ) : !data ? (
        <div className={styles.anCard}>
          <p className={styles.anMuted}>Loading…</p>
        </div>
      ) : isEmpty ? (
        <div className={`${styles.anCard} ${styles.anEmpty}`}>
          <span className={styles.anEmptyIcon} aria-hidden="true"><Icon name="BarChart3" size={28} /></span>
          <h3>No hiring data yet</h3>
          <p>
            Unlock candidate profiles and track them on the Purchased page. Your hire rate, cost per hire and time to hire
            will show up here.
          </p>
          <Link to="/candidate-search-dashboard" className={styles.btnPrimary}>
            <Icon name="Search" size={16} />Find candidates
          </Link>
        </div>
      ) : (
        renderBody()
      )}
    </div>
  );
};

export default UsageAnalytics;
