import React, { useEffect, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import SectionShell from './SectionShell';
import RichTextEditor from './RichTextEditor';
import TagEditor from './TagEditor';
import ComboField from './ComboField';
import Dropdown from './Dropdown';
import IconPicker from './IconPicker';
import { I } from './icons';

const hasValue = (v) => (Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim()));

// Groups several long-text sub-fields (e.g. Projects' Short Description /
// Challenge / Solution / Impact) behind tabs instead of stacking them, so the
// form doesn't grow to 4x the height for fields that are rarely all long at
// once. Each tab still writes to its own entry key via `onChange`.
const TabbedTextGroup = ({ tabs, entry, activeKey, onTabChange, onChange }) => {
  const active = tabs.find((t) => t.k === activeKey) || tabs[0];
  return (
    <div className="tabbed-field">
      <div className="tf-tabs">
        {tabs.map((t) => (
          <button
            type="button"
            key={t.k}
            className={`tf-tab${t.k === active.k ? ' on' : ''}${hasValue(entry[t.k]) ? ' has-content' : ''}`}
            onClick={() => onTabChange(t.k)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <RichTextEditor key={active.k} html={entry[active.k] || ''} placeholder={active.ph} onChange={(html) => onChange(active.k, html)} />
    </div>
  );
};

const EntryRow = ({ sec, schema, entry, editingId, setEditingId, onUpdateEntry, onToggleVisible, onDeleteEntry, dragHandlers, dragClassName }) => {
  const isEditing = editingId === entry.id;
  const sm = schema.summary(entry);
  const firstFieldRef = useRef(null);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [activeTabByField, setActiveTabByField] = useState({});

  useEffect(() => {
    if (isEditing) firstFieldRef.current?.focus();
    else setAttemptedSave(false);
  }, [isEditing]);

  const isValid = schema.fields.every((fl) => !fl.required || hasValue(entry[fl.k]));

  const requestClose = () => {
    if (isValid) setEditingId(null);
    else setAttemptedSave(true);
  };

  return (
    <div
      className={`ed-entry${entry.visible ? '' : ' hidden-item'}${isEditing ? ' editing' : ''}${dragClassName ? ` ${dragClassName}` : ''}`}
      data-id={entry.id}
      draggable={!isEditing}
      {...dragHandlers}
    >
      <div className="ee-row">
        <button className="ee-grip" aria-label="Reorder — up/down arrows" onKeyDown={dragHandlers?.onGripKeyDown}>
          <I name="grip" strokeWidth={2.2} />
        </button>
        <div className="ee-main">
          <div className="ee-title">
            {sm.icon && (
              <span className="ee-icon">
                <Icon name={sm.icon} size={16} />
              </span>
            )}
            {sm.title}
            {sm.companyText && <span className="co"> · {sm.companyText}</span>}
          </div>
          {sm.sub && <div className="ee-sub">{sm.sub}</div>}
        </div>
        <div className="ee-acts">
          <button
            type="button"
            className={`iconbtn eyeBtn${entry.visible ? '' : ' is-hidden'}`}
            aria-label={entry.visible ? 'Hide from CV' : 'Show on CV'}
            onClick={() => onToggleVisible(entry.id)}
          >
            <I name={entry.visible ? 'eye' : 'eyeoff'} />
          </button>
          <button
            type="button"
            className="iconbtn editBtn"
            aria-label="Edit"
            onClick={() => (isEditing ? requestClose() : setEditingId(entry.id))}
          >
            <I name="pencil" />
          </button>
          <button type="button" className="iconbtn danger delBtn" aria-label="Delete" onClick={() => onDeleteEntry(entry)}>
            <I name="trash" />
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="ee-form">
          <div className="fgrid">
            {schema.fields.map((fl, fi) => {
              const opts = typeof fl.opts === 'function' ? fl.opts(entry) : fl.opts;
              const isMissing = attemptedSave && fl.required && !hasValue(entry[fl.k]);
              const isDisabled = !!fl.disabledWhen?.(entry);
              const applyChange = (k, value) => onUpdateEntry(entry.id, (en) => {
                en[k] = value;
                fl.resets?.forEach((rk) => { en[rk] = ''; });
                if (fl.autoFill) Object.assign(en, fl.autoFill(value, en));
              });
              return (
                <div className={`field${fl.full ? ' full' : ''}${isMissing ? ' invalid' : ''}`} key={fl.k}>
                  {fl.t !== 'checkbox' && fl.t !== 'tabs' && (
                    <label>
                      {fl.label}
                      {fl.required && <span className="req">*</span>}
                    </label>
                  )}
                  {fl.t === 'textarea' && (
                    <RichTextEditor html={entry[fl.k] || ''} placeholder={fl.ph} onChange={(html) => applyChange(fl.k, html)} />
                  )}
                  {fl.t === 'select' && (
                    <Dropdown
                      ref={fi === 0 ? firstFieldRef : undefined}
                      value={entry[fl.k] || ''}
                      options={opts}
                      placeholder={fl.ph || 'Select…'}
                      disabledPlaceholder="Select industry first"
                      onChange={(v) => applyChange(fl.k, v)}
                    />
                  )}
                  {fl.t === 'combobox' && (
                    <ComboField
                      inputRef={fi === 0 ? firstFieldRef : undefined}
                      value={entry[fl.k] || ''}
                      options={opts || []}
                      placeholder={fl.ph}
                      onChange={(text) => applyChange(fl.k, text)}
                    />
                  )}
                  {fl.t === 'checkbox' && (
                    <label className={`field-checkbox${!fl.full ? ' align-input' : ''}`}>
                      <input
                        type="checkbox"
                        checked={!!entry[fl.k]}
                        onChange={(e) => applyChange(fl.k, e.target.checked)}
                      />
                      {fl.label}
                    </label>
                  )}
                  {fl.t === 'tags' && <TagEditor tags={entry[fl.k]} onChange={(tags) => applyChange(fl.k, tags)} />}
                  {fl.t === 'link' && (
                    <div className="input-icon">
                      <span className="ii">
                        <I name="link" />
                      </span>
                      <input
                        ref={fi === 0 ? firstFieldRef : undefined}
                        type="url"
                        placeholder={fl.ph || ''}
                        value={entry[fl.k] || ''}
                        onChange={(e) => applyChange(fl.k, e.target.value)}
                      />
                    </div>
                  )}
                  {fl.t === 'number' && (
                    <input
                      ref={fi === 0 ? firstFieldRef : undefined}
                      type="number"
                      placeholder={fl.ph || ''}
                      value={entry[fl.k] ?? ''}
                      onChange={(e) => applyChange(fl.k, e.target.value)}
                    />
                  )}
                  {fl.t === 'text' && (
                    <input
                      ref={fi === 0 ? firstFieldRef : undefined}
                      type="text"
                      placeholder={fl.ph || ''}
                      value={fl.readOnly ? (entry[fl.k] || '') : (isDisabled ? '' : (entry[fl.k] || ''))}
                      disabled={isDisabled || fl.readOnly}
                      onChange={(e) => applyChange(fl.k, e.target.value)}
                    />
                  )}
                  {fl.t === 'icon' && (
                    <IconPicker
                      value={entry[fl.k] || ''}
                      options={fl.opts}
                      ariaLabel={fl.label}
                      onChange={(v) => applyChange(fl.k, v)}
                    />
                  )}
                  {fl.t === 'tabs' && (
                    <TabbedTextGroup
                      tabs={fl.tabs}
                      entry={entry}
                      activeKey={activeTabByField[fl.k] || fl.tabs[0].k}
                      onTabChange={(k) => setActiveTabByField((prev) => ({ ...prev, [fl.k]: k }))}
                      onChange={(k, html) => applyChange(k, html)}
                    />
                  )}
                  {isMissing && <p className="field-hint error">This field is required</p>}
                </div>
              );
            })}
          </div>
          <div className="form-foot">
            {attemptedSave && !isValid && <span className="field-hint error">Fill in all required fields to save</span>}
            <span className="spacer" />
            <button type="button" className="btn btn-done btn-sm" onClick={requestClose}>
              <I name="check" strokeWidth={2.6} />
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ListSection = ({
  sec,
  schema,
  open,
  renaming,
  editingId,
  setEditingId,
  onToggleOpen,
  onStartRename,
  onRenameCommit,
  onDeleteSection,
  onSetKind,
  onAddEntry,
  onUpdateEntry,
  onToggleVisible,
  onDeleteEntry,
  onReorderEntries,
  onMoveEntry,
  sectionDragProps,
  sectionDragClassName,
}) => {
  const [dragId, setDragId] = useState(null);
  const [dropInfo, setDropInfo] = useState(null);

  const visN = sec.entries.filter((e) => e.visible).length;
  const count = `${sec.entries.length} ${sec.entries.length === 1 ? 'entry' : 'entries'} · ${visN} visible`;

  const dragHandlersFor = (entry) => ({
    onDragStart: (e) => {
      if (editingId) {
        e.preventDefault();
        return;
      }
      setDragId(entry.id);
      e.dataTransfer.effectAllowed = 'move';
      try {
        e.dataTransfer.setData('text/plain', entry.id);
      } catch {
        // some browsers restrict setData outside user gesture context — safe to ignore
      }
    },
    onDragEnd: () => {
      setDragId(null);
      setDropInfo(null);
    },
    onDragOver: (e) => {
      if (!dragId || dragId === entry.id) return;
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      const after = e.clientY - r.top > r.height / 2;
      setDropInfo({ id: entry.id, after });
    },
    onDrop: (e) => {
      if (!dragId) return;
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      const after = e.clientY - r.top > r.height / 2;
      onReorderEntries(dragId, entry.id, after);
      setDragId(null);
      setDropInfo(null);
    },
    onGripKeyDown: (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        onMoveEntry(entry.id, e.key === 'ArrowDown' ? 1 : -1);
      }
    },
  });

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
        {sec.type === 'custom' && (
          <div className="type-toggle">
            <span className="tt-label">Type:</span>
            <button type="button" className={sec.kind !== 'skill' ? 'on' : ''} onClick={() => onSetKind('list')}>
              Standard
            </button>
            <button type="button" className={sec.kind === 'skill' ? 'on' : ''} onClick={() => onSetKind('skill')}>
              Skills
            </button>
          </div>
        )}

        <div className="entries">
          {sec.entries.map((entry) => (
            <EntryRow
              key={entry.id}
              sec={sec}
              schema={schema}
              entry={entry}
              editingId={editingId}
              setEditingId={setEditingId}
              onUpdateEntry={onUpdateEntry}
              onToggleVisible={onToggleVisible}
              onDeleteEntry={onDeleteEntry}
              dragHandlers={dragHandlersFor(entry)}
              dragClassName={dragId === entry.id ? 'dragging' : dropInfo?.id === entry.id ? (dropInfo.after ? 'drop-after' : 'drop-before') : ''}
            />
          ))}
        </div>

        <div className="sec-foot">
          <button type="button" className="add-entry" onClick={onAddEntry}>
            <I name="plus" />
            Add {schema.noun}
          </button>
          <span className="spacer" />
          <button type="button" className="sec-del" aria-label="Delete section" title="Delete section" onClick={onDeleteSection}>
            <I name="trash" />
          </button>
        </div>
      </div>
    </SectionShell>
  );
};

export default ListSection;
