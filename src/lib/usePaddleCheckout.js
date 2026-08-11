import { useCallback, useState } from 'react';
import { openPaddleCheckout } from 'lib/paddle';
import { purchaseCredits, getBalance } from 'pages/company/credit-management/creditsApi';

const POLL_ATTEMPTS = 6;
const POLL_INTERVAL_MS = 1000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shared purchase-flow logic for both the credit-management Purchase modal and the
 * search-dashboard's quick Buy Credits modal. If the company has no saved payment
 * method yet, opens the Paddle Checkout overlay to collect one; otherwise the
 * backend charges the saved method directly and no overlay is shown at all.
 * Either way, credits land asynchronously via the Paddle webhook, so the balance
 * is polled briefly afterward rather than assumed.
 */
export function usePaddleCheckout({ onSuccess } = {}) {
  const [processing, setProcessing] = useState(false);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState('');

  const buy = useCallback(
    async (pkg) => {
      if (!pkg || processing || settling) return;
      setError('');
      setProcessing(true);

      try {
        const initialBalance = await getBalance().then((r) => r.balance).catch(() => null);
        const { transactionId, requiresCheckout } = await purchaseCredits(pkg.id);

        if (requiresCheckout) {
          await openPaddleCheckout(transactionId);
        }

        setProcessing(false);
        setSettling(true);

        let finalBalance = initialBalance;
        let credited = false;
        for (let i = 0; i < POLL_ATTEMPTS; i++) {
          await wait(POLL_INTERVAL_MS);
          try {
            const { balance } = await getBalance();
            finalBalance = balance;
            if (initialBalance == null || balance > initialBalance) {
              credited = true;
              break;
            }
          } catch {
            // keep polling
          }
        }

        setSettling(false);
        onSuccess?.({ balance: finalBalance, credited });
      } catch (err) {
        setProcessing(false);
        setSettling(false);
        setError(err?.response?.data?.message || err?.message || 'Payment failed — please try again.');
      }
    },
    [processing, settling, onSuccess],
  );

  return { buy, processing, settling, error, busy: processing || settling };
}
