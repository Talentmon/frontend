import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { I } from './icons';

// Custom listbox matching FlagSelect's look and portal behavior (rounded
// corners, gold hover, portaled into document.body so `.sec` section cards'
// `overflow: hidden` can't clip it) but without flag icons - the shared
// dropdown style for every plain select in this editor (Work preferences,
// Industry, Education level, Language name/level, ...).
const Dropdown = forwardRef(({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  disabledPlaceholder,
  ariaLabel,
  disabled = false,
  className = '',
}, forwardedRef) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeValue, setActiveValue] = useState(null);
  const [rect, setRect] = useState(null);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const nodeRefs = useRef(new Map());

  const setTriggerRef = (el) => {
    triggerRef.current = el;
    if (typeof forwardedRef === 'function') forwardedRef(el);
    else if (forwardedRef) forwardedRef.current = el;
  };

  const isDisabled = disabled || options.length === 0;

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
    if (isOpen) setActiveValue(value || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const updateRect = () => setRect(wrapRef.current?.getBoundingClientRect() ?? null);
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
    nodeRefs.current.get(activeValue)?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeValue]);

  const commit = (opt) => {
    onChange(opt);
    setIsOpen(false);
  };

  const moveActive = (dir) => {
    const idx = options.findIndex((o) => o === activeValue);
    const next = options[Math.min(Math.max(idx + dir, 0), options.length - 1)];
    if (next !== undefined) setActiveValue(next);
  };

  const handleKeyDown = (e) => {
    if (isDisabled) return;
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
      if (activeValue !== null) commit(activeValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const shownPlaceholder = options.length === 0 && disabledPlaceholder ? disabledPlaceholder : placeholder;

  return (
    <div className={`dropdown ${className}`.trim()} ref={wrapRef}>
      <button
        ref={setTriggerRef}
        type="button"
        className="dropdown-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={isDisabled}
        onClick={() => !isDisabled && setIsOpen((o) => !o)}
        onKeyDown={handleKeyDown}
      >
        <span className={`dropdown-value${value ? '' : ' placeholder'}`}>{value || shownPlaceholder}</span>
        <I name="chev" className="dropdown-chev" />
      </button>
      {isOpen &&
        rect &&
        createPortal(
          <div
            className="dropdown-list"
            role="listbox"
            ref={listRef}
            style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, minWidth: rect.width }}
            onMouseLeave={() => setActiveValue(value || null)}
          >
            {options.map((o) => (
              <div
                key={o}
                ref={(el) => {
                  if (el) nodeRefs.current.set(o, el);
                  else nodeRefs.current.delete(o);
                }}
                role="option"
                aria-selected={o === value}
                className={`dropdown-opt${o === value ? ' selected' : ''}${o === activeValue ? ' active' : ''}`}
                onMouseEnter={() => setActiveValue(o)}
                onClick={() => commit(o)}
              >
                {o}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
});

Dropdown.displayName = 'Dropdown';

export default Dropdown;
