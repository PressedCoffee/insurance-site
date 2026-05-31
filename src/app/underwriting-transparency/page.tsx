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
        name: 'How long does underwriting take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Typically a few days to six weeks, depending on whether an exam is needed and how quickly records are returned.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do all applications require a medical exam?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Many applications at moderate coverage amounts qualify for accelerated underwriting with no exam. The carrier decides based on your application answers and database checks.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I be turned down?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A carrier can decline to offer coverage. If that happens, you may still have options — adjusting the coverage amount or applying with a different carrier that has different guidelines.',
        },
      },
      {
        '@type': 'Question',
        name: 'What if my rate comes back higher than my quote?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'That means the underwriter found information that affected your risk classification. You can accept the new rate, decline, or explore other carriers. You are not obligated to accept.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I save my application and come back later?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'If you started an application and didn\'t finish, you can pick up where you left off. Text or call Ryan Rostine and he\'ll send you your direct resume link — no need to start over.',
        },
      },
      {
        '@type': 'Question',
        name: 'What if I change my mind?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can withdraw an application at any point before accepting the offer. After a policy issues, you typically have a free-look period (often 10–30 days, depending on your state) to cancel for a full refund.',
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
          Understanding the underwriting process — what gets reviewed, how long it takes, and what your options are at every step.
        </p>
      </header>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>The short version</h2>
        <p className={styles.bodyText}>
          After you submit an application, the insurance carrier reviews your information to decide whether to offer coverage and at what rate. This review is called underwriting. Your initial quote is an estimate based on the questions you answered upfront. The final offer comes after the carrier completes their review — and you are never obligated to accept it if the terms change.
        </p>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>What underwriting actually is</h2>
        <p className={styles.bodyText}>
          Underwriting is the carrier&apos;s process for assessing risk. They look at the information you provided on your application — age, health history, lifestyle, and coverage preferences — and compare it against their guidelines to determine your rate class.
        </p>
        <p className={styles.bodyText}>
          A rate class is the category the carrier places you in, which sets your premium. This is why two people the same age can get different rates: their health profiles and histories differ.
        </p>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>What data may be reviewed</h2>
        <p className={styles.bodyText}>
          Depending on the coverage amount and your situation, a carrier may review some or all of the following:
        </p>
        <ul className={styles.bodyText}>
          <li>Your application answers (health history, medications, family history)</li>
          <li>Prescription drug databases</li>
          <li>Motor vehicle records (in some cases)</li>
          <li>A brief health exam — typically blood draw, urine sample, height/weight, and blood pressure</li>
          <li>Attending physician statements, if the carrier has questions about a specific condition</li>
        </ul>
        <p className={styles.bodyText}>
          Not every application requires an exam. For many policies at moderate coverage amounts, carriers use accelerated underwriting — which means they rely on database lookups and your application answers instead of requiring a physical exam. Higher coverage amounts or certain health flags are more likely to trigger an exam requirement.
        </p>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Why your rate can change after you apply</h2>
        <p className={styles.bodyText}>
          Your initial quote is based on the limited information you provide during the quick-quote step. It does not include the full picture.
        </p>
        <p className={styles.bodyText}>
          If the underwriter finds information that changes your risk classification — a condition you mentioned on the application, a prescription in the database, or a detail in your medical records — the carrier may offer coverage at a different rate class than your initial quote showed.
        </p>
        <p className={styles.bodyText}>
          This is not unusual. It is how the process is designed to work: the quote gets you started, the underwriting review finalizes the terms.
        </p>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>You are never locked in</h2>
        <p className={styles.bodyText}>
          If the carrier offers different terms than your initial quote — a higher premium, a different rate class, or modified coverage — you do not have to accept it. You can:
        </p>
        <ul className={styles.bodyText}>
          <li>Accept the revised offer and proceed</li>
          <li>Decline the offer and walk away</li>
          <li>Adjust the coverage amount and reapply</li>
          <li>Apply with a different carrier</li>
        </ul>
        <p className={styles.bodyText}>
          There is no penalty for declining. You are never forced to accept an updated offer.
        </p>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>How long underwriting typically takes</h2>
        <p className={styles.bodyText}>
          <strong>Accelerated underwriting (no exam):</strong> often a few days to two weeks.
        </p>
        <p className={styles.bodyText}>
          <strong>Exam-required underwriting:</strong> typically two to six weeks, depending on how quickly the exam is scheduled and whether the carrier needs to request medical records.
        </p>
        <p className={styles.bodyText}>
          The biggest factor in timeline is usually the medical records request. If your doctor&apos;s office is slow to respond, the process slows down with it.
        </p>
      </section>

      <section className={styles.slowdownsSection}>
        <h2 className={styles.sectionTitle}>What could slow things down</h2>
        <div className={styles.slowdownsGrid}>
          <div className={styles.slowdownCard}>
            <h3 className={styles.slowdownTerm}>Medical records requests</h3>
            <p className={styles.slowdownDesc}>The carrier may need records from your doctor, and response times vary.</p>
          </div>
          <div className={styles.slowdownCard}>
            <h3 className={styles.slowdownTerm}>Exam scheduling</h3>
            <p className={styles.slowdownDesc}>Booking promptly keeps things moving.</p>
          </div>
          <div className={styles.slowdownCard}>
            <h3 className={styles.slowdownTerm}>Additional underwriter questions</h3>
            <p className={styles.slowdownDesc}>Respond quickly when asked.</p>
          </div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>What happens step by step</h2>
        <div className={styles.processSteps}>
          <div className={styles.processStep}>
            <div className={styles.stepMarker}>1</div>
            <h3 className={styles.stepTitle}>Quote</h3>
            <p className={styles.stepDesc}>You answer basic health and lifestyle questions to see initial rate ranges.</p>
          </div>
          <div className={styles.processStep}>
            <div className={styles.stepMarker}>2</div>
            <h3 className={styles.stepTitle}>Application</h3>
            <p className={styles.stepDesc}>You submit detailed health history, beneficiary information, and coverage preferences. This is where the formal record begins.</p>
          </div>
          <div className={styles.processStep}>
            <div className={styles.stepMarker}>3</div>
            <h3 className={styles.stepTitle}>Underwriting review</h3>
            <p className={styles.stepDesc}>The carrier evaluates your application, may order an exam or records, and determines your final rate class.</p>
          </div>
          <div className={styles.processStep}>
            <div className={styles.stepMarker}>4</div>
            <h3 className={styles.stepTitle}>Decision</h3>
            <p className={styles.stepDesc}>The carrier offers coverage at a specific rate, offers modified terms, or declines. You choose whether to accept.</p>
          </div>
          <div className={styles.processStep}>
            <div className={styles.stepMarker}>5</div>
            <h3 className={styles.stepTitle}>Policy issue</h3>
            <p className={styles.stepDesc}>If you accept and pay the first premium, coverage begins.</p>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLarge}`}>Common questions</h2>

        <details className={styles.faqItem}>
          <summary className={styles.faqSummary}>
            How long does underwriting take?
          </summary>
          <p className={styles.faqContent}>
            Typically a few days to six weeks, depending on whether an exam is needed and how quickly records are returned.
          </p>
        </details>

        <details className={styles.faqItem}>
          <summary className={styles.faqSummary}>
            Do all applications require a medical exam?
          </summary>
          <p className={styles.faqContent}>
            No. Many applications at moderate coverage amounts qualify for accelerated underwriting with no exam. The carrier decides based on your application answers and database checks.
          </p>
        </details>

        <details className={styles.faqItem}>
          <summary className={styles.faqSummary}>
            Can I be turned down?
          </summary>
          <p className={styles.faqContent}>
            A carrier can decline to offer coverage. If that happens, you may still have options — adjusting the coverage amount or applying with a different carrier that has different guidelines.
          </p>
        </details>

        <details className={styles.faqItem}>
          <summary className={styles.faqSummary}>
            What if my rate comes back higher than my quote?
          </summary>
          <p className={styles.faqContent}>
            That means the underwriter found information that affected your risk classification. You can accept the new rate, decline, or explore other carriers. You are not obligated to accept.
          </p>
        </details>

        <details className={styles.faqItem}>
          <summary className={styles.faqSummary}>
            Can I save my application and come back later?
          </summary>
          <p className={styles.faqContent}>
            If you started an application and didn&apos;t finish, you can pick up where you left off. Text or call me and I&apos;ll send you your direct resume link — no need to start over.
          </p>
        </details>

        <details className={styles.faqItem}>
          <summary className={styles.faqSummary}>
            What if I change my mind?
          </summary>
          <p className={styles.faqContent}>
            You can withdraw an application at any point before accepting the offer. After a policy issues, you typically have a free-look period (often 10–30 days, depending on your state) to cancel for a full refund.
          </p>
        </details>
      </section>

      <section className={styles.ctaSection}>
        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLarge}`} style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          Ready to pick up where you left off?
        </h2>
        <p className={styles.bodyText} style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
          If you started an application and have questions about what comes next, I&apos;m here to help. Get your personalized quotes, finish your application, or just ask me how the process works — no pressure, no jargon.
        </p>
        <Link href="https://app.back9ins.com/apply/RyanRostine" target="_blank" rel="noopener" className={styles.ctaButton}>
          See your quotes
        </Link>
      </section>

    </main>
  );
}