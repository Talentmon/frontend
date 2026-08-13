import React, { useMemo, useRef } from 'react';
import SectionShell from './SectionShell';
import { I } from './icons';
import { initials, PHONE_CODES, DEFAULT_PHONE_CODE } from './data';
import FlagSelect from './FlagSelect';

const BasicsSection = ({ basics, open, onToggleOpen, onChangeField, onPhotoUpload, onPhotoRemove, photoBusy, onChangeLink, onAddLink, onRemoveLink, photoHidden, onTogglePhotoHidden }) => {
  const fileRef = useRef(null);
  const b = basics;

  const phoneCodeGroups = useMemo(() => {
    const sorted = [...PHONE_CODES].sort((a, b2) => a.country.localeCompare(b2.country));
    return [{ options: sorted.map((c) => ({ value: c.code, iso: c.iso, label: c.code, title: c.country })) }];
  }, []);

  const tf = (key, label, ph, half, required = true) => {
    const invalid = required && !String(b[key] || '').trim();
    return (
      <div className={`field${half ? '' : ' full'}${invalid ? ' invalid' : ''}`} key={key}>
        <label>{label}</label>
        <input type="text" placeholder={ph || ''} value={b[key] || ''} onChange={(e) => onChangeField(key, e.target.value)} />
        {invalid && <span className="field-hint error">This field is required.</span>}
      </div>
    );
  };

  return (
    <SectionShell sectionKey="basics" icon="basics" title="Basics" count="NAME · CONTACT" renamable={false} movable={false} open={open} onToggleOpen={onToggleOpen}>
      <div className="simple-body">
        <div className="basics-photo">
          <div className={`avatar-wrap${b.photo && photoHidden ? ' photo-hidden' : ''}`}>
            <div className="avatar">{b.photo ? <img alt="" src={b.photo} /> : initials(b.name)}</div>
            {b.photo && (
              <button
                type="button"
                className="avatar-overlay"
                onClick={onTogglePhotoHidden}
                title={photoHidden ? 'Show photo on CV' : 'Hide photo from CV'}
              >
                <I name={photoHidden ? 'eyeoff' : 'eye'} />
              </button>
            )}
          </div>
          <div className="photo-acts">
            <div className="ptitle">Photo</div>
            <div className="row">
              <button type="button" className="linkbtn" disabled title="Photo upload is temporarily unavailable">
                Upload unavailable
              </button>
              <button type="button" className="linkbtn muted" disabled={photoBusy || !b.photo} onClick={onPhotoRemove}>
                Remove
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                e.target.value = '';
                if (!file) return;
                onPhotoUpload(file);
              }}
            />
          </div>
        </div>
        <div className="photo-tip">
          <span className="photo-tip-icon">!</span>
          <span>Professional CVs don't include a photo — content and experience speak for themselves.</span>
        </div>

        {tf('name', 'Full name', 'e.g. Jovana Kovacevic')}
        <div className="fgrid fgrid-role">
          {tf('role', 'Position', 'e.g. Product Designer', 1)}
          <div className="field">
            <label>Years of experience</label>
            <input type="text" value={b.years || '0'} disabled title="Computed automatically from your work experience entries" />
          </div>
        </div>
        <div className="fgrid fgrid-contact">
          {tf('location', 'Location', 'City, country', 1)}
          {(() => {
            const phoneInvalid = !String(b.phone || '').trim();
            return (
              <div className={`field${phoneInvalid ? ' invalid' : ''}`}>
                <label>Phone</label>
                <div className="phone-group">
                  <FlagSelect
                    className="phone-code"
                    ariaLabel="Country code"
                    value={b.phoneCode || DEFAULT_PHONE_CODE}
                    onChange={(v) => onChangeField('phoneCode', v)}
                    groups={phoneCodeGroups}
                  />
                  <input
                    type="text"
                    className="phone-number"
                    placeholder="64 118 9920"
                    value={b.phone || ''}
                    onChange={(e) => onChangeField('phone', e.target.value)}
                  />
                </div>
                {phoneInvalid && <span className="field-hint error">This field is required.</span>}
              </div>
            );
          })()}
        </div>
        <div className="field full">
          <label>Email</label>
          <input type="text" value={b.email || ''} disabled title="Managed by your account sign-in — cannot be edited here" />
        </div>
        {tf('linkedin', 'LinkedIn', '/in/username', false, false)}

        <div className="field full">
          <label>Other links</label>
          <div className="links-list">
            {(b.links || []).map((lk) => (
              <div className="link-row" key={lk.id}>
                <input
                  type="text"
                  className="lk-label"
                  placeholder="Name (e.g. Portfolio)"
                  value={lk.label || ''}
                  onChange={(e) => onChangeLink(lk.id, 'label', e.target.value)}
                />
                <input type="url" className="lk-url" placeholder="https://…" value={lk.url || ''} onChange={(e) => onChangeLink(lk.id, 'url', e.target.value)} />
                <button type="button" className="lk-del" aria-label="Remove link" title="Remove" onClick={() => onRemoveLink(lk.id)}>
                  <I name="trash" />
                </button>
              </div>
            ))}
            <button type="button" className="add-link" onClick={onAddLink}>
              <I name="plus" />
              Add link
            </button>
          </div>
        </div>

        <div className="field full">
          <div className="note">
            <I name="lock" />
            <span>Your name, photo, and contact info are hidden from companies until they spend a credit to unlock you. A hidden photo will not be shown on the CV, but will remain visible to the company on the unlocked card. If no photo is set, your initials will be shown.</span>
          </div>
        </div>
      </div>
    </SectionShell>
  );
};

export default BasicsSection;
