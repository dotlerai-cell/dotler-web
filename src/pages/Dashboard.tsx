import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import GoogleAds from './GoogleAds';
import AdminPage from '../whatsapp-automation/whatsapp-automation-frontend/pages/AdminPage';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Zap,
  MessageSquare,
  Instagram,
  Globe,
  Facebook,
  Activity,
  Shield
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ConsentManagement from '../components/ConsentManagement';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  // Debug: log active section changes
  useEffect(() => {
  }, [activeSection]);

  const statsData = [
    { name: 'Mon', revenue: 4200, spend: 1200 },
    { name: 'Tue', revenue: 5100, spend: 1400 },
    { name: 'Wed', revenue: 4800, spend: 1300 },
    { name: 'Thu', revenue: 6200, spend: 1800 },
    { name: 'Fri', revenue: 7100, spend: 2100 },
    { name: 'Sat', revenue: 6800, spend: 1900 },
    { name: 'Sun', revenue: 7500, spend: 2200 },
  ];

  const features = [
    {
      id: 'whatsapp',
      title: 'WhatsApp Automation',
      icon: MessageSquare,
      description: 'Automate customer engagement',
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'instagram',
      title: 'Instagram Automation',
      icon: Instagram,
      description: 'Manage posts and engagement',
      color: 'from-pink-500 to-purple-600',
    },
    {
      id: 'google-ads',
      title: 'Google Ads',
      icon: Globe,
      description: 'Optimize search campaigns',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'consent-management',
      title: 'Consent Management',
      icon: Shield,
      description: 'Manage cookie consent and privacy',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'meta-ads',
      title: 'Meta Ads',
      icon: Facebook,
      description: 'Scale social advertising',
      color: 'from-blue-600 to-indigo-600',
    },
  ];

  const renderDashboardContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Automate Ads with Intelligent Design
        </h1>
        <p className="text-gray-400">
          AI-powered platform for high-converting ad campaigns
        </p>
      </div>

      <div className="flex gap-4">
        <Button variant="primary">+ Start New Campaign</Button>
        <Button variant="secondary">View Demo</Button>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-red-600/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity className="w-6 h-6 text-primary" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Optimization Active
              </h3>
              <p className="text-sm text-gray-400">
                AI is monitoring and adjusting your campaigns
              </p>
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-gray-400">Meta ROAS</p>
              <p className="text-2xl font-bold text-white">
                4.2x <span className="text-green-500 text-sm">+12%</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Google CPC</p>
              <p className="text-2xl font-bold text-white">
                $0.45 <span className="text-green-500 text-sm">-8%</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={feature.id} 
              hover 
              className="cursor-pointer"
              onClick={() => setActiveSection(feature.id)}
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400">
                {feature.description}
              </p>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            Revenue vs Spend
          </h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm text-gray-400">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-400">Spend</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={statsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#111', 
                border: '1px solid #333',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#ec1313" 
              fill="#ec1313" 
              fillOpacity={0.2}
            />
            <Area 
              type="monotone" 
              dataKey="spend" 
              stroke="#666" 
              fill="#666" 
              fillOpacity={0.1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Spend</p>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-white">$12,450</p>
          <p className="text-sm text-green-500 mt-1">+8.2% from last week</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Blended ROAS</p>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-white">3.4x</p>
          <p className="text-sm text-green-500 mt-1">+12% from last week</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Conversions</p>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-white">450</p>
          <p className="text-sm text-green-500 mt-1">+15% from last week</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Avg CPA</p>
            <Zap className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-white">$27.60</p>
          <p className="text-sm text-red-500 mt-1">-5% from last week</p>
        </Card>
      </div>
    </div>
  );

  const renderFeatureContent = (featureId: string) => {
    const feature = features.find(f => f.id === featureId);
    
    if (featureId === 'consent-management') {
      return <ConsentManagement />;
    }

    if (featureId === 'google-ads') {
      return <GoogleAds />;
    }

    if (featureId === 'whatsapp') {
      return (
        <div className="h-[calc(100vh-240px)] w-full flex flex-col">
          <AdminPage />
        </div>
      );
    }

    if (!feature) {
      return null;
    }

    const Icon = feature.icon;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {feature.title}
            </h1>
            <p className="text-gray-400">
              {feature.description}
            </p>
          </div>
        </div>

        <Card>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#333] rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-400 mb-6">
              This feature is currently under development and will be available soon.
            </p>
            <Button variant="primary">Get Notified</Button>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-black">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        {/* DEBUG: Show active section */}
        <div className="px-6 py-2 bg-gray-900 border-b border-gray-800 text-xs text-gray-400">
          DEBUG: activeSection = <span className="font-bold text-primary">{activeSection}</span>
        </div>
        
        <main className="flex-1 overflow-y-auto p-6 bg-black">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeSection === 'dashboard' 
              ? renderDashboardContent() 
              : renderFeatureContent(activeSection)
            }
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
