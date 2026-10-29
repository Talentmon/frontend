import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import { useCurrentUser } from 'lib/CurrentUserContext';
import {
  listPaymentMethods,
  paymentMethodToFrontend,
  removePaymentMethod,
} from '../creditsApi';
import styles from '../styles/credits.module.scss';

const cardLabel = (method) => (method?.last4 ? `${method.brand} ending in ${method.last4}` : method?.brand);

const CardChip = () => (
  <svg className={styles.pmChip} viewBox="0 0 38 28" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="1" y="1" width="36" height="26" rx="5" />
    <path d="M12 1v26M26 1v26M1 10h11M1 18h11M26 10h11M26 18h11" />
  </svg>
);

const Contactless = () => (
  <svg className={styles.pmWaves} viewBox="0 0 16 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M3 7.5a4.5 4.5 0 0 1 0 5M7 5a9 9 0 0 1 0 10M11 2.5a13.5 13.5 0 0 1 0 15" />
  </svg>
);

// The card the company buys on, drawn as a card; a dashed outline until one is saved.
const CardFace = ({ method }) => (
  <div className={`${styles.pmFace} ${method ? styles.filled : ''}`} aria-hidden="true">
    <div className={styles.pmFaceTop}>
      <CardChip />
      <Contactless />
    </div>
    {method ? (
      <>
        <div className={styles.pmFaceNumber}>
          <span>•••• •••• ••••</span>
          {method.last4 ? <b>{method.last4}</b> : <span>••••</span>}
        </div>
        <div className={styles.pmFaceBottom}>
          <b>{method.brand}</b>
          {method.expiry && <span>{method.expiry}</span>}
        </div>
      </>
    ) : (
      <>
        <div className={styles.pmFaceNumber}><span>•••• •••• •••• ••••</span></div>
        <div className={styles.pmFaceBottom}>
          <i className={styles.pmBarLong} />
          <i className={styles.pmBarShort} />
        </div>
      </>
    )}
  </div>
);

const SECURITY_POINTS = [
  { icon: <Icon name="Lock" size={16} strokeWidth={1.75} />, title: 'Encrypted payments', text: 'Every payment is protected with SSL encryption.' },
  {
    icon: <Icon name="Database" size={16} strokeWidth={1.75}><path d="m3 3 18 18" /></Icon>,
    title: 'Not stored on our servers',
    text: 'Your card details never sit on our servers.',
  },
  { icon: <Icon name="Award" size={16} strokeWidth={1.75} />, title: 'PCI DSS compliant', text: 'Payments are handled by Paddle, a PCI DSS compliant provider.' },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="2" width="12" height="20" rx="2.5" />
        <path d="m9.5 12.2 1.8 1.8 3.2-3.5" />
      </svg>
    ),
    title: '3D Secure',
    text: 'Your bank can ask you to confirm a payment.',
  },
];

