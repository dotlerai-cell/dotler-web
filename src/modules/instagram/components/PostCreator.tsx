
import React, { useState, useRef } from 'react';
import { Post, PostStatus, InstagramConfig } from '../types';
import { generateCaption, suggestRelatedHashtags } from '../../backend/geminiService';
import { publishPost } from '../../backend/instagramService';
import { uploadToCloudinary } from '../../backend/cloudinaryService';
import { Loader2, Upload, RefreshCw, Check, X, Image as ImageIcon, Calendar, Send, AlertCircle, Link as LinkIcon, FileImage, Cloud, Sparkles, Plus, Hash } from 'lucide-react';

interface PostCreatorProps {
  onPostCreated: (post: Post) => void;
  instagramConfig?: InstagramConfig;
}

const PostCreator: React.FC<PostCreatorProps> = ({ onPostCreated, instagramConfig }) => {
  const [topic, setTopic] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageError, setImageError] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<Partial<Post> | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setImageUrlInput('');
        setImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setImageUrlInput(val);
      setSelectedImage(val);
      setImageError(false);
  };

  const clearImage = () => {
      setSelectedImage(null);
      setImageUrlInput('');
      setImageError(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!topic && !selectedImage) return;
    
    setIsGenerating(true);
    setGeneratedDraft(null);
    setSuggestedTags([]);

    // Try to fetch image to base64 for Gemini if in URL mode to allow visual analysis
    let imagePayload = selectedImage || undefined;
    if (imageMode === 'url' && selectedImage && !imageError) {
        try {
            const response = await fetch(selectedImage);
            const blob = await response.blob();
            const reader = new FileReader();
            imagePayload = await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn("CORS/Network error fetching image for AI analysis. Sending URL directly.");
        }
    }

    try {
      const result = await generateCaption(topic, imagePayload);
      
      setGeneratedDraft({
        topic: topic || 'Image Post',
        imageUrl: selectedImage || undefined,
        generatedCaption: result.caption,
        hashtags: result.hashtags,
        status: PostStatus.PENDING_APPROVAL,
        createdAt: Date.now()
      });

      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(10, 0, 0, 0);
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      setScheduledTime(localDate.toISOString().slice(0, 16));

    } catch (error) {
      console.error("Failed to generate", error);
      alert("Failed to generate content. Check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestTags = async () => {
      if (!generatedDraft || !generatedDraft.topic) return;
      setIsSuggesting(true);
      try {
          const tags = await suggestRelatedHashtags(generatedDraft.topic, generatedDraft.hashtags || []);
          // Filter out tags already present
          const currentSet = new Set(generatedDraft.hashtags?.map(t => t.toLowerCase().replace('#', '')));
          const filtered = tags.filter(t => !currentSet.has(t.toLowerCase().replace('#', '')));
          setSuggestedTags(filtered);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSuggesting(false);
      }
  };

  const addSuggestedTag = (tag: string) => {
      if (!generatedDraft) return;
      const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
      const currentTags = generatedDraft.hashtags || [];
      
      if (currentTags.length >= 30) {
          alert("Instagram limit reached: Max 30 hashtags per post.");
          return;
      }

      setGeneratedDraft({
          ...generatedDraft,
          hashtags: [...currentTags, formattedTag]
      });
      setSuggestedTags(prev => prev.filter(t => t !== tag));
  };

  const handleApprove = async (targetStatus: PostStatus) => {
    if (!generatedDraft) return;

    let instagramId = undefined;
    let finalImageUrl = generatedDraft.imageUrl;
    let finalStatus = targetStatus;

    if (targetStatus === PostStatus.PUBLISHED) {
        setIsPublishing(true);

        try {
            // Check if we need to upload to Cloudinary first
            if (
                finalImageUrl?.startsWith('data:') && 
                instagramConfig?.cloudinaryCloudName && 
                instagramConfig?.cloudinaryUploadPreset
            ) {
                try {
                    finalImageUrl = await uploadToCloudinary(
                        finalImageUrl, 
                        instagramConfig.cloudinaryCloudName, 
                        instagramConfig.cloudinaryUploadPreset
                    );
                } catch (uploadError: any) {
                    alert(`Cloudinary Upload Failed: ${uploadError.message}`);
                    setIsPublishing(false);
                    return;
                }
            }
        
            if (instagramConfig?.accessToken && instagramConfig?.businessId && finalImageUrl) {
                const result = await publishPost(
                    instagramConfig.accessToken, 
                    instagramConfig.businessId, 
                    finalImageUrl, 
                    `${generatedDraft.generatedCaption}\n\n${generatedDraft.hashtags?.join(' ')}`
                );

                if (!result.success && result.error !== "SIMULATION_MODE") {
                    const proceed = window.confirm(
                        `Instagram API Error:\n${result.error}\n\nDo you want to save this post as SCHEDULED locally so you don't lose it?`
                    );
                    
                    if (proceed) {
                        finalStatus = PostStatus.SCHEDULED;
                    } else {
                        setIsPublishing(false);
                        return;
                    }
                } else if (result.success) {
                    instagramId = result.id;
                }
            } else {
                 await new Promise(resolve => setTimeout(resolve, 1500));
            }
        } catch (e: any) {
             console.error(e);
             alert("An unexpected error occurred during publishing.");
             setIsPublishing(false);
             return;
        }

        setIsPublishing(false);
    }

    const finalTime = finalStatus === PostStatus.PUBLISHED 
      ? new Date().toISOString() 
      : new Date(scheduledTime).toISOString();

    const newPost: Post = {
      id: crypto.randomUUID(),
      instagramId: instagramId,
      topic: generatedDraft.topic!,
      imageUrl: finalImageUrl,
      generatedCaption: generatedDraft.generatedCaption!,
      hashtags: generatedDraft.hashtags!,
      status: finalStatus,
      scheduledTime: finalTime,
      createdAt: Date.now()
    };
    
    onPostCreated(newPost);
    
    setTopic('');
    setSelectedImage(null);
    setImageUrlInput('');
    setGeneratedDraft(null);
    setSuggestedTags([]);
    setScheduledTime('');
  };

  const handleReject = () => {
    setGeneratedDraft(null);
    setSuggestedTags([]);
    setScheduledTime('');
  };

  const hasCloudinary = !!(instagramConfig?.cloudinaryCloudName && instagramConfig?.cloudinaryUploadPreset);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Content Studio</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Enter a topic or upload an image to generate an Instagram post draft using Gemini.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Topic / Prompt</label>
            <textarea
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none transition bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
              rows={3}
              placeholder="e.g., Tips for staying productive while working from home..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Image Source</label>
                 <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                     <button 
                        onClick={() => { setImageMode('upload'); clearImage(); }}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${imageMode === 'upload' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                     >
                         <FileImage className="w-3 h-3" /> Upload
                     </button>
                     <button 
                        onClick={() => { setImageMode('url'); clearImage(); }}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${imageMode === 'url' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                     >
                         <LinkIcon className="w-3 h-3" /> URL
                     </button>
                 </div>
            </div>

            {imageMode === 'upload' ? (
                <div 
                  className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition relative group"
                  onClick={() => !selectedImage && fileInputRef.current?.click()}
                >
                  {selectedImage ? (
                    <div className="relative w-full h-64">
                       <img src={selectedImage} alt="Preview" className="w-full h-full object-contain rounded-md" />
                       <button 
                            onClick={(e) => { e.stopPropagation(); clearImage(); }}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition"
                       >
                            <X className="w-4 h-4" />
                       </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Click to upload an image</p>
                      {hasCloudinary ? (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                              <Cloud className="w-3 h-3" /> Cloudinary Ready
                          </p>
                      ) : (
                          <p className="text-xs text-slate-400 mt-1">(Simulated posting only - Configure Cloudinary to enable API upload)</p>
                      )}
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
            ) : (
                <div className="space-y-3">
                    <input 
                        type="text" 
                        placeholder="https://example.com/image.jpg"
                        value={imageUrlInput}
                        onChange={handleUrlChange}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 ${imageError ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 dark:border-slate-600 focus:ring-brand-500'}`}
                    />
                     {selectedImage && !imageError ? (
                        <div className="relative w-full h-64 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden">
                           <img 
                                src={selectedImage} 
                                alt="Preview" 
                                className="max-w-full max-h-full object-contain" 
                                onError={() => setImageError(true)}
                           />
                           <button 
                                onClick={clearImage}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition"
                           >
                                <X className="w-4 h-4" />
                           </button>
                        </div>
                      ) : (
                         <div className={`h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm ${imageError ? 'border-red-200 bg-red-50 text-red-500' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400'}`}>
                             {imageError ? (
                                 <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Invalid Image URL or Failed to Load</span>
                             ) : (
                                 "Enter a valid image URL to preview"
                             )}
                         </div>
                      )}
                      <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Supports real Instagram API posting
                      </p>
                </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!topic && !selectedImage)}
            className={`w-full py-3 rounded-lg flex items-center justify-center space-x-2 font-semibold text-white transition
              ${(isGenerating || (!topic && !selectedImage)) ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/30'}`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Draft...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Generate Content</span>
              </>
            )}
          </button>
        </div>
      </div>

      {generatedDraft && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-brand-100 dark:border-brand-900/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
          <div className="bg-brand-50 dark:bg-brand-900/20 px-6 py-3 border-b border-brand-100 dark:border-brand-900/30 flex justify-between items-center">
            <h3 className="font-bold text-brand-900 dark:text-brand-100 flex items-center gap-2">
                <Check className="w-4 h-4" /> Approval Required
            </h3>
            <span className="text-xs font-mono text-brand-700 dark:text-brand-300 bg-brand-200 dark:bg-brand-900/50 px-2 py-1 rounded">Status: Draft</span>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-100 dark:bg-slate-900 rounded-lg p-4 flex items-center justify-center border border-gray-200 dark:border-slate-700">
               {generatedDraft.imageUrl ? (
                   <img src={generatedDraft.imageUrl} alt="Draft" className="max-h-96 object-contain rounded shadow-sm" />
               ) : (
                   <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-slate-600">
                       <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                       <span className="text-sm">No image provided</span>
                   </div>
               )}
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Caption</label>
                    <textarea 
                        className="w-full mt-1 p-3 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-brand-500 focus:border-brand-500 h-40 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        value={generatedDraft.generatedCaption}
                        onChange={(e) => setGeneratedDraft({...generatedDraft, generatedCaption: e.target.value})}
                    />
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Hashtags ({generatedDraft.hashtags?.length}/30)</label>
                        <button 
                            onClick={handleSuggestTags}
                            disabled={isSuggesting}
                            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                        >
                            {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Suggest More
                        </button>
                    </div>
                    <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-600 text-brand-600 dark:text-brand-400 text-sm font-medium flex flex-wrap gap-2">
                        {generatedDraft.hashtags?.map((tag, i) => (
                            <span key={i} className="bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded flex items-center gap-1 group">
                                {tag.startsWith('#') ? tag : `#${tag}`}
                                <button 
                                    onClick={() => setGeneratedDraft({...generatedDraft, hashtags: generatedDraft.hashtags?.filter((_, idx) => idx !== i)})}
                                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* AI Tag Suggestions */}
                    {suggestedTags.length > 0 && (
                        <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-brand-500" /> AI Suggestions
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedTags.map((tag, i) => (
                                    <button
                                        key={i}
                                        onClick={() => addSuggestedTag(tag)}
                                        className="text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition-all flex items-center gap-1 group"
                                    >
                                        <Plus className="w-3 h-3 text-brand-400 group-hover:text-brand-600" />
                                        #{tag.replace('#', '')}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setSuggestedTags([])}
                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 ml-1"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Schedule Publication
                    </label>
                    <input 
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full mt-1 p-3 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-brand-500 focus:border-brand-500 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                </div>

                {(!instagramConfig?.accessToken || !instagramConfig?.businessId) && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex gap-2 text-xs text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p>Instagram is not connected in Settings. "Post Now" will simulate success locally.</p>
                    </div>
                )}
                
                {imageMode === 'upload' && instagramConfig?.accessToken && !hasCloudinary && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-2 text-xs text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900/50">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p>Using Local Upload mode without Cloudinary. Post will be simulated because Instagram API requires public URLs.</p>
                    </div>
                )}

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={handleReject}
                        disabled={isPublishing}
                        className="flex-1 py-2 px-4 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium flex items-center justify-center gap-2"
                    >
                        <X className="w-4 h-4" /> Reject
                    </button>
                    
                    <button 
                        onClick={() => handleApprove(PostStatus.PUBLISHED)}
                        disabled={isPublishing}
                        className="flex-[1.5] py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 
                        {isPublishing ? 'Posting...' : 'Approve & Post Now'}
                    </button>

                    <button 
                        onClick={() => handleApprove(PostStatus.SCHEDULED)}
                        disabled={isPublishing}
                        className="flex-[1.5] py-2 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                    >
                        <Calendar className="w-4 h-4" /> Approve & Schedule
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCreator;
