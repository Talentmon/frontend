import React, { useLayoutEffect, useRef } from 'react';
import cf from './candidateFilters.module.scss';

/**
 * The filters column beside an open CV (Bookmarked, Purchased). It sticks
 * under the site header, and its card always ends --side-gap above the
 * window's bottom edge, so the whole card stays in view: under the page title
 * it starts shorter, then grows with the scroll, pixel for pixel, until it
 * sticks. Groups that don't fit scroll inside the card.
 */
const CvSide = ({ children }) => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const side = ref.current;
    if (!side) return undefined;
    let stickyTop = 0;
    let gap = 0;
    const readInsets = () => {
      const style = getComputedStyle(side);
      stickyTop = parseFloat(style.top) || 0;
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
    window.addEventListener('scroll', fit, { passive: true });
    window.addEventListener('resize', onResize);
    // What's above can change height without a scroll (Purchased's pipeline folding away).
    const observer = new ResizeObserver(fit);
    observer.observe(side.closest('main') || document.body);
    return () => {
      window.removeEventListener('scroll', fit);
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
