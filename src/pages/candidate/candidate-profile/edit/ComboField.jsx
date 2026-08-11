import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { I } from './icons';

// Free-text input with filtered suggestions from `options`, plus a dropdown
// arrow that shows the full list. Any typed value is accepted - options are
// suggestions, not a constraint.
//
// The option list is portaled into document.body (position: fixed, placed
// via the trigger's getBoundingClientRect) for the same reason as
// FlagSelect in this same folder: `overflow: hidden` on .sec section cards
// would otherwise clip the list as soon as it grows past the card edge.
const ComboField = ({ value, options = [], placeholder = 'Type or choose from list', onChange, inputRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFullList, setShowFullList] = useState(false);
  const [rect, setRect] = useState(null);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutsideClick = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (listRef.current?.contains(e.target)) return;
      setIsOpen(false);
      setShowFullList(false);
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

  const filterText = (showFullList ? '' : value || '').toLowerCase();
  const visibleOptions = options.filter((opt) => !filterText || opt.toLowerCase().includes(filterText));

  return (
    <div className="combo" ref={wrapRef}>
      <div className="combo-row">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => {
            onChange(e.target.value);
            setShowFullList(false);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
            if (e.key === 'Enter') {
              e.preventDefault();
              setIsOpen(false);
            }
          }}
        />
        <button
          type="button"
          className="combo-arrow"
          aria-label="Show all options"
          onClick={() => {
            if (isOpen && showFullList) {
              setIsOpen(false);
            } else {
              setShowFullList(true);
              setIsOpen(true);
            }
          }}
        >
          <I name="chev" />
        </button>
      </div>
      {isOpen &&
        rect &&
        createPortal(
          <div
            ref={listRef}
            className="combo-list"
            style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width }}
          >
            {visibleOptions.length === 0 ? (
              <div className="combo-empty">No matches - keep typing to use your own</div>
            ) : (
              visibleOptions.map((opt, i) => (
                <div
                  key={`${opt}-${i}`}
                  className="combo-opt"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                >
                  {opt}
                </div>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default ComboField;
