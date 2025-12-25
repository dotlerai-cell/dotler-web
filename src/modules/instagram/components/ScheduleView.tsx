
import React, { useState } from 'react';
import { Post, PostStatus, InstagramConfig } from '../types';
import { publishPost } from '../../backend/instagramService';
import { uploadToCloudinary } from '../../backend/cloudinaryService';
import { Calendar, Clock, MoreVertical, Image as ImageIcon, Trash2, Edit2, X, Eye, Check, Repeat, Flag, ArrowUp, ArrowDown, Minus, Send, Loader2, AlertCircle } from 'lucide-react';

interface ScheduleViewProps {
  posts: Post[];
  instagramConfig?: InstagramConfig;
  onUpdatePost?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ posts, instagramConfig, onUpdatePost, onDeletePost }) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Edit State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState<string>('');
  const [editRecurrence, setEditRecurrence] = useState<string>('none');
  const [editPriority, setEditPriority] = useState<string>('medium');

  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Include PENDING_APPROVAL in the list
  const scheduledPosts = posts.filter(p => 
      p.status === PostStatus.SCHEDULED || 
      p.status === PostStatus.PUBLISHED || 
      p.status === PostStatus.PENDING_APPROVAL
  );

  const toggleMenu = (id: string) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const startReschedule = (post: Post) => {
    setEditingPostId(post.id);
    setActiveMenuId(null);
    if (post.scheduledTime) {
      // Convert ISO string to local datetime-local format (YYYY-MM-DDTHH:mm)
      const date = new Date(post.scheduledTime);
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      setEditTime(localDate.toISOString().slice(0, 16));
    } else {
        // Default to now if not set
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);
        setEditTime(localDate.toISOString().slice(0, 16));
    }
    setEditRecurrence(post.recurrence || 'none');
    setEditPriority(post.priority || 'medium');
  };

  const saveReschedule = (post: Post) => {
    if (onUpdatePost && editTime) {
        onUpdatePost({
            ...post,
            status: PostStatus.SCHEDULED, // Ensure it becomes scheduled if it was pending
            scheduledTime: new Date(editTime).toISOString(),
            recurrence: editRecurrence as any,
            priority: editPriority as any
        });
    }
    setEditingPostId(null);
  };

  const cancelReschedule = () => {
    setEditingPostId(null);
    setEditTime('');
    setEditRecurrence('none');
    setEditPriority('medium');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to cancel and delete this post?')) {
        onDeletePost?.(id);
    }
    setActiveMenuId(null);
  };

  const openDetailView = (post: Post) => {
      setViewingPost(post);
      setActiveMenuId(null);
  };

  const handlePostNow = async (post: Post) => {
    if (!instagramConfig?.accessToken || !instagramConfig?.businessId) {
        alert("Please configure Instagram settings first.");
        return;
    }
    
    if (!post.imageUrl) {
        alert("Cannot post without an image.");
        return;
    }

    setPublishingId(post.id);
    setActiveMenuId(null);
    
    try {
        let finalUrl = post.imageUrl;
        
        // Handle Cloudinary Upload for Data URIs
        if (finalUrl.startsWith('data:') && instagramConfig.cloudinaryCloudName && instagramConfig.cloudinaryUploadPreset) {
             try {
                 finalUrl = await uploadToCloudinary(finalUrl, instagramConfig.cloudinaryCloudName, instagramConfig.cloudinaryUploadPreset);
             } catch (e: any) {
                 alert(`Failed to upload image to Cloudinary: ${e.message}`);
                 setPublishingId(null);
                 return;
             }
        }

        const caption = `${post.generatedCaption}\n\n${post.hashtags.join(' ')}`;
        const result = await publishPost(instagramConfig.accessToken, instagramConfig.businessId, finalUrl, caption);
        
        if (result.success) {
            if (onUpdatePost) {
                onUpdatePost({
                    ...post,
                    status: PostStatus.PUBLISHED,
                    instagramId: result.id,
                    imageUrl: finalUrl, // Update URL to the remote one if changed
                    scheduledTime: new Date().toISOString()
                });
            }
            alert("Post published successfully!");
        } else {
             // If simulation mode or error
             if (result.error === 'SIMULATION_MODE') {
                 if (onUpdatePost) {
                    onUpdatePost({
                        ...post,
                        status: PostStatus.PUBLISHED,
                        instagramId: result.id,
                        scheduledTime: new Date().toISOString()
                    });
                }
                alert("Simulated Post Published (Local Mode)");
             } else {
                alert(`Failed to publish: ${result.error}`);
             }
        }
    } catch (e) {
        console.error(e);
        alert("Error publishing post");
    } finally {
        setPublishingId(null);
    }
  };

  const getPriorityIcon = (priority?: string) => {
      switch(priority) {
          case 'high': return <ArrowUp className="w-3 h-3 text-red-500" />;
          case 'low': return <ArrowDown className="w-3 h-3 text-blue-500" />;
          default: return <Minus className="w-3 h-3 text-slate-400" />;
      }
  };

  const getRecurrenceLabel = (recurrence?: string) => {
      if (!recurrence || recurrence === 'none') return null;
      return (
          <span className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 rounded border border-brand-100 dark:border-brand-900/50">
              <Repeat className="w-3 h-3" />
              <span className="capitalize">{recurrence}</span>
          </span>
      );
  };

  const getStatusBadge = (status: PostStatus) => {
    switch (status) {
        case PostStatus.PUBLISHED:
            return <span className="px-2 py-0.5 text-xs font-bold rounded-full uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Published</span>;
        case PostStatus.SCHEDULED:
            return <span className="px-2 py-0.5 text-xs font-bold rounded-full uppercase tracking-wide bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Scheduled</span>;
        case PostStatus.PENDING_APPROVAL:
            return <span className="px-2 py-0.5 text-xs font-bold rounded-full uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>;
        default:
            return <span className="px-2 py-0.5 text-xs font-bold rounded-full uppercase tracking-wide bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Content Schedule</h2>
            <p className="text-slate-500 dark:text-slate-400">Manage upcoming posts, priority, and recurring schedules.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm transition-colors">
            Total Queued: {scheduledPosts.filter(p => p.status !== PostStatus.PUBLISHED).length}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors min-h-[300px]">
        {scheduledPosts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center text-slate-400 dark:text-slate-500 h-full justify-center">
                <Calendar className="w-16 h-16 mb-4 opacity-20" />
                <p>No posts scheduled yet.</p>
                <p className="text-sm">Head to "Create Content" to draft new posts.</p>
            </div>
        ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {scheduledPosts.map((post) => (
                    <div key={post.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex items-start gap-4 relative group">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-md overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => openDetailView(post)}>
                             {post.imageUrl ? (
                                 <img src={post.imageUrl} className="w-full h-full object-cover" alt="thumb" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                     <ImageIcon className="w-8 h-8" />
                                 </div>
                             )}
                        </div>
                        
                        <div className="flex-1 min-w-0 pt-1">
                            {editingPostId === post.id ? (
                                <div className="flex flex-wrap items-center gap-2 mb-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-brand-200 dark:border-brand-900/50 animate-in fade-in zoom-in-95">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Time</span>
                                        <input 
                                            type="datetime-local" 
                                            value={editTime}
                                            onChange={(e) => setEditTime(e.target.value)}
                                            className="text-xs p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-brand-500"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Recurrence</span>
                                        <select 
                                            value={editRecurrence}
                                            onChange={(e) => setEditRecurrence(e.target.value)}
                                            className="text-xs p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-brand-500"
                                        >
                                            <option value="none">None</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Priority</span>
                                        <select 
                                            value={editPriority}
                                            onChange={(e) => setEditPriority(e.target.value)}
                                            className="text-xs p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-brand-500"
                                        >
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end gap-1 ml-2 pb-0.5">
                                        <button onClick={() => saveReschedule(post)} className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded"><Check className="w-4 h-4" /></button>
                                        <button onClick={cancelReschedule} className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {getStatusBadge(post.status)}
                                    
                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                        <Clock className="w-3 h-3" /> 
                                        {post.scheduledTime ? new Date(post.scheduledTime).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'Unscheduled'}
                                    </span>

                                    {getRecurrenceLabel(post.recurrence)}

                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700" title={`Priority: ${post.priority || 'Medium'}`}>
                                        <Flag className="w-3 h-3" />
                                        {getPriorityIcon(post.priority)}
                                        <span className="capitalize">{post.priority || 'Medium'}</span>
                                    </div>
                                </div>
                            )}

                            <h3 className="font-semibold text-lg text-slate-800 dark:text-white cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 line-clamp-1" onClick={() => openDetailView(post)}>{post.topic}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{post.generatedCaption}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {(post.status === PostStatus.PENDING_APPROVAL || post.status === PostStatus.SCHEDULED) && (
                                <button
                                    onClick={() => handlePostNow(post)}
                                    disabled={publishingId === post.id}
                                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {publishingId === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    {publishingId === post.id ? 'Posting...' : 'Post Now'}
                                </button>
                            )}

                            <div className="relative pt-1">
                                <button 
                                    onClick={() => toggleMenu(post.id)}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                                
                                {activeMenuId === post.id && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-10 animate-in fade-in zoom-in-95">
                                        <button 
                                            onClick={() => openDetailView(post)}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 first:rounded-t-lg"
                                        >
                                            <Eye className="w-4 h-4" /> View Details
                                        </button>
                                        
                                        {(post.status === PostStatus.PENDING_APPROVAL || post.status === PostStatus.SCHEDULED) && (
                                            <button 
                                                onClick={() => handlePostNow(post)}
                                                className="w-full text-left px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2 md:hidden"
                                            >
                                                <Send className="w-4 h-4" /> Post Now
                                            </button>
                                        )}

                                        <button 
                                            onClick={() => startReschedule(post)}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                        >
                                            <Edit2 className="w-4 h-4" /> Edit Schedule
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(post.id)}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 last:rounded-b-lg"
                                        >
                                            <Trash2 className="w-4 h-4" /> Cancel Post
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {viewingPost && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">Post Details</h3>
                      <button onClick={() => setViewingPost(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="overflow-y-auto p-6 space-y-6">
                      <div className="flex justify-center bg-slate-50 dark:bg-black/20 rounded-xl p-4">
                          {viewingPost.imageUrl ? (
                              <img src={viewingPost.imageUrl} className="max-h-[300px] object-contain rounded-lg shadow-sm" alt="Post" />
                          ) : (
                              <div className="h-48 w-full flex items-center justify-center text-slate-400 flex-col gap-2">
                                  <ImageIcon className="w-12 h-12" />
                                  <span>No image content</span>
                              </div>
                          )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Scheduled Time</span>
                              <div className="flex items-center gap-2 text-slate-800 dark:text-white font-medium">
                                  <Calendar className="w-4 h-4 text-brand-500" />
                                  <span className="text-sm">
                                      {viewingPost.scheduledTime ? new Date(viewingPost.scheduledTime).toLocaleString() : 'Unscheduled'}
                                  </span>
                              </div>
                          </div>
                          
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                               <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Settings</span>
                               <div className="flex items-center gap-3">
                                   {viewingPost.recurrence && viewingPost.recurrence !== 'none' ? (
                                        <div className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400">
                                            <Repeat className="w-4 h-4" />
                                            <span className="capitalize">{viewingPost.recurrence}</span>
                                        </div>
                                   ) : <span className="text-sm text-slate-400">No repeat</span>}
                                   
                                   <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>

                                   <div className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                                        <Flag className="w-4 h-4" />
                                        <span className="capitalize">{viewingPost.priority || 'Medium'}</span>
                                   </div>
                               </div>
                          </div>
                      </div>

                      <div>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Caption</span>
                          <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">{viewingPost.generatedCaption}</p>
                          </div>
                      </div>

                      <div>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hashtags</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                              {viewingPost.hashtags.map((tag, i) => (
                                  <span key={i} className="text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-2 py-1 rounded text-xs font-medium border border-brand-100 dark:border-brand-900/20">
                                      {tag.startsWith('#') ? tag : `#${tag}`}
                                  </span>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                      {(viewingPost.status === PostStatus.PENDING_APPROVAL || viewingPost.status === PostStatus.SCHEDULED) && (
                          <button
                            onClick={() => {
                                handlePostNow(viewingPost);
                                setViewingPost(null);
                            }}
                            disabled={publishingId === viewingPost.id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition flex items-center gap-2 text-sm disabled:opacity-50"
                          >
                             {publishingId === viewingPost.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                             Post Now
                          </button>
                      )}
                      <button 
                        onClick={() => {
                            if (window.confirm('Delete this post?')) {
                                onDeletePost?.(viewingPost.id);
                                setViewingPost(null);
                            }
                        }}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition text-sm"
                      >
                          Cancel Post
                      </button>
                      <button 
                        onClick={() => setViewingPost(null)}
                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:opacity-90 transition text-sm"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ScheduleView;
