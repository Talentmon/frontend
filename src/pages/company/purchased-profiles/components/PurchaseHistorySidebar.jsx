import React, { useState } from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/purchased.module.scss';

const STATUS_LABEL = {
  hired: 'Hired',
  interviewed: 'Interviewed',
  contacted: 'Contacted',
  rejected: 'Rejected',
  new: 'New'
};

const STATUS_CLASS = {
  hired: 'sHired',
  interviewed: 'sInterviewed',
  contacted: 'sContacted',
  rejected: 'sRejected',
  new: 'sNew'
};

const STATUS_COLOR = {
  hired: '#2f9e69',
  interviewed: '#3b6fb0',
  contacted: '#E6A93C',
  rejected: '#cf4b4b',
  new: '#8693A0'
};

const PurchaseHistorySidebar = ({
  purchaseHistory,
  creditAnalytics,
  isCollapsed,
  onToggleCollapse
}) => {
  const [activeTab, setActiveTab] = useState('analytics');

  const monthlySpending = creditAnalytics?.monthlySpending || [];
  const statusDistribution = Object.entries(creditAnalytics?.statusDistribution || {}).map(([key, value]) => ({
    key,
    name: STATUS_LABEL?.[key] || key,
    value,
    color: STATUS_COLOR?.[key] || '#8693A0'
  }));

  const maxCredits = Math.max(1, ...monthlySpending?.map((m) => m?.credits));
  const total = statusDistribution?.reduce((sum, s) => sum + s?.value, 0);

  let acc = 0;
  const donutSegments = statusDistribution?.map((s) => {
    const start = (acc / (total || 1)) * 360;
    acc += s?.value;
    const end = (acc / (total || 1)) * 360;
    return `${s?.color} ${start}deg ${end}deg`;
  });

  if (isCollapsed) {
    return (
      <div className={styles.collapsedSide}>
        <button onClick={onToggleCollapse} aria-label="Expand analytics">
          <Icon name="ChevronLeft" size={20} />
        </button>
        <Icon name="BarChart3" size={18} color="var(--color-primary)" />
        <Icon name="History" size={18} />
      </div>
    );
  }

  return (
    <aside className={styles.side}>
      <div className={styles.scard}>
        <div className={styles.scardHead}>
          <span>Analytics</span>
          <button onClick={onToggleCollapse} aria-label="Hide analytics">
            <Icon name="ChevronRight" size={18} />
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'analytics' ? styles.on : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Icon name="BarChart3" size={16} />
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.on : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Icon name="History" size={16} />
          </button>
        </div>

        {activeTab === 'analytics' ? (
          <div className={styles.kpis}>
            <div className={styles.kpi}>
              <div className={styles.kpiN}>{creditAnalytics?.totalSpent}</div>
              <div className={styles.kpiL}>Total Credits</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiN}>{creditAnalytics?.profilesUnlocked}</div>
              <div className={styles.kpiL}>Profiles unlocked</div>
            </div>
            <div className={styles.kpi}>
              <div className={`${styles.kpiN} ${styles.green}`}>{creditAnalytics?.successfulHires}</div>
              <div className={styles.kpiL}>Hires</div>
            </div>
            <div className={styles.kpi}>
              <div className={`${styles.kpiN} ${styles.gold}`}>{creditAnalytics?.hireRate}%</div>
              <div className={styles.kpiL}>Hire rate</div>
            </div>
          </div>
        ) : (
          <div className={styles.historyList}>
            {purchaseHistory?.map((purchase, index) => (
              <div key={index} className={styles.historyItem}>
                <div className={styles.historyName}>
                  <b>{purchase?.candidateName}</b>
                  <span>– {purchase?.position}</span>
                </div>
                <div className={styles.historyBottom}>
                  <span>{new Date(purchase.date)?.toLocaleDateString('en-GB')}</span>
                  <span className={`${styles.pill} ${styles[STATUS_CLASS?.[purchase?.status]]}`}>
                    {STATUS_LABEL?.[purchase?.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.scard}>
        <div className={styles.scardHead}>Monthly spending</div>
        <div className={styles.spark}>
          {monthlySpending?.map((m, i) => (
            <div
              key={i}
              className={styles.sparkCol}
              style={{ height: `${Math.max((m?.credits / maxCredits) * 100, 6)}%` }}
              title={`${m?.month}: ${m?.credits} Credits`}
            />
          ))}
        </div>
        <div className={styles.sparkX}>
          {monthlySpending?.map((m, i) => <span key={i}>{m?.month}</span>)}
        </div>
      </div>

      <div className={styles.scard}>
        <div className={styles.scardHead}>Candidate status</div>
        <div className={styles.donutWrap}>
          <div className={styles.donut} style={{ background: `conic-gradient(${donutSegments?.join(',')})` }} />
          <div className={styles.legend}>
            {statusDistribution?.map((s, i) => (
              <div key={i} className={styles.legendItem}>
                <span className={styles.dot} style={{ background: s?.color }} />
                <span className={styles.legendName}>{s?.name}</span>
                <span className={styles.v}>{s?.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.scard}>
        <div className={styles.scardHead}>Insights</div>
        <div className={styles.insights}>
          <div className={styles.insight}>
            <Icon name="Clock" size={16} />
            <span>Average time to hire</span>
            <b>{creditAnalytics?.avgTimeToHire !== null && creditAnalytics?.avgTimeToHire !== undefined ? `${creditAnalytics?.avgTimeToHire} days` : '—'}</b>
          </div>
          <div className={styles.insight}>
            <Icon name="Coins" size={16} />
            <span>Credits per hire</span>
            <b>{creditAnalytics?.creditsPerHire ?? '—'}</b>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default PurchaseHistorySidebar;
