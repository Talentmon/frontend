import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import cardShieldArt from 'data/pictures/card-shild.webp';
import shieldLockArt from 'data/pictures/shild-lock.webp';
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
    // Open the tab synchronously, inside the click handler, so browsers don't
    // treat it as a popup — then point it at the portal URL once we have it.
    const portalWindow = window.open('', '_blank');
    setOpeningPortal(true);
    try {
      const { url } = await createPaymentMethodPortalSession();
      if (portalWindow) {
        portalWindow.location.href = url;
      } else {
        onNotify('Please allow pop-ups for this site, then try again.');
      }
    } catch {
      portalWindow?.close();
      onNotify('Could not open the payment portal — please try again.');
    } finally {
      setOpeningPortal(false);
    }
  };

  return (
    <div>
      <div className={styles.settingsCard} style={{ marginBottom: 18 }}>
        <div className={styles.pmCardRow}>
          <div className={styles.pmCardMain}>
            <div className={styles.settingsHead}>
              <span className={`${styles.iconBadge} ${styles.peach}`}><Icon name="CreditCard" size={22} /></span>
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
                  <div className={styles.infoBox}>
                    <Icon name="Info" size={16} />
                    <span>You have no saved payment methods yet — one is saved automatically the first time you buy Credits.</span>
                  </div>
                )}
              </>
            )}

            <button className={styles.addCardBox} onClick={handleAddCard} disabled={openingPortal}>
              <Icon name={openingPortal ? 'Loader2' : 'Plus'} size={16} />
              {openingPortal ? 'Opening…' : 'Add / manage cards'}
            </button>
          </div>

          <img src={cardShieldArt} alt="" className={styles.pmCardArt} />
        </div>
      </div>

      <div className={`${styles.settingsCard} ${styles.secure}`} style={{ marginBottom: 0 }}>
        <div className={styles.pmCardRow}>
          <div className={styles.pmCardMain}>
            <div className={styles.settingsHead}>
              <span className={`${styles.iconBadge} ${styles.green}`}><Icon name="ShieldCheck" size={22} /></span>
              <div>
                <h3>Payment security</h3>
                <p>Your data is protected</p>
              </div>
            </div>
            <ul className={styles.secureGrid}>
              <li><Icon name="Check" size={15} />All payments are protected with SSL encryption</li>
              <li><Icon name="Check" size={15} />Card details are not stored on our servers</li>
              <li><Icon name="Check" size={15} />We are compliant with PCI DSS standards</li>
              <li><Icon name="Check" size={15} />We support 3D Secure verification</li>
            </ul>
          </div>

          <img src={shieldLockArt} alt="" className={`${styles.pmCardArt} ${styles.artSmall}`} />
        </div>
      </div>

      <div className={styles.securityFooter}>
        <Icon name="Lock" size={16} />
        <span>Your security is our priority. We use industry-leading measures to protect your payment information.</span>
        <a href="/privacy-policy" className={styles.securityFooterLink}>
          Learn more about security <Icon name="ExternalLink" size={14} />
        </a>
      </div>
    </div>
  );
};

export default PaymentMethods;
