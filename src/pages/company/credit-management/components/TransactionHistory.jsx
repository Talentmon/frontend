import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import { getTransactions, transactionToFrontend } from '../creditsApi';
import styles from '../styles/credits.module.scss';

const TYPE_TO_BACKEND = { purchase: 'PURCHASE', unlock: 'UNLOCK' };

const TransactionHistory = () => {
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTransactions({ type: TYPE_TO_BACKEND[filterType], sort: sortBy })
      .then((data) => setTransactions(data.items.map(transactionToFrontend)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterType, sortBy]);

  const filterOptions = [
    { value: 'all', label: 'All transactions' },
    { value: 'purchase', label: 'Purchases' },
    { value: 'unlock', label: 'Unlocks' }
  ];

  const sortOptions = [
    { value: 'date-desc', label: 'Newest first' },
    { value: 'date-asc', label: 'Oldest first' },
    { value: 'amount-desc', label: 'Highest amount' },
    { value: 'amount-asc', label: 'Lowest amount' }
  ];

  const filteredTransactions = transactions;

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })?.format(date);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'purchase':
        return 'Plus';
      case 'unlock':
        return 'Unlock';
      default:
        return 'Activity';
    }
  };

  const getTransactionClass = (type) => (type === 'purchase' ? 'buy' : 'spend');

  return (
    <div className={styles.histCard}>
      <div className={styles.histHead}>
        <div>
          <h3>Transaction history</h3>
          <p>Overview of all Credits purchases and usage</p>
        </div>

        <div className={styles.histFilters}>
          <Select value={filterType} onChange={setFilterType} options={filterOptions} />
          <Select value={sortBy} onChange={setSortBy} options={sortOptions} />
        </div>
      </div>

      <div>
        {loading ? (
          <div className={styles.histEmpty}>
            <p>Loading…</p>
          </div>
        ) : filteredTransactions?.length === 0 ? (
          <div className={styles.histEmpty}>
            <Icon name="Receipt" size={48} />
            <p>No transactions to display</p>
          </div>
        ) : (
          <div className={styles.histList}>
            {filteredTransactions?.map((transaction) => {
              const cls = getTransactionClass(transaction?.type);

              return (
                <div key={transaction?.id} className={styles.htx}>
                  <span className={`${styles.hi} ${styles[cls]}`}>
                    <Icon name={getTransactionIcon(transaction?.type)} size={20} />
                  </span>

                  <div className={styles.hd}>
                    <b>{transaction?.description}</b>
                    <span>{formatDate(transaction?.date)}</span>
                  </div>

                  <div className={styles.ha}>
                    <div className={`${styles.haAmt} ${styles[cls]}`}>
                      {transaction?.amount > 0 ? '+' : ''}{transaction?.amount} Credits
                    </div>
                    {transaction?.cost && (
                      <div className={styles.haCost}>{transaction?.cost?.toLocaleString('en-US')} {transaction?.currency || 'EUR'}</div>
                    )}
                    <div className={styles.haBal}>Balance: {transaction?.balanceAfter} Credits</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filteredTransactions?.length > 0 && (
        <div className={styles.histFoot}>
          <span>Showing {filteredTransactions?.length} transactions</span>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
