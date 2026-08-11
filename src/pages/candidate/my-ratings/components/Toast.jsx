import React, { useEffect, useState } from 'react';
import styles from '../styles/myRatings.module.scss';

const Toast = ({ msg, actionLabel, onAction, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!msg) { setVisible(false); return; }
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }, 4500);
    return () => clearTimeout(t);
  }, [msg]);

  const handleAction = () => {
    setVisible(false);
    onAction?.();
  };

  return (
    <div className={styles.toastHost} aria-live="polite" aria-atomic="true">
      <div className={`${styles.toast} ${visible ? styles.toastIn : ''}`} role="status">
        <span>{msg}</span>
        {actionLabel && (
          <button className={styles.toastAction} onClick={handleAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
