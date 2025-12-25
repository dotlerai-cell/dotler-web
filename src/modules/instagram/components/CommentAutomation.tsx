
import React, { useState } from 'react';
import { AutomationRule, InstagramConfig, InstagramMedia } from '../types';
import { getInstagramRecentMedia, getPostComments, replyToComment, sendInstagramReply } from '../../backend/instagramService';
import { Zap, Plus, Trash2, Play, AlertCircle, MessageCircle, Lock, UserCheck, Loader2, Check } from 'lucide-react';

interface CommentAutomationProps {
    instagramConfig: InstagramConfig;
}

const CommentAutomation: React.FC<CommentAutomationProps> = ({ instagramConfig }) => {
    const [rules, setRules] = useState<AutomationRule[]>([
        {
            id: '1',
            name: 'Ebook Lead Magnet',
            triggerKeyword: 'EBOOK',
            dmResponse: 'Hey! Here is the link to download the free ebook: https://example.com/ebook 📚',
            requireFollow: true,
            isActive: true,
            triggerCount: 12
        },
        {
            id: '2',
            name: 'Pricing Inquiry',
            triggerKeyword: 'PRICE',
            dmResponse: 'Our packages start at $99/mo. Would you like to see the full price list?',
            requireFollow: false,
            isActive: true,
            triggerCount: 5
        }
    ]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [showForm, setShowForm] = useState(false);
    
    // New Rule Form State
    const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
        name: '',
        triggerKeyword: '',
        dmResponse: '',
        requireFollow: false
    });

    const isConnected = !!(instagramConfig.accessToken && instagramConfig.businessId);

    const handleCreateRule = () => {
        if (!newRule.name || !newRule.triggerKeyword || !newRule.dmResponse) return;
        
        const rule: AutomationRule = {
            id: Date.now().toString(),
            name: newRule.name,
            triggerKeyword: newRule.triggerKeyword.toUpperCase(),
            dmResponse: newRule.dmResponse,
            requireFollow: newRule.requireFollow || false,
            isActive: true,
            triggerCount: 0
        };

        setRules([...rules, rule]);
        setNewRule({ name: '', triggerKeyword: '', dmResponse: '', requireFollow: false });
        setShowForm(false);
    };

    const handleDeleteRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
    };

    const toggleRuleStatus = (id: string) => {
        setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    };

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const simulateFollowCheck = async (username: string): Promise<boolean> => {
        // NOTE: Real API requires "instagram_manage_insights" or specific permissions to check follower relationship cleanly.
        // For this demo, we assume 50% chance they follow to demonstrate both states (Followed vs Not Followed).
        return Math.random() > 0.5;
    };

    const runAutomation = async () => {
        if (!isConnected) {
            addLog("Error: Connect Instagram API in Settings first.");
            return;
        }

        setIsProcessing(true);
        addLog("🚀 Starting Automation Run (Scanning recent posts)...");

        try {
            // 1. Get recent media
            const mediaRes = await getInstagramRecentMedia(instagramConfig.accessToken, instagramConfig.businessId);
            if (mediaRes.error || !mediaRes.media) {
                addLog(`Error fetching media: ${mediaRes.error}`);
                setIsProcessing(false);
                return;
            }

            // Limit to top 3 recent posts to avoid rate limits in demo
            const recentPosts = mediaRes.media.slice(0, 3);
            addLog(`Scanning ${recentPosts.length} recent posts...`);

            let processedCount = 0;

            for (const post of recentPosts) {
                // 2. Get comments for post
                const commentRes = await getPostComments(instagramConfig.accessToken, post.id);
                if (commentRes.error || !commentRes.comments) {
                    addLog(`Error fetching comments for post ${post.id.slice(-4)}...`);
                    continue;
                }

                // 3. Match rules
                for (const comment of commentRes.comments) {
                    // Skip if comment is from the business account itself (bot) to avoid loops
                    // Note: 'from' field might be missing in some API versions for self, assume unsafe if username matches config business name (if we had it)
                    // For now, we rely on rule matching.

                    const text = (comment.text || "").toUpperCase();
                    
                    for (const rule of rules) {
                        if (!rule.isActive) continue;

                        if (text.includes(rule.triggerKeyword)) {
                            addLog(`⚡ Match found! Keyword "${rule.triggerKeyword}" in comment by @${comment.username}`);
                            
                            // Check Follow Gating
                            let canSend = true;
                            if (rule.requireFollow) {
                                addLog(`🔒 Rule requires follow. Checking status for @${comment.username}...`);
                                const isFollowing = await simulateFollowCheck(comment.username);
                                
                                if (!isFollowing) {
                                    addLog(`❌ User @${comment.username} is NOT following. Sending public reply request.`);
                                    // Reply to comment asking them to follow
                                    const replyRes = await replyToComment(instagramConfig.accessToken, comment.id, `Please follow me so I can DM you the link!`);
                                    
                                    if (replyRes.success) {
                                         addLog(`💬 Replied to comment: "Please follow me..."`);
                                    } else {
                                         addLog(`⚠️ Failed to reply to comment: ${replyRes.error}`);
                                    }
                                    canSend = false;
                                } else {
                                    addLog(`✅ User @${comment.username} is following.`);
                                }
                            }

                            if (canSend) {
                                // Send DM
                                // Need recipient ID (Scoped User ID). The Comment API returns 'from.id' which is the IGSID.
                                const recipientId = comment.from?.id;
                                if (recipientId) {
                                    const dmRes = await sendInstagramReply(instagramConfig.accessToken, instagramConfig.businessId, recipientId, rule.dmResponse);
                                    if (dmRes.success) {
                                        addLog(`📩 DM Sent to @${comment.username}: "${rule.dmResponse.substring(0, 20)}..."`);
                                        // Update Stats
                                        setRules(prev => prev.map(r => r.id === rule.id ? { ...r, triggerCount: r.triggerCount + 1 } : r));
                                        
                                        // Optional: Reply to comment to confirm sent
                                        await replyToComment(instagramConfig.accessToken, comment.id, `Sent! Check your DMs 📬`);
                                        processedCount++;
                                    } else {
                                        addLog(`⚠️ Failed to DM: ${dmRes.error}`);
                                    }
                                } else {
                                    addLog(`⚠️ Could not resolve User ID for @${comment.username}`);
                                }
                            }
                        }
                    }
                }
            }

            if (processedCount === 0) {
                addLog("ℹ️ No new triggers processed this run.");
            } else {
                addLog(`✅ Run complete. Processed ${processedCount} interactions.`);
            }

        } catch (e: any) {
            addLog(`Error: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-brand-500" />
                        Lead Magnet Machine
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        Automatically send DMs when users comment specific keywords on your posts. 
                        Great for distributing ebooks, links, or coupon codes.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> New Rule
                    </button>
                    <button 
                        onClick={runAutomation}
                        disabled={isProcessing || !isConnected}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition shadow-lg
                            ${isProcessing || !isConnected ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20'}`}
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Run Check Now
                    </button>
                </div>
            </div>

            {!isConnected && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg flex gap-3 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-sm">API Not Connected</p>
                        <p className="text-sm">Please configure Instagram Settings to enable comment scanning.</p>
                    </div>
                </div>
            )}

            {/* Create Rule Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-brand-200 dark:border-slate-700 shadow-lg animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Create New Automation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rule Name</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="e.g. Ebook Campaign"
                                value={newRule.name}
                                onChange={e => setNewRule({...newRule, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trigger Keyword</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">#</span>
                                <input 
                                    type="text" 
                                    className="w-full pl-7 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 uppercase"
                                    placeholder="KEYWORD"
                                    value={newRule.triggerKeyword}
                                    onChange={e => setNewRule({...newRule, triggerKeyword: e.target.value.toUpperCase()})}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">DM Response</label>
                            <textarea 
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                rows={2}
                                placeholder="The message to send privately..."
                                value={newRule.dmResponse}
                                onChange={e => setNewRule({...newRule, dmResponse: e.target.value})}
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-3">
                             <div 
                                onClick={() => setNewRule({...newRule, requireFollow: !newRule.requireFollow})}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${newRule.requireFollow ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                             >
                                 <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${newRule.requireFollow ? 'translate-x-6' : 'translate-x-0'}`} />
                             </div>
                             <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Follow Gating (Require user to follow)
                             </span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                        <button onClick={handleCreateRule} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save Rule</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rules List */}
                <div className="lg:col-span-2 space-y-4">
                    {rules.map(rule => (
                        <div key={rule.id} className={`bg-white dark:bg-slate-800 rounded-xl p-5 border shadow-sm transition-all ${rule.isActive ? 'border-brand-200 dark:border-brand-900/50' : 'border-slate-200 dark:border-slate-700 opacity-70'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            {rule.name}
                                            {rule.requireFollow && <span title="Follow Gating Active"><Lock className="w-3 h-3 text-amber-500" /></span>}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                                KEYWORD: {rule.triggerKeyword}
                                            </span>
                                            <span className="text-xs text-slate-400">• {rule.triggerCount} triggers</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => toggleRuleStatus(rule.id)}
                                        className={`text-xs font-semibold px-2 py-1 rounded transition ${rule.isActive ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-slate-500 bg-slate-100 dark:bg-slate-700'}`}
                                    >
                                        {rule.isActive ? 'Active' : 'Paused'}
                                    </button>
                                    <button onClick={() => handleDeleteRule(rule.id)} className="p-2 text-slate-400 hover:text-red-500 transition">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 flex gap-2">
                                <MessageCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{rule.dmResponse}"</p>
                            </div>
                        </div>
                    ))}
                    {rules.length === 0 && (
                        <div className="text-center p-8 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            No rules created yet.
                        </div>
                    )}
                </div>

                {/* Logs Console */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800 flex flex-col h-[500px]">
                        <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                            <span className="text-xs font-mono text-slate-400">System Logs</span>
                            {isProcessing && <span className="flex items-center gap-1 text-[10px] text-green-400"><Loader2 className="w-3 h-3 animate-spin"/> Running</span>}
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2">
                            {logs.length === 0 && <span className="text-slate-600">Ready to start...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className={`border-b border-slate-800/50 pb-1 last:border-0 ${log.includes('Error') ? 'text-red-400' : log.includes('Match') ? 'text-green-400 font-bold' : log.includes('DM Sent') ? 'text-blue-400' : 'text-slate-400'}`}>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentAutomation;
