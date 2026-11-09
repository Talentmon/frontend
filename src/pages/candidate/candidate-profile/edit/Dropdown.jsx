import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { I } from './icons';

// Custom listbox matching FlagSelect's look and portal behavior (rounded
// corners, gold hover, portaled into document.body so `.sec` section cards'
// `overflow: hidden` can't clip it) but without flag icons - the shared
// dropdown style for every plain select in this editor (Work preferences,
// Industry, Education level, Language name/level, ...).
// `searchable`: a box at the top of the list narrows it as you type (for a
// long list like the countries); arrows, Enter and Escape work from the box.
const Dropdown = forwardRef(({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  disabledPlaceholder,
  ariaLabel,
  disabled = false,
  className = '',
  searchable = false,
  searchPlaceholder = 'Search…',
}, forwardedRef) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
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
  const needle = query.trim().toLowerCase();
  const shown = searchable && needle ? options.filter((o) => o.toLowerCase().includes(needle)) : options;

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
    else setQuery('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, value]);

  // The search box takes the cursor as soon as the list is on screen.
  const listShown = isOpen && !!rect;
  useEffect(() => {
    if (listShown && searchable) searchRef.current?.focus({ preventScroll: true });
  }, [listShown, searchable]);

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
    if (searchable) triggerRef.current?.focus();
  };

  const moveActive = (dir) => {
    const idx = shown.findIndex((o) => o === activeValue);
    const next = shown[Math.min(Math.max(idx + dir, 0), shown.length - 1)];
    if (next !== undefined) setActiveValue(next);
  };

  // Typing narrows the list and highlights its first match.
  const handleQueryChange = (text) => {
    setQuery(text);
    const t = text.trim().toLowerCase();
    setActiveValue(t ? options.find((o) => o.toLowerCase().includes(t)) ?? null : value || null);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeValue !== null && shown.includes(activeValue)) commit(activeValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
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
            style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width }}
            onMouseLeave={() => setActiveValue(value || null)}
          >
            {searchable && (
              <div className="dropdown-search">
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
            )}
            {searchable && shown.length === 0 && <div className="dropdown-empty">No matches</div>}
            {shown.map((o) => (
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
