/** "Credit" for one (or minus one, a spend), "Credits" otherwise — for labels next to a separately styled number. */
export const creditWord = (count) => (Math.abs(Number(count)) === 1 ? 'Credit' : 'Credits');

/** At or below this many Credits the company is "running low" — matches LOW_CREDIT_BALANCE in the backend unlocks service. */
export const LOW_CREDIT_BALANCE = 5;

/** "1 Credit", "5 Credits" */
export const formatCredits = (count) => `${count} ${creditWord(count)}`;
