import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Zap,
  Play,
  ArrowRight,
  CheckCircle,
  Edit3,
  Palette,
  DollarSign as CurrencyExchange,
  BarChart3,
  Check
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#181111] text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col gap-6 text-center lg:text-left z-10"
            >
              <div className="inline-flex items-center gap-2 self-center lg:self-start px-3 py-1 rounded-full bg-[#2a1a1a] border border-[#392828] w-fit">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-medium text-gray-300">AI Model v4.2 Live</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em]">
                Full-Funnel Advertising,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600">
                  Fully Autopilot.
                </span>
              </h1>

              <h2 className="text-gray-600 dark:text-gray-300 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                From generating high-converting copy and creatives to hourly budget optimization across Meta and Google. Meet your new AI marketing team.
              </h2>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center justify-center rounded-lg h-12 px-8 bg-primary hover:bg-red-700 text-white text-base font-bold transition-all shadow-lg hover:shadow-red-900/50"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
                <button className="flex items-center justify-center rounded-lg h-12 px-8 bg-white dark:bg-[#2a1a1a] border border-gray-200 dark:border-[#392828] hover:bg-gray-50 dark:hover:bg-[#3f2a2a] text-base font-bold transition-all">
                  <Play className="mr-2 w-5 h-5 text-primary" />
                  <span>Watch Demo</span>
                </button>
              </div>

              <div className="pt-4 flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-500">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
                <span className="mx-2">•</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 w-full relative group"
            >
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#392828] shadow-2xl bg-[#2a1a1a]">
                <div className="absolute inset-0 bg-[#181111]/80"></div>
                <div className="absolute top-4 left-4 right-4 bottom-4 flex flex-col gap-4">
                  <div className="h-8 w-1/3 bg-white/10 rounded animate-pulse"></div>
                  <div className="flex gap-4 h-full">
                    <div className="w-2/3 h-full bg-white/5 rounded border border-white/10 p-4 flex items-end justify-between">
                      <div className="w-8 h-[40%] bg-primary/40 rounded-t"></div>
                      <div className="w-8 h-[70%] bg-primary/60 rounded-t"></div>
                      <div className="w-8 h-[50%] bg-primary/40 rounded-t"></div>
                      <div className="w-8 h-[90%] bg-primary rounded-t shadow-[0_0_15px_#ec1313]"></div>
                      <div className="w-8 h-[60%] bg-primary/40 rounded-t"></div>
                    </div>
                    <div className="w-1/3 h-full flex flex-col gap-3">
                      <div className="h-1/3 bg-white/5 rounded border border-white/10"></div>
                      <div className="h-1/3 bg-white/5 rounded border border-white/10"></div>
                      <div className="h-1/3 bg-white/5 rounded border border-white/10"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-8 border-y border-white/5 bg-[#2a1a1a]/30">
        <div className="mx-auto max-w-7xl px-4 md:px-10 text-center">
          <p className="text-sm font-medium text-gray-500 mb-6">TRUSTED BY MODERN GROWTH TEAMS</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <span className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6" /> DataFlow
            </span>
            <span className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-6 h-6" /> RocketAds
            </span>
            <span className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6" /> FastScale
            </span>
            <span className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6" /> CrystalClear
            </span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 dark:bg-[#181111]">
        <div className="mx-auto max-w-7xl px-4 md:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Meta ROAS', value: '4.2x', change: '+12%', icon: TrendingUp },
              { label: 'Google CPA', value: '$12.50', change: '-15%', icon: DollarSign },
              { label: 'Creative CTR', value: '3.8%', change: '+0.5%', icon: Target },
              { label: 'Budget Saved', value: '$4,200', change: '+15%', icon: Zap },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#2a1a1a] border border-gray-100 dark:border-[#392828] shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                    <div className="text-primary bg-primary/10 rounded p-1">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-end gap-3 mt-2">
                    <p className="text-3xl font-bold leading-none">{stat.value}</p>
                    <p className="text-[#0bda0b] text-sm font-bold bg-[#0bda0b]/10 px-2 py-0.5 rounded mb-1">
                      {stat.change}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* The 4-Step Funnel */}
      <section className="py-20" id="features">
        <div className="mx-auto max-w-7xl px-4 md:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The 4-Step AI Funnel</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Stop managing ads manually. Let Dotler handle the entire lifecycle from ideation to optimization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Edit3, title: '1. AI Copywriting', desc: 'Generates hundreds of high-converting hooks, headlines, and primary text options in seconds.' },
              { icon: Palette, title: '2. Creative Studio', desc: 'Instantly designs thumb-stopping visuals tailored to your brand identity and audience segments.' },
              { icon: CurrencyExchange, title: '3. Budget Split', desc: 'Smartly allocates budget between Meta & Google hourly based on live performance signals.' },
              { icon: BarChart3, title: '4. Live Analytics', desc: 'Real-time dashboard showing exactly where your money is going and what\'s driving revenue.' },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-[#2a1a1a] border border-[#392828] flex items-center justify-center mb-6 group-hover:bg-primary group-hover:border-primary transition-colors duration-300">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-[#392828] to-transparent z-[-1]"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Deep Dive: Creative */}
      <section className="py-20 bg-[#2a1a1a]/30 border-y border-[#392828]">
        <div className="mx-auto max-w-7xl px-4 md:px-10">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`bg-gradient-to-br from-primary/20 to-orange-600/20 rounded-lg aspect-square shadow-lg ${i === 2 ? 'mt-8' : i === 3 ? '-mt-8' : ''}`}
                  ></div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 flex flex-col gap-6">
              <div className="inline-block p-2 rounded bg-primary/10 w-fit">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Creative Studio</h2>
              <h3 className="text-xl text-primary font-medium">Infinite variations. Zero designer bottlenecks.</h3>
              <p className="text-gray-400 leading-relaxed">
                Our Generative AI analyzes your best performers and creates new iterations instantly. Test 50+ creatives per week without hiring an agency. Dotler automatically detects winning patterns—colors, objects, text placement—and doubles down on them.
              </p>
              <ul className="flex flex-col gap-3 mt-2">
                {['Auto-resize for Stories, Feeds, and Reels', 'Brand-compliant color palettes', 'One-click background replacement'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#181111]"></div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 md:px-10 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-white">
            Ready to fire your ad agency?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join 500+ growth teams scaling with dotler.ai today. Start your 14-day free trial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-14 px-8 bg-primary hover:bg-red-700 text-white text-lg font-bold shadow-[0_0_20px_rgba(236,19,19,0.4)] transition-all"
            >
              Start Free Trial
            </button>
            <button className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-14 px-8 bg-[#2a1a1a] hover:bg-[#3f2a2a] border border-[#392828] text-white text-lg font-bold transition-all">
              Talk to Sales
            </button>
          </div>
          <p className="mt-6 text-sm text-gray-500">Includes 10,000 free AI creative credits.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#392828] bg-[#181111] pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4 text-white">
                <Sparkles className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">dotler.ai</span>
              </div>
              <p className="text-gray-500 text-sm max-w-xs mb-6">
                The all-in-one AI advertising platform for modern growth teams.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="text-white font-bold">Product</h4>
              <a href="#features" className="text-gray-500 hover:text-primary transition-colors text-sm">Features</a>
              <a href="/pricing" className="text-gray-500 hover:text-primary transition-colors text-sm">Pricing</a>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="text-white font-bold">Resources</h4>
              <a href="/about" className="text-gray-500 hover:text-primary transition-colors text-sm">About</a>
              <a href="/privacy" className="text-gray-500 hover:text-primary transition-colors text-sm">Privacy</a>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="text-white font-bold">Company</h4>
              <a href="/about" className="text-gray-500 hover:text-primary transition-colors text-sm">About</a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors text-sm">Contact</a>
            </div>
          </div>

          <div className="border-t border-[#392828] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-xs">© 2024 Dotler AI Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/privacy" className="text-gray-600 hover:text-gray-400 text-xs">Privacy Policy</a>
              <a href="#" className="text-gray-600 hover:text-gray-400 text-xs">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
