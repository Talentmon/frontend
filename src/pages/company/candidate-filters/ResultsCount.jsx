import React, { useLayoutEffect, useRef, useState } from 'react';
import SalaryViewMenu from '../candidate-search-dashboard/components/SalaryViewMenu';
import ds from '../candidate-search-dashboard/styles/dashboard.module.scss';
import bm from '../bookmarked-candidates/styles/bookmarked.module.scss';

/**
 * "Showing 3 of 5 candidates | Salaries Net · per month ▾" above the cards on
 * Bookmarked and Purchased (the cards show bare amounts). `fill` (beside an
 * open CV): the row spans the cards' column, the count at the filters' side,
 * Salaries at the CV's. When the two don't fit there (a three-digit count, or
 * Gross), "Showing" goes, leaving "128 of 256 candidates" (screen readers
 * still hear it).
 */
const ResultsCount = ({ shown, total, fill = false }) => {
  const rowRef = useRef(null);
  const wordRef = useRef(null);
  const wordWidth = useRef(0);
  const tightRef = useRef(false);
  const [tight, setTight] = useState(false);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!fill || !row) {
      tightRef.current = false;
      setTight(false);
      return undefined;
    }
    // What the row needs with "Showing" in, against what it has.
    const check = () => {
      if (!tightRef.current) wordWidth.current = wordRef.current?.getBoundingClientRect().width || 0;
      const items = [...row.children];
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const content = items.reduce((sum, el) => sum + el.getBoundingClientRect().width, 0) + gap * (items.length - 1);
      const next = content + (tightRef.current ? wordWidth.current : 0) > row.clientWidth + 0.5;
      if (next !== tightRef.current) {
        tightRef.current = next;
        setTight(next);
      }
    };
    check();
    // The count, the salary view and the column can each change width.
    const observer = new ResizeObserver(check);
    observer.observe(row);
    [...row.children].forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [fill]);

  return (
    <div ref={rowRef} className={`${ds.resultsInfo} ${fill ? bm.resultsInfoFull : ''}`}>
      <p role="status" className={bm.resultsCount}>
        <span ref={wordRef} className={tight ? bm.srOnly : undefined}>Showing </span>
        <strong>{shown}</strong> of {total} candidate{total === 1 ? '' : 's'}
      </p>
      <span className={ds.resultsDivider} aria-hidden="true" />
      <SalaryViewMenu fitButton />
    </div>
  );
};

export default ResultsCount;
