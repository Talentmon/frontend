import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from 'components/AppIcon';
import { I } from './icons';

// Curated Lucide-icon grid picker, portaled the same way as Dropdown/ComboField
// in this folder so `.sec` cards' `overflow: hidden` can't clip it. Stores the
// Lucide icon NAME (e.g. "Music") on the entry, not an emoji character.
const IconPicker = ({ value, onChange, options = [], ariaLabel = 'Choose icon' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

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

  const commit = (name) => {
    onChange(name);
    setIsOpen(false);
  };

  // `options` is either a flat array of icon names, or an array of
  // { category, icons } groups (Interests' curated set) - normalize to groups
  // so the grid can render category headers when they're present.
  const groups = options.length && options[0]?.icons ? options : [{ category: null, icons: options }];

  return (
    <div className="icon-picker" ref={wrapRef}>
      <button
        type="button"
        className="icon-picker-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((o) => !o)}
      >
        {value ? <Icon name={value} size={18} /> : <span className="icon-picker-placeholder">Choose icon…</span>}
        <I name="chev" className="icon-picker-chev" />
      </button>
      {isOpen &&
        rect &&
        createPortal(
          <div
            className="icon-picker-grid"
            role="listbox"
            ref={listRef}
            style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, minWidth: rect.width }}
          >
            {groups.map((g) => (
              <div className="icon-picker-group" key={g.category || 'all'}>
                {g.category && <div className="icon-picker-group-label">{g.category}</div>}
                <div className="icon-picker-group-grid">
                  {g.icons.map((name) => (
                    <button
                      type="button"
                      key={name}
                      role="option"
                      aria-selected={name === value}
                      aria-label={name}
                      title={name}
                      className={`icon-picker-opt${name === value ? ' selected' : ''}`}
                      onClick={() => commit(name)}
                    >
                      <Icon name={name} size={18} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

export default IconPicker;
