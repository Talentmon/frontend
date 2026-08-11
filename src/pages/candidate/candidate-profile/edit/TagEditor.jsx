import React, { useState } from 'react';
import { I } from './icons';

const TagEditor = ({ tags, onChange }) => {
  const [draft, setDraft] = useState('');
  const list = tags || [];

  const commit = () => {
    const v = draft.trim();
    if (v) onChange([...list, v]);
    setDraft('');
  };

  return (
    <div className="tagedit">
      {list.map((t, i) => (
        <span className="tg" key={`${t}-${i}`}>
          {t}
          <button type="button" aria-label="Remove" onClick={() => onChange(list.filter((_, idx) => idx !== i))}>
            <I name="x" />
          </button>
        </span>
      ))}
      <input
        type="text"
        placeholder="Add and press Enter…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !draft && list.length) {
            onChange(list.slice(0, -1));
          }
        }}
      />
    </div>
  );
};

export default TagEditor;
