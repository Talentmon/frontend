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
 * search-dashboard's quick Buy Credits modal. Always opens the Paddle Checkout
 * overlay — Paddle doesn't charge a saved card by itself for a one-time purchase,
 * so the company's saved cards are offered there. Credits land asynchronously via
 * the Paddle webhook, so the balance is polled briefly afterward rather than assumed.
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
        const { transactionId, customerAuthToken } = await purchaseCredits(pkg.id);
        await openPaddleCheckout(transactionId, { customerAuthToken });

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
