import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-primary">
      {/* Navbar */}
      <nav className="flex items-center justify-between max-w-7xl mx-auto px-6 py-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-accent mr-2" />
          <span className="text-xl font-bold text-white tracking-tight">AppsForHire</span>
        </div>
        {/* Nav Links */}
        <div className="hidden md:flex gap-8">
          <Link href="#" className="text-base font-semibold text-gray-300 hover:text-white transition">Overview</Link>
          <Link href="#pricing" className="text-base font-semibold text-gray-300 hover:text-white transition">Pricing</Link>
          <Link href="#" className="text-base font-semibold text-gray-300 hover:text-white transition">Documentation</Link>
        </div>
        {/* Auth Links */}
        <div className="flex items-center gap-4">
          <Link href="/signup" className="text-base font-semibold text-white hover:text-accent transition">Sign In</Link>
          <Link href="/signup" className="rounded-full bg-accent px-6 py-2 text-base font-semibold text-white shadow hover:bg-accent/90 transition">Free Trial</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center min-h-[70vh] px-4">
        <h1 className="text-5xl sm:text-7xl font-extrabold text-white leading-tight mt-16">
          Find & Hire<br />
          Top Developers.
        </h1>
        <p className="mt-8 text-xl text-gray-300 max-w-2xl">
          The only platform you need to automatically match, hire, and manage the best developers for your project.
        </p>
        <div className="mt-10">
          <Link
            href="/signup"
            className="inline-block rounded-full bg-accent px-8 py-4 text-lg font-semibold text-white shadow hover:bg-accent/90 transition"
          >
            Start Your Free Trial
            <span className="ml-2" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="bg-background py-20 px-4">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-textPrimary mb-8 text-center">
            Your Dashboard, Reimagined
          </h2>
          <div className="w-full flex justify-center">
            <Image
              src="/Screenshot 2025-06-10 223343.png"
              alt="Dashboard Preview"
              width={1200}
              height={600}
              className="rounded-2xl shadow-2xl border border-surface"
              priority
            />
          </div>
          <p className="mt-6 text-lg text-textMuted text-center max-w-2xl">
            Manage your API keys, monitor usage, and gain insights—all in one beautiful, easy-to-use dashboard.
          </p>
        </div>
      </section>

      {/* Challenge Section */}
      <section className="bg-primary py-20 px-4">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-center mb-6">
            <span className="text-accent">API integration</span> is a challenge for teams.
          </h2>
          <p className="text-lg text-gray-300 text-center max-w-3xl mb-12">
            Integrating APIs can be daunting for modern teams. From complex setup and scaling issues to the time-consuming nature of ongoing maintenance, the process can drain resources and slow down your project's momentum.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {/* Card 1 */}
            <div className="bg-surface rounded-2xl shadow p-8 flex flex-col items-start">
              <div className="mb-4 bg-gray-700 rounded-xl p-3">
                {/* Placeholder icon: Lightning bolt */}
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-textPrimary mb-2">
                Complex <span className="text-accent">Setup</span>
              </h3>
              <p className="text-textMuted">
                Setting up API integrations often requires deep technical knowledge and can involve a maze of configuration steps.
              </p>
            </div>
            {/* Card 2 */}
            <div className="bg-surface rounded-2xl shadow p-8 flex flex-col items-start">
              <div className="mb-4 bg-gray-700 rounded-xl p-3">
                {/* Placeholder icon: Bar chart */}
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M12 20V4M20 20v-6"/></svg>
              </div>
              <h3 className="text-xl font-bold text-textPrimary mb-2">
                Scaling <span className="text-accent">Issues</span>
              </h3>
              <p className="text-textMuted">
                As your project grows, scaling your API integrations can become a bottleneck, impacting performance and reliability.
              </p>
            </div>
            {/* Card 3 */}
            <div className="bg-surface rounded-2xl shadow p-8 flex flex-col items-start">
              <div className="mb-4 bg-gray-700 rounded-xl p-3">
                {/* Placeholder icon: Hourglass */}
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 2h12M6 22h12M8 2v2a6 6 0 004 5.66A6 6 0 0016 4V2M8 22v-2a6 6 0 014-5.66A6 6 0 0016 20v2"/></svg>
              </div>
              <h3 className="text-xl font-bold text-textPrimary mb-2">
                Time <span className="text-accent">Consuming</span>
              </h3>
              <p className="text-textMuted">
                Ongoing maintenance and monitoring of API integrations can take up valuable time and resources from your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-background py-24 px-4">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <h2 className="text-5xl font-extrabold text-textPrimary text-center mb-8">Pricing</h2>
          {/* Toggle */}
          <div className="flex items-center gap-4 mb-12">
            <span className="text-textMuted font-semibold">Monthly</span>
            <button className="relative inline-flex items-center h-8 rounded-full w-16 bg-accent/20 transition">
              <span className="absolute left-1 top-1 w-6 h-6 bg-accent rounded-full transition" />
              <span className="sr-only">Toggle pricing</span>
            </button>
            <span className="text-textPrimary font-semibold">Yearly</span>
            <span className="ml-2 px-3 py-1 rounded bg-success/10 text-success text-xs font-semibold">Get ~2 months free</span>
          </div>
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {/* Free */}
            <div className="bg-surface border border-gray-200 rounded-2xl shadow p-8 flex flex-col items-center">
              <h3 className="text-lg font-bold text-textPrimary mb-2">Free</h3>
              <div className="text-4xl font-extrabold text-textPrimary mb-1">$0 <span className="text-base font-medium text-textMuted">/mo</span></div>
              <p className="text-textMuted mb-6 text-center">For individuals and hobbyists just getting started.</p>
              <ul className="mb-8 space-y-2 text-textPrimary">
                <li>✔ 100 API calls/month</li>
                <li>✔ Community support</li>
                <li>✔ 1 project</li>
              </ul>
              <button className="w-full rounded-full bg-accent text-white font-semibold py-3 mt-auto hover:bg-accent/90 transition">Get started for free</button>
            </div>
            {/* Team */}
            <div className="bg-surface border border-gray-200 rounded-2xl shadow p-8 flex flex-col items-center">
              <h3 className="text-lg font-bold text-textPrimary mb-2">Team</h3>
              <div className="text-4xl font-extrabold text-textPrimary mb-1">$49 <span className="text-base font-medium text-textMuted">/mo</span></div>
              <p className="text-textMuted mb-6 text-center">For small teams who need more power and collaboration.</p>
              <ul className="mb-8 space-y-2 text-textPrimary">
                <li>✔ 10,000 API calls/month</li>
                <li>✔ Priority support</li>
                <li>✔ 5 projects</li>
              </ul>
              <button className="w-full rounded-full bg-accent text-white font-semibold py-3 mt-auto hover:bg-accent/90 transition">Get started for free</button>
            </div>
            {/* Business */}
            <div className="bg-surface border border-gray-200 rounded-2xl shadow p-8 flex flex-col items-center">
              <h3 className="text-lg font-bold text-accent mb-2">Business</h3>
              <div className="text-4xl font-extrabold text-textPrimary mb-1">$199 <span className="text-base font-medium text-textMuted">/mo</span></div>
              <p className="text-textMuted mb-6 text-center">For growing businesses with advanced needs and higher usage.</p>
              <ul className="mb-8 space-y-2 text-textPrimary">
                <li>✔ 100,000 API calls/month</li>
                <li>✔ Dedicated support</li>
                <li>✔ 20 projects</li>
              </ul>
              <button className="w-full rounded-full bg-accent text-white font-semibold py-3 mt-auto hover:bg-accent/90 transition">Get started for free</button>
            </div>
            {/* Enterprise */}
            <div className="bg-surface border border-gray-200 rounded-2xl shadow p-8 flex flex-col items-center">
              <h3 className="text-lg font-bold text-textPrimary mb-2">Enterprise</h3>
              <div className="text-4xl font-extrabold text-textPrimary mb-1">Custom</div>
              <p className="text-textMuted mb-6 text-center">For large organizations with custom requirements and support.</p>
              <ul className="mb-8 space-y-2 text-textPrimary">
                <li>✔ Unlimited API calls</li>
                <li>✔ SLA & custom support</li>
                <li>✔ Unlimited projects</li>
              </ul>
              <button className="w-full rounded-full border border-accent text-accent font-semibold py-3 mt-auto hover:bg-accent hover:text-white transition">Talk with our team</button>
            </div>
          </div>
          <p className="mt-8 text-textMuted text-center text-sm max-w-2xl">
            All paid plans start with a 7-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Why AppsForHire Section */}
      <section className="bg-primary py-24 px-4">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <h2 className="text-5xl font-extrabold text-center mb-16">
            <span className="text-white">Why </span>
            <span className="text-accent">AppsForHire?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
            {/* Card 1 */}
            <div className="flex flex-col items-start bg-surface rounded-2xl shadow p-8">
              <div className="mb-4 bg-gray-700 rounded-xl p-3">
                {/* Shield icon */}
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">We're the only tool that can actually enforce your API usage policies.</h3>
              <p className="text-textMuted">
                Other platforms take a reactive approach to API usage violations. We take a proactive approach, ensuring your integrations are always compliant and secure.
              </p>
            </div>
            {/* Card 2 */}
            <div className="flex flex-col items-start bg-surface rounded-2xl shadow p-8">
              <div className="mb-4 bg-gray-700 rounded-xl p-3">
                {/* Clock icon */}
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/><path stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Our platform saves you time by requiring no extra work after setup.</h3>
              <p className="text-textMuted">
                Set it and forget it. Our platform automates compliance and monitoring, so you can focus on building, not babysitting your APIs.
              </p>
            </div>
            {/* Card 3 */}
            <div className="flex flex-col items-start bg-surface rounded-2xl shadow p-8">
              <div className="mb-4 bg-gray-700 rounded-xl p-3">
                {/* Bar chart icon */}
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M12 20V4M20 20v-6"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Profit margins tend to be higher when API usage is actually enforced.</h3>
              <p className="text-textMuted">
                Teams and organizations benefit from better predictability and efficiency when API usage is managed and enforced from the start.
              </p>
            </div>
            {/* Card 4 */}
            <div className="flex flex-col items-start bg-surface rounded-2xl shadow p-8">
              <div className="mb-4 bg-gray-700 rounded-xl p-3">
                {/* Clock icon */}
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/><path stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">API monitoring is included with our platform.</h3>
              <p className="text-textMuted">
                We offer both monitoring and enforcement, often at a fraction of the cost of other solutions. Get peace of mind with AppsForHire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-gray-100 mt-24">
        <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block w-3 h-3 rounded-full bg-accent mr-2" />
              <span className="text-xl font-bold text-primary tracking-tight">AppsForHire</span>
            </div>
            <p className="text-textMuted mb-6">AppsForHire is the easiest way to manage, monitor, and scale your API integrations with confidence.</p>
            <div className="flex gap-4">
              {/* Facebook */}
              <a href="#" aria-label="Facebook" className="hover:text-accent text-primary">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 5 3.657 9.127 8.438 9.877v-6.987h-2.54v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.632.771-1.632 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.127 22 17 22 12z"/></svg>
              </a>
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="hover:text-accent text-primary">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>
              </a>
              {/* LinkedIn */}
              <a href="#" aria-label="LinkedIn" className="hover:text-accent text-primary">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" stroke="currentColor" strokeWidth="2"/><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M8 11v5M8 8v.01M12 16v-5m0 0a2 2 0 1 1 4 0v5"/></svg>
              </a>
              {/* Twitter */}
              <a href="#" aria-label="Twitter" className="hover:text-accent text-primary">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M22 5.924c-.793.352-1.645.59-2.54.698a4.48 4.48 0 0 0 1.963-2.475 8.94 8.94 0 0 1-2.828 1.082A4.48 4.48 0 0 0 11.5 9.5c0 .352.04.695.116 1.022C7.728 10.37 4.1 8.6 1.671 5.888a4.48 4.48 0 0 0-.607 2.257c0 1.557.793 2.933 2.002 3.74a4.48 4.48 0 0 1-2.03-.561v.057a4.48 4.48 0 0 0 3.6 4.393c-.193.053-.397.082-.607.082-.148 0-.292-.014-.432-.04a4.48 4.48 0 0 0 4.18 3.11A8.98 8.98 0 0 1 2 19.07a12.68 12.68 0 0 0 6.88 2.017c8.26 0 12.78-6.84 12.78-12.78 0-.195-.004-.39-.013-.583A9.14 9.14 0 0 0 24 4.59a8.98 8.98 0 0 1-2.6.713z"/></svg>
              </a>
            </div>
          </div>
          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold text-primary mb-4">Contact</h4>
            <ul className="text-textMuted space-y-1">
              <li>info@appsforhire.com</li>
              <li>Live Chat</li>
              <li>123 Startup Lane<br />San Francisco, CA 94105</li>
            </ul>
          </div>
          {/* Navigation */}
          <div>
            <h4 className="text-lg font-bold text-primary mb-4">Navigation</h4>
            <ul className="text-textMuted space-y-1">
              <li><a href="#" className="hover:text-accent transition">Free Trial</a></li>
              <li><a href="#" className="hover:text-accent transition">Overview</a></li>
              <li><a href="#" className="hover:text-accent transition">Blog</a></li>
              <li><a href="#" className="hover:text-accent transition">For Teams</a></li>
              <li><a href="#" className="hover:text-accent transition">Support Hub</a></li>
              <li><a href="#" className="hover:text-accent transition">Contact</a></li>
              <li><a href="#" className="hover:text-accent transition">Sign In</a></li>
            </ul>
          </div>
          {/* Subscribe */}
          <div>
            <h4 className="text-lg font-bold text-primary mb-4">Subscribe to New Blog Posts</h4>
            <form className="flex flex-col gap-4">
              <input type="email" placeholder="Enter your email address" className="rounded-lg bg-gray-100 px-4 py-3 text-primary placeholder:text-textMuted focus:outline-accent" />
              <button type="submit" className="rounded-lg bg-accent px-6 py-3 text-white font-semibold shadow hover:bg-accent/90 transition">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-8 pt-6 pb-4 text-sm text-textMuted flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-4">
          <div className="mb-2 md:mb-0">© {new Date().getFullYear()} AppsForHire | All Rights Reserved</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-accent transition">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:text-accent transition">Terms of Service</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
