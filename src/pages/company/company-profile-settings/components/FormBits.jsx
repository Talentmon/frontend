import React from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/company.module.scss';

/** Red line under a field, with an alert icon. Renders nothing without a message. */
export const FieldError = ({ children }) =>
  children ? (
    <span className={styles.ferr}>
      <Icon name="AlertCircle" size={13} strokeWidth={2.2} />
      {children}
    </span>
  ) : null;

/** Grey line under a field; `info` adds the small info icon in front. */
export const Hint = ({ info = false, children }) => (
  <span className={styles.fhint}>
    {info && <Icon name="Info" size={13} />}
    <span>{children}</span>
  </span>
);

/** Small mono label with a rule after it, over a group of fields (Company, Location, Password…). */
export const Group = ({ label, children, grid = true }) => (
  <fieldset className={styles.group}>
    <legend className={styles.legend}><span>{label}</span></legend>
    {grid ? <div className={styles.form2}>{children}</div> : children}
  </fieldset>
);
