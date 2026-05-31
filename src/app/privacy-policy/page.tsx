import type { Metadata } from 'next';
import OptOutButton from '../../components/OptOutButton';
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
          Last updated: April 13, 2026
        </p>
        <p className={styles.bodyText}>
          This policy explains what data this site collects, how it is used, and your rights. 
          It is designed to be clear and specific—not buried in legal jargon.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What this site collects</h2>
        <h3 className={styles.subsectionTitle}>Analytics and ad measurement</h3>
        <p className={styles.bodyText}>
          This site uses Google Ads conversion tracking to measure the effectiveness of 
          advertising. When you arrive via a Google ad, a cookie is set to attribute your 
          visit to that ad. This allows us to understand which ads lead to quotes and applications.
        </p>
        <p className={styles.bodyText}>
          If Google Analytics or other analytics tools are configured in the future, this 
          section will be updated to reflect what data they collect.
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
          This site currently uses:
        </p>
        <ul className={styles.list}>
          <li><strong>Google Ads conversion tracking:</strong> Sets first-party cookies to measure ad effectiveness. Only active when you arrive via a Google ad.</li>
        </ul>
        <p className={styles.bodyText}>
          No other third-party tracking scripts (analytics, pixels, or ad networks) are loaded 
          unless their corresponding configuration is enabled. If additional tracking is enabled 
          in the future, this section will be updated before those scripts become active.
        </p>
      </section>

      <section className={styles.section} id="your-rights-ccpa">
        <h2 className={styles.sectionTitle}>Your privacy rights</h2>
        <p className={styles.bodyText}>
          If you are a California resident, you have the right to:
        </p>
        <ul className={styles.list}>
          <li>Know what personal information is collected about you</li>
          <li>Request deletion of your personal information</li>
          <li>Opt out of the sale or sharing of personal information</li>
          <li>Non-discrimination for exercising these rights</li>
        </ul>
        <p className={styles.bodyText}>
          This site uses Google Ads conversion tracking, which may constitute &quot;sharing&quot; 
          under the CPRA. You can opt out of ad tracking below. When opted out, Google will 
          process data in restricted mode — no personalized advertising cookies will be set, 
          and no personal data will be used for ad targeting. If your browser sends a 
          Global Privacy Control (GPC) signal, tracking is suppressed automatically.
        </p>
        <OptOutButton />
        <p className={styles.bodyText} style={{ marginTop: '0.75rem' }}>
          You can also use Google&apos;s Ads Settings or install a browser extension that blocks 
          third-party cookies. Because this site does not collect personal information directly, 
          most CPRA requests will not apply here. If you have applied for insurance through 
          BackNine, their privacy policy governs that data.
        </p>
        <p className={styles.bodyText}>
          To exercise any of these rights by email, contact:{' '}
          <a href="mailto:ryan@rostineinsurance.com">ryan@rostineinsurance.com</a>
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Data sharing</h2>
        <p className={styles.bodyText}>
          We do not sell, trade, or rent your personal information. The ad measurement data 
          collected by Google is governed by Google&apos;s privacy policy. We may share anonymized 
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
          This site uses HTTPS encryption. Ad measurement data is processed by Google with 
          industry-standard protections. We do not store personal information on this site.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>SMS Follow-Up Communications</h2>
        <p className={styles.bodyText}>
          When a visitor starts an insurance application and provides a phone number, 
          the site may send follow-up text messages to help them complete the application. 
          These messages are sent by the producer, Ryan Rostine, and are limited to a 
          maximum of 3 attempts over approximately 7 days after the application was started. 
          After that period, no further follow-up messages will be sent.
        </p>
        <p className={styles.bodyText}>
          You can opt out of these messages at any time by replying STOP to any text 
          you receive, or by texting back indicating you no longer wish to be contacted. 
          No further messages will be sent after you opt out.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Application Data Storage</h2>
        <p className={styles.bodyText}>
          To enable follow-up communications, application state data — such as eApp status 
          and contact information — is stored temporarily in a secure cloud key-value store 
          (Upstash/KV). This data is retained only while the application is active and for 
          a short period afterward to support any necessary follow-up.
        </p>
        <p className={styles.bodyText}>
          This data is not sold or shared beyond the insurance carriers the applicant selects. 
          Once the retention period ends, the data is deleted from the store.
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
          For privacy questions, contact:{' '}
          <a href="mailto:ryan@rostineinsurance.com">ryan@rostineinsurance.com</a>
        </p>
      </section>
    </main>
  );
}