import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from 'components/ui/Header';
import Icon from 'components/AppIcon';
import styles from './styles/help.module.scss';

// Company guide behind "Help & Support" in the profile menu. Screenshots live in
// public/help and are regenerated with scripts/help-screenshots.mjs.

const SUPPORT_EMAIL = 'talentmon.app@gmail.com';

const SECTIONS = [
  { id: 'profile', label: 'Company profile', icon: 'Building2' },
  { id: 'credits', label: 'Credits', icon: 'Coins' },
  { id: 'search', label: 'Search', icon: 'Search' },
  { id: 'bookmarks', label: 'Bookmarks', icon: 'Bookmark' },
  { id: 'unlock', label: 'Unlocking', icon: 'Unlock' },
  { id: 'purchased', label: 'Purchased', icon: 'ShoppingBag' },
  { id: 'team', label: 'Team', icon: 'Users' },
  { id: 'reputation', label: 'Reputation', icon: 'Star' },
];

const FLOW = [
  { target: 'profile', icon: 'Building2', title: 'Complete your profile', text: 'Required fields, then save' },
  { target: 'credits', icon: 'Coins', title: 'Buy Credits', text: '1 Credit = 1 unlock' },
  { target: 'search', icon: 'Search', title: 'Search & shortlist', text: 'Filters and bookmarks' },
  { target: 'unlock', icon: 'Unlock', title: 'Unlock', text: 'Reveal name and contacts' },
  { target: 'purchased', icon: 'Handshake', title: 'Contact & hire', text: 'Reach out, track progress' },
];

const REQUIRED_FIELDS = [
  'Company name',
  'Year founded',
  'Company email',
  'Industry',
  'Company size',
  'City',
  'Country',
  'Address',
  'Short description',
];

const FILTER_GROUPS = [
  { name: 'Basic search', text: 'Position and location' },
  { name: 'Experience & education', text: 'Years of experience and highest education' },
  { name: 'Salary', text: 'Expected salary range, in the currency you pick' },
  { name: 'Skills', text: 'Skill categories and specific skills' },
  { name: 'Languages', text: 'Languages, each with a minimum level' },
  { name: 'Industry', text: 'Industry, then subindustry' },
  { name: 'Certifications', text: 'Any certification, or by issuer, family or exact name' },
  { name: 'Status & preferences', text: 'Actively searching or open to offers, job type, notice period, relocation and business travel' },
];

const PIPELINE = [
  { label: 'New', tone: 'sNew' },
  { label: 'Contacted', tone: 'sContacted' },
  { label: 'Interviewed', tone: 'sInterviewed' },
  { label: 'Hired', tone: 'sHired' },
  { label: 'Rejected', tone: 'sRejected' },
];

const SEATS = [
  { size: '1–50 employees', seats: '3' },
  { size: '51–200 employees', seats: '5' },
  { size: '201–1000 employees', seats: '15' },
  { size: '1000+ employees', seats: 'Unlimited' },
];

const RATING_CATEGORIES = [
  { name: 'Hiring process', text: 'Speed, clarity, fairness' },
  { name: 'Communication', text: 'Feedback and tone' },
  { name: 'Work culture', text: 'Team, values, atmosphere' },
  { name: 'Benefits', text: 'Health coverage, days off, equipment, flexibility' },
];

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ----- Building blocks -----

const SectionHead = ({ num, eyebrow, title, subtitle, icon }) => (
  <header className={styles.secHead}>
    <span className={styles.secNum}>{num}</span>
    <div className={styles.secText}>
      <span className={styles.secEyebrow}>
        <Icon name={icon} size={13} />
        {eyebrow}
      </span>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  </header>
);

const Figure = ({ src, alt, caption, onZoom, narrow = false }) => (
  <figure className={`${styles.figure} ${narrow ? styles.figureNarrow : ''}`}>
    <button type="button" className={styles.shot} onClick={() => onZoom({ src, alt })} aria-label={`Enlarge: ${alt}`}>
      <img src={src} alt={alt} loading="lazy" />
      <span className={styles.zoomHint}><Icon name="ZoomIn" size={15} /></span>
    </button>
    {caption && <figcaption>{caption}</figcaption>}
  </figure>
);

