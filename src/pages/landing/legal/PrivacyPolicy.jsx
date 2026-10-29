import React from 'react';
import LegalLayout from './LegalLayout';

const KEY_POINTS = [
  'We collect what we need to run Talentmon: account details, CV and company profile data, sign-in and usage data.',
  'Candidate profiles stay anonymous (no name, contact details or employers) until a company unlocks them.',
  "We never see or store your full card number. Payments are handled by Paddle; your team only sees a saved card's type, last four digits and expiry date.",
  "We don't sell your data. We share it only with the providers that run the service, listed in section 6.",
  'We use only the cookies needed to keep you signed in. No advertising or tracking cookies.',
  'You can access, correct or delete your data at any time.',
];

const PrivacyPolicy = () => (
  <LegalLayout
    title="Privacy Policy"
    subtitle="What we collect, why we need it, and what happens to it."
    updated="October 2026"
    keyPoints={KEY_POINTS}
  >
    <p>
      This policy explains what information Talentmon collects, why, and how it's used. It applies to both
      candidate and company accounts. Talentmon LTD (Talentmon d.o.o.), registered in the Republic of Serbia,
      is responsible for your data.
    </p>

    <h2>1. Information we collect</h2>
    <p>Depending on your account type, we collect:</p>
    <ul>
      <li><b>Account data</b> — name and email address, managed through our authentication provider, Clerk</li>
      <li><b>Sign-in data</b> — the browser, device type, approximate location and IP address of your sign-ins, so you can see where you're signed in and sign out other devices</li>
      <li><b>Candidate profile data</b> — the CV content you enter: experience, education, skills, and any other section you choose to fill in, plus an optional profile photo</li>
      <li><b>Company data</b> — company name, logo, and details you provide in your company profile</li>
      <li><b>Reviews</b> — the ratings and comments candidates leave about companies</li>
      <li><b>Usage data</b> — actions like searches, bookmarks, and profile unlocks, needed to operate the Service</li>
    </ul>

    {/* The "Learn more about security" link on the Payment methods tab points here (#payments-and-card-security). */}
    <h2>2. Payments and card security</h2>
    <p>
      Purchases are processed by Paddle, our payment provider and Merchant of Record. You enter your card details
      in Paddle's checkout and they go straight to Paddle: Talentmon never sees or stores your full card number or
      security code.
    </p>
    <ul>
      <li><b>Encrypted</b> — every payment is sent over an encrypted (SSL/TLS) connection</li>
      <li><b>PCI DSS</b> — Paddle is compliant with PCI DSS, the card industry's data security standard</li>
      <li><b>3D Secure</b> — your bank may ask you to confirm a payment</li>
      <li>
        <b>Saved cards</b> — if you tick the box to save your card at checkout, Paddle keeps it for your
        company's future purchases. Everyone on your company's team can then pay with it, and on the Payment
        tab they see each saved card's type, last four digits and expiry date. We load these details from Paddle
        when the page opens and don't store them. Only the account owner can remove a saved card.
      </li>
    </ul>
    <p>
      See Paddle's own{' '}
      <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noreferrer">privacy policy</a> for how
      they handle payment data.
    </p>

    <h2>3. How we use your information</h2>
    <p>
      We use your data to operate the Service: matching candidates with searching companies, showing your
      profile as anonymized until unlocked, processing credit purchases, showing company reviews, keeping your
      account secure, and communicating with you about your account.
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
      <li>Clerk — authentication and sign-in security</li>
      <li>Paddle — payment processing</li>
      <li>Neon — database hosting, where account, profile and company data is stored</li>
      <li>Cloudflare — file storage</li>
      <li>Render and Vercel — application hosting</li>
    </ul>
    <p>We don't sell your data, and we don't share candidate data with companies beyond what unlocking a profile is meant to reveal.</p>

    <h2>7. Data retention and deletion</h2>
    <p>
      You can delete your account at any time from your account settings. Your login is removed and your
      profile disappears from the Service. Some records are kept afterwards:
    </p>
    <ul>
      <li>
        <b>Transaction records</b> — purchases and credit history, for as long as accounting and tax law
        requires.
      </li>
      <li>
        <b>A deleted company's details</b> — the basic and contact information from its company profile, the
        reviews candidates wrote about it, and records of which candidate profiles it unlocked. Only
        Talentmon's administrators can see them. We keep them to recognise the company if it registers again,
        so reviews can't be wiped by re-registering, and to handle disputes.
      </li>
    </ul>
    <p>
      When a company account is deleted, its team members' names and emails, the copies of candidate profiles
      it unlocked, and its notes about candidates are deleted.
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
  </LegalLayout>
);

export default PrivacyPolicy;
