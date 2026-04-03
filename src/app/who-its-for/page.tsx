export const metadata = {
  title: 'Who This Is For',
  description: 'Self-serve life insurance for independent California residents who prefer async, system-mediated evaluation. No sales pressure, no required meetings.',
  alternates: {
    canonical: '/who-its-for',
  },
};

export default function WhoItsForPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Who This Is For
          </h1>
          <p className="text-xl text-slate-600">
            Self-serve life insurance for independent decision-makers
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            You might be a fit if...
          </h2>
          
          <ul className="space-y-4 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>You prefer to research and evaluate on your own schedule</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>You value transparency over persuasion</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>You want to compare carriers without entering a sales funnel</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>You are a California resident with straightforward insurance needs</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>You want licensed review only when you are ready, not before</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            How this works
          </h2>
          
          <ol className="space-y-6 text-slate-700">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">1</span>
              <div>
                <strong className="block text-slate-900 mb-1">Calculate your need</strong>
                <span>Use the coverage calculator to estimate what makes sense for your situation.</span>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">2</span>
              <div>
                <strong className="block text-slate-900 mb-1">Get instant quotes</strong>
                <span>Compare prices from multiple A-rated carriers. No phone number required.</span>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">3</span>
              <div>
                <strong className="block text-slate-900 mb-1">Apply when ready</strong>
                <span>Submit your application. A licensed producer reviews before submission to carriers.</span>
              </div>
            </li>
          </ol>
        </div>

        <div className="bg-slate-100 rounded-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Not the right fit?
          </h2>
          <p className="text-slate-700 mb-4">
            This model works best for straightforward situations. You may need traditional advice if:
          </p>
          <ul className="space-y-2 text-slate-600 list-disc pl-5">
            <li>Your financial situation is complex (business ownership, estate planning, trusts)</li>
            <li>You have significant health conditions that require specialized underwriting</li>
            <li>You prefer in-person consultation and discussion before any recommendations</li>
            <li>You need permanent life insurance for reasons other than straightforward income replacement</li>
          </ul>
        </div>

        <div className="text-center">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Calculate your coverage need
            <span aria-hidden="true">→</span>
          </a>
          <p className="mt-4 text-sm text-slate-500">
            California Producer License #4479678
          </p>
        </div>
      </div>
    </main>
  );
}
