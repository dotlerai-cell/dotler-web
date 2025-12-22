import { motion } from 'framer-motion';
import Navigation from '../components/Navigation';
import { Sparkles, CheckCircle, Mail, Target, Palette, TrendingUp, BarChart3 } from 'lucide-react';

const Pricing = () => {

  const tiers = [
    {
      name: 'Starter',
      subtitle: 'Solopreneurs',
      price: '$49',
      features: [
        'AI Copy Generation',
        'Basic Analytics',
        'Single Platform (Meta)',
      ],
      highlighted: false,
    },
    {
      name: 'Growth',
      subtitle: 'Startups',
      price: '$149',
      features: [
        'Full Funnel Automation',
        'Hourly Optimization',
        'Meta & Google Ads',
        'Creative Generation (50/mo)',
      ],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      subtitle: 'Agencies',
      price: '$499',
      features: [
        'Multi-account Management',
        'Dedicated Account Manager',
        'Unlimited Creative Gen',
        'Custom API Access',
      ],
      highlighted: false,
    },
  ];

  const features = [
    { icon: Target, title: 'Meta & Google Ads', desc: 'Unified budget allocation across platforms automatically.' },
    { icon: Palette, title: 'Creative Gen', desc: 'AI-generated high converting creatives tailored to your brand.' },
    { icon: TrendingUp, title: 'Hourly Opt', desc: 'Real-time spend optimization algorithms 24/7.' },
    { icon: BarChart3, title: 'Deep Analytics', desc: 'Full funnel insights from click to conversion.' },
  ];

  return (
    <div className="min-h-screen bg-[#221010] text-white">
      <Navigation />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[#221010] opacity-90"></div>
          </div>
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                Public Beta Cohort 1
              </div>

              <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                The Future of Ad Optimization <br className="hidden sm:block" />
                <span className="text-primary">is Arriving</span>
              </h1>

              <p className="mx-auto max-w-2xl text-lg text-gray-300">
                First public beta cohort launching soon. Automate copy, creative, and budget across Meta & Google with our Neural Engine.
              </p>

              <div className="mt-8 w-full max-w-md">
                <form className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-grow">
                    <Mail className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 w-5 h-5 top-3" />
                    <input
                      className="block w-full rounded-lg border-[#543b3b] bg-[#2b1515] py-3 pl-10 text-white focus:border-primary focus:ring-primary placeholder-gray-500 sm:text-sm"
                      placeholder="Enter your email address"
                      type="email"
                    />
                  </div>
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-red-700 shadow-[0_0_20px_rgba(236,19,19,0.4)] transition-all"
                    type="button"
                  >
                    Sign up here
                  </button>
                </form>
                <p className="mt-3 text-xs text-gray-400">
                  Limited spots available for Cohort 1. No credit card required.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-12 border-y border-[#543b3b] bg-[#221010]/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Powered by dotler.ai Neural Engine
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative overflow-hidden rounded-xl border border-[#543b3b] bg-[#2b1515] p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-[0_0_20px_rgba(236,19,19,0.1)]"
                  >
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-gray-400">{feature.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Pricing Tiers</h2>
              <p className="mt-4 text-lg text-gray-300">
                Flexible plans that scale with your ad spend.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {tiers.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex flex-col rounded-2xl p-8 transition-all ${
                    tier.highlighted
                      ? 'border border-primary bg-[#2b1515] shadow-2xl shadow-primary/10 transform md:-translate-y-4 z-10'
                      : 'border border-[#543b3b] bg-[#2b1515]/40 backdrop-blur-sm hover:scale-[1.02] hover:bg-[#2b1515]/60 hover:border-primary/30'
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">
                      {tier.name} ({tier.subtitle})
                    </h3>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-500 blur-[4px] select-none">
                        {tier.price}
                      </span>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        tier.highlighted
                          ? 'bg-primary text-white ring-primary'
                          : 'bg-primary/20 text-primary ring-primary/30'
                      }`}>
                        Revealing Soon
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">per month</p>
                  </div>

                  <ul className="mb-8 space-y-4 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      tier.highlighted
                        ? 'bg-primary text-white hover:bg-red-700 shadow-lg shadow-primary/25'
                        : 'border border-[#543b3b] bg-transparent hover:bg-white/5'
                    }`}
                  >
                    Join Waitlist
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative isolate overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-20 shadow-2xl sm:px-12 sm:py-32 md:px-16 lg:px-24">
              <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ec1313 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
              
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Limited spots available for <span className="text-primary">Cohort 1</span>
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
                  Secure your early access to the neural engine. Don't let your ad budget go to waste another day.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <input
                    className="w-full min-w-0 flex-auto rounded-lg border-0 bg-white/10 px-4 py-3 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    placeholder="Enter your email"
                    type="email"
                  />
                  <button className="w-full flex-none rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700 sm:w-auto transition-all">
                    Join the Waitlist
                  </button>
                </div>
                <p className="mt-4 text-sm text-gray-400">Launching in Q4 2024</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#543b3b] bg-[#221010] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gray-500" />
              <p className="text-sm text-gray-400">© 2024 dotler.ai. All rights reserved.</p>
            </div>
            <div className="flex gap-6">
              <a href="/privacy" className="text-sm text-gray-400 hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
