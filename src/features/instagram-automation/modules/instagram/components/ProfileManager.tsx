
import React, { useState, useEffect, useRef } from 'react';
import { InstagramConfig, InstagramProfile } from '../types';
import { getInstagramProfile, updateInstagramProfile } from '../../backend/instagramService';
import { UserCircle, Save, ExternalLink, Loader2, AlertCircle, Camera, Check, Info } from 'lucide-react';

interface ProfileManagerProps {
    instagramConfig: InstagramConfig;
    onNavigateSettings: () => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ instagramConfig, onNavigateSettings }) => {
    const [profile, setProfile] = useState<InstagramProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        biography: '',
        website: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!instagramConfig.accessToken || !instagramConfig.businessId) return;
            
            setLoading(true);
            const result = await getInstagramProfile(instagramConfig.accessToken, instagramConfig.businessId);
            
            if (result.error) {
                setError(result.error);
            } else if (result.profile) {
                setProfile(result.profile);
                setFormData({
                    name: result.profile.name || '',
                    username: result.profile.username || '',
                    biography: result.profile.biography || '',
                    website: result.profile.website || ''
                });
            }
            setLoading(false);
        };

        fetchProfile();
    }, [instagramConfig]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        const result = await updateInstagramProfile(instagramConfig.accessToken, instagramConfig.businessId, {
            name: formData.name,
            biography: formData.biography,
            website: formData.website
        });

        if (result.success) {
            setSuccessMsg("Profile updated successfully (Simulated)");
            // Optimistic update of local profile view
            setProfile(prev => prev ? ({
                ...prev,
                name: formData.name,
                biography: formData.biography,
                website: formData.website
            }) : null);
        } else {
            setError(result.error || "Failed to update profile");
        }
        setSaving(false);
    };

    const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Immediately update local state to show preview
                setProfile(prev => prev ? { ...prev, profile_picture_url: base64 } : null);
                
                // Show notification about API limitation
                setSuccessMsg("Profile picture updated in dashboard (Note: Official Graph API does not support picture updates. Use mobile app for live change.)");
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!instagramConfig.accessToken || !instagramConfig.businessId) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
                    <UserCircle className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Profile Manager</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                    Connect your Instagram account in settings to manage your profile information.
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
                <p className="text-slate-500 dark:text-slate-400 font-medium">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Profile Manager</h2>
                    <p className="text-slate-500 dark:text-slate-400">View and edit your Instagram public profile.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-red-800 dark:text-red-200">Error</h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {successMsg && (
                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-green-800 dark:text-green-200">Success</h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">{successMsg}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 italic">
                            Note: Actual API write access to Profile Info is restricted by Instagram. This is a visual simulation.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Live Preview */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                        <div className="h-32 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"></div>
                        <div className="px-6 relative">
                            <div className="absolute -top-16 left-6 p-1 bg-white dark:bg-slate-800 rounded-full group">
                                <img 
                                    src={profile?.profile_picture_url || "https://via.placeholder.com/150"} 
                                    alt="Profile" 
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 bg-slate-100"
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-2 right-2 bg-slate-900 hover:bg-brand-600 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-slate-800 transition-colors" 
                                    title="Simulate Picture Upload"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleProfilePicUpload}
                                />
                            </div>
                        </div>
                        <div className="mt-20 px-6 pb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{formData.name || profile?.name}</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">@{profile?.username}</p>
                            
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                                    {formData.biography || <span className="text-slate-400 italic">No biography set</span>}
                                </p>
                                {formData.website && (
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <a href={formData.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                            <ExternalLink className="w-3 h-3" />
                                            {formData.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-between items-center text-center">
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-white text-lg">{profile?.media_count || 0}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Posts</div>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-white text-lg">{profile?.followers_count?.toLocaleString() || 0}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Followers</div>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-white text-lg">-</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Following</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                            Changes made here update your internal dashboard view immediately. 
                            To push changes to Instagram, use the official mobile app as the API is read-only for bio/picture updates.
                        </p>
                    </div>
                </div>

                {/* Right Column: Edit Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Profile Details</h3>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Display Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-800 dark:text-white"
                                        placeholder="Business Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-2.5 text-slate-400">@</span>
                                        <input 
                                            type="text" 
                                            value={formData.username}
                                            disabled // Usually cannot change username easily via API
                                            className="w-full pl-8 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400">Username cannot be changed via API.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Biography</label>
                                    <span className={`text-xs ${formData.biography.length > 150 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {formData.biography.length} / 150
                                    </span>
                                </div>
                                <textarea 
                                    rows={4}
                                    value={formData.biography}
                                    onChange={(e) => setFormData({...formData, biography: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-800 dark:text-white resize-none"
                                    placeholder="Tell your followers about your business..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
                                <input 
                                    type="url" 
                                    value={formData.website}
                                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-800 dark:text-white"
                                    placeholder="https://yourwebsite.com"
                                />
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                            <button 
                                type="submit"
                                disabled={saving || formData.biography.length > 150}
                                className={`px-6 py-2.5 rounded-lg font-medium text-white flex items-center gap-2 shadow-lg transition-transform active:scale-95
                                    ${(saving || formData.biography.length > 150) ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/30'}`}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileManager;
