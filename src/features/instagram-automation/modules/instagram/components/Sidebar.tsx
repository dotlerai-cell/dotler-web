
import React from 'react';
import { LayoutDashboard, PenTool, Calendar, Database, MessageSquare, Settings, Moon, Sun, Bot, Grid, Zap, Hash } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isDarkMode, toggleTheme }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Content', icon: PenTool },
    { id: 'feed', label: 'My Feed', icon: Grid },
    { id: 'hashtags', label: 'Hashtags', icon: Hash },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'automation', label: 'Lead Magnet', icon: Zap },
    { id: 'dms', label: 'DM Automation', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database },
    { id: 'chatbot', label: 'AI Assistant', icon: Bot },
  ];

  return (
    <div className="w-64 bg-slate-900 dark:bg-slate-950 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-50 transition-colors duration-200 border-r border-transparent dark:border-slate-800">
      <div className="p-6 border-b border-slate-800 dark:border-slate-800">
        <h1 className="text-xl font-bold text-white">
          Instagram Intelligence
        </h1>
        <p className="text-xs text-slate-400 mt-1">Auto-Pilot Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 dark:border-slate-800 space-y-2">
         <button 
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-300" />}
            <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button 
          onClick={() => setView('settings')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
            ${currentView === 'settings' 
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <Settings className={`w-5 h-5 ${currentView === 'settings' ? 'text-white' : 'text-slate-400'}`} />
            <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
