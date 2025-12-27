import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();

  return (
    <header className="bg-[#111111] border-b border-[#333333] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search campaigns..."
              className="w-full bg-black border border-[#333333] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 ml-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[#333333] transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-gray-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <button className="relative p-2 rounded-lg hover:bg-[#333333] transition-colors">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-red-600 flex items-center justify-center text-white font-semibold">
            {(currentUser as any)?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
