import React, { useEffect, useRef, useState } from 'react';
import { I } from './icons';

const GROUPS = [
  [
    { cmd: 'bold', label: 'Bold', node: <b>B</b> },
    { cmd: 'italic', label: 'Italic', node: <i>I</i> },
    { cmd: 'underline', label: 'Underline', node: <u>U</u> },
  ],
  [
    { cmd: 'insertUnorderedList', label: 'List', icon: 'list' },
    { cmd: 'createLink', label: 'Link', icon: 'link' },
  ],
  [
    { cmd: 'justifyLeft', label: 'Left', icon: 'alignLeft' },
    { cmd: 'justifyCenter', label: 'Center', icon: 'alignCenter' },
    { cmd: 'justifyRight', label: 'Right', icon: 'alignRight' },
    { cmd: 'justifyFull', label: 'Justify', icon: 'alignFull' },
  ],
];

// TODO: document.execCommand is deprecated but works broadly; replace with Tiptap/Lexical
// when this editor moves past the prototype stage. Sanitize this HTML on the backend (DOMPurify)
// before rendering it to other users.
const RichTextEditor = ({ html, placeholder, onChange }) => {
  const edRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!html || !html.replace(/<[^>]*>/g, '').trim());

  useEffect(() => {
    if (edRef.current) edRef.current.innerHTML = html || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncEmpty = () => {
    const ed = edRef.current;
    if (!ed) return;
    const text = ed.textContent.replace(/\s/g, '');
    setIsEmpty(!text && !/<(img|li|br)/i.test(ed.innerHTML));
  };

  const exec = (cmd) => {
    const ed = edRef.current;
    if (!ed) return;
    ed.focus();
    try {
      if (cmd === 'createLink') {
        // eslint-disable-next-line no-alert
        const url = window.prompt('Enter URL:', 'https://');
        if (url) document.execCommand('createLink', false, url);
      } else {
        document.execCommand(cmd, false, null);
      }
    } catch {
      // execCommand can throw in some browsers when selection is invalid — ignore
    }
    syncEmpty();
    onChange(ed.innerHTML);
  };

  return (
    <div className={`rte-wrap${isEmpty ? ' is-empty' : ''}`}>
      <div className="rte-toolbar">
        {GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <span className="rte-div" />}
            {group.map((b) => (
              <button
                key={b.cmd}
                type="button"
                className="rte-btn"
                title={b.label}
                aria-label={b.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec(b.cmd)}
              >
                {b.node || <I name={b.icon} />}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div
        ref={edRef}
        className="rte"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-ph={placeholder || 'Add description…'}
        onInput={() => {
          syncEmpty();
          onChange(edRef.current.innerHTML);
        }}
        onBlur={() => onChange(edRef.current.innerHTML)}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;
