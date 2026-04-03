import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'How Does Life Insurance Underwriting Work?',
  description: 'Transparent explanation of what happens after you apply for life insurance. No jargon. California independent advisor.',
  alternates: {
    canonical: '/underwriting-transparency',
  },
};

export default function UnderwritingTransparencyPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can I save my progress and return later?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Applications typically allow saving progress. Check the specific process for availability.',
        },
      },
      {
        '@type': 'Question',
        name: 'What if I change my mind?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can withdraw an application before payment. After a policy issues, you generally have a period to review and cancel with full refund (often called a free-look period; check your specific policy terms).',
        },
      },
      {
        '@type': 'Question',
        name: 'What if I am declined?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The decision and any available options will be communicated to you. You may be able to reapply, adjust coverage amount, or apply with a different carrier.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is my information protected?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Information is shared only with carriers you choose to apply to, under standard data protection practices. Specific security measures vary by carrier.',
        },
      },
      {
        '@type': 'Question',
        name: 'What could cause delays or adjustments?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Delays often come from medical records requests, exam scheduling, or manual review for complex situations. Rate adjustments can happen if the underwriter discovers information that affects risk classification that the initial quote did not account for.',
        },
      },
    ],
  };

  return (
    <main className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>What Happens After You Apply</h1>
        <p className={styles.heroSubtitle}>
          Understanding the life insurance underwriting process: what to expect, timelines, and how decisions are made.
        </p>
      </header>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>The short version</h2>
        <p className={styles.bodyText}>
          After you submit an application, the carrier reviews your information and decides 
          whether to offer coverage and at what rate. This process is called underwriting. 
          It can take minutes or weeks, depending on your situation.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLarge}`}>The three typical paths</h2>
        
        <div className={styles.pathsGrid}>
          <article className={styles.pathCard}>
            <div className={styles.pathHeader}>
              <div className={styles.pathIcon}>⚡</div>
              <h3 className={styles.pathTitle}>Accelerated underwriting</h3>
            </div>
            <ul className={styles.pathList}>
              <li>No exam required</li>
              <li>Decision often within days</li>
              <li>Common for: straightforward health, moderate coverage</li>
            </ul>
          </article>

          <article className={styles.pathCard}>
            <div className={styles.pathHeader}>
              <div className={styles.pathIcon}>🩺</div>
              <h3 className={styles.pathTitle}>Exam required</h3>
            </div>
            <ul className={styles.pathList}>
              <li>Brief health exam (blood, urine, measurements)</li>
              <li>Decision after exam results</li>
              <li>Common for: higher coverage, certain ages</li>
            </ul>
          </article>

          <article className={styles.pathCard}>
            <div className={styles.pathHeader}>
              <div className={styles.pathIcon}>📋</div>
              <h3 className={styles.pathTitle}>Manual review</h3>
            </div>
            <ul className={styles.pathList}>
              <li>Underwriter reviews individually</li>
              <li>May request additional records</li>
              <li>Timeline based on complexity</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.slowdownsSection}>
        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLarge}`}>What slows things down</h2>
        
        <div className={styles.slowdownsGrid}>
          <div className={styles.slowdownCard}>
            <h3 className={styles.slowdownTerm}>Medical records request</h3>
            <p className={styles.slowdownDesc}>Authorize access upfront to avoid delays.</p>
          </div>
          
          <div className={styles.slowdownCard}>
            <h3 className={styles.slowdownTerm}>Scheduling an exam</h3>
            <p className={styles.slowdownDesc}>Book promptly; confirm preparation requirements.</p>
          </div>
          
          <div className={styles.slowdownCard}>
            <h3 className={styles.slowdownTerm}>Manual review</h3>
            <p className={styles.slowdownDesc}>Respond quickly to any carrier requests.</p>
          </div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>What could cause delays or adjustments?</h2>
        
        <p className={styles.bodyText}>
          Most applications proceed smoothly, but certain situations require additional verification:
        </p>
        
        <ul className={styles.bodyText}>
          <li><strong>Discrepancies between your application and medical records</strong> — even minor ones</li>
          <li><strong>Health conditions not disclosed in the initial quote</strong> — may lead to reclassification</li>
          <li><strong>Occupation or lifestyle risks</strong> — hazardous jobs or activities may require additional review</li>
          <li><strong>Foreign travel or residence</strong> — some destinations affect eligibility</li>
          <li><strong>Financial justification</strong> — very high coverage amounts may require income verification</li>
        </ul>
        <p className={styles.bodyText}>
          When these arise, the underwriter may request additional documentation or adjust the rate class 
          based on the actual risk profile. This is why initial quotes are estimates—final rates come from 
          the full underwriting review.
        </p>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>What happens step by step</h2>
        
        <div className={styles.processSteps}>
          <div className={styles.processStep}>
            <div className={styles.stepMarker}>1</div>
            <h3 className={styles.stepTitle}>Quote questions</h3>
            <p className={styles.stepDesc}>Answer health and lifestyle questions to see initial rate ranges.</p>
          </div>
          
          <div className={styles.processStep}>
            <div className={styles.stepMarker}>2</div>
            <h3 className={styles.stepTitle}>Formal application</h3>
            <p className={styles.stepDesc}>Submit detailed health history, beneficiary information, and financial details.</p>
          </div>
          
          <div className={styles.processStep}>
            <div className={styles.stepMarker}>3</div>
            <h3 className={styles.stepTitle}>Underwriting</h3>
            <p className={styles.stepDesc}>Carrier evaluates; may request exam or records.</p>
          </div>
          
          <div className={styles.processStep}>
            <div className={styles.stepMarker}>4</div>
            <h3 className={styles.stepTitle}>Decision</h3>
            <p className={styles.stepDesc}>Approved, approved at different terms, or declined.</p>
          </div>
          
          <div className={styles.processStep}>
            <div className={styles.stepMarker}>5</div>
            <h3 className={styles.stepTitle}>Policy issue</h3>
            <p className={styles.stepDesc}>Upon payment of first premium, coverage begins.</p>
          </div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Communication during the process</h2>
        
        <p className={styles.bodyText}>
          Most communication happens online or via the carrier's portal. You may receive 
          emails requesting additional information, outreach to schedule a medical exam, 
          and updates on application status.
        </p>
        
        <div className={styles.infoBox}>
          <p className={styles.bodyText} style={{ margin: 0 }}>
            <strong>If someone contacts you:</strong> It will typically be about scheduling 
            an exam or clarifying information. You are not required to accept phone outreach; 
            online options are usually available.
          </p>
        </div>
      </section>

      <section className={styles.faqSection}>
        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLarge}`}>Common questions</h2>
        
        <details className={styles.faqItem}>
          <summary className={styles.faqSummary}>
            Can I save my progress and return later?
          </summary>
          <p className={styles.faqContent}>
            Applications typically allow saving progress. Check the specific process 
            for availability.
          </p>
        </details>

        <details className={styles.faqItem}>
          <summary className={styles.faqSummary}>
            What if I change my mind?
          </summary>
          <p className={styles.faqContent}>
            You can withdraw an application before payment. After a policy issues, 
            you generally have a period to review and cancel with full refund 
            (often called a free-look period; check your specific policy terms).
          </p>
        </details>

        <details className={styles.faqItem}>
          <summary className={styles.faqSummary}>
            What if I am declined?
          </summary>
          <p className={styles.faqContent}>
            The decision and any available options will be communicated to you. 
            You may be able to reapply, adjust coverage amount, or apply with 
            a different carrier.
          </p>
        </details>

        <details className={styles.faqItem}>
          <summary className={styles.faqSummary}>
            How is my information protected?
          </summary>
          <p className={styles.faqContent}>
            Information is shared only with carriers you choose to apply to, 
            under standard data protection practices. Specific security measures 
            vary by carrier.
          </p>
        </details>

        <details className={styles.faqItem}>
          <summary className={styles.faqSummary}>
            What could cause delays or adjustments?
          </summary>
          <p className={styles.faqContent}>
            Delays often come from medical records requests, exam scheduling, or manual review 
            for complex situations. Rate adjustments can happen if the underwriter discovers 
            information that affects risk classification that the initial quote did not account for.
          </p>
        </details>
      </section>

      <section className={styles.ctaSection}>
        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLarge}`} style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          Ready to explore coverage?
        </h2>
        <Link href="/coverage-need" className={styles.ctaButton}>
          Calculate your coverage need
        </Link>
      </section>

      <footer className={styles.pageFooter}>
        <p>
          California Producer License #4479678 |{' '}
          <a href="https://app.back9ins.com/apply/RyanRostine" target="_blank" rel="noopener">
            See quotes from multiple carriers
          </a>
        </p>
      </footer>
    </main>
  );
}
