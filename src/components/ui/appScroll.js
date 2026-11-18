// The company pages scroll inside the area under the header (CompanyLayout), not the window,
// so the scrollbar starts under the header. Code that follows or sets the scroll uses this element.
export const APP_SCROLL_ID = 'app-scroll';

/** The company pages' scroll area, or null outside them (the window scrolls there). */
export const getAppScroller = () => document.getElementById(APP_SCROLL_ID);
