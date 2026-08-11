import React from 'react';
import SectionShell from './SectionShell';
import RichTextEditor from './RichTextEditor';
import { I } from './icons';

const SUMMARY_MIN_LENGTH = 200;

const TextSection = ({ sec, open, renaming, onToggleOpen, onStartRename, onRenameCommit, onChangeText, onDeleteSection, sectionDragProps, sectionDragClassName }) => {
  const plain = (sec.text || '').replace(/<[^>]*>/g, '').trim();
  const isSummary = sec.type === 'summary';
  const tooShort = isSummary && plain.length < SUMMARY_MIN_LENGTH;
  const count = plain ? `${plain.length}${isSummary ? `/${SUMMARY_MIN_LENGTH}` : ''} characters` : 'empty';

  return (
    <SectionShell
      sectionKey={sec.id}
      icon={sec.icon}
      title={sec.title}
      count={count}
      renamable
      movable
      open={open}
      renaming={renaming}
      onToggleOpen={onToggleOpen}
      onStartRename={onStartRename}
      onRename={onRenameCommit}
      dragProps={sectionDragProps}
      dragClassName={sectionDragClassName}
    >
      <div className="simple-body">
        <div className="field full">
          <label>Text</label>
          <RichTextEditor html={sec.text || ''} placeholder="A few sentences…" onChange={onChangeText} />
          {tooShort && (
            <span className="field-hint error">
              Summary must be at least {SUMMARY_MIN_LENGTH} characters (currently {plain.length}).
            </span>
          )}
        </div>
        <div className="sec-foot">
          <span className="spacer" />
          <button type="button" className="sec-del" aria-label="Delete section" title="Delete section" onClick={onDeleteSection}>
            <I name="trash" />
          </button>
        </div>
      </div>
    </SectionShell>
  );
};

export default TextSection;
