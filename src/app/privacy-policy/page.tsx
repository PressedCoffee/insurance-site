import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How rostineinsurance.com handles data and privacy.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.container}>
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>Privacy Policy</h1>
      </header>

      <section className={styles.section}>
        <p className={styles.bodyText}>
          Last updated: April 2, 2026
        </p>
        <p className={styles.bodyText}>
          This policy explains what data this site collects, how it is used, and your rights. 
          It is designed to be clear and specific—not buried in legal jargon.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What this site collects</h2>
        <h3 className={styles.subsectionTitle}>Analytics data</h3>
        <p className={styles.bodyText}>
          We use Google Analytics 4 to understand how visitors use the site. This includes:
        </p>
        <ul className={styles.list}>
          <li>Pages visited and time spent</li>
          <li>Approximate location (city/region level)</li>
          <li>Device and browser type</li>
          <li>Referral source (how you found the site)</li>
        </ul>
        <p className={styles.bodyText}>
          This data is aggregated and anonymous. We do not collect personally identifiable information 
          through analytics.
        </p>

        <h3 className={styles.subsectionTitle}>Calculator inputs</h3>
        <p className={styles.bodyText}>
          The coverage need calculator runs entirely in your browser. Your inputs (income, debts, etc.) 
          are not stored on our servers. If you proceed to Quote & Apply, that data is handled by 
          BackNine Insurance Technologies under their privacy policy.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What we do not collect</h2>
        <ul className={styles.list}>
          <li>Name, address, phone number, or email on this site</li>
          <li>Social Security Number or date of birth</li>
          <li>Health information</li>
          <li>Payment information</li>
        </ul>
        <p className={styles.bodyText}>
          Any personal information required for an insurance application is collected directly by 
          BackNine Insurance Technologies when you choose to apply.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cookies and tracking</h2>
        <p className={styles.bodyText}>
          This site uses:
        </p>
        <ul className={styles.list}>
          <li><strong>Google Analytics:</strong> For site usage analytics (first-party cookies)</li>
          <li><strong>Google Ads conversion tracking:</strong> To measure ad effectiveness (only if you arrived via a Google ad)</li>
        </ul>
        <p className={styles.bodyText}>
          We do not use Meta/Facebook pixels or other third-party ad trackers.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your rights (CCPA)</h2>
        <p className={styles.bodyText}>
          If you are a California resident, you have the right to:
        </p>
        <ul className={styles.list}>
          <li>Know what personal information is collected about you</li>
          <li>Request deletion of your personal information</li>
          <li>Opt out of the sale of personal information (we do not sell personal information)</li>
          <li>Non-discrimination for exercising these rights</li>
        </ul>
        <p className={styles.bodyText}>
          Because this site does not collect personal information directly, most CCPA requests 
          will not apply here. If you have applied for insurance through BackNine, their 
          privacy policy governs that data.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Data sharing</h2>
        <p className={styles.bodyText}>
          We do not sell, trade, or rent your personal information. We may share anonymized 
          analytics data with service providers who help us operate the site.
        </p>
        <p className={styles.bodyText}>
          If you apply for insurance through BackNine, your application data is shared only with 
          the insurance carriers you select.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Security</h2>
        <p className={styles.bodyText}>
          This site uses HTTPS encryption. Analytics data is stored in Google Analytics with 
          industry-standard protections. We do not store personal information on this site.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Changes to this policy</h2>
        <p className={styles.bodyText}>
          We may update this policy as the site evolves. Changes will be posted here with an 
          updated date.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Contact</h2>
        <p className={styles.bodyText}>
          For privacy questions, contact: ryan@rostineinsurance.com
        </p>
      </section>

      <footer className={styles.footer}>
        <p>
          Ryan Rostine, Licensed Life Insurance Producer CA #4479678 |{' '}
          <a href="https://app.back9ins.com/apply/RyanRostine" target="_blank" rel="noopener">
            See quotes from multiple carriers
          </a>
        </p>
      </footer>
    </main>
  );
}
