import React from 'react';
import LegalLayout from './LegalLayout';

const PrivacyPolicy = () => (
  <LegalLayout title="Privacy Policy" updated="August 2026">
    <p>
      This policy explains what information Talentmon collects, why, and how it's used. It applies to both
      candidate and company accounts.
    </p>

    <h2>1. Information we collect</h2>
    <p>Depending on your account type, we collect:</p>
    <ul>
      <li><b>Account data</b> — name and email address, managed through our authentication provider, Clerk</li>
      <li><b>Candidate profile data</b> — the CV content you enter: experience, education, skills, and any other section you choose to fill in, plus an optional profile photo</li>
      <li><b>Company data</b> — company name, logo, and details you provide in your company profile</li>
      <li><b>Usage data</b> — actions like searches, bookmarks, and profile unlocks, needed to operate the Service</li>
    </ul>

    <h2>2. Payment information</h2>
    <p>
      Purchases are processed by Paddle, our payment provider and Merchant of Record. Talentmon never sees or
      stores your full card number — Paddle handles that directly. See Paddle's own{' '}
      <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noreferrer">privacy policy</a> for how
      they handle payment data.
    </p>

    <h2>3. How we use your information</h2>
    <p>
      We use your data to operate the Service: matching candidates with searching companies, showing your
      profile as anonymized until unlocked, processing credit purchases, and communicating with you about your
      account.
    </p>

    <h2>4. Candidate profile visibility</h2>
    <p>
      Candidate profiles are shown to companies in anonymized form (no name, contact details, or employer
      names) until a company spends a credit to unlock the full profile. Once unlocked, the company can see
      and, where the platform allows, download the full profile.
    </p>

    <h2>5. File storage</h2>
    <p>
      Profile photos and company logos are stored using Cloudflare R2, an object storage provider. Files are
      only accessible via the URLs our backend generates.
    </p>

    <h2>6. Who we share data with</h2>
    <p>We share data only with the providers needed to run the Service:</p>
    <ul>
      <li>Clerk — authentication</li>
      <li>Paddle — payment processing</li>
      <li>Cloudflare — file storage</li>
      <li>Render and Vercel — application hosting</li>
    </ul>
    <p>We don't sell your data, and we don't share candidate data with companies beyond what unlocking a profile is meant to reveal.</p>

    <h2>7. Data retention and deletion</h2>
    <p>
      You can request deletion of your account and associated data at any time from your account settings.
      We retain transaction records as required for accounting and legal purposes even after account deletion.
    </p>

    <h2>8. Cookies</h2>
    <p>
      We use only the cookies necessary to keep you signed in and to operate the Service — no advertising or
      third-party tracking cookies.
    </p>

    <h2>9. Your rights</h2>
    <p>
      You can access, correct, or delete your data at any time through your account, or by contacting us
      directly.
    </p>

    <h2>10. Contact</h2>
    <p>Questions about this policy: <a href="mailto:talentmon.app@gmail.com">talentmon.app@gmail.com</a></p>
  </LegalLayout>
);

export default PrivacyPolicy;
