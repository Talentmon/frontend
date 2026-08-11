import React, { useEffect, useRef, useState } from 'react';
import { SecIcon, I } from './icons';

const SectionShell = ({
  sectionKey,
  icon,
  title,
  count,
  renamable,
  movable,
  open,
  renaming,
  onToggleOpen,
  onStartRename,
  onRename,
  dragProps,
  dragClassName,
  children,
  className = '',
}) => {
  const inputRef = useRef(null);
  const [draft, setDraft] = useState(title);

  useEffect(() => {
    if (renaming) {
      setDraft(title);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming, title]);

  const commit = () => onRename(draft.trim());
  const cancel = () => onRename(null);

  return (
    <section
      className={`sec${open ? ' open' : ''}${dragClassName ? ` ${dragClassName}` : ''} ${className}`.trim()}
      data-sid={sectionKey}
      {...(movable ? dragProps?.sectionDrag : {})}
    >
      <div className="sec-head">
        {movable && (
          <button
            type="button"
            className="sec-grip"
            aria-label="Move section — up/down arrows"
            title="Drag to reorder"
            onMouseDown={dragProps?.onGripMouseDown}
            onMouseUp={dragProps?.onGripMouseUp}
            onKeyDown={dragProps?.onGripKeyDown}
          >
            <I name="grip" strokeWidth={2.2} />
          </button>
        )}

        {renaming ? (
          <>
            <span className="ic" style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--cpe-mist)', display: 'grid', placeItems: 'center', color: 'var(--cpe-ink-3)', flex: 'none' }}>
              <SecIcon kind={icon} />
            </span>
            <input
              ref={inputRef}
              className="title-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commit();
                } else if (e.key === 'Escape') {
                  cancel();
                }
              }}
              onBlur={cancel}
            />
            <button
              type="button"
              className="renameBtn saveBtn"
              aria-label="Save name"
              title="Save name"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commit}
            >
              <I name="save" />
            </button>
          </>
        ) : (
          <button type="button" className="sec-toggle" aria-expanded={open} onClick={onToggleOpen}>
            <span className="ic">
              <SecIcon kind={icon} />
            </span>
            {title ? (
              <span>
                <span className="st">{title}</span>
                <br />
                <span className="cnt">{count || ''}</span>
              </span>
            ) : (
              <span className="cnt cnt-only">{count || ''}</span>
            )}
          </button>
        )}

        <span className="htools">
          {renamable && !renaming && (
            <button type="button" className="renameBtn" aria-label="Rename section" title="Rename" onClick={onStartRename}>
              <I name="pencil" />
            </button>
          )}
          {!renaming && (
            <span className="chev" onClick={onToggleOpen}>
              <I name="chev" strokeWidth={2.4} />
            </span>
          )}
        </span>
      </div>
      <div className="sec-body">{open ? children : null}</div>
    </section>
  );
};

export default SectionShell;
