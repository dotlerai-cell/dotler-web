import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  onSnapshot 
} from 'firebase/firestore'; 
import { db } from '../config/firebase'; 
import { useAuth } from '../contexts/AuthContext'; 
import Card from './Card';

interface StatsData {
  totalUsers: number;
  consented: number;
  optedOut: number;
}

const ConsentManagement = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  
  // States for individual user preferences
  const [aiOptOut, setAiOptOut] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Load Individual User Preferences from Firestore
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAiOptOut(userData.aiOptOut || false);
          setMarketingConsent(userData.marketingConsent || false);
        }
      }
    };

    fetchUserPreferences();
  }, [currentUser]);

  // 2. REAL-TIME ADMIN STATS: Listen to the entire 'users' collection
  useEffect(() => {
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // If the collection is empty, set stats to zero so the UI updates
      if (snapshot.empty) {
        setStats({ totalUsers: 0, optedOut: 0, consented: 0 });
        return;
      }

      const total = snapshot.size;
      let optedOutCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Count users who have explicitly set aiOptOut to true
        if (data.aiOptOut === true) {
          optedOutCount++;
        }
      });

      setStats({
        totalUsers: total,
        optedOut: optedOutCount,
        consented: total - optedOutCount
      });
    }, (error) => {
      console.error("Error listening to admin stats:", error);
    });

    return () => unsubscribe(); 
  }, []);

  // 3. Logic for AI Training Toggle
  const handleToggleAiTraining = async () => {
    if (!currentUser) return;
    setSaving(true);
    const newValue = !aiOptOut;
    
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        aiOptOut: newValue,
        email: currentUser.email,
        lastUpdated: Date.now()
      }, { merge: true });
      
      setAiOptOut(newValue);
    } catch (error) {
      console.error("Error saving preference:", error);
    } finally {
      setSaving(false);
    }
  };

  // 4. Logic for Marketing Sharing Toggle
  const handleToggleMarketing = async () => {
    if (!currentUser) return;
    setSaving(true);
    const newValue = !marketingConsent;

    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        marketingConsent: newValue,
        lastUpdated: Date.now()
      }, { merge: true });
      
      setMarketingConsent(newValue);
    } catch (error) {
      console.error("Error saving marketing preference:", error);
    } finally {
      setSaving(false);
    }
  };

  // 5. Logic for Data Portability (Export JSON)
  const handleExportData = () => {
    if (!currentUser) return;

    const dataToExport = {
      user_id: currentUser.uid,
      email: currentUser.email,
      preferences: {
        ai_training_opt_out: aiOptOut,
        marketing_consent: marketingConsent
      },
      exported_at: new Date().toISOString(),
      platform: "Dotler.ai CMP"
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dotler-privacy-data-${currentUser.uid.slice(0, 5)}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // 6. Logic for "Right to Erasure" (Delete Data)
  const handleDeleteMyData = async () => {
    if (!currentUser) return;

    const confirmDelete = window.confirm(
      "Are you sure? This will permanently delete your privacy preferences from our database. This action cannot be undone."
    );

    if (confirmDelete) {
      setSaving(true);
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid));
        setAiOptOut(false);
        setMarketingConsent(false);
        alert("Your data has been successfully erased.");
      } catch (error) {
        console.error("Error deleting data:", error);
      } finally {
        setSaving(false);
      }
    }
  };

  const chartData = stats ? [
    { name: 'Consented', value: stats.consented },
    { name: 'Opted Out', value: stats.optedOut },
  ] : [];
  const COLORS = ['#00C49F', '#FF8042'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Consent Management</h1>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <h3 className="text-xl font-semibold text-white mb-4">Your Privacy Settings</h3>
        
        <div className="space-y-4">
          {/* AI Toggle */}
          <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-[#333]">
            <div>
              <p className="text-white font-medium">Opt-out of AI Training</p>
              <p className="text-sm text-gray-400">Exclude your data from non-essential AI model improvements.</p>
            </div>
            <button 
              onClick={handleToggleAiTraining}
              disabled={saving}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                aiOptOut ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {saving ? 'Saving...' : aiOptOut ? 'Opted Out' : 'Active'}
            </button>
          </div>

          {/* Marketing Toggle */}
          <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-[#333]">
            <div>
              <p className="text-white font-medium">Third-Party Marketing Sharing</p>
              <p className="text-sm text-gray-400">Allow data sharing with Meta and Google Ads networks.</p>
            </div>
            <button 
              onClick={handleToggleMarketing}
              disabled={saving}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                marketingConsent ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {saving ? 'Saving...' : marketingConsent ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Export JSON Button */}
          <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-[#333]">
            <div>
              <p className="text-white font-medium">Data Portability</p>
              <p className="text-sm text-gray-400">Download a copy of your privacy settings and data.</p>
            </div>
            <button 
              onClick={handleExportData}
              className="px-4 py-2 rounded-lg font-bold bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
            >
              Export JSON
            </button>
          </div>

          {/* Delete Data Section */}
          <div className="mt-8 pt-6 border-t border-red-900/30">
            <p className="text-red-500 font-bold text-xs uppercase tracking-widest mb-3">Danger Zone</p>
            <div className="flex items-center justify-between p-4 bg-red-900/10 rounded-lg border border-red-900/30">
              <div>
                <p className="text-white font-medium">Right to Erasure</p>
                <p className="text-sm text-gray-400">Permanently delete your account data and history.</p>
              </div>
              <button 
                onClick={handleDeleteMyData}
                disabled={saving}
                className="px-4 py-2 rounded-lg font-bold bg-transparent border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all"
              >
                Delete Data
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Global Admin Stats Section */}
      <div className="pt-8 border-t border-[#333]">
        <h2 className="text-xl font-bold text-gray-500 mb-6 uppercase tracking-wider">Global Admin Stats</h2>
        
        {stats && stats.totalUsers > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-sm text-gray-400 mb-2">Total Users</h3>
                <h1 className="text-4xl font-bold text-white">{stats.totalUsers}</h1>
              </Card>
              <Card>
                <h3 className="text-sm text-gray-400 mb-2">Total Opt-Outs</h3>
                <h1 className="text-4xl font-bold text-white">{stats.optedOut}</h1>
              </Card>
            </div>
            
            <Card className="mt-6">
              <h3 className="text-xl font-semibold text-white mb-6">Global Consent Overview</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" dataKey="value" label>
                      {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        ) : stats && stats.totalUsers === 0 ? (
          <div className="p-12 text-center bg-black/20 rounded-xl border border-dashed border-[#333]">
            <h3 className="text-white font-medium mb-1">No Consent Data Available</h3>
            <p className="text-gray-400 text-sm">The 'users' collection is currently empty. Data will appear here once users set their preferences.</p>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-400 animate-pulse">Connecting to live Firestore stream...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentManagement;