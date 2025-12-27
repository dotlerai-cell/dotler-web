import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Sparkles, Clock, Zap, Palette, TrendingUp, Check } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  const stats = [
    { 
      value: '1h', 
      label: 'Optimization Cycle', 
      desc: 'Adjusts bids & budget every hour, 24/7.', 
      icon: Clock 
    },
    { 
      value: '2', 
      label: 'Unified Channels', 
      desc: 'Seamlessly splits budget between Meta & Google.', 
      icon: Zap 
    },
    { 
      value: '100+', 
      label: 'Creatives / Wk', 
      desc: 'AI-generated copy and visual assets.', 
      icon: Palette 
    },
    { 
      value: '3.5x', 
      label: 'Avg. ROAS Increase', 
      desc: 'Based on early adopter performance data.', 
      icon: TrendingUp 
    },
  ];

  const steps = [
    {
      title: 'AI Copy & Creative Generation',
      desc: 'Our engine analyzes your product and audience to generate high-converting ad copy and visuals instantly.',
      active: true,
    },
    {
      title: 'Smart Budget Allocation',
      desc: 'The system intelligently splits your budget between Meta and Google Ads based on predicted performance.',
      active: false,
    },
    {
      title: 'Hourly Optimization',
      desc: 'Unlike humans who optimize weekly, dotler.ai adjusts bids and targeting every single hour.',
      active: false,
    },
    {
      title: 'Analytics & Insights',
      desc: 'Get crystal clear reporting on what works, what doesn\'t, and where your next opportunity lies.',
      active: false,
    },
  ];

  const team = [
    {
      name: 'Michael Rodriguez',
      role: 'Founder & CEO',
      subtitle: 'Ex-Google Ads Lead',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    },
    {
      name: 'Emily Thompson',
      role: 'CTO',
      subtitle: 'AI Research PhD',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    },
    {
      name: 'David Park',
      role: 'Head of Product',
      subtitle: 'Growth Hacker',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen bg-[#181111] text-white">
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center w-full">
        {/* Hero Section */}
        <section className="w-full flex justify-center py-10 px-4 md:px-10 lg:px-40">
          <div className="w-full max-w-[960px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 md:gap-10 rounded-2xl overflow-hidden bg-[#2a1d1d] border border-[#392828] relative"
            >
              <div className="absolute inset-0 z-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-t from-[#181111] via-[#181111]/80 to-transparent"></div>
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 gap-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>The Intelligence Behind The Ads</span>
                </div>

                <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-[-0.033em] max-w-3xl">
                  We're Building the Brain of Digital Advertising
                </h1>

                <h2 className="text-white/80 text-lg md:text-xl font-normal leading-relaxed max-w-2xl">
                  Dotler.ai exists to democratize enterprise-level ad optimization. We combine autonomous creative generation with real-time budget allocation to maximize ROI for every business.
                </h2>

                <div className="pt-4">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center justify-center rounded-lg h-12 px-8 bg-white text-[#181111] text-base font-bold hover:bg-gray-100 transition-colors"
                  >
                    Explore Our Technology
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className="w-full flex justify-center py-10 px-4 md:px-10 lg:px-40">
          <div className="w-full max-w-[960px] flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-white text-[28px] font-bold leading-tight tracking-[-0.015em]">Our Impact</h2>
              <p className="text-white/60 text-base">
                Delivering measurable results through autonomous decision making.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#2a1d1d] border border-[#392828] p-6 rounded-xl flex flex-col gap-2 group hover:border-primary/50 transition-colors"
                  >
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                    <p className="text-white/60 text-sm font-medium">{stat.label}</p>
                    <p className="text-white/40 text-xs">{stat.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Timeline */}
        <section className="w-full flex justify-center py-10 px-4 md:px-10 lg:px-40">
          <div className="w-full max-w-[960px] flex flex-col">
            <div className="flex flex-col gap-2 mb-8 px-4">
              <h2 className="text-white text-[28px] font-bold leading-tight tracking-[-0.015em]">How It Works</h2>
              <p className="text-white/60 text-base max-w-xl">
                Our full-funnel approach takes the guesswork out of advertising. The AI handles the heavy lifting from creation to conversion.
              </p>
            </div>

            <div className="grid grid-cols-[40px_1fr] gap-x-6 px-4">
              {steps.map((step, index) => (
                <div key={index} className="contents">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className={`flex items-center justify-center size-10 rounded-full z-10 ${
                      step.active 
                        ? 'bg-primary text-white shadow-[0_0_10px_rgba(236,19,19,0.5)]' 
                        : 'bg-[#2a1d1d] border border-[#392828] text-white'
                    }`}>
                      <Check className="w-5 h-5" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-[2px] h-full grow min-h-[60px] ${
                        step.active ? 'bg-gradient-to-b from-primary to-[#543b3b]' : 'bg-[#543b3b]'
                      }`}></div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col pb-10 pt-2">
                    <h3 className="text-white text-lg font-bold">{step.title}</h3>
                    <p className="text-white/60 text-sm mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="w-full flex justify-center py-10 px-4 md:px-10 lg:px-40 bg-[#2a1d1d]/30 border-y border-[#392828]">
          <div className="w-full max-w-[960px] flex flex-col gap-8">
            <div className="flex flex-col items-center text-center gap-2">
              <h2 className="text-white text-[28px] font-bold leading-tight tracking-[-0.015em]">Meet the Minds</h2>
              <p className="text-white/60 text-base max-w-lg">
                A team of data scientists, ad strategists, and engineers dedicated to solving the ad-tech puzzle.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center text-center gap-4 p-4 rounded-xl bg-[#181111] border border-[#392828] hover:border-primary/40 transition-all group"
                >
                  <div className="size-32 rounded-full overflow-hidden border-2 border-[#392828] group-hover:border-primary transition-colors">
                    <img
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      src={member.image}
                      alt={member.name}
                    />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-bold">{member.name}</h3>
                    <p className="text-primary text-sm font-medium">{member.role}</p>
                    <p className="text-white/40 text-xs mt-2">{member.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="w-full flex justify-center py-20 px-4 md:px-10 lg:px-40">
          <div className="w-full max-w-[960px]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-primary to-red-900 rounded-2xl p-8 md:p-12 shadow-[0_0_40px_rgba(236,19,19,0.2)]">
              <div className="flex flex-col gap-2 text-center md:text-left">
                <h2 className="text-white text-3xl font-black tracking-tight">
                  Stop Guessing. Start Scaling.
                </h2>
                <p className="text-white/90 text-lg">
                  Join the AI revolution and optimize your ad spend today.
                </p>
              </div>
              <div className="flex gap-4 flex-col sm:flex-row">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="flex min-w-[140px] items-center justify-center rounded-lg h-12 px-6 bg-white text-primary text-base font-bold shadow-lg hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </button>
                <button className="flex min-w-[140px] items-center justify-center rounded-lg h-12 px-6 bg-black/20 text-white border border-white/20 text-base font-bold hover:bg-black/40 transition-colors">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Simple Footer */}
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
      </main>
    </div>
  );
};

export default About;
