import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { 
  LayoutDashboard, 
  MessageSquare, 
  Instagram, 
  Globe, 
  Facebook,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Sidebar = ({ activeSection, setActiveSection }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate(); // 2. Initialize the hook

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'whatsapp', label: 'WhatsApp Automation', icon: MessageSquare },
    { id: 'instagram', label: 'Instagram Automation', icon: Instagram },
    { id: 'google-ads', label: 'Google Ads', icon: Globe },
    { id: 'consent-management', label: 'Consent Management', icon: Shield },
    { id: 'meta-ads', label: 'Meta Ads', icon: Facebook },
  ];

  // 3. Helper function to handle clicks
  const handleNavigation = (id: string) => {
    if (id === 'instagram') {
      // If Instagram is clicked, go to the new Module Route
      navigate('/instagram');
    } else {
      // Otherwise, keep the old behavior (stay on Dashboard and switch tabs)
      setActiveSection(id);
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 250 }}
      className="bg-[#111111] border-r border-[#333333] h-screen flex flex-col relative"
    >
      <div className="p-6 border-b border-[#333333]">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.h1
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-2xl font-bold text-white"
            >
              <span className="text-primary">Dotler</span>.ai
            </motion.h1>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-2xl font-bold text-primary text-center"
            >
              D
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)} // 4. Use the new handler
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:bg-[#333333] hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#333333] space-y-2">
        {!isCollapsed && currentUser && (
          <div className="px-4 py-2 mb-2">
            <p className="text-white text-sm font-medium truncate">
              {(currentUser as any).displayName || currentUser.email}
            </p>
            <p className="text-gray-500 text-xs">Red Plan</p>
          </div>
        )}
        
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#333333] hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-[#111111] border border-[#333333] rounded-full p-1 hover:bg-[#333333] transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        )}
      </button>
    </motion.div>
  );
};

export default Sidebar;