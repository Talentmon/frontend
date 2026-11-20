import React from 'react';

// Two stacked coin piles (the Talentmon navbar design), drawn like a lucide icon.
const CreditsIcon = ({ size = 16, strokeWidth = 2, className = '' }) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`flex-none ${className}`}
  >
    <ellipse cx="9" cy="8" rx="5.5" ry="3" />
    <path d="M3.5 8v4c0 1.7 2.5 3 5.5 3" />
    <ellipse cx="15" cy="14" rx="5.5" ry="3" />
    <path d="M9.5 14v3c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3v-3" />
  </svg>
);

export default CreditsIcon;
