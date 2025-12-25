import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// --- COMPONENT IMPORTS ---
// Ensure your folders are at src/modules/instagram/components
import PostCreator from './components/PostCreator';
import ScheduleView from './components/ScheduleView';
import DMInbox from './components/DMInbox';
import CommentAutomation from './components/CommentAutomation';
import KnowledgeBase from './components/KnowledgeBase';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import ChatBot from './components/ChatBot';
import InstagramFeed from './components/InstagramFeed';
import HashtagExplorer from './components/HashtagExplorer';

// --- TYPES & ICONS ---
import { ViewState, Post, InstagramConfig, KnowledgeDocument } from './types';
import { 
  AlertTriangle, LayoutDashboard, Send, MessageSquare, 
  Database, Settings as SettingsIcon, PenTool, Hash, 
  Image as ImageIcon, Bot 
} from 'lucide-react';

const CONFIG_VERSION = '5';

// --- NESTED SIDEBAR COMPONENT ---
// This sidebar sits INSIDE the Instagram module
const NestedSidebar = ({ currentPath, onNavigate }: { currentPath: string, onNavigate: (path: string) => void }) => {
  const menuItems = [
    { id: '', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Post', icon: PenTool },
    { id: 'schedule', label: 'Schedule', icon: Send },
    { id: 'feed', label: 'Feed', icon: ImageIcon },
    { id: 'automation', label: 'Automation', icon: MessageSquare },
    { id: 'dms', label: 'DM Inbox', icon: Send }, 
    { id: 'hashtags', label: 'Hashtags', icon: Hash },
    { id: 'knowledge', label: 'Knowledge', icon: Database },
    { id: 'chatbot', label: 'AI Chat', icon: Bot },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto hidden md:block">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            📸 Instagram
        </h2>
        <p className="text-xs text-slate-500 mt-1">Automation Suite</p>
      </div>
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          // Highlight "Dashboard" if path is empty
          const isActive = currentPath === item.id || (currentPath === 'dashboard' && item.id === '');
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

// --- MAIN MODULE LAYOUT ---
const InstagramLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. ROUTING LOGIC
  // Extracts "schedule" from "/instagram/schedule"
  const getPathFromUrl = () => {
    const pathParts = location.pathname.split('/');
    // Assumes route is /instagram/:viewId
    // pathParts[0] = ""
    // pathParts[1] = "instagram"
    // pathParts[2] = viewId (schedule, create, etc.)
    return pathParts[2] || ''; 
  };

  const [currentView, setCurrentView] = useState<ViewState>(() => (getPathFromUrl() as ViewState) || 'dashboard');

  // Sync State with URL
  useEffect(() => {
    const newView = getPathFromUrl() as ViewState;
    if (newView !== currentView) {
      setCurrentView(newView || 'dashboard');
    }
  }, [location.pathname]);

  // Handle Navigation (Updates URL)
  const handleNavigation = (viewId: string) => {
    const targetPath = viewId === '' ? '/instagram' : `/instagram/${viewId}`;
    navigate(targetPath);
  };

  // 2. STATE MANAGEMENT 
  const [posts, setPosts] = useState<Post[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);

  // 3. CONFIGURATION (Cleaned up for Dotler)
  const [instagramConfig, setInstagramConfig] = useState<InstagramConfig>(() => {
    const defaults = {
      accessToken: '',
      businessId: '',
      webhookUrl: '', // REMOVED HARDCODED URL
      verifyToken: '',
      cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
      cloudinaryUploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''
    };
    
    const saved = localStorage.getItem('instagramConfig');
    return saved ? JSON.parse(saved) : defaults;
  });

  const handleSaveConfig = (config: InstagramConfig) => {
    setInstagramConfig(config);
    localStorage.setItem('instagramConfig', JSON.stringify(config));
  };

  // 4. API KEY CHECK
  const hasGeminiKey = !!import.meta.env.VITE_GOOGLE_API_KEY;

  // 5. EVENT HANDLERS
  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    handleNavigation('schedule');
  };

  const handleUpdatePost = (updatedPost: Post) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleAddDocument = (doc: KnowledgeDocument) => {
    setDocuments(prev => [doc, ...prev]);
  };

  const handleUpdateDocument = (updatedDoc: KnowledgeDocument) => {
    setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // 6. VIEW RENDERER
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard posts={posts} instagramConfig={instagramConfig} onNavigateSettings={() => handleNavigation('settings')} />;
      case 'create':
        return <PostCreator onPostCreated={handlePostCreated} instagramConfig={instagramConfig} />;
      case 'feed':
        return <InstagramFeed instagramConfig={instagramConfig} onNavigateSettings={() => handleNavigation('settings')} />;
      case 'hashtags':
        return <HashtagExplorer instagramConfig={instagramConfig} />;
      case 'schedule':
        return <ScheduleView posts={posts} instagramConfig={instagramConfig} onUpdatePost={handleUpdatePost} onDeletePost={handleDeletePost} />;
      case 'automation':
        return <CommentAutomation instagramConfig={instagramConfig} />;
      case 'knowledge':
        return <KnowledgeBase documents={documents} onAddDocument={handleAddDocument} onUpdateDocument={handleUpdateDocument} onDeleteDocument={handleDeleteDocument} />;
      case 'dms':
        return <DMInbox documents={documents} instagramConfig={instagramConfig} />;
      case 'settings':
        return <Settings config={instagramConfig} onSave={handleSaveConfig} />;
      case 'chatbot':
        return <ChatBot />;
      default:
        return <Dashboard posts={posts} instagramConfig={instagramConfig} onNavigateSettings={() => handleNavigation('settings')} />;
    }
  };

  return (
    // MAIN LAYOUT CONTAINER
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-200">
      
      {/* 1. NESTED SIDEBAR */}
      <NestedSidebar currentPath={getPathFromUrl()} onNavigate={handleNavigation} />

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 p-6 overflow-y-auto">
        
        {/* API WARNING */}
        <div className="space-y-4 mb-4">
          {!hasGeminiKey && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 p-4 rounded-r shadow-sm">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                <p className="text-sm text-amber-700 dark:text-amber-200 font-bold uppercase tracking-tighter">
                  System Halted: Gemini API Key Required
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ACTIVE VIEW */}
        {renderView()}
      </main>
    </div>
  );
};

export default InstagramLayout;