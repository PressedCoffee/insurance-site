'use client';

import './page.module.css';

/**
 * For Partners Page
 * One-pager for referral partners, BDRs, and collaborators
 * Clear value proposition without positioning drift
 */
export default function ForPartnersPage() {
  return (
    <div className="container">
      <header className="hero">
        <h1>For Partners</h1>
        <p className="subtitle">
          A straightforward way to refer people who need life insurance —
          without the usual friction.
        </p>
      </header>

      <section className="section">
        <h2>Who This Serves</h2>
        <p>
          Your clients or contacts who:
        </p>
        <ul>
          <li>Have dependents and want clarity on what coverage actually costs</li>
          <li>Prefer to self-educate before talking to anyone</li>
          <li>Value transparency over persuasion</li>
          <li>Are California residents</li>
        </ul>
        <p className="note">
          This is term life insurance — not investments, not whole life, not complex products.
          Coverage amounts from $100K to $2M+. Ages 18–60.
        </p>
      </section>

      <section className="section">
        <h2>How It Works</h2>
        
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <h3>You Send the Link</h3>
            <p>Your custom URL with attribution. They land on the coverage calculator.</p>
          </div>
          
          <div className="step">
            <span className="step-number">2</span>
            <h3>They Self-Educate</h3>
            <p>Transparent calculator. No forms to fill, no phone number required.</p>
          </div>
          
          <div className="step">
            <span className="step-number">3</span>
            <h3>They Choose Their Path</h3>
            <p>Quote & Apply if they want to move forward. Advisor review only if needed.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Why This Is Different</h2>
        
        <div className="comparison">
          <div className="comparison-col">
            <h4>Typical Agent</h4>
            <ul>
              <li>Lead form → immediate phone call</li>
              <li>"Let me explain why you need this"</li>
              <li>Opaque underwriting process</li>
              <li>Pressure to decide quickly</li>
            </ul>
          </div>
          
          <div className="comparison-col highlight">
            <h4>This Model</h4>
            <ul>
              <li>Calculator first → informed decision</li>
              <li>"Here is what is actually going on"</li>
              <li>Transparent underwriting process</li>
              <li>Move at their pace</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Your Custom Link</h2>
        <p>
          Every partner gets a unique URL. This tracks attribution correctly and 
          lets you see how many people you have sent — if you want.
        </p>
        
        <div className="link-example">
          <code>
            https://rostineinsurance.com/?utm_source=partner_jane-smith&amp;utm_medium=email
          </code>
        </div>
        
        <p className="note">
          Want a custom URL? <a href="mailto:ryan@rostineinsurance.com">Email Ryan</a> with your preferred identifier.
        </p>
      </section>

      <section className="section">
        <h2>About Ryan</h2>
        <p>
          Ryan Rostine is a California-licensed life insurance producer (#4479678) 
          based in Oakland. This practice operates as an independent advisor 
          leveraging transparent systems and asynchronous workflows.
        </p>
        
        <p>
          Former software engineer. Believes the insurance experience should be 
          legible, not mystifying.
        </p>
      </section>

      <section className="section">
        <h2>Referral Guidelines</h2>
        
        <ul>
          <li><strong>Best fit:</strong> CA residents, ages 25–50, have dependents, household income $75K–$250K</li>
          <li><strong>Not a fit:</strong> Complex estate planning, business succession, high-net-worth strategies requiring specialized carriers</li>
          <li><strong>The ask:</strong> Send the link when the topic naturally comes up. No scripts needed.</li>
        </ul>
      </section>

      <footer className="footer">
        <p><a href="mailto:ryan@rostineinsurance.com">ryan@rostineinsurance.com</a></p>
        <p><a href="/">Coverage Calculator →</a></p>
      </footer>
    </div>
  );
}
