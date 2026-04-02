export const metadata = {
  title: 'How Much Life Insurance Do You Actually Need? | Ryan Rostine',
  description: 'A self-serve calculator that shows its assumptions. Estimate your life insurance coverage need and compare quotes from multiple carriers.',
  openGraph: {
    title: 'How Much Life Insurance Do You Actually Need?',
    description: 'A self-serve calculator that shows its assumptions.',
  },
};

export default function CoverageNeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
