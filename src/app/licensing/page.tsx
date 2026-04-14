import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Licensing & Disclosures',
  description: 'Insurance licensing information and disclosures for Ryan Rostine.',
};

export default function LicensingPage() {
  return (
    <main className={styles.container}>
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>Licensing &amp; Disclosures</h1>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Insurance License</h2>
        <p className={styles.bodyText}>
          Ryan Rostine, California Insurance Producer License #4479678, Life, Accident &amp; Health.
        </p>
        <p className={styles.bodyText}>
          Effective 03/20/2026 – 03/31/2028.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Regulatory Authority</h2>
        <p className={styles.bodyText}>
          Licensed by the California Department of Insurance. Consumers may verify license status at{' '}
          <a href="https://www.insurance.ca.gov" target="_blank" rel="noopener noreferrer">
            https://www.insurance.ca.gov
          </a>.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Disclaimer</h2>
        <p className={styles.bodyText}>
          This site provides life insurance information and quotes. Insurance quotes are estimates
          only. Final rates, terms, and eligibility are determined by the issuing insurance carrier
          through their underwriting process.
        </p>
        <p className={styles.bodyText}>
          This site does not provide tax, legal, or investment advice. Consult appropriate
          professionals for advice specific to your situation.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Carrier Appointments</h2>
        <p className={styles.bodyText}>
          Ryan Rostine is appointed with select insurance carriers. Carrier names and product
          availability are shown during the quote process. Being appointed with a carrier does not
          constitute an endorsement.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Contact</h2>
        <p className={styles.bodyText}>
          <a href="mailto:ryan@rostineinsurance.com">ryan@rostineinsurance.com</a>
          <br />
          (661) 220-0928
        </p>
      </section>
    </main>
  );
}