// Cards belong to the company: anyone on the team pays with them or saves a new one at checkout,
// only the owner removes them.
// Paddle saves a card only when it's paid with at checkout (its portal can't add one), so "add a card" means "buy Credits".
const PaymentMethods = ({ onNotify = () => {}, onBuy }) => {
  const { isCompanyOwner } = useCurrentUser();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(false);
    listPaymentMethods()
      .then((rows) => setPaymentMethods(rows.map(paymentMethodToFrontend)))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRemoveMethod = async (method) => {
    if (!window.confirm(`Remove ${cardLabel(method)}?`)) return;

    const rest = paymentMethods.filter((m) => m.id !== method.id);
    setPaymentMethods(rest);
    if (rest.length === 0) setListOpen(false);
    try {
      await removePaymentMethod(method.id);
      onNotify(`${cardLabel(method)} has been removed`);
    } catch {
      onNotify('Could not remove card — please try again.');
      load();
    }
  };

  const primary = paymentMethods[0];
  const others = paymentMethods.length - 1;
  // The owner opens the list to remove cards (even the only one); the rest of the team only to see them.
  const listToggle = isCompanyOwner
    ? { closed: 'Manage cards', open: 'Done' }
    : others > 0 && { closed: 'See other cards', open: 'Hide other cards' };

  let main;
  if (loading) {
    main = (
      <>
        <CardFace />
        <p className={styles.pmText}>Loading your cards…</p>
      </>
    );
  } else if (loadError) {
    main = (
      <>
        <CardFace />
        <h3 className={styles.pmTitle}>Couldn’t load your cards</h3>
        <p className={styles.pmText}>Check your connection and try again.</p>
        <div className={styles.pmActions}>
          <button type="button" className={styles.pmBtnOutline} onClick={load}>Try again</button>
        </div>
      </>
    );
  } else if (!primary) {
    main = (
      <>
        <CardFace />
        <h3 className={styles.pmTitle}>No saved cards yet</h3>
        <p className={styles.pmText}>
          Your card is saved the first time you buy Credits — just tick the box to save it at checkout. After that it’s
          ready at every checkout, so you won’t need to type it in again.
        </p>
        <div className={styles.pmActions}>
          <button type="button" className={styles.pmBtnDark} onClick={onBuy}>
            <Icon name="Plus" size={16} />Buy Credits
          </button>
        </div>
      </>
    );
  } else {
    main = (
      <>
        <CardFace method={primary} />
        {/* Paddle has no "default card" setting, so the badge only shows while one card is saved — the one checkout offers. */}
        <h3 className={styles.pmTitle}>
          {cardLabel(primary)}
          {others === 0 && <span className={styles.pmBadge}>Default</span>}
        </h3>
        <p className={styles.pmText}>
          {primary.expiryFull && `Expires ${primary.expiryFull}. `}
          {others === 0
            ? 'Ready at checkout whenever you buy Credits.'
            : `${others} more ${others === 1 ? 'card' : 'cards'} saved — pick one at checkout.`}
        </p>

        {listToggle && (
          <div className={styles.pmActions}>
            <button
              type="button"
              className={styles.pmBtnOutline}
              onClick={() => setListOpen((v) => !v)}
              aria-expanded={listOpen}
              aria-controls="pm-saved-cards"
            >
              {listOpen ? listToggle.open : listToggle.closed}
            </button>
          </div>
        )}
        <p className={styles.pmNote}>
          <Icon name="Info" size={14} />To add another card, pay with it at checkout and tick the box to save it.
        </p>
        {!isCompanyOwner && (
          <p className={styles.pmNote}>
            <Icon name="Lock" size={14} />Only the account owner can remove cards.
          </p>
        )}

        {listToggle && listOpen && (
          <ul className={styles.pmList} id="pm-saved-cards" aria-label="Saved cards">
            {paymentMethods.map((method) => (
              <li key={method.id}>
                <span className={styles.pmListIcon}><Icon name="CreditCard" size={16} /></span>
                <div className={styles.pmListBody}>
                  <b>{cardLabel(method)}</b>
                  {method.expiryFull && <span>Expires {method.expiryFull}</span>}
                </div>
                {isCompanyOwner && (
                  <button type="button" className={styles.pmRemove} onClick={() => handleRemoveMethod(method)}>
                    <Icon name="Trash2" size={14} />Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  return (
    <div className={styles.pmPanel}>
      <div className={styles.pmHead}>
        <h2>Payment methods</h2>
        <p>Manage the cards you use to buy Credits.</p>
      </div>

      <div className={styles.pmGrid}>
        <div className={styles.pmMain}>{main}</div>

        <aside className={styles.pmSecurity} aria-label="Payment security">
          <h3><Icon name="ShieldCheck" size={18} strokeWidth={1.75} />Payment security</h3>
          <ul>
            {SECURITY_POINTS.map((point) => (
              <li key={point.title}>
                <span className={styles.pmSecIcon}>{point.icon}</span>
                <div>
                  <b>{point.title}</b>
                  <span>{point.text}</span>
                </div>
              </li>
            ))}
          </ul>
          <a href="/privacy-policy#payments-and-card-security" target="_blank" rel="noreferrer" className={styles.pmSecLink}>
            Learn more about security <Icon name="ExternalLink" size={14} />
          </a>
        </aside>
      </div>
    </div>
  );
};

export default PaymentMethods;
