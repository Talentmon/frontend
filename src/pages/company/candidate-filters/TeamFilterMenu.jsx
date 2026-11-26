import React, { useCallback, useState } from 'react';
import Icon from 'components/AppIcon';
import Popover from '../bookmarked-candidates/components/Popover';
import bm from '../bookmarked-candidates/styles/bookmarked.module.scss';
import cf from './candidateFilters.module.scss';
import { CheckList } from './commonFields';
import { toggleIn } from './commonFilters';

/**
 * Who saved / unlocked them, beside Sort on Bookmarked and Purchased, for a
 * team: shows once two or more teammates have saved (unlocked) someone. Its
 * list ticks one or more of them (`items`: { value, label, count }); none
 * ticked = everyone. Like Sort it sits outside the filters, so their Clear all
 * leaves it alone. Its list is as wide as the button (at least 200px, so names
 * fit). `compact` (beside an open CV): a people icon stands in for the label,
 * and the list spans this button and Sort together, since the button alone is
 * too narrow for names there.
 */
const TeamFilterMenu = ({ id, label, items, picked, onChange, compact = false }) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  if (items.length < 2) return null;

  const nameOf = (value) => items.find((item) => item.value === value)?.label || 'Teammate';
  const value = picked.length === 0 ? 'Anyone' : picked.length === 1 ? nameOf(picked[0]) : `${picked.length} recruiters`;
  const clear = () => {
    onChange([]);
    close();
    document.getElementById(`${id}-trigger`)?.focus();
  };

  return (
    <Popover
      id={id}
      label={label}
      open={open}
      onToggle={() => setOpen((prev) => !prev)}
      onClose={close}
      matchTrigger
      className={`${cf.teamRoot} ${compact ? cf.teamRootSpan : ''}`}
      renderTrigger={(props) => (
        <button
          {...props}
          title={compact ? `${label}: ${value}` : undefined}
          className={`${bm.toolBtn} ${picked.length ? bm.toolBtnActive : ''} ${open ? bm.toolBtnOpen : ''}`}
        >
          {compact && <Icon name="Users" size={16} />}
          <span className={compact ? bm.srOnly : bm.toolBtnMuted}>{label}:</span>
          <span className={`${bm.toolBtnStrong} ${cf.teamValue}`}>{value}</span>
          <Icon name="ChevronDown" size={14} strokeWidth={2.2} className={bm.pillChevron} />
        </button>
      )}
    >
      <div className={cf.teamHead}>
        <p className={cf.menuHeading}>{label}</p>
        {picked.length > 0 && (
          <button type="button" className={cf.teamClear} onClick={clear}>
            Clear
          </button>
        )}
      </div>
      <CheckList label={label} items={items} picked={picked} onToggle={(member) => onChange(toggleIn(picked, member))} />
    </Popover>
  );
};

export default TeamFilterMenu;
