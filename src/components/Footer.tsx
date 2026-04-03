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
        <div className={styles.links}>
          <Link href="/privacy-policy" className={styles.link}>
            Privacy Policy
          </Link>
          <span className={styles.separator}>|{`" | "`}</span>
          <a 
            href="https://app.back9ins.com/apply/RyanRostine" 
            target="_blank" 
            rel="noopener"
            className={styles.link}
          >
            Get a Quote
          </a>
        </div>
      </div>
    </footer>
  );
}
