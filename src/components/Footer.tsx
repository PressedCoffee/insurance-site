import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.row}>
          <span className={styles.license}>
            Ryan Rostine, Licensed Life Insurance Producer CA #4479678
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.disclaimer}>
            Insurance quotes are estimates. Final rates and eligibility are determined by the insurance carrier through underwriting. This site does not provide tax, legal, or investment advice.
          </span>
        </div>
        <div className={styles.links}>
          <Link href="/privacy-policy#your-rights-ccpa" className={styles.privacyLink}>
            Do Not Sell or Share My Personal Information
          </Link>
          <span className={styles.separator}>|</span>
          <Link href="/privacy-policy" className={styles.link}>
            Privacy Policy
          </Link>
          <span className={styles.separator}>|</span>
          <Link href="/licensing" className={styles.link}>
            Licensing
          </Link>
          <span className={styles.separator}>|</span>
          <a 
            href="https://app.back9ins.com/apply/RyanRostine" 
            target="_blank" 
            rel="noopener"
            className={styles.link}
          >
            Get a Quote
          </a>
          <span className={styles.separator}>|</span>
          <Link href="/continuity-audit" className={styles.link}>
            Continuity Audit
          </Link>
        </div>
      </div>
    </footer>
  );
}