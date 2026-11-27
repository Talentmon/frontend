import React, { useRef, useState } from 'react';
import './salaryNetGross.scss';

/**
 * A salary on the landing pages: net by default, gross while a mouse hovers it.
 * Touch screens have no hover, so a tap toggles it (Enter too). The app itself
 * shows both amounts; this is for the landings only.
 *
 * Both amounts sit in the same spot and only one shows, so the box is always as
 * big as the longer one and nothing around it moves when it switches.
 */
const SalaryNetGross = ({ net, gross, label, className = '' }) => {
  const [showGross, setShowGross] = useState(false);
  const lastPointerRef = useRef(null);

  return (
    <button
      type="button"
      className={`salary-ng ${className}`}
      aria-pressed={showGross}
      aria-label={`${label}: ${showGross ? gross : net}. Switch to ${showGross ? 'net' : 'gross'}`}
      onPointerDown={(e) => { lastPointerRef.current = e.pointerType; }}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setShowGross(true); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setShowGross(false); }}
      onClick={() => {
        // A mouse already shows gross by hovering; a tap or Enter toggles.
        if (lastPointerRef.current !== 'mouse') setShowGross((v) => !v);
        lastPointerRef.current = null;
      }}
    >
      <span className={`salary-ng-text${showGross ? '' : ' on'}`} aria-hidden="true">{net}</span>
      <span className={`salary-ng-text${showGross ? ' on' : ''}`} aria-hidden="true">{gross}</span>
    </button>
  );
};

export default SalaryNetGross;
