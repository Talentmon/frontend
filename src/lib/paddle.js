import { initializePaddle } from '@paddle/paddle-js';

let paddleInstance;
let currentHandlers = null;

function handleEvent(event) {
  if (!currentHandlers) return;
  if (event.name === 'checkout.completed') {
    currentHandlers.resolve(event.data);
    currentHandlers = null;
  } else if (event.name === 'checkout.closed') {
    currentHandlers.reject(new Error('Checkout closed before completing payment.'));
    currentHandlers = null;
  } else if (event.name === 'checkout.error') {
    currentHandlers.reject(new Error(event.data?.error?.message || 'Checkout error — please try again.'));
    currentHandlers = null;
  }
}

/** Singleton — Paddle.js should only ever be initialized once per page. */
async function getPaddle() {
  if (!paddleInstance) {
    paddleInstance = await initializePaddle({
      environment: import.meta.env.VITE_PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
      eventCallback: handleEvent,
    });
  }
  return paddleInstance;
}

/**
 * Opens the Paddle Checkout overlay for an existing (backend-created) transaction and resolves once payment completes.
 * `customerAuthToken` makes Checkout list the company's saved cards.
 */
export async function openPaddleCheckout(transactionId, { customerAuthToken } = {}) {
  const paddle = await getPaddle();
  return new Promise((resolve, reject) => {
    currentHandlers = { resolve, reject };
    paddle.Checkout.open({
      transactionId,
      ...(customerAuthToken && { customerAuthToken }),
      settings: {
        // one-page variant is required for the "save payment method" checkbox
        // and for saved cards to appear at all — the default multi-page
        // (details, then payment) layout never shows them, even with the
        // account setting enabled.
        variant: 'one-page',
      },
    });
  });
}
