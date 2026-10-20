import React from 'react';
import LegalLayout from './LegalLayout';

const TermsOfService = () => (
  <LegalLayout title="Terms of Service" updated="October 2026">
    <p>
      These Terms govern your use of Talentmon (the "Service"), a platform where companies search an
      anonymized pool of candidates and spend credits to unlock full candidate profiles. The Service is
      operated by Talentmon LTD (Talentmon d.o.o.), a company registered in the Republic of Serbia
      ("Talentmon", "we"). By creating an account or using the Service, you agree to these Terms.
    </p>

    <h2>1. Accounts</h2>
    <p>
      You register as either a company or a candidate. Each account has a single role, and you must provide
      accurate information. You're responsible for activity on your account and for keeping your login
      credentials secure.
    </p>

    <h2>2. Credits and purchases</h2>
    <p>
      Companies unlock candidate profiles by spending credits, purchased in packages for a one-time price.
      Credits do not expire and there is no subscription or recurring billing — you only pay when you choose
      to buy more credits.
    </p>

    <h2>3. Payment processing</h2>
    <p>
      Our order process is conducted by our online reseller, Paddle.com. Paddle.com Market Limited is the
      Merchant of Record for all orders placed through Talentmon, and handles payment collection, invoicing,
      and applicable sales tax / VAT. Paddle also handles customer service inquiries related to your order and
      payment. See Paddle's own{' '}
      <a href="https://www.paddle.com/legal/terms" target="_blank" rel="noreferrer">terms</a> for details on
      how they process your order.
    </p>

    <h2>4. Acceptable use</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Scrape, bulk-export, or otherwise extract candidate data outside the normal use of the Service</li>
      <li>Resell, sublicense, or share unlocked candidate profiles with anyone outside your organization</li>
      <li>Use unlocked candidate data for any purpose other than legitimate recruiting</li>
      <li>Attempt to bypass the credit system or access profiles you haven't unlocked</li>
    </ul>

    <h2>5. Candidate content</h2>
    <p>
      Candidates own the content of their profile and CV. By publishing a profile, a candidate allows it to be
      shown (anonymized) to searching companies, and shown in full to a company that spends a credit to unlock
      it. Candidates may edit or delete their profile at any time.
    </p>

    <h2>6. Company reviews</h2>
    <p>
      Candidates can rate and review the companies they've been in contact with through the Service. Reviews
      belong to the candidates who wrote them: a company can't edit or remove them, and they are not removed
      when a company deletes its account. If the same company registers again, its earlier reviews may be
      linked to the new account.
    </p>

    <h2>7. Termination and account deletion</h2>
    <p>
      You may stop using the Service and delete your account at any time from your account settings. We may
      suspend or terminate accounts that violate these Terms.
    </p>
    <p>
      When a company account is deleted, its profile is removed from the Service and every team member loses
      access. Any unused credits are forfeited and are not refunded — if you're eligible for a refund under our{' '}
      <a href="/refund-policy">Refund Policy</a>, request it before deleting the account. Some records are kept
      after deletion, as described in our <a href="/privacy-policy">Privacy Policy</a>.
    </p>

    <h2>8. Disclaimer and limitation of liability</h2>
    <p>
      The Service is provided "as is." Talentmon doesn't guarantee the accuracy of information candidates or
      companies submit, and isn't a party to any employment relationship formed through the Service. To the
      extent permitted by law, Talentmon's liability arising from your use of the Service is limited to the
      amount you paid us in the preceding 12 months.
    </p>

    <h2>9. Governing law</h2>
    <p>
      These Terms are governed by the laws of the Republic of Serbia. Any dispute arising from them will be
      resolved by the competent courts of the Republic of Serbia, unless mandatory consumer protection law
      where you live gives you the right to bring it elsewhere.
    </p>

    <h2>10. Changes to these Terms</h2>
    <p>
      We may update these Terms from time to time. Continued use of the Service after a change means you
      accept the updated Terms.
    </p>

    <h2>11. Contact</h2>
    <p>
      Talentmon LTD (Talentmon d.o.o.), Republic of Serbia —{' '}
      <a href="mailto:talentmon.app@gmail.com">talentmon.app@gmail.com</a>
    </p>
  </LegalLayout>
);

export default TermsOfService;
