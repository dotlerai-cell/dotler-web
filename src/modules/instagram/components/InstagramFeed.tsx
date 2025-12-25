
import React, { useEffect, useState } from 'react';
import { InstagramConfig, InstagramMedia } from '../types';
import { getInstagramFeed, updateInstagramMedia, deleteInstagramMedia, isSessionExpired } from '../../backend/instagramService';

// Added missing Clock icon import from lucide-react
import { Loader2, Heart, MessageCircle, ExternalLink, Image as ImageIcon, Video, Layers, AlertCircle, Edit2, Save, X, Hash, CheckCircle2, Trash2, AlertTriangle, RefreshCw, Key, ShieldAlert, Clock } from 'lucide-react';

interface InstagramFeedProps {
    instagramConfig: InstagramConfig;
    onNavigateSettings: () => void;
}

const InstagramFeed: React.FC<InstagramFeedProps> = ({ instagramConfig, onNavigateSettings }) => {
    const [mediaItems, setMediaItems] = useState<InstagramMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit State
    const [editingMedia, setEditingMedia] = useState<InstagramMedia | null>(null);
    const [editCaption, setEditCaption] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveResult, setSaveResult] = useState<{success: boolean, message?: string} | null>(null);

    // Delete State
    const [deletingMedia, setDeletingMedia] = useState<InstagramMedia | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchFeed = async () => {
        if (!instagramConfig.accessToken || !instagramConfig.businessId) {
            setLoading(false);
            setError(null);
            return;
        }
        
        setLoading(true);
        setError(null);
        const result = await getInstagramFeed(instagramConfig.accessToken, instagramConfig.businessId);
        
        if (result.error) {
            setError(result.error);
        } else if (result.media) {
            setMediaItems(result.media);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFeed();
    }, [instagramConfig]);

    const handleEditClick = (media: InstagramMedia) => {
        setEditingMedia(media);
        setEditCaption(media.caption || '');
        setSaveResult(null);
    };

    const handleSaveEdit = async () => {
        if (!editingMedia || !instagramConfig.accessToken) return;
        
        setIsSaving(true);
        setSaveResult(null);

        const result = await updateInstagramMedia(
            instagramConfig.accessToken, 
            editingMedia.id, 
            editCaption,
            editingMedia.is_comment_enabled ?? true
        );
        
        if (result.success) {
            setMediaItems(prev => prev.map(item => 
                item.id === editingMedia.id ? { ...item, caption: editCaption } : item
            ));
            setSaveResult({ success: true, message: 'Caption updated successfully!' });
            
            setTimeout(() => {
                setEditingMedia(null);
                setSaveResult(null);
            }, 1500);
        } else {
            setSaveResult({ success: false, message: result.error || 'Failed to update post.' });
        }
        setIsSaving(false);
    };

    const handleConfirmDelete = async () => {
        if (!deletingMedia || !instagramConfig.accessToken) return;
        
        setIsDeleting(true);
        const result = await deleteInstagramMedia(instagramConfig.accessToken, deletingMedia.id);
        
        if (result.success) {
            // Optimistic UI update
            setMediaItems(prev => prev.filter(item => item.id !== deletingMedia.id));
            setDeletingMedia(null);
        } else {
            alert(result.error);
        }
        setIsDeleting(false);
    };

    if (!instagramConfig.accessToken || !instagramConfig.businessId) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Connect Your Account</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                    To view your live Instagram feed, please configure your Access Token and Business ID in the settings.
                </p>
                <button 
                    onClick={onNavigateSettings}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-lg shadow-brand-500/30 flex items-center gap-2"
                >
                    Go to Settings <ExternalLink className="w-4 h-4" />
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Fetching your posts...</p>
            </div>
        );
    }

    if (error) {
         const expired = isSessionExpired(error);
         const rateLimit = error.includes('Rate Limit');
         const permission = error.includes('Missing Permissions');

         return (
            <div className={`p-8 rounded-2xl border-l-8 shadow-md flex flex-col md:flex-row items-start gap-6 animate-in slide-in-from-top-4 duration-300 ${
                rateLimit ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500' :
                permission ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500' :
                'bg-red-50 dark:bg-red-900/10 border-red-500'
            }`}>
                <div className={`p-4 rounded-2xl flex-shrink-0 ${
                    rateLimit ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                    permission ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                    'bg-red-100 dark:bg-red-900/30 text-red-600'
                }`}>
                    {rateLimit ? <Clock className="w-8 h-8" /> : 
                     expired ? <Key className="w-8 h-8" /> :
                     permission ? <ShieldAlert className="w-8 h-8" /> :
                     <AlertCircle className="w-8 h-8" />}
                </div>
                
                <div className="flex-1 space-y-3">
                    <h3 className={`text-xl font-bold ${
                        rateLimit ? 'text-amber-900 dark:text-amber-100' :
                        permission ? 'text-blue-900 dark:text-blue-100' :
                        'text-red-900 dark:text-red-100'
                    }`}>
                        {rateLimit ? "Slow down a bit" : 
                         expired ? "Authentication Required" : 
                         permission ? "Permissions Required" : 
                         "Live Feed Unavailable"}
                    </h3>
                    <p className={`text-lg leading-relaxed ${
                        rateLimit ? 'text-amber-800 dark:text-amber-200' :
                        permission ? 'text-blue-800 dark:text-blue-200' :
                        'text-red-800 dark:text-red-200'
                    }`}>
                        {error}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <button 
                            onClick={fetchFeed}
                            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm ${
                                rateLimit ? 'bg-amber-600 text-white hover:bg-amber-700' :
                                permission ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                'bg-red-600 text-white hover:bg-red-700'
                            }`}
                        >
                            <RefreshCw className="w-4 h-4" /> Retry Connection
                        </button>
                        {(expired || permission || error.includes('Configuration')) && (
                            <button 
                                onClick={onNavigateSettings}
                                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 bg-white dark:bg-slate-800 border-2 shadow-sm ${
                                    rateLimit ? 'text-amber-700 border-amber-200 hover:bg-amber-50' :
                                    permission ? 'text-blue-700 border-blue-200 hover:bg-blue-50' :
                                    'text-red-700 border-red-200 hover:bg-red-50'
                                }`}
                            >
                                <ExternalLink className="w-4 h-4" /> {expired ? 'Update Token' : 'Adjust Settings'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const getMediaIcon = (type: string) => {
        switch(type) {
            case 'VIDEO': return <Video className="w-5 h-5" />;
            case 'CAROUSEL_ALBUM': return <Layers className="w-5 h-5" />;
            default: return null;
        }
    };

    const captionCharCount = editCaption.length;
    const hashtagCount = (editCaption.match(/#/g) || []).length;
    const isOverCharLimit = captionCharCount > 2200;
    const isOverTagLimit = hashtagCount > 30;
    const isValid = !isOverCharLimit && !isOverTagLimit;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Feed</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage and analyze your live Instagram posts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchFeed}
                        className="p-2 text-slate-500 hover:text-brand-600 transition-colors"
                        title="Refresh Feed"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                        {mediaItems.length} Posts Loaded
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {mediaItems.map((item) => (
                    <div 
                        key={item.id} 
                        className="group relative bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-2xl hover:border-brand-200 dark:hover:border-brand-900/50 transition-all duration-300 flex flex-col"
                    >
                        {/* Image Container */}
                        <div className="aspect-square relative bg-slate-100 dark:bg-slate-900 overflow-hidden">
                            <img 
                                src={item.thumbnail_url || item.media_url || 'https://via.placeholder.com/400?text=No+Image'} 
                                alt={item.caption || 'Instagram Post'}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                            
                            {/* Media Type Indicator */}
                            {item.media_type !== 'IMAGE' && (
                                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white p-1.5 rounded-lg">
                                    {getMediaIcon(item.media_type)}
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 pointer-events-none">
                                <div className="flex items-center gap-2 text-white font-bold">
                                    <Heart className="w-6 h-6 fill-current" />
                                    <span>{item.like_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-2 text-white font-bold">
                                    <MessageCircle className="w-6 h-6 fill-current" />
                                    <span>{item.comments_count || 0}</span>
                                </div>
                            </div>

                            {/* Quick Action: Delete (Only on hover for desktop) */}
                            <button 
                                onClick={() => setDeletingMedia(item)}
                                className="absolute bottom-2 right-2 p-2 bg-red-600/90 hover:bg-red-700 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                                title="Delete Post"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col">
                            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 min-h-[2.5em] font-medium leading-relaxed">
                                {item.caption || <span className="italic text-slate-400">No caption</span>}
                            </p>
                            
                            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                                <span className="font-semibold">{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => handleEditClick(item)}
                                        className="flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-bold uppercase tracking-wider"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <a 
                                        href={item.permalink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-bold uppercase tracking-wider"
                                    >
                                        View <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {mediaItems.length === 0 && !loading && !error && (
                <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 h-[400px] flex flex-col items-center justify-center">
                    <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-lg">No posts found on this account.</p>
                </div>
            )}

            {/* Edit Modal */}
            {editingMedia && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                                    <Edit2 className="w-5 h-5 text-brand-600" />
                                </div>
                                Edit Post Details
                            </h3>
                            <button onClick={() => setEditingMedia(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
                             <div className="flex items-start justify-center bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                                 <img 
                                    src={editingMedia.media_url || editingMedia.thumbnail_url || ''} 
                                    alt="Post Preview" 
                                    className="max-h-80 object-contain"
                                 />
                             </div>
                             <div className="flex flex-col gap-4">
                                 <div className="space-y-2">
                                     <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Caption & Hashtags</label>
                                     <textarea 
                                        className="w-full flex-1 p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none min-h-[200px] text-sm leading-relaxed"
                                        value={editCaption}
                                        onChange={(e) => setEditCaption(e.target.value)}
                                        placeholder="Write an engaging caption..."
                                     />
                                 </div>
                                 
                                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mt-1">
                                    <div className={`flex items-center gap-1 ${isOverTagLimit ? 'text-red-500' : 'text-slate-400'}`}>
                                        <Hash className="w-3 h-3" />
                                        <span>{hashtagCount} / 30 Tags</span>
                                    </div>
                                    <div className={isOverCharLimit ? 'text-red-500' : 'text-slate-400'}>
                                        {captionCharCount} / 2200 Chars
                                    </div>
                                 </div>
                                 
                                 {saveResult && (
                                     <div className={`mt-2 p-4 rounded-xl flex items-start gap-3 text-sm animate-in zoom-in-95 ${saveResult.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-100 dark:border-green-900' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-100 dark:border-red-900'}`}>
                                         {saveResult.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                         <span className="font-medium">{saveResult.message}</span>
                                     </div>
                                 )}
                             </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button 
                                onClick={() => setEditingMedia(null)}
                                className="px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                disabled={isSaving || !isValid}
                                className="px-8 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20 active:scale-95"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isSaving ? 'Saving Changes...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingMedia && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Confirm Deletion</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                                Are you sure you want to permanently delete this post from your Instagram feed? This action <span className="text-red-600 dark:text-red-400 font-bold underline">cannot be undone</span>.
                            </p>
                            
                            {/* Small preview of item being deleted */}
                            <div className="w-full flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-8 border border-slate-100 dark:border-slate-700">
                                <img src={deletingMedia.thumbnail_url || deletingMedia.media_url} className="w-16 h-16 rounded-xl object-cover" alt="To Delete" />
                                <div className="text-left flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{deletingMedia.caption || "No caption"}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">{new Date(deletingMedia.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button 
                                    onClick={() => setDeletingMedia(null)}
                                    disabled={isDeleting}
                                    className="py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition shadow-sm disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                    {isDeleting ? 'Deleting...' : 'Delete Forever'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstagramFeed;
