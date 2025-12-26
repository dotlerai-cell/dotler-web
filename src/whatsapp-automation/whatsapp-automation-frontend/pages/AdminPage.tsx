import { useState, useEffect, FC } from 'react';
import { LogOut, Menu, X, BarChart3, Users, Send, AlertCircle, TrendingUp, Home } from 'lucide-react';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import apiService from '../services/apiService';
import AdminLoginPage from './AdminLoginPage';
import DashboardAnalyticsView from './DashboardAnalyticsView';
import RecentComplaintsView from './RecentComplaintsView';
import IntentStatsView from './IntentStatsView';
import UsersManagementView from './UsersManagementView';
import CampaignsView from './CampaignsView';

type MenuOption = 'overview' | 'users' | 'campaigns' | 'analytics' | 'complaints' | 'intent';

interface MenuItemConfig {
  id: MenuOption;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const AdminPage: FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuOption>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Debugging logs
  useEffect(() => {
  }, []);

  useEffect(() => {
    try {
      apiService.initializeWithToken();
      const token = localStorage.getItem('wa_admin_token');
      if (token) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed', error);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    apiService.logout();
    setIsAuthenticated(false);
    setActiveMenu('overview');
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full w-full flex flex-col">
        <AdminLoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  const menuItems: MenuItemConfig[] = [
    { id: 'overview', label: 'Overview', icon: <Home className="w-5 h-5" />, description: 'Dashboard overview' },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, description: 'Complaint analytics' },
    { id: 'complaints', label: 'Complaints', icon: <AlertCircle className="w-5 h-5" />, description: 'Recent complaints' },
    { id: 'intent', label: 'Intent Stats', icon: <TrendingUp className="w-5 h-5" />, description: 'Intent analysis' },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" />, description: 'Manage users' },
    { id: 'campaigns', label: 'Campaigns', icon: <Send className="w-5 h-5" />, description: 'Send broadcasts' },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'analytics': return <DashboardAnalyticsView />;
      case 'complaints': return <RecentComplaintsView />;
      case 'intent': return <IntentStatsView />;
      case 'users': return <UsersManagementView />;
      case 'campaigns': return <CampaignsView />;
      case 'overview': default: return <OverviewSection menuItems={menuItems} onSelectMenu={setActiveMenu} />;
    }
  };

  return (
    // CHANGE 1: Use h-full instead of h-screen. Use flex-row to put sidebar next to content.
    <div className="flex h-full w-full bg-black relative overflow-hidden rounded-xl border border-gray-800">
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="absolute top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* CHANGE 2: Sidebar logic updated to fit inside container */}
      <div
        className={`absolute lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-xl font-bold text-white">WA Admin</h1>
            <p className="text-sm text-gray-400">Panel</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeMenu === item.id
                    ? 'bg-primary/20 border border-primary/50 text-primary'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 border border-transparent'
                }`}
              >
                {item.icon}
                <div className="text-left">
                  <p className="font-medium">{item.label}</p>
                </div>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <Button variant="secondary" onClick={handleLogout} className="w-full flex items-center justify-center gap-2 rounded-lg">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay on mobile */}
      {isMobileMenuOpen && (
        <div className="absolute inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-black">
        <div className="border-b border-gray-800 bg-gray-900/50 p-6 pl-16 lg:pl-6">
          <h2 className="text-2xl font-bold text-white">
            {menuItems.find((item) => item.id === activeMenu)?.label || 'Dashboard'}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// OverviewSection stays exactly the same as your code, just pasting export for safety
const OverviewSection: FC<{ menuItems: MenuItemConfig[]; onSelectMenu: (menu: MenuOption) => void; }> = ({ menuItems, onSelectMenu }) => {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to Admin Panel</h1>
            <p className="text-gray-400">Manage your WhatsApp automation and analytics</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.filter((item) => item.id !== 'overview').map((item) => (
            <Card key={item.id} hover onClick={() => onSelectMenu(item.id)} className="cursor-pointer group border border-gray-700 hover:border-primary/50 transition">
            <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition">{item.icon}</div>
                <div className="flex-1">
                <h3 className="font-semibold text-white group-hover:text-primary transition">{item.label}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
                </div>
            </div>
            </Card>
        ))}
        </div>
    </div>
  );
};

export default AdminPage;