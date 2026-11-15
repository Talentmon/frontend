import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { LEGAL_DOCS, SiteFooter, SiteNav, SUPPORT_EMAIL } from '../legal/SiteChrome';
import legal from '../legal/legal.module.scss';
import styles from './about.module.scss';

// Only facts that hold today: no user counts until there are real ones to show.
const FACTS = [
  { value: '€0', label: 'to search, preview CVs and shortlist' },
  { value: '1 Credit', label: "unlocks one candidate's contact details" },
  { value: 'Net + gross', label: 'salary minimum on every profile' },
  { value: 'Never', label: 'do Credits expire' },
];

const COMPANY_STEPS = [
  { icon: 'Search', title: 'Search', text: 'Filter the pool by skills, experience, salary minimum (net or gross), location, work mode and availability.' },
  { icon: 'Bookmark', title: 'Shortlist', text: 'Bookmark the people who fit and leave notes your whole team can see. Free.' },
  { icon: 'Unlock', title: 'Unlock', text: "Spend one Credit to see the candidate's name, contact details, employers and full CV." },
  { icon: 'Route', title: 'Hire', text: 'Get in touch directly and follow every candidate from New to Hired, with your hire rate and cost per hire.' },
];

const CANDIDATE_STEPS = [
  { icon: 'FileText', title: 'Create your profile', text: 'Build your CV and state your salary minimum, net and gross. It costs you nothing.' },
  { icon: 'EyeOff', title: 'Stay anonymous', text: 'Companies see your experience and skills, never your name, photo, contacts or employers until they unlock you.' },
  { icon: 'SlidersHorizontal', title: 'Choose who sees you', text: 'Show your profile to every company, hide it from the ones you worked for, or hide it completely.' },
  { icon: 'Handshake', title: 'Get contacted', text: 'A company that unlocks you has already accepted your salary minimum. After you are hired, you rate them.' },
];

const VALUES = [
  {
    icon: 'Scale',
    title: 'Salary up front',
    text: "Every profile carries the candidate's salary minimum, net and gross. A company that unlocks a profile agrees to offer at least that much, and the amounts are kept with the unlock.",
  },
  {
    icon: 'EyeOff',
    title: 'Anonymous until it matters',
    text: "Name, photo, contact details and employers stay hidden until a company decides a candidate is worth a Credit. Nobody browses people's identities for free.",
  },
  {
    icon: 'Star',
    title: 'Fair both ways',
    text: "Only candidates a company actually hired can rate it, anonymously. Companies can't edit or remove ratings, and an ignored salary minimum caps the score.",
  },
  {
    icon: 'Coins',
    title: 'Pay for contacts, not for ads',
    text: 'No subscription and no posting fees. Searching is free, a company pays only for the contacts it chooses to unlock, and Credits never expire.',
  },
  {
    icon: 'ShieldCheck',
    title: "Your data isn't for sale",
    text: "We don't sell data and we don't use advertising cookies. Unlocked profiles may be used only for the company's own recruiting.",
  },
  {
    icon: 'Globe',
    title: 'Built for every market',
    text: 'Salaries in any currency, net or gross, per month or per year, so a company in Berlin and a candidate in Belgrade read the same number the same way.',
  },
];

const IS = [
  'A platform that brings companies and candidates together',
  'Free for candidates, and free for companies to search and shortlist',
  'Paid only when a company unlocks a candidate, one Credit each',
  'A place where the salary is settled before the first conversation',
];

const IS_NOT = [
  'A recruitment agency or an employer: the conversation and the hiring decision are yours',
  'A job board: companies don’t post ads and candidates don’t apply',
  'A background check: candidates write their own profiles and we don’t verify them, so check references before a hire',
  'A subscription: there are no monthly fees',
];

