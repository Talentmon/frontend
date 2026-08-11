import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import { getUsageAnalytics } from '../creditsApi';
import styles from '../styles/credits.module.scss';

const PERIOD_TO_MONTHS = { '3months': 3, '6months': 6, '12months': 12 };

const UsageAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [monthlyUsageData, setMonthlyUsageData] = useState([]);
  const [hiresInvestmentData, setHiresInvestmentData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getUsageAnalytics(PERIOD_TO_MONTHS[selectedPeriod])
      .then(({ monthlyUsage, hiresInvestment }) => {
        setMonthlyUsageData(monthlyUsage);
        setHiresInvestmentData(hiresInvestment);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedPeriod]);

  const periodOptions = [
    { value: '3months', label: 'Last 3 months' },
    { value: '6months', label: 'Last 6 months' },
    { value: '12months', label: 'Last year' }
  ];

  const totalCreditsUsed = monthlyUsageData?.reduce((sum, month) => sum + month?.used, 0);
  const totalCreditsPurchased = monthlyUsageData?.reduce((sum, month) => sum + month?.purchased, 0);
  const averageMonthlyUsage = monthlyUsageData?.length ? Math.round(totalCreditsUsed / monthlyUsageData.length) : 0;
  const totalHires = hiresInvestmentData?.reduce((sum, month) => sum + month?.hires, 0);

  return (
    <div>
      <div className={styles.analyticsHead}>
        <div>
          <h3>Usage analytics</h3>
          <p>Overview of trends and Credits usage efficiency</p>
        </div>

        <Select value={selectedPeriod} onChange={setSelectedPeriod} options={periodOptions} />
      </div>
      {/* Key Metrics */}
      <div className={styles.kpis4}>
        <div className={styles.kpi}>
          <span className={`${styles.kpiIcon} ${styles.k1}`}><Icon name="TrendingUp" size={20} /></span>
          <div className={styles.kpiNum}>{totalCreditsUsed}</div>
          <div className={styles.kpiLbl}>Credits used</div>
        </div>

        <div className={styles.kpi}>
          <span className={`${styles.kpiIcon} ${styles.k2}`}><Icon name="ShoppingCart" size={20} /></span>
          <div className={styles.kpiNum}>{totalCreditsPurchased}</div>
          <div className={styles.kpiLbl}>Credits purchased</div>
        </div>

        <div className={styles.kpi}>
          <span className={`${styles.kpiIcon} ${styles.k3}`}><Icon name="Calendar" size={20} /></span>
          <div className={styles.kpiNum}>{averageMonthlyUsage}</div>
          <div className={styles.kpiLbl}>average monthly</div>
        </div>

        <div className={styles.kpi}>
          <span className={`${styles.kpiIcon} ${styles.k4}`}><Icon name="Users" size={20} /></span>
          <div className={styles.kpiNum}>{totalHires}</div>
          <div className={styles.kpiLbl}>candidates hired</div>
        </div>
      </div>
      {/* Charts Grid */}
      <div className={styles.grid2}>
        {/* Monthly Usage Chart */}
        <div className={styles.chartCard}>
          <h4>Monthly Credits usage</h4>
          <div className={styles.chartBox}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EA" />
                <XAxis dataKey="month" stroke="#8693A0" fontSize={12} />
                <YAxis stroke="#8693A0" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E4E7EA',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="purchased" fill="#2f9e69" name="Purchased" />
                <Bar dataKey="used" fill="#E6A93C" name="Used" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Investment & Hires Chart */}
        <div className={styles.chartCard}>
          <h4>Investment and hires</h4>
          <div className={styles.chartBox}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hiresInvestmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EA" />
                <XAxis dataKey="month" stroke="#8693A0" fontSize={12} />
                <YAxis yAxisId="investment" stroke="#E6A93C" fontSize={12} />
                <YAxis yAxisId="hires" orientation="right" stroke="#2f9e69" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E4E7EA',
                    borderRadius: '8px'
                  }}
                />
                <Line yAxisId="hires" type="monotone" dataKey="hires" stroke="#2f9e69" strokeWidth={2} name="Hires" />
                <Line yAxisId="investment" type="monotone" dataKey="investment" stroke="#E6A93C" strokeWidth={2} name="Investment (€)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommendations */}
        <div className={styles.chartCard}>
          <h4>Recommendations</h4>
          <div className={styles.recs}>
            <div className={styles.rec}>
              <span className={`${styles.recIcon} ${styles.r1}`}><Icon name="TrendingUp" size={16} /></span>
              <div className={styles.recBody}>
                <b>Track your trend</b>
                <span>{averageMonthlyUsage} Credits/month on average over this period.</span>
              </div>
            </div>

            <div className={styles.rec}>
              <span className={`${styles.recIcon} ${styles.r3}`}><Icon name="Users" size={16} /></span>
              <div className={styles.recBody}>
                <b>Hires</b>
                <span>{totalHires} candidate{totalHires === 1 ? '' : 's'} hired in this period.</span>
              </div>
            </div>

            <div className={styles.rec}>
              <span className={`${styles.recIcon} ${styles.r2}`}><Icon name="AlertTriangle" size={16} /></span>
              <div className={styles.recBody}>
                <b>Auto-renewal</b>
                <span>Enable auto-renewal so you never run out of Credits.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageAnalytics;
