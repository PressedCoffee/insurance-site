export const metadata = {
  title: 'How Much Life Insurance Do You Actually Need? | Ryan Rostine',
  description: 'Calculate your life insurance coverage need in 2 minutes. Transparent assumptions. No phone number required. California independent advisor.',
  alternates: {
    canonical: '/',  // Canonical points to root, not self
  },
  openGraph: {
    title: 'How Much Life Insurance Do I Need? | Free Calculator',
    description: 'Calculate your life insurance coverage need in 2 minutes. Transparent assumptions. No phone number required.',
  },
};

export default function CoverageNeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Does this replace financial advice?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. This produces a rough estimate for a straightforward situation. Complex finances, health considerations, or non-standard needs may warrant individual review.',
        },
      },
      {
        '@type': 'Question',
        name: 'Why 70% for income replacement?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Many people don\'t need to replace 100% of income—taxes drop, some expenses change. But you can adjust this. If you want to be conservative, use 100%. If your household has other income sources, you might use less.',
        },
      },
      {
        '@type': 'Question',
        name: 'Should I include liquid assets?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Optional. Some people subtract accessible savings because they could use them. Others prefer the estimate without this offset, treating it as a more conservative target. You decide based on your comfort level.',
        },
      },
      {
        '@type': 'Question',
        name: 'How accurate is this?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'It\'s a directional estimate based on the assumptions you enter. Your actual need depends on factors this tool cannot see: how your income might change, exact future expenses, your partner\'s financial situation, and other variables. Use this as a starting point, not a precise figure.',
        },
      },
      {
        '@type': 'Question',
        name: 'What happens after I get an estimate?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can get instant quotes from multiple carriers through Quote & Apply by BackNine. No phone number required. If you choose to apply, the process ranges from minutes (accelerated underwriting) to weeks (exam required).',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