const Callout = ({ tone = 'tip', icon, title, children }) => (
  <div className={`${styles.callout} ${styles[tone]}`}>
    <span className={styles.calloutIcon}><Icon name={icon} size={17} /></span>
    <div>
      <b>{title}</b>
      <div className={styles.calloutText}>{children}</div>
    </div>
  </div>
);

const Steps = ({ items }) => (
  <ol className={styles.steps}>
    {items.map((item, index) => (
      <li key={index}>
        <span className={styles.stepNum}>{index + 1}</span>
        <span>{item}</span>
      </li>
    ))}
  </ol>
);

// Icon + bold name + explanation; used for "what's on the card" style lists.
const Points = ({ items, columns = 1 }) => (
  <ul className={`${styles.points} ${columns === 2 ? styles.points2 : ''}`}>
    {items.map((item) => (
      <li key={item.title}>
        <span className={styles.pointIcon}><Icon name={item.icon} size={16} /></span>
        <span>
          <b>{item.title}</b>
          <span className={styles.pointText}>{item.text}</span>
        </span>
      </li>
    ))}
  </ul>
);

const Path = ({ children }) => (
  <span className={styles.path}>
    <Icon name="MousePointerClick" size={14} />
    {children}
  </span>
);

// ----- Page -----

const CompanyHelp = () => {
  const location = useLocation();
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [zoomed, setZoomed] = useState(null);

  // Highlight the section currently in the reading band of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-35% 0px -60% 0px' }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Deep links like /help#credits.
  useEffect(() => {
    const id = location.hash?.slice(1);
    if (id) setTimeout(() => scrollToSection(id), 100);
  }, [location.hash]);

  useEffect(() => {
    if (!zoomed) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setZoomed(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoomed]);

  useEffect(() => {
    document.title = 'Help & Support · Talentmon';
  }, []);

  return (
    <div className={styles.page}>
      <Header />
      <main className="pt-16 max-w-[1180px] mx-auto px-[22px]" style={{ paddingBottom: '80px' }}>
        {/* ===== Hero ===== */}
        <section className={styles.hero}>
          <span className={styles.heroEyebrow}>
            <Icon name="LifeBuoy" size={14} />
            Help & Support
          </span>
          <h1>How Talentmon works</h1>
          <p className={styles.heroLead}>
            Talentmon lets you reach the people you want to hire <em>directly</em>. No job ads, no waiting for
            applications, no scrolling through hundreds of CVs.
          </p>
          <p className={styles.heroText}>
            You describe the person you're looking for with filters, see only the candidates who match, and contact
            them yourself. Every candidate here has a profile because they're open to new opportunities. Profiles stay
            anonymous until you unlock them: you see experience, skills, salary expectations and availability, but not
            the name, photo, contact details or employers. When a profile looks right, unlock it for one Credit and
            reach out.
          </p>

          <div className={styles.pillars}>
            <div className={styles.pillar}>
              <span className={styles.pillarIcon}><Icon name="MegaphoneOff" size={20} /></span>
              <b>No job ads</b>
              <span>No writing, posting or promoting listings, then waiting for someone to apply.</span>
            </div>
            <div className={styles.pillar}>
              <span className={styles.pillarIcon}><Icon name="ListFilter" size={20} /></span>
              <b>No CV piles</b>
              <span>Filters do the reading. You only see candidates who match what you need.</span>
            </div>
            <div className={styles.pillar}>
              <span className={styles.pillarIcon}><Icon name="Handshake" size={20} /></span>
              <b>Direct contact</b>
              <span>Unlock a profile and reach the candidate yourself by email, phone or LinkedIn.</span>
            </div>
          </div>
        </section>

        {/* ===== The flow in five steps ===== */}
        <nav className={styles.flow} aria-label="Your hiring flow">
          {FLOW.map((step, index) => (
            <button key={step.target} type="button" className={styles.flowStep} onClick={() => scrollToSection(step.target)}>
              <span className={styles.flowIcon}>
                <Icon name={step.icon} size={18} />
                <span className={styles.flowNum}>{index + 1}</span>
              </span>
              <span className={styles.flowText}>
                <b>{step.title}</b>
                <span>{step.text}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className={styles.layout}>
          {/* ===== Table of contents ===== */}
          <aside className={styles.toc}>
            <div className={styles.tocTitle}>On this page</div>
            <ul>
              {SECTIONS.map((section, index) => (
                <li key={section.id}>
                  <button
                    type="button"
                    className={activeId === section.id ? styles.tocOn : ''}
                    onClick={() => scrollToSection(section.id)}
                  >
                    <span className={styles.tocNum}>{index + 1}</span>
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
            <a className={styles.tocSupport} href={`mailto:${SUPPORT_EMAIL}`}>
              <Icon name="Mail" size={15} />
              Contact support
            </a>
          </aside>

          <div className={styles.content}>
            {/* ===== 1. Company profile ===== */}
            <section id="profile" className={styles.section}>
              <SectionHead
                num={1}
                icon="Building2"
                eyebrow="Step 1"
                title="Complete your company profile"
                subtitle="It's the first thing candidates see when you get in touch."
              />
              <div className={styles.split}>
                <div className={styles.prose}>
                  <p>
                    You sign up with just your company name. Before <b>Search</b>, <b>Bookmarked</b>, <b>Purchased</b> and{' '}
                    <b>Credits</b> open up, fill in the required fields and save. Until then, a banner at the top of the
                    settings page lists exactly what's still missing.
                  </p>
                  <Path>Profile menu → Company Profile → Company information</Path>

                  <div className={styles.subTitle}>Required fields</div>
                  <div className={styles.chips}>
                    {REQUIRED_FIELDS.map((field) => (
                      <span key={field} className={styles.chip}>
                        <Icon name="Check" size={13} />
                        {field}
                      </span>
                    ))}
                  </div>
                  <ul className={styles.bullets}>
                    <li><b>Company email</b> is your login email and is filled in for you.</li>
                    <li><b>Short description</b> has room for 200 characters. Candidates read it first, so make it count.</li>
                  </ul>
                </div>
                <Figure
                  src="/help/profile-required.webp"
                  alt="Company information with the 'Complete your company profile' banner"
                  caption="The banner lists the required fields that are still empty."
                  onZoom={setZoomed}
                />
              </div>
              <Points
                columns={2}
                items={[
                  { icon: 'Sparkles', title: 'Fill in the rest too', text: 'Detailed description, contact email, phone, LinkedIn, website, work mode, flexible hours and benefits are optional, but a complete profile gets more replies.' },
                  { icon: 'Eye', title: 'Preview profile', text: 'The Preview profile button at the top of the settings page shows your page exactly as candidates see it.' },
                  { icon: 'Users', title: 'Company size', text: 'Size also sets how many team accounts you get (see Team). After the first choice, it can be changed once a year.' },
                  { icon: 'Save', title: "Don't forget to save", text: 'Changes on this tab are saved with the Save button. As soon as the required fields are saved, you are taken to Search.' },
                ]}
              />
            </section>

            {/* ===== 2. Credits ===== */}
            <section id="credits" className={styles.section}>
              <SectionHead
                num={2}
                icon="Coins"
                eyebrow="Step 2"
                title="Buy Credits"
                subtitle="One Credit unlocks one candidate profile."
              />
              <div className={styles.prose}>
                <p>
                  Credits are how you pay on Talentmon. Searching, filtering, previewing CVs and bookmarking are all
                  free. You only spend a Credit when you unlock a candidate's full profile and contact details.
                </p>
              </div>
              <Steps
                items={[
                  <>Click <b>Credits</b> in the top bar, then <b>Buy Credits</b> (or open the <b>Purchase</b> tab).</>,
                  <>Pick a package and click <b>Buy now</b>. The bigger the package, the lower the price per unlock.</>,
                  <>Check the summary and click <b>Continue to payment</b>.</>,
                  <>Pay in Paddle's secure checkout, by card or PayPal. The Credits land on your balance right away.</>,
                ]}
              />
              <Figure
                src="/help/credits-packages.webp"
                alt="Credit packages on the Purchase tab"
                caption="Packages on the Purchase tab, with the price per unlock and the bookmark bonus."
                onZoom={setZoomed}
              />
              <Points
                columns={2}
                items={[
                  { icon: 'Infinity', title: 'Credits never expire', text: 'Buy once and use them whenever you need them.' },
                  { icon: 'Users', title: 'One balance for the team', text: 'Everyone on your team can buy Credits and spends from the same balance. It is always shown in the top bar.' },
                  { icon: 'Bookmark', title: 'Bonus bookmark slots', text: 'Larger packages add extra bookmark slots for 6 months. The bonus is shown on each package.' },
                  { icon: 'Wallet', title: 'Your currency', text: "Prices include VAT and are shown in your company's billing currency (EUR, USD, GBP or CNY), set under Account settings." },
                  { icon: 'History', title: 'History', text: 'Every purchase and unlock, grouped by day, with totals at the top and Export CSV. With a team, it shows who made each one.' },
                  { icon: 'BarChart3', title: 'Analytics', text: 'Hire rate, cost per hire and time to hire, where your unlocked candidates are now, and what each team member unlocked.' },
                ]}
              />

              <div className={styles.subTitle}>Saved cards</div>
              <div className={styles.split}>
                <div className={styles.prose}>
                  <p>
                    At checkout, tick <b>Save my card details</b> to keep your card for next time. The next checkout
                    offers it, so nobody has to type it in again. Saved cards belong to the company: anyone on the team
                    can pay with them, or with a new card.
                  </p>
                  <Path>Credits → Payment</Path>
                  <ul className={styles.bullets}>
                    <li><b>Manage cards</b> lists every saved card. Only the account owner sees it and can remove cards.</li>
                    <li>The rest of the team gets <b>See other cards</b>: the same list, without Remove.</li>
                    <li>To add another card, pay with it at checkout and tick the box to save it.</li>
                    <li>Card details stay with Paddle. Talentmon only shows the card type, last four digits and expiry date.</li>
                  </ul>
                </div>
                <Figure
                  src="/help/credits-payment-methods.webp"
                  alt="Payment tab with a saved card and the list of saved cards"
                  caption="The Payment tab, with Manage cards open."
                  onZoom={setZoomed}
                />
              </div>

              <div className={styles.subTitle}>Low balance alert</div>
              <div className={styles.split}>
                <div className={styles.prose}>
                  <p>
                    Get a heads-up before your team runs out of Credits. Pick an alert level: when your balance drops to
                    that many Credits or fewer, you count as running low. It's on by default at 5 Credits.
                  </p>
                  <Path>Credits → Settings</Path>
                  <ul className={styles.bullets}>
                    <li>Any whole number from 1 to 100, with quick picks and a suggestion of about a week of unlocks at your team's pace.</li>
                    <li>The balance in the top bar turns amber at the alert level.</li>
                    <li>With <b>Notify the team</b> on, everyone gets a bell notification when the balance reaches the level, and again at zero. Each alert is sent once.</li>
                    <li>Only the account owner changes the alert. The rest of the team sees how it's set.</li>
                  </ul>
                </div>
                <Figure
                  src="/help/credits-alert.webp"
                  alt="Low balance alert on the Settings tab"
                  caption="The alert level, the current balance and the notifications your team gets."
                  onZoom={setZoomed}
                />
              </div>
            </section>

            {/* ===== 3. Search ===== */}
            <section id="search" className={styles.section}>
              <SectionHead
                num={3}
                icon="Search"
                eyebrow="Step 3"
                title="Search candidates"
                subtitle="Describe who you need and see only the people who fit."
              />
              <div className={styles.prose}>
                <p>
                  Search is where you'll spend most of your time. Type a position, skill or city into the search bar,
                  then narrow the results with the filters on the left. The list updates as you go, and the number of
                  matching candidates is shown above it.
                </p>
              </div>
              <Figure
                src="/help/search-overview.webp"
                alt="Candidate search with filters on the left and results on the right"
                caption="Filters on the left, matching candidates on the right."
                onZoom={setZoomed}
              />

              <div className={styles.subTitle}>Filters</div>
              <div className={styles.filterGrid}>
                {FILTER_GROUPS.map((group) => (
                  <div key={group.name} className={styles.filterRow}>
                    <b>{group.name}</b>
                    <span>{group.text}</span>
                  </div>
                ))}
              </div>

              <Callout tone="tip" icon="Save" title="Save your filters">
                Found a combination that works? Click <b>Save filter</b> at the bottom of the filters and give it a
                name. It appears under <b>Your filters</b> at the top, and one click runs it again. Adjust it and click{' '}
                <b>Update saved filter</b>, or remove it with the bin icon.
              </Callout>
              <div className={styles.prose}>
                <p>
                  Use <b>Sort</b> to order results by relevance, experience, salary or newest, and switch between grid
                  and list view with the buttons next to it.
                </p>
              </div>

              <div className={styles.subTitle}>Reading a candidate card</div>
              <div className={`${styles.split} ${styles.splitCard}`}>
                <Figure
                  narrow
                  src="/help/search-card.webp"
                  alt="An anonymous candidate card"
                  caption="Until you unlock, the name and photo are hidden."
                  onZoom={setZoomed}
                />
                <div className={styles.prose}>
                  <div className={styles.seeHide}>
                    <div className={styles.see}>
                      <span className={styles.seeHead}><Icon name="Eye" size={15} />What you see</span>
                      Status (actively searching or open to offers), position, years of experience, expected salary,
                      location, work arrangement, notice period, top skills and a short summary.
                    </div>
                    <div className={styles.hide}>
                      <span className={styles.seeHead}><Icon name="EyeOff" size={15} />Hidden until you unlock</span>
                      Name, photo, contact details and the names of their employers.
                    </div>
                  </div>
                  <Points
                    items={[
                      { icon: 'Unlock', title: 'Unlock', text: 'Reveals the full profile for one Credit (see step 5).' },
                      { icon: 'Eye', title: 'Preview', text: 'Opens the CV on the side: summary, work experience, education, skills and languages.' },
                      { icon: 'Bookmark', title: 'Bookmark', text: 'Saves the candidate to your shortlist. Free.' },
                    ]}
                  />
                </div>
              </div>
              <Figure
                src="/help/search-preview.webp"
                alt="CV preview panel next to the results"
                caption="The CV preview. You can bookmark or unlock straight from it."
                onZoom={setZoomed}
              />
            </section>

            {/* ===== 4. Bookmarks ===== */}
            <section id="bookmarks" className={styles.section}>
              <SectionHead
                num={4}
                icon="Bookmark"
                eyebrow="Step 4"
                title="Shortlist with bookmarks"
                subtitle="Collect promising candidates before you spend any Credits."
              />
              <div className={styles.prose}>
                <p>
                  Click the bookmark icon on a card or in the CV preview to save a candidate to <b>Bookmarked</b>.
                  Bookmarking is free. Use it to gather the best matches, compare them side by side and talk them over
                  with your team before you decide who to unlock.
                </p>
              </div>
              <Figure
                src="/help/bookmarks-overview.webp"
                alt="Bookmarked candidates page with the limit ring"
                caption="The ring shows how many of your bookmark slots are in use."
                onZoom={setZoomed}
              />
              <Callout tone="info" icon="Info" title="How many you can save">
                Your company list holds <b>10 candidates</b>, and package bonuses can raise it to <b>30</b>. Team members
                also get <b>5 personal slots</b> each, tagged <i>Personal</i>, and only they can remove those. Bookmarks
                are a short "decide soon" list: unlock or remove candidates to make room for new ones.
              </Callout>
              <div className={`${styles.split} ${styles.splitCard}`}>
                <Figure
                  narrow
                  src="/help/bookmarks-notes.webp"
                  alt="Bookmarked candidate card with a note"
                  caption="A bookmarked candidate with a note."
                  onZoom={setZoomed}
                />
                <div className={styles.stack}>
                  <div className={styles.subTitle}>On each card</div>
                  <Points
                    items={[
                      { icon: 'CalendarDays', title: 'Saved date', text: 'When the candidate was saved, and by whom when you work as a team.' },
                      { icon: 'X', title: 'Remove', text: 'Takes the candidate off your list.' },
                      { icon: 'Unlock', title: 'Unlock', text: 'Unlock straight from your shortlist.' },
                      { icon: 'Eye', title: 'Preview', text: 'Opens the CV.' },
                      { icon: 'Pencil', title: 'Notes', text: 'Write down your thoughts on the candidate. Your whole team sees the note.' },
                    ]}
                  />
                </div>
              </div>
              <div className={styles.stack}>
                <div className={styles.subTitle}>Tools at the top</div>
                <Points
                  columns={2}
                  items={[
                    { icon: 'Filter', title: 'Filters', text: 'By industry, experience, status, skills and salary.' },
                    { icon: 'ArrowUpDown', title: 'Sort', text: 'Recently saved, oldest, experience, salary or your custom order.' },
                    { icon: 'GripVertical', title: 'Reorder', text: 'Drag cards into your own order, for example your favourites first.' },
                    { icon: 'CheckSquare', title: 'Select', text: 'Click the cards you want, then Unlock all at once or Remove selected.' },
                  ]}
                />
              </div>
              <Figure
                src="/help/bookmarks-select.webp"
                alt="Selecting several bookmarked candidates"
                caption="Select mode: unlock or remove several candidates at once."
                onZoom={setZoomed}
              />
            </section>

            {/* ===== 5. Unlock ===== */}
            <section id="unlock" className={styles.section}>
              <SectionHead
                num={5}
                icon="Unlock"
                eyebrow="Step 5"
                title="Unlock a profile"
                subtitle="One Credit reveals the person behind the profile."
              />
              <div className={styles.split}>
                <div className={styles.prose}>
                  <p>
                    When a candidate looks right, click <b>Unlock</b> on the card, in the CV preview or in Bookmarked. A
                    confirmation shows the price and what your balance will be afterwards.
                  </p>
                  <Callout tone="gold" icon="Scale" title="The salary clause">
                    By unlocking, you accept that <b>the salary the candidate entered is the minimum you'll offer
                    them</b>. That's what makes candidates trust the platform, and after a hire they're asked whether it
                    was honored (see Reputation).
                  </Callout>
                  <div className={styles.subTitle}>After you unlock</div>
                  <ul className={styles.checks}>
                    <li><Icon name="Check" size={15} />The name, photo, contact details and employers are revealed.</li>
                    <li><Icon name="Check" size={15} />The candidate moves to <b>Purchased</b>, where your whole team can see them.</li>
                    <li><Icon name="Check" size={15} />The profile stays unlocked. You never pay for the same candidate twice.</li>
                  </ul>
                </div>
                <Figure
                  narrow
                  src="/help/unlock-modal.webp"
                  alt="Unlock confirmation with price, balance after and the salary clause"
                  caption="The unlock confirmation."
                  onZoom={setZoomed}
                />
              </div>
            </section>

            {/* ===== 6. Purchased ===== */}
            <section id="purchased" className={styles.section}>
              <SectionHead
                num={6}
                icon="ShoppingBag"
                eyebrow="Step 6"
                title="Contact and hire"
                subtitle="Everything you need to reach candidates and track your hiring."
              />
              <div className={styles.prose}>
                <p>
                  Every candidate you unlock lands in <b>Purchased</b>. Each card has their full details and the tools to
                  take the conversation forward.
                </p>
              </div>
              <Figure
                src="/help/purchased-overview.webp"
                alt="Purchased profiles page"
                caption="Unlocked candidates, with your hiring stats on the side."
                onZoom={setZoomed}
              />
              <div className={`${styles.split} ${styles.splitCard}`}>
                <Figure
                  narrow
                  src="/help/purchased-card.webp"
                  alt="An unlocked candidate card with contact details"
                  caption="An unlocked candidate."
                  onZoom={setZoomed}
                />
                <div className={styles.stack}>
                  <div className={styles.subTitle}>On each card</div>
                  <Points
                    items={[
                      { icon: 'Mail', title: 'Contact', text: 'Email and phone with a copy button, and a link to their LinkedIn.' },
                      { icon: 'FileText', title: 'Open CV', text: 'The full CV, with Send email and Print. Choose "Save as PDF" in the print dialog to keep a PDF.' },
                      { icon: 'Download', title: 'Download CV', text: 'Saves a copy of the CV to your computer.' },
                      { icon: 'Pencil', title: 'Notes', text: 'Shared with your team.' },
                      { icon: 'ChevronDown', title: 'Show more', text: 'Work experience, education and additional activities.' },
                      { icon: 'Unlock', title: 'Unlocked date', text: 'When the profile was unlocked, and by whom.' },
                    ]}
                  />
                </div>
              </div>

              <div className={styles.subTitle}>Track your hiring</div>
              <div className={styles.prose}>
                <p>Use the status on each card to follow every candidate through your process:</p>
              </div>
              <div className={styles.pipeline}>
                {PIPELINE.map((stage, index) => (
                  <React.Fragment key={stage.label}>
                    <span className={`${styles.stage} ${styles[stage.tone]}`}>{stage.label}</span>
                    {index < 3 && <Icon name="ChevronRight" size={16} className={styles.pipeArrow} />}
                    {index === 3 && <span className={styles.pipeOr}>or</span>}
                  </React.Fragment>
                ))}
              </div>
              <div className={styles.split}>
                <div className={styles.prose}>
                  <p>
                    When you choose <b>Hired</b>, a short <b>Hiring feedback</b> form opens: your rating of the candidate,
                    the hire date, the position, whether you honored the salary clause, and optional comments. It keeps
                    the candidate pool high quality, and it's what lets the candidate rate you back.
                  </p>
                  <Callout tone="info" icon="LayoutGrid" title="Cards, table and stats">
                    Switch between <b>Cards</b> and <b>Table</b> view. The side panel shows your numbers: Credits spent,
                    profiles unlocked, hire rate, monthly spending, candidates by status, average time to hire and
                    Credits per hire.
                  </Callout>
                </div>
                <Figure
                  narrow
                  src="/help/purchased-feedback.webp"
                  alt="Hiring feedback form"
                  caption="The Hiring feedback form opens when you mark a candidate as Hired."
                  onZoom={setZoomed}
                />
              </div>
            </section>

            {/* ===== 7. Team ===== */}
            <section id="team" className={styles.section}>
              <SectionHead
                num={7}
                icon="Users"
                eyebrow="Good to know"
                title="Work as a team"
                subtitle="Invite colleagues to search, bookmark and unlock under one company."
              />
              <div className={styles.split}>
                <div className={styles.prose}>
                  <p>
                    Everyone on your team shares the company profile and the Credit balance, but each person signs in
                    with their own account. Every unlock, bookmark and purchase shows who made it.
                  </p>
                  <Steps
                    items={[
                      <>Go to <b>Company Profile → Team</b>.</>,
                      <>Enter your colleague's email and click <b>Send</b>.</>,
                      <>They get an email with a link to set their name and password. The link is valid for 7 days.</>,
                    ]}
                  />
                  <ul className={styles.bullets}>
                    <li>Each person can belong to only one company.</li>
                    <li>
                      Only the account owner edits the company profile and billing currency, removes saved cards and
                      changes the low balance alert, and can hand the account over to a teammate with <b>Make owner</b>.
                    </li>
                  </ul>
                </div>
                <div>
                  <div className={styles.seats}>
                    <div className={styles.seatsHead}>
                      <Icon name="Users" size={16} />
                      Team accounts by company size
                    </div>
                    {SEATS.map((row) => (
                      <div key={row.size} className={styles.seatRow}>
                        <span>{row.size}</span>
                        <b>{row.seats}</b>
                      </div>
                    ))}
                    <div className={styles.seatsNote}>The owner and pending invitations count too.</div>
                  </div>
                  <Figure
                    src="/help/team.webp"
                    alt="Team tab in company settings"
                    caption="The Team tab in Company Profile."
                    onZoom={setZoomed}
                  />
                </div>
              </div>
            </section>

            {/* ===== 8. Reputation ===== */}
            <section id="reputation" className={styles.section}>
              <SectionHead
                num={8}
                icon="Star"
                eyebrow="Good to know"
                title="Your reputation"
                subtitle="Candidates you hire rate you back, anonymously."
              />
              <div className={styles.prose}>
                <p className={styles.leadP}>
                  Talentmon works both ways. Once you unlock a candidate, everything becomes transparent for them too:
                  they see who you are, and once you hire them, they get to hold you accountable.
                </p>
              </div>
              <div className={styles.repGrid}>
                <div className={styles.repCard}>
                  <span className={styles.repIcon}><Icon name="UserCheck" size={18} /></span>
                  <b>Who can rate you</b>
                  <p>Only candidates you've marked as <b>Hired</b>, so every rating comes from a real hiring experience.</p>
                </div>
                <div className={styles.repCard}>
                  <span className={styles.repIcon}><Icon name="Star" size={18} /></span>
                  <b>What they rate</b>
                  <ul className={styles.repCats}>
                    {RATING_CATEGORIES.map((cat) => (
                      <li key={cat.name}><b>{cat.name}</b><span>{cat.text}</span></li>
                    ))}
                  </ul>
                  <p>Plus whether they'd recommend you, and an optional comment.</p>
                </div>
                <div className={`${styles.repCard} ${styles.repCardGold}`}>
                  <span className={styles.repIcon}><Icon name="ShieldCheck" size={18} /></span>
                  <b>The salary rule has teeth</b>
                  <p>
                    They're asked whether the minimum salary from their profile was honored. If it wasn't, their overall
                    rating is capped at 3, no matter how perfect everything else was.
                  </p>
                </div>
                <div className={styles.repCard}>
                  <span className={styles.repIcon}><Icon name="Lock" size={18} /></span>
                  <b>Completely anonymous</b>
                  <p>You see the score and the comment, never who left it.</p>
                </div>
              </div>
              <div className={styles.split}>
                <div className={styles.prose}>
                  <Path>Company Profile → Reputation management</Path>
                  <p>
                    Here you'll find your overall score, the star breakdown, how many candidates recommend you, and
                    every comment. The same ratings appear on your public company profile, which candidates look at
                    before they reply.
                  </p>
                  <Callout tone="tip" icon="Lightbulb" title="How to keep a good score">
                    Reply quickly, give candidates clear feedback, and always offer at least the salary from their
                    profile.
                  </Callout>
                </div>
                <Figure
                  src="/help/reputation.webp"
                  alt="Reputation management with overall score and ratings"
                  caption="Your ratings under Reputation management."
                  onZoom={setZoomed}
                />
              </div>
            </section>

            {/* ===== Support ===== */}
            <section id="support" className={styles.support}>
              <span className={styles.supportIcon}><Icon name="LifeBuoy" size={26} /></span>
              <div className={styles.supportText}>
                <h2>Still need help?</h2>
                <p>
                  Can't find what you're looking for, or something doesn't work as described? Write to us and we'll get
                  back to you.
                </p>
                <div className={styles.legal}>
                  <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                  <span aria-hidden="true">·</span>
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                  <span aria-hidden="true">·</span>
                  <a href="/refund-policy" target="_blank" rel="noopener noreferrer">Refund Policy</a>
                </div>
              </div>
              <a className={styles.supportBtn} href={`mailto:${SUPPORT_EMAIL}`}>
                <Icon name="Mail" size={17} />
                {SUPPORT_EMAIL}
              </a>
            </section>
          </div>
        </div>
      </main>

      {/* ===== Screenshot lightbox ===== */}
      {zoomed && (
        <div className={styles.lightbox} onClick={() => setZoomed(null)} role="dialog" aria-modal="true" aria-label={zoomed.alt}>
          <img src={zoomed.src} alt={zoomed.alt} onClick={(e) => e.stopPropagation()} />
          <button type="button" className={styles.lightboxClose} onClick={() => setZoomed(null)} aria-label="Close">
            <Icon name="X" size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CompanyHelp;
