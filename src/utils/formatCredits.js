/** "Credit" for one (or minus one, a spend), "Credits" otherwise — for labels next to a separately styled number. */
export const creditWord = (count) => (Math.abs(Number(count)) === 1 ? 'Credit' : 'Credits');

/**
 * At or below this many Credits the company is "running low", until the owner picks its own level on
 * Credits management → Settings (GET balance returns it as `lowBalanceThreshold`). Matches
 * DEFAULT_LOW_BALANCE_THRESHOLD in the backend (credits/low-balance-alert.ts).
 */
export const LOW_CREDIT_BALANCE = 5;

/** Fired on window with `detail: threshold` when the owner changes the level, so the header counter follows without a reload. */
export const LOW_BALANCE_EVENT = 'credits:low-balance-threshold';

/** "1 Credit", "5 Credits" */
export const formatCredits = (count) => `${count} ${creditWord(count)}`;
