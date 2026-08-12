import React from 'react';
import LegalLayout from './LegalLayout';

const RefundPolicy = () => (
  <LegalLayout title="Refund Policy" updated="August 2026">
    <p>
      All credit purchases on Talentmon are processed by Paddle.com Market Limited, our reseller and Merchant
      of Record. Paddle handles billing for every order and has its own buyer terms in addition to the policy
      below.
    </p>

    <h2>1. Unused credits</h2>
    <p>
      If you purchased credits and haven't used any of them to unlock a candidate profile, you can request a
      full refund within 14 days of purchase.
    </p>

    <h2>2. Used credits</h2>
    <p>
      Once a credit has been spent to unlock a candidate profile, that portion of the purchase is
      non-refundable — the service (revealing the full profile) has already been delivered. If your remaining
      balance from the same purchase is still unused, that portion remains eligible for a refund under section 1.
    </p>

    <h2>3. Technical issues</h2>
    <p>
      If a payment was charged but credits were not added to your account due to a technical error, contact us
      and we'll investigate and correct the balance or issue a refund.
    </p>

    <h2>4. How to request a refund</h2>
    <p>
      Email <a href="mailto:talentmon.app@gmail.com">talentmon.app@gmail.com</a> with your account email and
      the package you purchased. Since Paddle processes the payment, you can also request a refund directly
      through Paddle using the receipt link from your purchase confirmation email.
    </p>

    <h2>5. Processing time</h2>
    <p>
      Approved refunds are typically returned to your original payment method within 5–10 business days,
      depending on your card issuer.
    </p>
  </LegalLayout>
);

export default RefundPolicy;
