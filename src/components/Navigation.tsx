import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#392828] bg-[#181111]/95 backdrop-blur">
      <div className="px-4 md:px-10 lg:px-40 flex justify-center py-3">
        <div className="flex w-full max-w-[960px] items-center justify-between">
          <div className="flex items-center gap-4 text-white cursor-pointer" onClick={() => navigate('/')}>
            <Sparkles className="w-8 h-8 text-primary" />
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">dotler.ai</h2>
          </div>

          <div className="hidden md:flex flex-1 justify-end gap-8">
            <nav className="flex items-center gap-9">
              <a 
                href="/" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-white font-bold border-b-2 border-primary py-1' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Home
              </a>
              <a 
                href="/about" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/about') 
                    ? 'text-white font-bold border-b-2 border-primary py-1' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                About Us
              </a>
              <a 
                href="/pricing" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/pricing') 
                    ? 'text-white font-bold border-b-2 border-primary py-1' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Pricing
              </a>
              <a 
                href="/privacy" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/privacy') 
                    ? 'text-white font-bold border-b-2 border-primary py-1' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Privacy Policy
              </a>
            </nav>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/login')}
                className="flex items-center justify-center rounded-lg h-9 px-4 bg-transparent border border-[#392828] text-white text-sm font-bold hover:bg-[#392828] transition-colors"
              >
                <span className="truncate">Login</span>
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center rounded-lg h-9 px-4 bg-primary text-white text-sm font-bold shadow-[0_0_15px_rgba(236,19,19,0.4)] hover:shadow-[0_0_25px_rgba(236,19,19,0.6)] transition-all"
              >
                <span className="truncate">Get Started</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
