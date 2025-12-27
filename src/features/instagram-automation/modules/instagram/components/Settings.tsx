
import React, { useState, useEffect } from 'react';
import { InstagramConfig } from '../types';
import { getFacebookPages, getInstagramBusinessId } from '../../backend/instagramService';
import { Save, Instagram, Key, ShieldCheck, CheckCircle, HelpCircle, ExternalLink, AlertTriangle, Cloud, Image as ImageIcon, Search, Loader2, ArrowRight, Facebook, X, Globe } from 'lucide-react';

interface SettingsProps {
    config: InstagramConfig;
    onSave: (config: InstagramConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave }) => {
    const [formData, setFormData] = useState<InstagramConfig>({
        accessToken: '',
        businessId: '',

        cloudinaryCloudName: '',
        cloudinaryUploadPreset: ''
    });
    const [saved, setSaved] = useState(false);

    // ID Discovery State
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [discoveredPages, setDiscoveredPages] = useState<any[]>([]);
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        setFormData(config);
    }, [config]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedConfig = {
            accessToken: formData.accessToken.trim(),
            businessId: formData.businessId.trim(),

            verifyToken: formData.verifyToken?.trim() || '',
            cloudinaryCloudName: formData.cloudinaryCloudName?.trim() || '',
            cloudinaryUploadPreset: formData.cloudinaryUploadPreset?.trim() || ''
        };
        onSave(cleanedConfig);
        setFormData(cleanedConfig);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleScanAccounts = async () => {
        if (!formData.accessToken) {
            setScanError("Please enter your Access Token first.");
            return;
        }

        setIsScanning(true);
        setScanError(null);
        setDiscoveredPages([]);
        setShowScanner(true);

        const res = await getFacebookPages(formData.accessToken);

        if (res.error) {
            setScanError(res.error);
        } else if (res.pages) {
            const pagesWithIg = await Promise.all(res.pages.map(async (page: any) => {
                const igRes = await getInstagramBusinessId(formData.accessToken, page.id);
                return { ...page, igId: igRes.igId };
            }));
            setDiscoveredPages(pagesWithIg);
        }
        setIsScanning(false);
    };

    const selectIgId = (id: string) => {
        setFormData({ ...formData, businessId: id });
        setShowScanner(false);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Settings</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your API connections and automation preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                            Security & Privacy
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            Your credentials are stored locally in your browser. They are used exclusively for direct requests to the Meta Graph API.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <HelpCircle className="w-5 h-5" />
                            ID Scanner
                        </h3>
                        <p className="text-sm text-brand-100 mb-4 leading-relaxed">
                            Connect your token to scan all Facebook Pages and find linked Instagram Business IDs automatically.
                        </p>
                        <button
                            onClick={handleScanAccounts}
                            className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-white/20"
                        >
                            <Search className="w-4 h-4" /> Scan for Business IDs
                        </button>
                    </div>

                </div>

                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">

                        <div className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center">
                                    <Instagram className="w-6 h-6 text-pink-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Instagram Graph API</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Main credentials for content and messaging.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    User Access Token
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Key className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={formData.accessToken}
                                        onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono text-sm text-slate-700 dark:text-slate-200"
                                        placeholder="EAAG..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Verify Token (Custom Password)
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <ShieldCheck className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.verifyToken || ''}
                                        onChange={(e) => setFormData({ ...formData, verifyToken: e.target.value })}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono text-sm text-slate-700 dark:text-slate-200"
                                        placeholder="my_secure_verify_token"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500">
                                    Create a password here. You MUST paste this exact same string into the Meta App Dashboard when setting up the Webhook.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Instagram Business ID
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.businessId}
                                        onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                                        className="block w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono text-sm text-slate-700 dark:text-slate-200"
                                        placeholder="1784..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cloudinary Section */}
                        <div className="border-t border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center">
                                    <Cloud className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Media Hosting (Cloudinary)</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Used to generate public URLs for direct image posting.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Cloud Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cloudinaryCloudName || ''}
                                        onChange={(e) => setFormData({ ...formData, cloudinaryCloudName: e.target.value })}
                                        className="block w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm text-slate-700 dark:text-slate-200"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Upload Preset
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cloudinaryUploadPreset || ''}
                                        onChange={(e) => setFormData({ ...formData, cloudinaryUploadPreset: e.target.value })}
                                        className="block w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm text-slate-700 dark:text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-2 h-6">
                                {saved && (
                                    <span className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium animate-in zoom-in">
                                        <CheckCircle className="w-4 h-4" />
                                        Settings synced
                                    </span>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 active:bg-brand-800 flex items-center gap-2 transition-all shadow-lg shadow-brand-500/30"
                            >
                                <Save className="w-4 h-4" />
                                Save & Sync
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Account Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Account Scanner</h3>
                                <p className="text-slate-500 text-sm">Searching your Meta Graph profile...</p>
                            </div>
                            <button onClick={() => setShowScanner(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            {isScanning ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Meta Nodes...</p>
                                </div>
                            ) : scanError ? (
                                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-start gap-4">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                    <div className="flex-1">
                                        <p className="text-red-800 dark:text-red-200 font-bold">Scanning Failed</p>
                                        <p className="text-red-700 dark:text-red-300 text-sm mt-1">{scanError}</p>
                                    </div>
                                </div>
                            ) : discoveredPages.length === 0 ? (
                                <div className="text-center py-12">
                                    <Facebook className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-500">No managed Pages found. Ensure your token has 'pages_show_list'.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {discoveredPages.map(page => (
                                        <div key={page.id} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-brand-300 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                                                    <Facebook className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white">{page.name}</h4>
                                                    <p className="text-xs text-slate-500 font-mono">ID: {page.id}</p>
                                                    {page.igId ? (
                                                        <div className="mt-1 flex items-center gap-1.5 text-pink-600 dark:text-pink-400 text-[10px] font-black uppercase tracking-widest bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 rounded-md w-fit">
                                                            <Instagram className="w-3 h-3" />
                                                            Instagram Account Linked
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold italic tracking-tight">No Business Account Attached</p>
                                                    )}
                                                </div>
                                            </div>
                                            {page.igId && (
                                                <button
                                                    onClick={() => selectIgId(page.igId)}
                                                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-brand-500/20 flex items-center gap-2 active:scale-95"
                                                >
                                                    Use ID <ArrowRight className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
