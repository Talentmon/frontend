import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import {
  listPaymentMethods,
  paymentMethodToFrontend,
  removePaymentMethod,
  createPaymentMethodPortalSession,
} from '../creditsApi';
import styles from '../styles/credits.module.scss';

const PaymentMethods = ({ onNotify = () => {} }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    listPaymentMethods()
      .then((rows) => setPaymentMethods(rows.map(paymentMethodToFrontend)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemoveMethod = async (methodId) => {
    const removed = paymentMethods?.find((m) => m?.id === methodId);
    if (!window.confirm(`Remove card ${removed?.name}?`)) return;

    setPaymentMethods((prev) => prev?.filter((m) => m?.id !== methodId));
    try {
      await removePaymentMethod(methodId);
      onNotify(`${removed?.name} has been removed`);
    } catch {
      onNotify('Could not remove card — please try again.');
    }
  };

  const handleAddCard = async () => {
    setOpeningPortal(true);
    try {
      const { url } = await createPaymentMethodPortalSession();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      onNotify('Could not open the payment portal — please try again.');
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleContactSales = () => {
    window.location.href = 'mailto:sales@talentmon.rs?subject=Corporate invoicing';
  };

  return (
    <div>
      <div className={styles.settingsCard} style={{ marginBottom: 18 }}>
        <div className={styles.settingsHead}>
          <Icon name="CreditCard" size={24} />
          <div>
            <h3>Payment methods</h3>
            <p>Manage your payment methods for buying Credits</p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--slate)', fontSize: '.88rem' }}>Loading…</p>
        ) : (
          <>
            {paymentMethods?.map((method) => (
              <div key={method?.id} className={styles.pm}>
                <span className={styles.pmIcon}><Icon name="CreditCard" size={20} /></span>
                <div className={styles.pmBody}>
                  <b>{method?.name}</b>
                  <span>Expires {method?.expiry}</span>
                </div>
                <div className={styles.pmActions}>
                  <button className={styles.delBtn} onClick={() => handleRemoveMethod(method?.id)} aria-label="Remove card">
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              </div>
            ))}

            {paymentMethods?.length === 0 && (
              <p style={{ color: 'var(--slate)', fontSize: '.88rem' }}>
                You have no saved payment methods yet — one is saved automatically the first time you buy Credits.
              </p>
            )}
          </>
        )}

        <button className={styles.addCard} onClick={handleAddCard} disabled={openingPortal}>
          <Icon name={openingPortal ? 'Loader2' : 'Plus'} size={16} />
          {openingPortal ? 'Opening…' : 'Add / manage cards'}
        </button>
      </div>

      <div className={styles.grid2} style={{ marginBottom: 0 }}>
        <div className={styles.settingsCard}>
          <div className={styles.corpBox} style={{ background: 'transparent', padding: 0 }}>
            <Icon name="Building2" size={20} />
            <div>
              <b>Corporate invoicing</b>
              <p>For larger companies, we offer corporate invoicing with deferred payment and special discounts.</p>
              <button className={styles.btnGhost} onClick={handleContactSales}>
                <Icon name="Mail" size={15} />Contact sales
              </button>
            </div>
          </div>
        </div>

        <div className={`${styles.settingsCard} ${styles.secure}`}>
          <div className={styles.cardTitle}>Payment security</div>
          <div className={styles.cardSub}>Your data is protected</div>
          <ul>
            <li><Icon name="Check" size={15} />All payments are protected with SSL encryption</li>
            <li><Icon name="Check" size={15} />Card details are not stored on our servers</li>
            <li><Icon name="Check" size={15} />We are compliant with PCI DSS standards</li>
            <li><Icon name="Check" size={15} />We support 3D Secure verification</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
