
import React, { useState } from 'react';
import { InstagramConfig, InstagramMedia } from '../types';
import { getInstagramHashtagId, getInstagramHashtagMedia } from '../../backend/instagramService';
import { Search, Hash, Loader2, AlertCircle, ExternalLink, TrendingUp, Clock, Grid, Video, Layers, X, ChevronRight, Info, SearchX, RefreshCw, ShieldAlert, AlertTriangle } from 'lucide-react';

interface HashtagExplorerProps {
    instagramConfig: InstagramConfig;
}

interface FetchState {
    loading: boolean;
    error: string | null;
    data: InstagramMedia[];
}

const HashtagExplorer: React.FC<HashtagExplorerProps> = ({ instagramConfig }) => {
    const [query, setQuery] = useState('');
    const [isIdLoading, setIsIdLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'top' | 'recent'>('top');
    const [selectedPost, setSelectedPost] = useState<InstagramMedia | null>(null);

    const [hashtagId, setHashtagId] = useState<string | null>(null);
    const [currentHashtag, setCurrentHashtag] = useState<string>('');

    // Independent states for each media source to handle partial failures
    const [topState, setTopState] = useState<FetchState>({ loading: false, error: null, data: [] });
    const [recentState, setRecentState] = useState<FetchState>({ loading: false, error: null, data: [] });

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const cleanQuery = query.replace('#', '').trim().toLowerCase();
        if (!cleanQuery) return;

        if (!instagramConfig.accessToken || !instagramConfig.businessId) {
            setGlobalError("Please configure your Instagram API settings first.");
            return;
        }

        setIsIdLoading(true);
        setGlobalError(null);
        setSelectedPost(null);
        setHashtagId(null);

        // Reset states
        setTopState({ loading: true, error: null, data: [] });
        setRecentState({ loading: true, error: null, data: [] });

        try {
            // 1. Resolve Hashtag ID
            const idRes = await getInstagramHashtagId(instagramConfig.accessToken, instagramConfig.businessId, cleanQuery);

            if (idRes.error) {
                setGlobalError(idRes.error);
                setIsIdLoading(false);
                setTopState(prev => ({ ...prev, loading: false }));
                setRecentState(prev => ({ ...prev, loading: false }));
                return;
            }

            if (!idRes.id) {
                setGlobalError(`The hashtag "${cleanQuery}" could not be resolved. It may be restricted, shadowbanned, or have too few posts.`);
                setIsIdLoading(false);
                setTopState(prev => ({ ...prev, loading: false }));
                setRecentState(prev => ({ ...prev, loading: false }));
                return;
            }

            const hId = idRes.id;
            setHashtagId(hId);
            setCurrentHashtag(cleanQuery);
            setIsIdLoading(false);

            // 2. Fetch Media Independently to prevent a single failure from blocking the entire UI
            fetchMediaSection(hId, 'top_media', setTopState);
            fetchMediaSection(hId, 'recent_media', setRecentState);

        } catch (err: any) {
            setGlobalError(err.message || "An unexpected network error occurred.");
            setIsIdLoading(false);
            setTopState(prev => ({ ...prev, loading: false }));
            setRecentState(prev => ({ ...prev, loading: false }));
        }
    };

    const fetchMediaSection = async (hId: string, type: 'top_media' | 'recent_media', setter: React.Dispatch<React.SetStateAction<FetchState>>) => {
        setter(prev => ({ ...prev, loading: true, error: null }));
        try {
            const res = await getInstagramHashtagMedia(instagramConfig.accessToken, instagramConfig.businessId, hId, type);
            if (res.error) {
                setter({ loading: false, error: res.error, data: [] });
            } else {
                setter({ loading: false, error: null, data: res.media || [] });
            }
        } catch (e: any) {
            setter({ loading: false, error: "Network retrieval failed for this section.", data: [] });
        }
    };

    const currentState = activeTab === 'top' ? topState : recentState;
    const hasPartialError = !!(topState.error || recentState.error);
    const bothFailed = !!(topState.error && recentState.error);

    const getMediaIcon = (type: string) => {
        switch (type) {
            case 'VIDEO': return <Video className="w-4 h-4" />;
            case 'CAROUSEL_ALBUM': return <Layers className="w-4 h-4" />;
            default: return null;
        }
    };

    const renderEmptyOrError = () => {
        const err = currentState.error;
        const isRateLimited = err?.includes('Rate Limit');
        const isRestricted = err?.includes('restricted') || err?.includes('Access denied');

        if (err) {
            return (
                <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-[3.5rem] border-4 border-dashed border-red-50 dark:border-red-900/10 animate-in fade-in">
                    <div className={`p-8 rounded-[2.5rem] mb-6 shadow-inner ${isRateLimited ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'}`}>
                        {isRateLimited ? <Clock className="w-16 h-16" /> : isRestricted ? <ShieldAlert className="w-16 h-16" /> : <AlertTriangle className="w-16 h-16" />}
                    </div>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                        {isRateLimited ? "Slow Down" : isRestricted ? "Section Restricted" : "Retrieval Failed"}
                    </h4>
                    <p className="text-slate-400 max-w-md text-center text-lg px-6 mb-8 leading-relaxed">
                        {err}
                    </p>
                    <button
                        onClick={() => fetchMediaSection(hashtagId!, activeTab === 'top' ? 'top_media' : 'recent_media', activeTab === 'top' ? setTopState : setRecentState)}
                        className="px-8 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${currentState.loading ? 'animate-spin' : ''}`} /> Retry Section
                    </button>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-800 rounded-[3.5rem] border-4 border-dashed border-slate-100 dark:border-slate-700 animate-in fade-in">
                <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] mb-6 shadow-inner">
                    <SearchX className="w-20 h-20 text-slate-300 dark:text-slate-600" />
                </div>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">No content found</h4>
                <p className="text-slate-400 max-w-md text-center text-lg px-6">
                    This hashtag section currently has no public items or has been hidden by Instagram's moderation filters.
                </p>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-brand-600 rounded-xl shadow-lg shadow-brand-500/20">
                            <Hash className="w-7 h-7 text-white" />
                        </div>
                        Hashtag Explorer
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        Analyze niche trends and discover high-engagement public content via Instagram Graph.
                    </p>
                </div>
            </div>

            {/* Search Console */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 transition-all">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                            <Hash className="w-6 h-6 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Explore hashtag (e.g. tech, aesthetic, fitness)"
                            className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:outline-none transition-all text-xl font-medium text-slate-800 dark:text-white placeholder:text-slate-400"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <button
                        disabled={isIdLoading || !query.trim()}
                        className="px-10 py-5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg rounded-3xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-500/40 disabled:opacity-50 active:scale-95"
                    >
                        {isIdLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                        {isIdLoading ? 'Resolving...' : 'Explore'}
                    </button>
                </form>
            </div>

            {globalError && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 p-6 rounded-[2.5rem] shadow-sm flex items-start gap-4 animate-in slide-in-from-top-4">
                    <div className="p-4 bg-red-100 dark:bg-red-900/40 rounded-2xl flex-shrink-0">
                        <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-red-800 dark:text-red-200 text-xl">Search Blocked</h4>
                        <p className="text-red-700 dark:text-red-300 mt-1 leading-relaxed">{globalError}</p>
                    </div>
                </div>
            )}

            {hashtagId && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-700 pb-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">#{currentHashtag}</span>
                                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                    ID: {hashtagId}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="text-sm text-slate-400 flex items-center gap-1 uppercase tracking-widest font-black">
                                    Public Domain Content Analysis
                                </p>
                                {hasPartialError && !bothFailed && (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-lg border border-amber-200 animate-pulse">
                                        <AlertTriangle className="w-3 h-3" /> Partial Data Retrieval
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Tab Toggle */}
                        <div className="flex gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200 dark:border-slate-700 shadow-inner">
                            <button
                                onClick={() => setActiveTab('top')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'top' ? 'bg-white dark:bg-slate-700 shadow-md text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <TrendingUp className={`w-4 h-4 ${topState.error ? 'text-red-400' : ''}`} />
                                Top Posts
                                {topState.loading && <Loader2 className="w-3 h-3 animate-spin" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('recent')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'recent' ? 'bg-white dark:bg-slate-700 shadow-md text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <Clock className={`w-4 h-4 ${recentState.error ? 'text-red-400' : ''}`} />
                                Recently Added
                                {recentState.loading && <Loader2 className="w-3 h-3 animate-spin" />}
                            </button>
                        </div>
                    </div>

                    {/* Section Content Logic */}
                    {currentState.loading ? (
                        <div className="py-48 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Fetching items from the Cloud...</p>
                        </div>
                    ) : currentState.data.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                            {currentState.data.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedPost(item)}
                                    className="group relative bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
                                >
                                    <div className="aspect-square relative bg-slate-100 dark:bg-slate-900 overflow-hidden">
                                        {item.media_type === 'VIDEO' || item.media_type === 'REELS' ? (
                                            <video
                                                src={item.media_url}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                controls
                                                muted
                                                playsInline
                                                preload="metadata"
                                                poster={item.thumbnail_url}
                                            />
                                        ) : (
                                            <img
                                                src={item.media_url}
                                                alt={item.id}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                        )}

                                        {/* Type Badge */}
                                        {item.media_type !== 'IMAGE' && (
                                            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white p-2 rounded-xl z-10 border border-white/10 shadow-lg">
                                                {getMediaIcon(item.media_type)}
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-6">
                                            <div className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                                Analyze Post <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed h-10 font-medium">
                                            {item.caption || <span className="italic text-slate-400">Public data node (No caption text)</span>}
                                        </p>
                                        <div className="mt-auto flex justify-between items-center border-t border-slate-50 dark:border-slate-700 pt-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</span>
                                            <div className="text-brand-600 dark:text-brand-400 p-2 bg-brand-50 dark:bg-brand-900/30 rounded-xl group-hover:bg-brand-600 group-hover:text-white transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        renderEmptyOrError()
                    )}
                </div>
            )}

            {/* Post Inspection Modal */}
            {selectedPost && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[850px] border border-white/20">
                        {/* Media Display */}
                        <div className="flex-1 bg-black flex items-center justify-center relative group">
                            <img
                                src={selectedPost.media_url}
                                className="max-w-full max-h-full object-contain"
                                alt="Inspector"
                            />
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="absolute top-6 left-6 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white transition-all md:hidden"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Detail Column */}
                        <div className="w-full md:w-[450px] flex flex-col bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800">
                            <div className="p-8 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg shadow-brand-500/30">
                                        IG
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 dark:text-white text-lg tracking-tight">Public Post Detail</h4>
                                        <p className="text-[10px] text-brand-600 dark:text-brand-400 uppercase tracking-widest font-black">#{currentHashtag}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-10">
                                <div className="space-y-4">
                                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-1 bg-brand-500 rounded-full"></div>
                                        Captured Text
                                    </h5>
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base">
                                            {selectedPost.caption || "Metadata-only post. No textual caption content available."}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-1 bg-brand-500 rounded-full"></div>
                                        Public Meta
                                    </h5>
                                    <div className="p-6 bg-brand-50 dark:bg-brand-900/20 rounded-3xl border border-brand-100 dark:border-brand-900/30 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">Post Timestamp</p>
                                            <p className="font-black text-slate-800 dark:text-white text-lg">{new Date(selectedPost.timestamp).toLocaleString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                        <Clock className="w-10 h-10 text-brand-500/20" />
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 leading-relaxed font-medium">
                                    <div className="flex items-center gap-2 mb-2 font-black uppercase tracking-widest text-[10px] text-slate-400">
                                        <Info className="w-3 h-3" /> Privacy Transparency
                                    </div>
                                    Hashtag content is anonymized. Engagement metrics (likes/comments) are restricted on public hashtag nodes by the Instagram API.
                                </div>
                            </div>

                            <div className="p-10 border-t border-slate-100 dark:border-slate-800">
                                <a
                                    href={selectedPost.permalink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg rounded-[2rem] transition-all flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 shadow-2xl shadow-slate-900/40"
                                >
                                    View on Instagram <ExternalLink className="w-6 h-6" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!hashtagId && !isIdLoading && !globalError && (
                <div className="flex flex-col items-center justify-center py-32 text-slate-200 dark:text-slate-800">
                    <div className="relative group">
                        <Hash className="w-56 h-56 mb-8 opacity-40 animate-pulse group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute -bottom-6 -right-6 p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border-4 border-slate-50 dark:border-slate-800">
                            <Search className="w-14 h-14 text-brand-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-300 dark:text-slate-700 italic tracking-tight mt-12">Search to analyze high-performing content trends...</p>
                </div>
            )}
        </div>
    );
};

export default HashtagExplorer;
