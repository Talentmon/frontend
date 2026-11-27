import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';
import styles from './notFound.module.scss';

// In the public pages' ink-and-gold look (landing, login).
const NotFound = () => {
  const navigate = useNavigate();

  // Opened straight from a link there's nothing to go back to, so go home instead.
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Page not found · Talentmon</title>
      </Helmet>

      <header className={styles.bar}>
        <Link to="/" className={styles.brand}>
          <span className={styles.mark}><img src="/assets/images/talentmon.png" alt="" /></span>
          <span>Talent<b>mon</b></span>
        </Link>
      </header>

      <main className={styles.main}>
        <span className={styles.code} aria-hidden="true">404</span>
        <h1>Page not found</h1>
        <p>The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={goBack}>
            <Icon name="ArrowLeft" size={17} />
            Go back
          </button>
          <Link to="/" className={styles.btnGold}>
            <Icon name="Home" size={17} />
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
