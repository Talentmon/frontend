import React, { useEffect } from 'react';
import { SecIcon, I } from './icons';
import { CATALOG } from './data';

const AddContentModal = ({ open, onClose, onPick }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="addModalTitle">
        <button className="modal-x" aria-label="Close" onClick={onClose}>
          <I name="x" />
        </button>
        <h2 id="addModalTitle">Add section</h2>
        <p className="modal-sub">Choose what to add to your CV. You can rename, move, or delete the section later.</p>
        <div className="catalog-grid">
          {CATALOG.map((item) => (
            <button key={item.type} type="button" className={`cat-card${item.type === 'custom' ? ' custom' : ''}`} onClick={() => onPick(item)}>
              <span className="ct">
                <SecIcon kind={item.icon} />
                {item.title}
              </span>
              <span className="cd">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddContentModal;
