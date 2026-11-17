// Shared look of the company top bar (Header + its credit, bell and profile controls).

// Keyboard focus ring for everything in the bar.
export const HEADER_FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6A93C]';

// The slate "tray" the bell, profile and mobile-menu buttons sit in; lighter on hover or while open.
export const headerTray = (open) => (open
  ? 'bg-[#364152] text-white'
  : 'bg-[#2B3646] text-[#C9D1DC] hover:bg-[#364152] hover:text-white');