const About = () => (
  <div className={legal.page}>
    <Helmet>
      <title>About Talentmon</title>
      <meta
        name="description"
        content="Talentmon connects companies with candidates directly: anonymous profiles with the salary up front, free to search, and paid only when a company unlocks a contact."
      />
    </Helmet>

    <SiteNav />

    {/* ===== Mission ===== */}
    <header className={styles.hero}>
      <div className={legal.wrap}>
        <div className={styles.heroText}>
          <span className={legal.eyebrow}>About Talentmon</span>
          <h1>Hiring without the job ad.</h1>
          <p className={styles.lead}>
            Talentmon connects companies with the people they want to hire, directly. Candidates who are open to new
            work keep an anonymous profile with the salary they really expect, and companies reach the ones who fit,
            without writing a job ad or reading a pile of applications.
          </p>
          <div className={styles.heroActions}>
            <Link to="/" className={styles.btnGold}>
              I'm hiring
              <Icon name="ArrowRight" size={17} />
            </Link>
            <Link to="/landing-page-candidates" className={styles.btnGhost}>I'm looking for work</Link>
          </div>
        </div>

        <ul className={styles.facts}>
          {FACTS.map((fact) => (
            <li key={fact.value}>
              <b>{fact.value}</b>
              <span>{fact.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </header>

    <main>
      {/* ===== Story ===== */}
      <section className={styles.section}>
        <div className={`${legal.wrap} ${styles.story}`}>
          <div className={styles.storyHead}>
            <span className={styles.kicker}>Why we built it</span>
            <h2>Both sides of hiring deserved better.</h2>
          </div>
          <div className={styles.storyBody}>
            <p>
              Hiring usually starts with a job ad. A company writes it, pays to post it and waits. Hundreds of
              applications arrive, most of them from people who don't fit, and someone has to read every one.
              Meanwhile the people who would fit best are busy at their current job and never see the ad.
            </p>
            <p>
              Candidates have the opposite problem. They send CVs into silence, hear the salary only in the third
              interview, and often never hear back at all.
            </p>
            <p>
              We built Talentmon so it works the other way round. Candidates describe what they do and what they
              need, once. Companies go straight to the people who fit, and the salary is on the table before anyone
              picks up the phone.
            </p>
            <blockquote className={styles.quote}>
              Companies should reach the people who fit. Candidates should be found on their own terms.
            </blockquote>
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className={`${styles.section} ${styles.sectionTint}`}>
        <div className={legal.wrap}>
          <div className={styles.secHead}>
            <span className={styles.kicker}>How it works</span>
            <h2>One platform, two sides.</h2>
            <p>Companies and candidates use Talentmon differently, but they meet on the same terms.</p>
          </div>
          <div className={styles.sides}>
            {[
              { title: 'For companies', icon: 'Building2', steps: COMPANY_STEPS, link: '/', linkText: 'See Talentmon for companies' },
              { title: 'For candidates', icon: 'UserRound', steps: CANDIDATE_STEPS, link: '/landing-page-candidates', linkText: 'See Talentmon for candidates' },
            ].map((side) => (
              <article key={side.title} className={styles.side}>
                <div className={styles.sideHead}>
                  <span className={styles.sideIcon}><Icon name={side.icon} size={20} /></span>
                  <h3>{side.title}</h3>
                </div>
                <ol className={styles.steps}>
                  {side.steps.map((step, index) => (
                    <li key={step.title}>
                      <span className={styles.stepIcon}>
                        <Icon name={step.icon} size={17} />
                        <span className={styles.stepNum}>{index + 1}</span>
                      </span>
                      <span>
                        <b>{step.title}</b>
                        <span className={styles.stepText}>{step.text}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <Link to={side.link} className={styles.sideLink}>
                  {side.linkText}
                  <Icon name="ArrowRight" size={15} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Values ===== */}
      <section className={styles.section}>
        <div className={legal.wrap}>
          <div className={styles.secHead}>
            <span className={styles.kicker}>What we stand for</span>
            <h2>The rules we built Talentmon around.</h2>
          </div>
          <div className={styles.values}>
            {VALUES.map((value) => (
              <div key={value.title} className={styles.value}>
                <span className={styles.valueIcon}><Icon name={value.icon} size={19} /></span>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Is / isn't ===== */}
      <section className={`${styles.section} ${styles.sectionTint}`}>
        <div className={legal.wrap}>
          <div className={styles.secHead}>
            <span className={styles.kicker}>Plain and simple</span>
            <h2>What Talentmon is, and what it isn't.</h2>
          </div>
          <div className={styles.isGrid}>
            <div className={`${styles.isCard} ${styles.isYes}`}>
              <h3><Icon name="CheckCircle2" size={19} />Talentmon is</h3>
              <ul>
                {IS.map((item) => (
                  <li key={item}><Icon name="Check" size={16} />{item}</li>
                ))}
              </ul>
            </div>
            <div className={`${styles.isCard} ${styles.isNo}`}>
              <h3><Icon name="XCircle" size={19} />Talentmon isn't</h3>
              <ul>
                {IS_NOT.map((item) => (
                  <li key={item}><Icon name="X" size={16} />{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className={styles.isNote}>
            The details are in our <Link to="/terms-of-service">Terms of Service</Link>.
          </p>
        </div>
      </section>

      {/* ===== Who we are ===== */}
      <section className={styles.section}>
        <div className={`${legal.wrap} ${styles.who}`}>
          <div>
            <span className={styles.kicker}>Who we are</span>
            <h2>A company building for every market.</h2>
            <p>
              Talentmon is built and run by Talentmon LTD. Payments are handled by Paddle, our Merchant of
              Record, so every purchase comes with a proper invoice and VAT, wherever the company is.
            </p>
            <p>
              We build Talentmon together with the people who use it. Companies can post ideas on the Your
              suggestions page and vote on what we work on next, and anyone can write to us.
            </p>
          </div>
          <aside className={styles.contactCard}>
            <span className={styles.contactIcon}><Icon name="Mail" size={22} /></span>
            <h3>Get in touch</h3>
            <p>Questions, partnerships or press: write to us and we'll get back to you.</p>
            <a className={styles.contactBtn} href={`mailto:${SUPPORT_EMAIL}`}>
              <Icon name="Send" size={15} />
              {SUPPORT_EMAIL}
            </a>
            <div className={styles.contactLinks}>
              {LEGAL_DOCS.map((doc) => (
                <Link key={doc.path} to={doc.path}>{doc.label}</Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* ===== Final call ===== */}
      <section className={styles.cta}>
        <div className={legal.wrap}>
          <h2>Ready to meet your next hire, or your next job?</h2>
          <div className={styles.heroActions}>
            <Link to="/" className={styles.btnGold}>
              I'm hiring
              <Icon name="ArrowRight" size={17} />
            </Link>
            <Link to="/landing-page-candidates" className={styles.btnGhost}>I'm looking for work</Link>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
);

export default About;
