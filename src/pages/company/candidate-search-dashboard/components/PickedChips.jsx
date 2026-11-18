import React from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/dashboard.module.scss';

/**
 * What's picked in a multi-select, as removable pills under the field
 * (Education in Search's sidebar and in Bookmarked / Purchased).
 * `items`: { value, label }[] in the order they're shown.
 */
const PickedChips = ({ items = [], onRemove = () => {}, label = 'Selected' }) => {
  if (!items.length) return null;
  return (
    <ul className={styles.pickedChips} aria-label={label}>
      {items.map((item) => (
        <li key={item.value} className={styles.pickedChip}>
          {item.label}
          <button
            type="button"
            className={styles.pickedChipX}
            aria-label={`Remove ${item.label}`}
            onClick={() => onRemove(item.value)}
          >
            <Icon name="X" size={12} strokeWidth={2.6} />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default PickedChips;
