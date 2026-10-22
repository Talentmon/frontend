/** "Credit" for one (or minus one, a spend), "Credits" otherwise — for labels next to a separately styled number. */
export const creditWord = (count) => (Math.abs(Number(count)) === 1 ? 'Credit' : 'Credits');

/** "1 Credit", "5 Credits" */
export const formatCredits = (count) => `${count} ${creditWord(count)}`;
