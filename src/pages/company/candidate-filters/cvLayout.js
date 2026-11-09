import { useEffect, useState } from 'react';

// From this width the CV drawer pushes the page aside on Bookmarked and
// Purchased (CandidatePreviewDrawer's pushBreakpoint; $push-bp in their SCSS):
// the 55% left must hold the filters (at least 256px) and a 448px card. Below
// it the drawer overlays the page, which keeps its normal layout.
export const CV_PUSH_BREAKPOINT = 1400;

/** Whether the window is at least `px` wide, following resizes. */
export const useMinWidth = (px) => {
  const query = `(min-width: ${px}px)`;
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return matches;
};
