import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { I } from './icons';

// Combines value+iso so options that share a value (e.g. dial code "+44" for
// UK/Isle of Man/Guernsey/Jersey, or "+1" across North America) still get a
// unique React key / DOM id / keyboard-highlight identity.
const optKey = (o) => `${o.value}__${o.iso}`;

// Custom listbox that renders a real flag icon (flag-icons `fi fi-xx` span) next
// to each option - native <select><option> can't render icons, and on Windows,
// flag emoji fall back to plain letter pairs instead of a flag glyph.
//
// The option list is portaled into document.body and positioned with
// `position: fixed` against the trigger's bounding rect. Section cards use
// `overflow: hidden` (to keep their rounded corners), which would otherwise
// clip an absolutely-positioned list as soon as it grows past the card edge.
const FlagSelect = ({ value, onChange, groups, ariaLabel, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [rect, setRect] = useState(null);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const nodeRefs = useRef(new Map());

  const flatOptions = useMemo(() => groups.flatMap((g) => g.options), [groups]);
  const selected = flatOptions.find((o) => o.value === value) || flatOptions[0];

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutsideClick = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (listRef.current?.contains(e.target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setActiveKey(selected ? optKey(selected) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const updateRect = () => setRect(triggerRef.current?.getBoundingClientRect() ?? null);
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    nodeRefs.current.get(activeKey)?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeKey]);

  const commit = (o) => {
    onChange(o.value);
    setIsOpen(false);
  };

  const moveActive = (dir) => {
    const idx = flatOptions.findIndex((o) => optKey(o) === activeKey);
    const next = flatOptions[Math.min(Math.max(idx + dir, 0), flatOptions.length - 1)];
    if (next) setActiveKey(optKey(next));
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const active = flatOptions.find((o) => optKey(o) === activeKey);
      if (active) commit(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={`flagselect ${className}`} ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className="flagselect-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-activedescendant={isOpen && activeKey ? `flagopt-${activeKey}` : undefined}
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={handleKeyDown}
      >
        {selected && <span className={`fi fis fi-${selected.iso} flagselect-flag`} aria-hidden="true" />}
        <span className="flagselect-value">{selected?.label}</span>
        <I name="chev" className="flagselect-chev" />
      </button>
      {isOpen &&
        rect &&
        createPortal(
          <div
            className="flagselect-list"
            role="listbox"
            ref={listRef}
            style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, minWidth: rect.width }}
            onMouseLeave={() => setActiveKey(selected ? optKey(selected) : null)}
          >
            {groups.map((g, gi) => (
              <div className="flagselect-group" key={g.label || gi}>
                {g.label && <div className="flagselect-group-label">{g.label}</div>}
                {g.options.map((o) => {
                  const k = optKey(o);
                  return (
                    <div
                      key={k}
                      id={`flagopt-${k}`}
                      ref={(el) => {
                        if (el) nodeRefs.current.set(k, el);
                        else nodeRefs.current.delete(k);
                      }}
                      role="option"
                      aria-selected={o.value === value}
                      title={o.title}
                      className={`flagselect-opt${o.value === value ? ' selected' : ''}${k === activeKey ? ' active' : ''}`}
                      onMouseEnter={() => setActiveKey(k)}
                      onClick={() => commit(o)}
                    >
                      <span className={`fi fis fi-${o.iso} flagselect-flag`} aria-hidden="true" />
                      <span className="flagselect-opt-label">{o.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

export default FlagSelect;
