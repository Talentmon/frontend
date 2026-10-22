import React from 'react';
import LegalLayout from './LegalLayout';

const KEY_POINTS = [
  'All credit purchases are final: credits are not refundable, whether you’ve used them or not.',
  'Credits never expire, so there’s no deadline to use them.',
  'Unused credits are forfeited when a company account is deleted.',
  'Charged but no credits added, or charged twice? Contact us and we’ll fix the balance or refund the incorrect charge.',
  'Any rights you have under mandatory law or Paddle’s buyer terms still apply.',
];

const RefundPolicy = () => (
  <LegalLayout
    title="Refund Policy"
    subtitle="Credit purchases are final. Here’s what that means, and what to do if a payment goes wrong."
    updated="October 2026"
    keyPoints={KEY_POINTS}
  >
    <p>
      Talentmon is operated by Talentmon LTD (Talentmon d.o.o.), Republic of Serbia. All credit purchases on
      Talentmon are processed by Paddle.com Market Limited, our reseller and Merchant of Record. Paddle handles
      billing for every order and has its own buyer terms in addition to the policy below.
    </p>

    <h2>1. Credits are non-refundable</h2>
    <p>
      All credit purchases are final. Credits are not refundable, whether or not they have been used to unlock a
      candidate profile. Credits never expire, so you can use them whenever you need them.
    </p>

    <h2>2. Deleting your account</h2>
    <p>
      Unused credits are forfeited when a company account is deleted, and they are not refunded.
    </p>

    <h2>3. Billing errors</h2>
    <p>
      If a payment was charged but credits were not added to your account, or you were charged more than once for
      the same purchase, contact us and we'll investigate and correct the balance or refund the incorrect charge.
    </p>

    <h2>4. How to report a billing problem</h2>
    <p>
      Email <a href="mailto:talentmon.app@gmail.com">talentmon.app@gmail.com</a> with your account email, the
      package you purchased and, if you have it, your Paddle receipt. Since Paddle processes the payment, you can
      also contact Paddle directly using the receipt link from your purchase confirmation email.
    </p>

    <h2>5. Processing time</h2>
    <p>
      Refunds approved for billing errors are returned to your original payment method within 30 business days,
      depending on your card issuer.
    </p>

    <h2>6. Your legal rights</h2>
    <p>
      Nothing in this policy limits any rights you have under mandatory law, or under Paddle's{' '}
      <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noreferrer">buyer terms and refund
      policy</a>, which apply to every purchase.
    </p>
  </LegalLayout>
);

export default RefundPolicy;
