export const metadata = {
  title: 'Get Your Life Insurance Quote',
  description: 'Compare instant quotes from multiple A-rated carriers. No phone number required. Takes 2 minutes. California licensed producer.',
  alternates: {
    canonical: '/quote',
  },
};

const coverageOptions = [
  { amount: 10000, label: '$10,000' },
  { amount: 25000, label: '$25,000' },
  { amount: 50000, label: '$50,000' },
  { amount: 75000, label: '$75,000' },
  { amount: 100000, label: '$100,000' },
  { amount: 150000, label: '$150,000' },
];

function backnineUrl(amount: number) {
  return `https://app.back9ins.com/apply/RyanRostine?coverage_amount=${amount}`;
}

export default function QuotePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <header className="mb-12 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Get Your Life Insurance Quote
            </h1>
            <p className="text-xl text-slate-600 max-w-xl mx-auto">
              Compare quotes from multiple A-rated carriers in 2 minutes. No phone number required. No obligation.
            </p>
          </header>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              100% Online — No Calls
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              California Licensed #4479678
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              Free Quotes — No Obligation
            </span>
          </div>

          {/* Coverage amount selector */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 text-center">
              Choose a coverage amount to see your rate:
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {coverageOptions.map((opt) => (
                <a
                  key={opt.amount}
                  href={backnineUrl(opt.amount)}
                  className="flex items-center justify-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors text-center"
                >
                  {opt.label}
                </a>
              ))}
            </div>

            {/* Custom amount */}
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-3">Or apply with a custom amount:</p>
              <a
                href="https://app.back9ins.com/apply/RyanRostine"
                className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                Enter your own coverage amount
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              How it works
            </h2>

            <ol className="space-y-6 text-slate-700">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">1</span>
                <div>
                  <strong className="block text-slate-900 mb-1">See instant quotes</strong>
                  <span>Share basic info and get real prices from multiple carriers.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">2</span>
                <div>
                  <strong className="block text-slate-900 mb-1">Pick a carrier and apply</strong>
                  <span>Everything is self-serve. No agent required to start.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">3</span>
                <div>
                  <strong className="block text-slate-900 mb-1">Licensed review before submission</strong>
                  <span>A licensed producer (Ryan Rostine, CA Producer #4479678) reviews your application before it goes to the carrier.</span>
                </div>
              </li>
            </ol>
          </div>

          {/* What you get / Why us */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              What you can expect
            </h2>
            <ul className="space-y-4 text-slate-700">
              <li className="flex items-start gap-3">
                <span className="text-indigo-600 font-bold">→</span>
                <span>Term life insurance quotes from A-rated carriers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-600 font-bold">→</span>
                <span>Accelerated underwriting options — no medical exam for many applicants</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-600 font-bold">→</span>
                <span>Full price transparency — no hidden fees or surprises</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-600 font-bold">→</span>
                <span>If you have questions at any point, email is available. No hard sell.</span>
              </li>
            </ul>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-12 mb-4">
            <a
              href="https://app.back9ins.com/apply/RyanRostine"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-lg font-semibold text-lg hover:bg-slate-800 transition-colors shadow-md"
            >
              Get a Free Quote Now
              <span aria-hidden="true">→</span>
            </a>
            <p className="mt-4 text-sm text-slate-400">
              California Producer License #4479678
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
