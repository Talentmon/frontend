import React from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/dashboard.module.scss';

const Toast = ({ message }) => (
  <div className={`${styles.toast} ${message ? styles.show : ''}`}>
    <Icon name="CheckCircle2" size={17} />
    <span>{message}</span>
  </div>
);

export default Toast;
