import React from 'react';

const STAR_PATH = 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z';

const FullStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d={STAR_PATH} /></svg>
);

const EmptyStar = () => (
  <svg className="empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={STAR_PATH} /></svg>
);

// Renders a rating with precise fractional granularity, e.g. 4.3 -> 4 full stars + a 5th star filled 30%.
const Stars = ({ rating = 0 }) => {
  const full = Math.floor(rating);
  const remainder = rating - full;

  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <FullStar key={i} />;
        if (i === full && remainder > 0) {
          return (
            <span key={i} className="rev-star-partial">
              <EmptyStar />
              <span className="rev-star-partial-fill" style={{ width: `${remainder * 100}%` }}><FullStar /></span>
            </span>
          );
        }
        return <EmptyStar key={i} />;
      })}
    </>
  );
};

export default Stars;
