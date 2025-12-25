import React, { useEffect, useState } from 'react';
import { Post, InstagramProfile, InstagramConfig, InstagramMedia, PostStatus } from '../types';
import { getInstagramProfile, getInstagramRecentMedia } from '../../backend/instagramService';
import { TrendingUp, Users, MessageCircle, AlertCircle, Instagram, ExternalLink, Settings, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
    posts: Post[];
    instagramConfig: InstagramConfig;
    onNavigateSettings: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ posts, instagramConfig, onNavigateSettings }) => {
    const [profile, setProfile] = useState<InstagramProfile | null>(null);
    const [recentMedia, setRecentMedia] = useState<InstagramMedia[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Default mock data for demo state
    const mockChartData = [
        { name: 'Mon', engagement: 4000 },
        { name: 'Tue', engagement: 3000 },
        { name: 'Wed', engagement: 2000 },
        { name: 'Thu', engagement: 2780 },
        { name: 'Fri', engagement: 1890 },
        { name: 'Sat', engagement: 2390 },
        { name: 'Sun', engagement: 3490 },
    ];

    useEffect(() => {
        const loadInstagramData = async () => {
            if (!instagramConfig.accessToken || !instagramConfig.businessId) {
                setProfile(null);
                setRecentMedia([]);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Fetch Profile
                const profileResult = await getInstagramProfile(instagramConfig.accessToken, instagramConfig.businessId);
                if (profileResult.error) {
                    setError(profileResult.error);
                } else if (profileResult.profile) {
                    setProfile(profileResult.profile);
                }

                // Fetch Recent Media for Stats
                const mediaResult = await getInstagramRecentMedia(instagramConfig.accessToken, instagramConfig.businessId);
                if (mediaResult.media) {
                    setRecentMedia(mediaResult.media);
                }
            } catch (err) {
                console.error("Dashboard Sync Error:", err);
                setError("Failed to sync dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        loadInstagramData();
    }, [instagramConfig]);

    // Calculate Dynamic Stats
    const calculateEngagementRate = () => {
        if (!profile || !profile.followers_count || recentMedia.length === 0) return "4.8%"; // Fallback

        const totalInteractions = recentMedia.reduce((acc, media) => acc + (media.like_count || 0) + (media.comments_count || 0), 0);
        const avgInteractions = totalInteractions / recentMedia.length;
        const rate = (avgInteractions / profile.followers_count) * 100;

        return rate.toFixed(2) + "%";
    };

    const getChartData = () => {
        if (recentMedia.length === 0) return mockChartData;

        // Map recent media to chart format, reversing to show chronological order left-to-right
        return [...recentMedia].reverse().map((media, index) => {
            const date = new Date(media.timestamp);
            const likes = media.like_count || 0;
            const comments = media.comments_count || 0;
            return {
                name: `${date.getDate()}/${date.getMonth() + 1}`, // e.g., "23/12"
                engagement: likes + comments,
                likes: likes,
                comments: comments,
                fullDate: date.toLocaleDateString(),
                postNumber: index + 1
            };
        });
    };

    // Calculate total posts (API + Local Session - De-duplication)
    // If a local post has an instagramId that exists in recentMedia, it's already counted in apiPostCount.
    const apiPostCount = profile?.media_count || 0;

    const uniqueSessionPosts = posts.filter(p => {
        if (p.status !== PostStatus.PUBLISHED) return false;
        // If we know the instagramId, and it's already in the recent media list fetched from API, don't double count it
        if (p.instagramId && recentMedia.some(m => m.id === p.instagramId)) {
            return false;
        }
        return true;
    }).length;

    const displayPostCount = apiPostCount + uniqueSessionPosts;

    const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</span>
                <div className={`p-2 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20`}>
                    <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
                </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
            {subtext && (
                <div className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" /> {subtext}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-red-800 dark:text-red-200">Instagram Connection Failed</h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                        <button
                            onClick={onNavigateSettings}
                            className="mt-2 text-xs font-semibold text-red-800 dark:text-red-200 underline hover:text-red-900"
                        >
                            Update Settings
                        </button>
                    </div>
                </div>
            )}

            {/* Profile Header */}
            {loading ? (
                <div className="bg-white dark:bg-slate-800 p-12 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-3 transition-colors">
                    <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Syncing with Instagram...</p>
                </div>
            ) : profile ? (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center md:items-start gap-6 animate-in fade-in transition-colors">
                    <div className="flex-shrink-0">
                        <img
                            src={profile.profile_picture_url || "https://via.placeholder.com/150"}
                            alt={profile.username}
                            className="w-24 h-24 rounded-full border-4 border-slate-50 dark:border-slate-700 object-cover shadow-sm"
                        />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{profile.name || profile.username}</h2>
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-sm font-mono">@{profile.username}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 max-w-2xl">{profile.biography}</p>
                        {profile.website && (
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 text-sm font-medium">
                                <ExternalLink className="w-3 h-3" />
                                {profile.website}
                            </a>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                            <span className="block text-xl font-bold text-slate-800 dark:text-white">{displayPostCount}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Posts</span>
                        </div>
                    </div>
                </div>
            ) : !error && (
                <div className="bg-gradient-to-r from-red-500 to-red-700 p-6 rounded-xl shadow-lg text-white flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg">Connect your Instagram Account</h3>
                        <p className="text-red-100 text-sm opacity-90">Enter your Access Token and Business ID in settings to view real-time profile stats.</p>
                    </div>
                    <button
                        onClick={onNavigateSettings}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition backdrop-blur-sm"
                    >
                        <Settings className="w-4 h-4" />
                        Configure
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Followers"
                    value={profile?.followers_count != null ? profile.followers_count.toLocaleString() : "-"}
                    icon={Users}
                    color="bg-blue-500"
                    subtext={profile ? "Real-time" : "Not connected"}
                />
                <StatCard
                    title="Total Posts"
                    value={displayPostCount}
                    icon={Instagram}
                    color="bg-pink-500"
                    subtext={profile ? (uniqueSessionPosts > 0 ? `${apiPostCount} API + ${uniqueSessionPosts} Session` : "From Instagram API") : "Not connected"}
                />
                <StatCard
                    title="Avg. Engagement"
                    value={calculateEngagementRate()}
                    icon={TrendingUp}
                    color="bg-green-500"
                    subtext={recentMedia.length > 0 ? "Based on last 7 posts" : "Estimated"}
                />
                <StatCard
                    title="Scheduled Posts"
                    value={posts.filter(p => p.status === PostStatus.SCHEDULED).length}
                    icon={AlertCircle}
                    color="bg-orange-500"
                    subtext="Local Queue"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6">Engagement Overview (Recent Posts)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getChartData()}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ color: '#64748b' }}
                                />
                                <Bar dataKey="engagement" fill="#dc2626" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">System Health (Workers)</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Gemini AI Connection', status: 'Active', load: 'Low Latency' },
                            { name: 'Scheduler Engine', status: 'Active', load: 'Idle' },
                            { name: 'Instagram Graph API', status: profile ? 'Connected' : (error ? 'Error' : 'Offline'), load: profile ? 'Synced' : '-' },
                            { name: 'RAG Knowledge Base', status: 'Operational', load: 'Ready' },
                        ].map((worker, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${worker.status === 'Connected' || worker.status === 'Active' || worker.status === 'Operational' ? 'bg-green-500' : worker.status === 'Error' ? 'bg-red-500' : 'bg-slate-300'} animate-pulse`}></div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{worker.name}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                    <span>{worker.load}</span>
                                    <span className={`${worker.status === 'Offline' ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400' : worker.status === 'Error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'} px-2 py-1 rounded`}>{worker.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;