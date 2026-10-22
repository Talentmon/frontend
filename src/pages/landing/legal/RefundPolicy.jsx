import React from 'react';
import LegalLayout from './LegalLayout';

const KEY_POINTS = [
  'Credits you haven’t spent can be refunded within 14 days of purchase.',
  'Credits already spent on unlocking a profile are not refundable.',
  'Unused credits are forfeited when a company account is deleted, so request a refund first.',
  'Charged but no credits added? Contact us and we’ll correct the balance or refund you.',
  'Email us or use the Paddle receipt link. Approved refunds arrive within 5–10 business days.',
];

const RefundPolicy = () => (
  <LegalLayout
    title="Refund Policy"
    subtitle="When you can get your money back for Credits, and how to ask for it."
    updated="October 2026"
    keyPoints={KEY_POINTS}
  >
    <p>
      Talentmon is operated by Talentmon LTD (Talentmon d.o.o.), Republic of Serbia. All credit purchases on
      Talentmon are processed by Paddle.com Market Limited, our reseller and Merchant of Record. Paddle handles
      billing for every order and has its own buyer terms in addition to the policy below.
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

    <h2>3. Deleting your account</h2>
    <p>
      Unused credits are forfeited when a company account is deleted, and they are not refunded afterwards.
      If you're eligible for a refund under section 1, request it before deleting your account.
    </p>

    <h2>4. Technical issues</h2>
    <p>
      If a payment was charged but credits were not added to your account due to a technical error, contact us
      and we'll investigate and correct the balance or issue a refund.
    </p>

    <h2>5. How to request a refund</h2>
    <p>
      Email <a href="mailto:talentmon.app@gmail.com">talentmon.app@gmail.com</a> with your account email and
      the package you purchased. Since Paddle processes the payment, you can also request a refund directly
      through Paddle using the receipt link from your purchase confirmation email.
    </p>

    <h2>6. Processing time</h2>
    <p>
      Approved refunds are typically returned to your original payment method within 5–10 business days,
      depending on your card issuer.
    </p>
  </LegalLayout>
);

export default RefundPolicy;
