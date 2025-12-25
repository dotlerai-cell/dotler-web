
import React, { useState, useEffect, useRef } from 'react';
import { DMThread, KnowledgeDocument, InstagramConfig } from '../types';
import { generateDMBotResponse, retrieveRelevantDocuments } from '../../backend/geminiService';
import { getInstagramConversations, getInstagramMessages, sendInstagramReply } from '../../backend/instagramService';
// Fix: Added missing 'Info' icon to lucide-react imports.
import { Send, Bot, User, Database, Wifi, WifiOff, Loader2, RefreshCw, AlertCircle, MessageSquare, ShieldAlert, Clock, HelpCircle, X, ExternalLink, Globe, Info } from 'lucide-react';

interface DMInboxProps {
    documents: KnowledgeDocument[];
    instagramConfig?: InstagramConfig;
}

const DMInbox: React.FC<DMInboxProps> = ({ documents, instagramConfig }) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<DMThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time Simulation
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [showWebhookInfo, setShowWebhookInfo] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isConnected = !!(instagramConfig?.accessToken && instagramConfig?.businessId);
  const webhookUrl = instagramConfig?.webhookUrl || "https://filme-char-phpbb-driver.trycloudflare.com/webhook";

  // Mock Data
  const mockThreads: DMThread[] = [
    {
      id: 'mock_1',
      username: 'sarah_styles',
      avatar: 'https://ui-avatars.com/api/?name=sarah_styles&background=random',
      lastMessage: 'Do you ship to Canada?',
      history: [
        { sender: 'user', text: 'Hi! I love your new collection.', timestamp: Date.now() - 100000 },
        { sender: 'bot', text: 'Thanks Sarah! We are glad you like it ❤️', timestamp: Date.now() - 90000 },
        { sender: 'user', text: 'Do you ship to Canada?', timestamp: Date.now() - 5000 },
      ]
    }
  ];

  // POLLING ENGINE (Mimics Webhook Activity)
  useEffect(() => {
      fetchThreads(true); // Initial fetch silent
      
      const interval = setInterval(() => {
          if (isAutoRefresh && isConnected) {
              fetchThreads(true); // Silent background fetch
              if (selectedThreadId) fetchHistory(selectedThreadId, true);
          }
      }, 15000); // 15s refresh for "real-time" feel

      return () => clearInterval(interval);
  }, [isConnected, isAutoRefresh, selectedThreadId]);

  const fetchThreads = async (silent = false) => {
      if (!isConnected || !instagramConfig) {
          if (!silent) {
              setThreads(mockThreads);
              setSelectedThreadId('mock_1');
          }
          return;
      }

      if (!silent) setIsLoading(true);
      setError(null);
      
      const result = await getInstagramConversations(instagramConfig.accessToken, instagramConfig.businessId);
      
      if (result.error) {
          setError(result.error);
      } else if (result.threads) {
          const mappedThreads: DMThread[] = result.threads.map((t: any) => {
              const otherParticipant = t.participants?.data?.find((p: any) => p.id !== instagramConfig.businessId) || t.participants?.data?.[0];
              const username = otherParticipant?.username || otherParticipant?.name || 'Customer';
              const lastMsgText = t.messages?.data?.[0]?.message || '(Media Attachment)';
              
              return {
                  id: t.id,
                  recipientId: otherParticipant?.id,
                  username: username,
                  avatar: `https://ui-avatars.com/api/?name=${username}&background=random`,
                  lastMessage: lastMsgText,
                  history: [] 
              };
          });
          setThreads(mappedThreads);
          setLastRefreshed(new Date());
          if (mappedThreads.length > 0 && !selectedThreadId) {
              setSelectedThreadId(mappedThreads[0].id);
          }
      }
      if (!silent) setIsLoading(false);
  };

  const fetchHistory = async (threadId: string, silent = false) => {
      if (!isConnected || !instagramConfig || threadId.startsWith('mock_')) return;

      if (!silent) setIsMessageLoading(true);
      const result = await getInstagramMessages(instagramConfig.accessToken, threadId);
      
      if (result.messages) {
             const apiMessages = result.messages.slice().reverse().map((m: any) => ({
                 sender: (m.from?.id === instagramConfig.businessId ? 'bot' : 'user') as 'user' | 'bot',
                 text: m.message || '[Media Content]',
                 timestamp: new Date(m.created_time).getTime()
             }));

             setThreads(prev => prev.map(t => t.id === threadId ? { ...t, history: apiMessages } : t));
      }
      if (!silent) setIsMessageLoading(false);
  };

  useEffect(() => {
      if (selectedThreadId) fetchHistory(selectedThreadId);
  }, [selectedThreadId]);

  const activeThread = threads.find(t => t.id === selectedThreadId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.history, isMessageLoading]);

  const handleTriggerAutoReply = async () => {
     if (!activeThread) return;
     setIsTyping(true);
     
     const history = activeThread.history;
     const lastMsg = history.length > 0 ? history[history.length - 1] : { text: activeThread.lastMessage, sender: 'user' };

     const activeDocs = documents.filter(d => d.status === 'indexed');
     const contextDocs = activeDocs.length > 0 ? retrieveRelevantDocuments(lastMsg.text, activeDocs, 3) : ["No specific knowledge found."];

     if (lastMsg.sender === 'user' || history.length === 0) {
         const previousMessages = history.slice(0, -1).map(m => ({
             role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
             text: m.text
         }));

         const responseText = await generateDMBotResponse(lastMsg.text, contextDocs, previousMessages);
         
         if (isConnected && instagramConfig && activeThread.recipientId && !activeThread.id.startsWith('mock_')) {
             const result = await sendInstagramReply(instagramConfig.accessToken, instagramConfig.businessId, activeThread.recipientId, responseText);
             if (!result.success) {
                 alert(`API Send Error: ${result.error}`);
                 setIsTyping(false);
                 return;
             }
         }

         const newMsg = { sender: 'bot' as const, text: responseText, timestamp: Date.now() };
         setThreads(prev => prev.map(t => t.id === activeThread.id ? { ...t, history: [...t.history, newMsg], lastMessage: responseText } : t));
     }
     setIsTyping(false);
  };

  const isAccessDeniedError = error && (error.includes('allow access to messages') || error.includes('manage_messages'));

  return (
    <div className="h-[calc(100vh-6rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex transition-colors animate-in fade-in duration-500">
      
      {/* Thread List */}
      <div className="w-1/3 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 space-y-4">
             <div className="flex justify-between items-center">
                 <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-lg">
                     <MessageSquare className="w-5 h-5 text-brand-600" /> Conversations
                 </div>
                 <div className="flex items-center gap-2">
                     <button 
                        onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                        className={`p-2 rounded-xl transition-all ${isAutoRefresh ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}
                        title={isAutoRefresh ? "Live Polling Active" : "Auto-Refresh Paused"}
                     >
                         <Clock className={`w-4 h-4 ${isAutoRefresh ? 'animate-pulse' : ''}`} />
                     </button>
                     <button onClick={() => fetchThreads()} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition">
                         <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                     </button>
                 </div>
             </div>
             
             <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                 <div className="flex items-center gap-1.5">
                     <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                     {isConnected ? 'Webhook Cloud Sync' : 'Static Demo Mode'}
                 </div>
                 <span>Last: {lastRefreshed.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>
             </div>
        </div>
        
        {isAccessDeniedError ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-5 border-b border-amber-200 dark:border-amber-800 animate-in slide-in-from-top-2">
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-100 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Permission Denied
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-200 mt-2 mb-3 leading-relaxed">
                    Meta requires <strong>"Allow Access to Messages"</strong> enabled in Instagram Settings  Privacy  Messages.
                </p>
                <button onClick={() => setShowWebhookInfo(true)} className="px-3 py-1.5 bg-amber-200 dark:bg-amber-800/50 rounded-lg text-[10px] font-black uppercase text-amber-800 dark:text-amber-200 hover:bg-amber-300 transition-colors">
                    Setup Guide
                </button>
            </div>
        ) : error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 text-xs text-red-600 dark:text-red-400 border-b border-red-100 dark:border-red-900/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="font-bold">Sync Error</p>
                    <p className="opacity-80">{error}</p>
                </div>
            </div>
        )}

        <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {threads.length === 0 && !isLoading && (
                <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
                        <MessageSquare className="w-10 h-10 opacity-20" />
                    </div>
                    <p className="font-bold">Inbox is empty</p>
                    <p className="text-xs mt-1">No messages detected via API.</p>
                </div>
            )}
            {threads.map(thread => (
                <div 
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`p-4 flex items-center gap-3 cursor-pointer rounded-2xl transition-all
                        ${selectedThreadId === thread.id 
                            ? 'bg-white dark:bg-slate-700 shadow-md border border-slate-100 dark:border-slate-600' 
                            : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-transparent'}`}
                >
                    <div className="relative">
                        <img src={thread.avatar} alt={thread.username} className="w-12 h-12 rounded-full bg-slate-200 object-cover shadow-sm" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center mb-0.5">
                            <div className="font-bold text-slate-800 dark:text-white text-sm truncate pr-2">@{thread.username}</div>
                            <span className="text-[10px] text-slate-400 font-black uppercase">Direct</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">{thread.lastMessage}</div>
                    </div>
                </div>
            ))}
        </div>
        
        <button 
            onClick={() => setShowWebhookInfo(true)}
            className="p-4 bg-white dark:bg-slate-800 text-[10px] font-black uppercase text-brand-600 dark:text-brand-400 flex items-center justify-center gap-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors border-t border-slate-200 dark:border-slate-700"
        >
            <Globe className="w-3 h-3" /> Webhook Integration Details
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900 relative">
        {activeThread ? (
            <>
                <div className="p-5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm z-10 transition-colors">
                    <div className="flex items-center gap-4">
                        <img src={activeThread.avatar} className="w-10 h-10 rounded-full object-cover" alt="User" />
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-xl">@{activeThread.username}</span>
                                <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-black text-slate-400 uppercase tracking-tighter">IGSID: {activeThread.recipientId?.substring(0,6)}...</div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-green-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Meta Direct Connection Active
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex flex-col items-end">
                             <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                 <Database className="w-3 h-3 text-brand-500" /> RAG Context
                             </div>
                             <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{documents.filter(d => d.status === 'indexed').length} Source Files</span>
                        </div>
                        <button 
                            onClick={handleTriggerAutoReply}
                            disabled={isTyping || isMessageLoading}
                            className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition font-bold shadow-lg text-sm border-2
                                ${isTyping 
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                                    : 'bg-white hover:bg-brand-50 text-brand-600 border-brand-100 hover:border-brand-200 dark:bg-slate-800 dark:text-brand-400 dark:border-slate-600'}`}
                        >
                            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                            {isTyping ? 'Drafting...' : 'AI Smart Reply'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50 dark:bg-slate-950/50">
                    {isMessageLoading ? (
                        <div className="flex justify-center items-center h-full flex-col gap-3">
                            <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                            <span className="text-sm font-black uppercase tracking-widest text-slate-400">Syncing Direct Messages...</span>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-6">
                            {activeThread.history.length === 0 && (
                                <div className="text-center py-20 text-slate-400">
                                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                    <p className="font-bold">Chat history is blank</p>
                                    <p className="text-xs mt-1 italic">Waiting for incoming signals...</p>
                                </div>
                            )}
                            {activeThread.history.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`flex items-end gap-3 max-w-[90%] sm:max-w-[75%] ${msg.sender === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
                                            ${msg.sender === 'user' ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600' : 'bg-brand-600 text-white shadow-brand-500/20'}`}>
                                            {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                        </div>
                                        <div className={`px-5 py-3.5 rounded-[2rem] text-sm shadow-sm relative group transition-all
                                            ${msg.sender === 'user' 
                                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-bl-none border border-slate-100 dark:border-slate-700' 
                                                : 'bg-brand-600 text-white rounded-br-none'}`}>
                                            {msg.text}
                                            <div className="absolute bottom-[-1.2rem] opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black uppercase text-slate-400 whitespace-nowrap">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {isTyping && (
                        <div className="flex justify-end animate-in fade-in">
                            <div className="flex items-center gap-3 text-sm text-slate-500 bg-white dark:bg-slate-800 px-5 py-3 rounded-full shadow-lg border border-slate-100 dark:border-slate-700">
                                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                                <span className="font-bold tracking-tight">Gemini is drafting response...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <div className="max-w-4xl mx-auto relative">
                        <input 
                            type="text" 
                            disabled
                            placeholder="Human-in-the-Loop Mode: AI drafts, you approve."
                            className="w-full pl-6 pr-16 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] text-slate-400 text-sm italic focus:outline-none"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                             <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-[9px] font-black uppercase text-slate-500">Read Only</div>
                             <Send className="w-6 h-6 text-slate-200" />
                        </div>
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-700 bg-slate-50 dark:bg-slate-900">
                <div className="p-8 bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4 animate-in zoom-in-95">
                    <MessageSquare className="w-20 h-20 opacity-10" />
                    <p className="text-xl font-black italic tracking-tight">Select conversation to begin automation</p>
                </div>
            </div>
        )}
      </div>

      {/* Webhook Guide Modal */}
      {showWebhookInfo && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-brand-50/50 dark:bg-brand-900/10">
                      <div>
                        <h3 className="text-2xl font-black text-brand-900 dark:text-brand-100 flex items-center gap-2 tracking-tight uppercase">
                            <Wifi className="w-7 h-7" />
                            Direct-Connect Guide
                        </h3>
                        <p className="text-xs text-brand-600 dark:text-brand-400 font-bold uppercase tracking-widest mt-1">Real-time Messaging Pipeline</p>
                      </div>
                      <button onClick={() => setShowWebhookInfo(false)} className="p-4 hover:bg-white/50 dark:hover:bg-slate-800 rounded-3xl transition-colors">
                          <X className="w-8 h-8 text-brand-900 dark:text-brand-100" />
                      </button>
                  </div>
                  <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                      <div className="space-y-4">
                          <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-brand-500"></div> Webhook Configuration
                          </h4>
                          <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                            To enable instant message notifications and automated replies, configure your Meta App with this specific tunnel endpoint:
                          </p>
                          <div className="group relative">
                            <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 font-mono text-xs break-all text-brand-400 shadow-inner">
                                {webhookUrl}
                            </div>
                            <button 
                                onClick={() => { navigator.clipboard.writeText(webhookUrl); alert("Copied!"); }}
                                className="absolute right-4 top-4 px-3 py-1.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-700 transition"
                            >
                                Copy URL
                            </button>
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-brand-500"></div> Setup Checklist
                          </h4>
                          <div className="space-y-4">
                              {[
                                  "Log in to Meta Developer Portal > Your App.",
                                  "Navigate to Webhooks > Instagram Section.",
                                  "Click 'Subscribe to this object' and select 'messages'.",
                                  "Paste the URL above as your Callback URL.",
                                  "Ensure your Business Account ID is saved in Settings."
                              ].map((step, i) => (
                                  <div key={i} className="flex gap-5 items-start">
                                      <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 flex items-center justify-center font-black text-sm flex-shrink-0">{i+1}</div>
                                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{step}</p>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex gap-4">
                          <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <div className="space-y-1">
                            <h5 className="font-bold text-blue-900 dark:text-blue-200 text-sm uppercase tracking-wide">Developer Sync Note</h5>
                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                This dashboard simulates webhook behavior via high-frequency polling when the tunnel is inactive. 
                                Linking a live webhook ensures sub-second latency for bot responses.
                            </p>
                          </div>
                      </div>

                      <a 
                        href="https://developers.facebook.com/docs/messenger-platform/instagram/features/webhook"
                        target="_blank" rel="noreferrer"
                        className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-3xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-900/40 text-lg"
                      >
                          Meta Developer Guide <ExternalLink className="w-5 h-5" />
                      </a>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DMInbox;
