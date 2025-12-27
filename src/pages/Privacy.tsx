import Navigation from '../components/Navigation';
import { Search, Info, Database, Bot, Share, User, Shield, Mail, Target, Image, BadgeCheck, CreditCard } from 'lucide-react';

const Privacy = () => {

  const sections = [
    { id: 'introduction', label: 'Introduction', icon: Info },
    { id: 'data-collection', label: 'Data Collection', icon: Database },
    { id: 'ai-usage', label: 'AI & Automation', icon: Bot },
    { id: 'sharing', label: 'Third-Party Sharing', icon: Share },
    { id: 'rights', label: 'User Rights', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'contact', label: 'Contact Us', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-[#181111] text-white flex flex-col font-display selection:bg-primary selection:text-white overflow-x-hidden">
      <Navigation />

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-24 flex flex-col gap-6">
              {/* Search */}
              <div className="relative group">
                <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#b99d9d] group-focus-within:text-white transition-colors w-5 h-5 top-2.5 left-3" />
                <input
                  className="block w-full rounded-lg border-none bg-[#2a1d1d] py-2.5 pl-10 pr-4 text-white placeholder-[#b99d9d] focus:ring-2 focus:ring-primary focus:bg-[#322222] text-sm transition-all"
                  placeholder="Search policy..."
                  type="text"
                />
              </div>

              {/* Navigation */}
              <nav className="flex flex-col gap-1">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">
                  Table of Contents
                </h3>
                {sections.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border-l-2 transition-all ${
                        index === 0
                          ? 'bg-[#392828]/50 border-primary text-white'
                          : 'border-transparent hover:bg-[#2a1d1d] text-[#b99d9d] hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </a>
                  );
                })}
              </nav>

              {/* Support Card */}
              <div className="bg-gradient-to-br from-[#2a1d1d] to-[#1e1414] rounded-xl p-5 border border-[#392828] mt-4">
                <div className="flex items-center gap-2 mb-2 text-white">
                  <Mail className="w-5 h-5" />
                  <span className="font-semibold text-sm">Need legal help?</span>
                </div>
                <p className="text-xs text-[#b99d9d] mb-3">
                  Our DPO is available to answer your specific privacy questions.
                </p>
                <a href="mailto:legal@dotler.ai" className="text-xs font-bold text-primary hover:text-red-400">
                  Contact DPO →
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <article className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-10 border-b border-[#392828] pb-8">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                Privacy Policy
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-[#b99d9d] text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Last Updated: October 24, 2023</span>
                </div>
                <span className="hidden sm:inline text-[#392828]">•</span>
                <span>Effective Date: November 1, 2023</span>
              </div>
              <p className="mt-6 text-lg text-gray-300 leading-relaxed max-w-3xl">
                This policy outlines how dotler.ai protects your creative assets, optimizes your ad spend, and handles the data required to power our AI-driven marketing engine.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-16">
              {/* Introduction */}
              <section className="scroll-mt-28" id="introduction">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                  Introduction
                </h2>
                <div className="prose prose-invert prose-lg text-[#b99d9d] max-w-none">
                  <p className="leading-relaxed mb-4">
                    At dotler.ai, we are committed to maintaining the trust and confidence of our visitors and customers. We understand that as an AI-powered full-funnel ad platform, we handle sensitive creative assets and budget allocations.
                  </p>
                  <p className="leading-relaxed">
                    This Privacy Policy provides detailed information on when and why we collect your personal and campaign information, how we use it to train our models and optimize your ads, the limited conditions under which we may disclose it to ad networks like Meta and Google, and how we keep it secure.
                  </p>
                </div>
              </section>

              {/* Data Collection */}
              <section className="scroll-mt-28" id="data-collection">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                  Data Collection
                </h2>
                <div className="bg-[#231515] rounded-xl p-6 border border-[#392828]">
                  <p className="text-[#b99d9d] mb-6">
                    To provide our AI optimization services, we collect specific types of data from your connected ad accounts:
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { icon: Target, title: 'Campaign Performance', desc: 'CTR, CPC, ROAS, and other metrics from Meta and Google Ads are ingested hourly.' },
                      { icon: Image, title: 'Creative Assets', desc: 'Images, videos, and copy you upload are stored to generate variations.' },
                      { icon: BadgeCheck, title: 'Account Info', desc: 'Business name, ad account IDs, and authorized user details.' },
                      { icon: CreditCard, title: 'Budgeting Data', desc: 'Total spend limits and allocation history for budget optimization.' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="flex gap-4">
                          <div className="flex-shrink-0 size-10 rounded-full bg-[#392828] flex items-center justify-center text-primary">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                            <p className="text-sm text-[#b99d9d]">{item.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* AI Usage */}
              <section className="scroll-mt-28" id="ai-usage">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                  AI & Automation
                </h2>
                <div className="prose prose-invert prose-lg text-[#b99d9d] max-w-none space-y-4">
                  <p>dotler.ai utilizes advanced machine learning algorithms to:</p>
                  <ul className="list-disc pl-5 space-y-2 marker:text-primary">
                    <li>Analyze high-performing ad copy to generate new variations.</li>
                    <li>Predict audience fatigue and rotate creatives automatically.</li>
                    <li>Reallocate budget between Meta and Google Ads in real-time based on performance signals.</li>
                  </ul>
                  <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg mt-4">
                    <p className="text-sm text-white italic">
                      "We do not use your proprietary creative data to train models for other clients. Your brand voice remains isolated within your workspace."
                    </p>
                  </div>
                </div>
              </section>

              {/* Third Party Sharing */}
              <section className="scroll-mt-28" id="sharing">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                  Third-Party Data Sharing
                </h2>
                <p className="text-[#b99d9d] mb-6">
                  We act as a bridge between your business and major advertising networks. Data is shared strictly via official APIs.
                </p>
                <div className="overflow-hidden rounded-xl border border-[#392828]">
                  <table className="min-w-full divide-y divide-[#392828] bg-[#231515]">
                    <thead className="bg-[#2a1d1d]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Data Shared</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#392828]">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">Meta (Facebook/Instagram)</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b99d9d]">Ad Creatives, Audiences, Spend</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b99d9d]">Ad Delivery</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">Google Ads</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b99d9d]">Keywords, Bids, Copy</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b99d9d]">Search & Display Placement</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">Stripe</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b99d9d]">Billing Details</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b99d9d]">Subscription Processing</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* User Rights */}
              <section className="scroll-mt-28" id="rights">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                  Your Rights
                </h2>
                <p className="text-[#b99d9d] mb-6">
                  You retain full ownership of your creative assets and campaign data.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Right to Access', desc: 'Request a copy of all personal and campaign data we hold about you.' },
                    { title: 'Right to Erasure', desc: 'Request deletion of your account and associated historical data.' },
                    { title: 'Data Portability', desc: 'Export your campaign history in a machine-readable format.' },
                    { title: 'Opt-out of AI Training', desc: 'Choose to exclude your data from non-essential AI model improvements.' },
                  ].map((right) => (
                    <div key={right.title} className="p-5 border border-[#392828] rounded-lg hover:border-primary/50 transition-colors bg-[#231515]">
                      <h4 className="text-white font-bold mb-2">{right.title}</h4>
                      <p className="text-sm text-[#b99d9d]">{right.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Security */}
              <section className="scroll-mt-28" id="security">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                  Security Measures
                </h2>
                <div className="flex items-start gap-4 p-6 bg-[#231515] rounded-xl border border-[#392828]">
                  <Shield className="w-10 h-10 text-green-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Enterprise-Grade Encryption</h3>
                    <p className="text-[#b99d9d] mb-4">
                      All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We utilize secure tokens for API access to Meta and Google, ensuring we never store your raw passwords.
                    </p>
                    <ul className="text-sm text-[#b99d9d] space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> SOC 2 Type II Compliant
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Regular Penetration Testing
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Contact */}
              <section className="scroll-mt-28" id="contact">
                <div className="bg-gradient-to-r from-[#2a1d1d] to-[#181111] rounded-2xl p-8 border border-[#392828] relative overflow-hidden">
                  <div className="absolute -top-24 -right-24 size-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white mb-4">Questions about your privacy?</h2>
                    <p className="text-[#b99d9d] mb-6 max-w-xl">
                      If you have any questions or concerns about our Privacy Policy or data processing, please contact us.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <a
                        href="mailto:privacy@dotler.ai"
                        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                        privacy@dotler.ai
                      </a>
                      <button className="inline-flex items-center justify-center gap-2 bg-[#392828] hover:bg-[#4a3535] text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#392828] py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-white/40 text-sm">© 2024 dotler.ai. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="text-white/40 hover:text-white text-sm transition-colors">Privacy</a>
            <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">Terms</a>
            <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
