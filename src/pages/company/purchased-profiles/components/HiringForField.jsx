import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from 'components/AppIcon';
import Combobox from 'components/ui/Combobox';
import styles from '../styles/purchased.module.scss';

const PANEL_WIDTH = 300;
const PANEL_HEIGHT = 190;

/**
 * "Hiring for": the position the company is considering a candidate for. A
 * small button ("+ Hiring for", or the position) opens a panel with a field
 * that takes any text and suggests the positions already in use. The panel is
 * portalled to <body>, so neither the card nor the table's scroll clips it, and
 * follows its button when the page scrolls.
 * `onSave(text)` ('' clears) resolves to whether it worked.
 */
const HiringForField = ({ id, value = '', suggestions = [], onSave, size = 'card' }) => {
  const [pos, setPos] = useState(null);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const isOpen = !!pos;
  const fieldId = `${id}-field`;

  // Under the button (above it near the bottom of the window), its right edge at
  // the button's (the button sits at the card's right; the CV drawer opens to the right), inside the window.
  const placement = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8));
    const below = rect.bottom + 6;
    const top = below + PANEL_HEIGHT > window.innerHeight ? Math.max(8, rect.top - PANEL_HEIGHT - 6) : below;
    return { left, top };
  };

  const close = (focusTrigger = false) => {
    setPos(null);
    if (focusTrigger) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    // The suggestion list is portalled too (data-floating-menu): clicks and scrolls in it don't count.
    const inside = (target) =>
      panelRef.current?.contains(target) || triggerRef.current?.contains(target) || target?.closest?.('[data-floating-menu]');
    const onDown = (e) => {
      if (!inside(e.target)) close();
    };
    // Escape is this panel's (the CV drawer behind it stays open); with the suggestion
    // list open it only closes the list.
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      if (document.querySelector('[data-floating-menu]')) return;
      close(true);
    };
    // A scroll inside the panel or its list doesn't move it (resize's target is window, not a Node).
    const follow = (e) => {
      if (e?.target instanceof Node && e.target !== document && inside(e.target)) return;
      if (triggerRef.current) setPos(placement());
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    panelRef.current?.querySelector('input')?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
    };
  }, [isOpen]);

  const open = () => {
    if (isOpen) {
      close();
      return;
    }
    setDraft(value);
    setPos(placement());
  };

  const save = async (text) => {
    if (saving) return;
    setSaving(true);
    const ok = await onSave(text.trim());
    setSaving(false);
    if (ok) close(true);
  };

  // Enter saves what's typed — unless a suggestion is highlighted: that Enter picks it, the next one saves.
  const onPanelKeyDown = (e) => {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT' || e.target.getAttribute('aria-activedescendant')) return;
    e.preventDefault();
    if (draft.trim() && draft.trim() !== value) save(draft);
  };

  const options = suggestions.filter((s) => s && s !== value);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.hfTrigger} ${size === 'row' ? styles.hfRow : ''} ${value ? '' : styles.hfEmpty}`}
        onClick={open}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={value ? `Hiring for: ${value}. Change` : 'Set the position you are hiring for'}
        title={value ? `Hiring for: ${value}` : 'Set the position you are hiring for'}
      >
        <Icon name={value ? 'Briefcase' : 'Plus'} size={13} strokeWidth={2.2} />
        <span className={styles.hfText}>{value || 'Hiring for'}</span>
      </button>

      {isOpen && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Hiring for"
          className={styles.hfPanel}
          style={{ left: pos.left, top: pos.top, width: PANEL_WIDTH }}
          onKeyDown={onPanelKeyDown}
        >
          <label htmlFor={fieldId} className={styles.hfLabel}>Hiring for</label>
          <Combobox
            id={fieldId}
            value={draft}
            onChange={(next) => setDraft(next || '')}
            options={options}
            placeholder="e.g. Frontend Developer"
          />
          <p className={styles.hfHint}>The position you&apos;re considering them for. The pipeline and the filters use it.</p>
          <div className={styles.hfFoot}>
            {value && (
              <button type="button" className={styles.hfRemove} onClick={() => save('')} disabled={saving}>
                Remove
              </button>
            )}
            <button type="button" className={styles.hfCancel} onClick={() => close(true)}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.hfSave}
              onClick={() => save(draft)}
              disabled={saving || !draft.trim() || draft.trim() === value}
            >
              <Icon name="Check" size={15} strokeWidth={2.2} />
              Save
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default HiringForField;
