import React, { useLayoutEffect, useRef } from 'react';
import cf from './candidateFilters.module.scss';
import { getAppScroller } from 'components/ui/appScroll';

/**
 * The filters column beside an open CV (Bookmarked, Purchased). It sticks
 * near the top of the scroll area under the site header, and its card always
 * ends --side-gap above the window's bottom edge, so the whole card stays in
 * view: under the page title it starts shorter, then grows with the scroll,
 * pixel for pixel, until it sticks. Groups that don't fit scroll inside the card.
 */
const CvSide = ({ children }) => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const side = ref.current;
    if (!side) return undefined;
    // The page scrolls inside the area under the header (AppLayout), not the window.
    const scroller = getAppScroller() || window;
    let stickyTop = 0;
    let gap = 0;
    const readInsets = () => {
      const style = getComputedStyle(side);
      // Sticky top counts from the scroll area's top edge; fit() works in window coordinates.
      const areaTop = scroller === window ? 0 : scroller.getBoundingClientRect().top;
      stickyTop = areaTop + (parseFloat(style.top) || 0);
      gap = parseFloat(style.getPropertyValue('--side-gap')) || 0;
    };
    // Where the card starts now: under the title, or stuck under the header.
    const fit = () => {
      const top = Math.max(stickyTop, side.getBoundingClientRect().top);
      side.style.maxHeight = `${Math.max(0, window.innerHeight - gap - top)}px`;
    };
    const onResize = () => {
      readInsets();
      fit();
    };

    onResize();
    scroller.addEventListener('scroll', fit, { passive: true });
    window.addEventListener('resize', onResize);
    // What's above can change height without a scroll (Purchased's pipeline folding away).
    const observer = new ResizeObserver(fit);
    observer.observe(side.closest('main') || document.body);
    return () => {
      scroller.removeEventListener('scroll', fit);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={cf.cvSide}>
      {children}
    </div>
  );
};

export default CvSide;
