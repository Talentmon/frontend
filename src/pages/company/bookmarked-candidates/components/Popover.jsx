import React, { useEffect, useRef } from 'react';
import styles from '../styles/bookmarked.module.scss';

/**
 * A trigger with a panel under it - the filter pills and the Sort menu.
 * The parent keeps which one is open, so only one is at a time. Escape closes
 * it and puts focus back on the trigger; so does a click outside, except in a
 * Select/Combobox list opened from inside the panel (those are portaled to
 * <body> and marked data-floating-menu). While such a list is open, Escape
 * closes only the list; the next one closes the panel. The panel takes Escape
 * first (capture) and marks it handled, so a CV drawer behind it stays open.
 */
const Popover = ({
  id,
  label,
  open,
  onToggle,
  onClose,
  renderTrigger,
  align = 'left',
  width,
  padded = false,
  role = 'dialog',
  // Extra class on the root, e.g. to fill a grid cell (Purchased's compact filters).
  className = '',
  children
}) => {
  const rootRef = useRef(null);
  const triggerId = `${id}-trigger`;
  const panelId = `${id}-panel`;

  useEffect(() => {
    if (!open) return undefined;
    const handleMouseDown = (e) => {
      if (rootRef.current?.contains(e.target) || e.target?.closest?.('[data-floating-menu]')) return;
      onClose();
    };
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      // A list still open inside the panel (focus left it after a click) goes
      // first: Select and Combobox close on another one's "ui-select-open".
      if (document.querySelector('[data-floating-menu]')) {
        window.dispatchEvent(new CustomEvent('ui-select-open', { detail: { id: null } }));
        return;
      }
      onClose();
      document.getElementById(triggerId)?.focus();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open, onClose, triggerId]);

  return (
    <div ref={rootRef} className={`${styles.popRoot} ${className}`}>
      {renderTrigger({
        id: triggerId,
        type: 'button',
        onClick: onToggle,
        'aria-expanded': open,
        'aria-haspopup': role === 'listbox' ? 'listbox' : 'true',
        'aria-controls': open ? panelId : undefined
      })}
      {open && (
        <div
          id={panelId}
          role={role}
          aria-label={label}
          className={`${styles.popPanel} ${padded ? styles.popPanelPadded : ''} ${align === 'right' ? styles.popPanelRight : ''}`}
          style={width ? { width } : undefined}
        >
          {children}
        </div>
      )}
    </div>
  );
};

/** A checkbox (or radio) row in a pill's list, with how many bookmarks have it. */
export const MenuOption = ({ label, count, checked, radio = false, disabled = false, sub = false, strong = false, onClick }) => (
  <button
    type="button"
    role={radio ? 'menuitemradio' : 'menuitemcheckbox'}
    aria-checked={checked}
    disabled={disabled}
    onClick={onClick}
    className={`${styles.menuOption} ${sub ? styles.menuOptionSub : ''} ${strong ? styles.menuOptionStrong : ''}`}
  >
    <CheckBox checked={checked} round={radio} />
    <span className={styles.menuLabel}>{label}</span>
    {count !== undefined && <span className={styles.menuCount}>{count}</span>}
  </button>
);

/** The gold box (or circle) the pill lists and the "With notes only" pill use. */
export const CheckBox = ({ checked, round = false }) => (
  <span aria-hidden="true" className={`${styles.menuBox} ${round ? styles.menuBoxRound : ''} ${checked ? styles.menuBoxOn : ''}`}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  </span>
);

export default Popover;
