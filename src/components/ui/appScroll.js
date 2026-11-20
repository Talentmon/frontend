// The signed-in pages scroll inside the area under their bar (AppLayout), not the
// window, so the scrollbar starts under the bar. On a computer the public pages do
// the same (PublicScroll). Code that follows or sets the scroll uses this element.
export const APP_SCROLL_ID = 'app-scroll';

/**
 * The page's scroll area, or null where the window scrolls. On a phone the public
 * pages' area exists but doesn't scroll, so this returns null there too.
 */
export const getAppScroller = () => {
  const el = document.getElementById(APP_SCROLL_ID);
  return el && getComputedStyle(el).overflowY !== 'visible' ? el : null;
};

/** Scrolls the page back to its top, in whichever of the two scrolls it. */
export const scrollPageToTop = (behavior = 'auto') => {
  (getAppScroller() || window).scrollTo({ top: 0, behavior });
};
