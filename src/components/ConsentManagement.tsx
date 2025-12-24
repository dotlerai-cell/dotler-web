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

// Step 1: Define the Global Version Constant
const CURRENT_POLICY_VERSION = "1.1"; 

interface StatsData {
  totalUsers: number;
  consented: number;
  optedOut: number;
}

const ConsentManagement = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  
  const [aiOptOut, setAiOptOut] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  // NEW: Phase 5 State for Notification
  const [showNotice, setShowNotice] = useState(false);

  // 1. Load Individual User Preferences and Check Version
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAiOptOut(userData.aiOptOut || false);
          setMarketingConsent(userData.marketingConsent || false);

          // Step 2: Compare Versions to Trigger Notice
          const lastAgreed = userData.lastAgreedVersion || "1.0";
          if (lastAgreed < CURRENT_POLICY_VERSION) {
            setShowNotice(true);
          }
        } else {
          // New user logic: show notice if they have no profile yet
          setShowNotice(true);
        }
      }
    };
    fetchUserPreferences();
  }, [currentUser]);

  // 2. Real-time Admin Stats Listener
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setStats({ totalUsers: 0, optedOut: 0, consented: 0 });
        return;
      }
      const total = snapshot.size;
      let optedOutCount = 0;
      snapshot.forEach((doc) => {
        if (doc.data().aiOptOut === true) optedOutCount++;
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

  const saveAuditLog = async (action: string, status: boolean) => {
    if (!currentUser) return;
    try {
      const logRef = doc(collection(db, 'consent_logs')); 
      await setDoc(logRef, {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        action: action, 
        status: status ? "OPTED_OUT / ENABLED" : "ACTIVE / DISABLED",
        timestamp: Date.now(),
        platform: "Dotler.ai CMP",
        version: CURRENT_POLICY_VERSION 
      });
    } catch (error) {
      console.error("Audit log error:", error);
    }
  };

  // Step 3: Handle Policy Update Acknowledgment
  const handleAcknowledgeUpdate = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      // Update User Version in Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        lastAgreedVersion: CURRENT_POLICY_VERSION,
        lastUpdated: Date.now()
      }, { merge: true });

      // Create Audit Log of Acknowledgement
      await saveAuditLog("POLICY_UPDATE_ACKNOWLEDGED", true);
      
      setShowNotice(false);
    } catch (error) {
      console.error("Error acknowledging update:", error);
    } finally {
      setSaving(false);
    }
  };

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
      await saveAuditLog("AI_TRAINING_PREFERENCE_CHANGE", newValue);
      setAiOptOut(newValue);
    } catch (error) {
      console.error("Error saving preference:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMarketing = async () => {
    if (!currentUser) return;
    setSaving(true);
    const newValue = !marketingConsent;
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        marketingConsent: newValue,
        lastUpdated: Date.now()
      }, { merge: true });
      await saveAuditLog("MARKETING_SHARING_PREFERENCE_CHANGE", newValue);
      setMarketingConsent(newValue);
    } catch (error) {
      console.error("Error saving marketing preference:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    if (!currentUser) return;
    const dataToExport = {
      user_id: currentUser.uid,
      email: currentUser.email,
      preferences: { ai_training_opt_out: aiOptOut, marketing_consent: marketingConsent },
      exported_at: new Date().toISOString(),
      platform: "Dotler.ai CMP",
      policy_version: CURRENT_POLICY_VERSION
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dotler-privacy-data-${currentUser.uid.slice(0, 5)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteMyData = async () => {
    if (!currentUser) return;
    const confirmDelete = window.confirm("Are you sure? This will permanently delete your privacy preferences.");
    if (confirmDelete) {
      setSaving(true);
      try {
        await saveAuditLog("USER_DATA_ERASURE_REQUESTED", true);
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

      {/* Step 4: UI Notification Banner */}
      {showNotice && (
        <div className="p-4 bg-blue-600/20 border border-blue-500/50 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            <p className="text-blue-100 text-sm">
              <span className="font-bold">Privacy Update:</span> We've updated our data processing notice (v{CURRENT_POLICY_VERSION}). Please review.
            </p>
          </div>
          <button 
            onClick={handleAcknowledgeUpdate}
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
          >
            {saving ? 'Saving...' : 'Acknowledge'}
          </button>
        </div>
      )}

      <Card className="border-primary/30 bg-primary/5">
        <h3 className="text-xl font-semibold text-white mb-4">Your Privacy Settings</h3>
        <div className="space-y-4">
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

          <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-[#333]">
            <div>
              <p className="text-white font-medium">Data Portability</p>
              <p className="text-sm text-gray-400">Download a copy of your settings.</p>
            </div>
            <button onClick={handleExportData} className="px-4 py-2 rounded-lg font-bold bg-blue-600/20 border border-blue-500/50 text-blue-400">
              Export JSON
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-red-900/30">
            <p className="text-red-500 font-bold text-xs uppercase tracking-widest mb-3">Danger Zone</p>
            <button onClick={handleDeleteMyData} className="px-4 py-2 rounded-lg font-bold border border-red-600 text-red-600">
              Delete Data
            </button>
          </div>
        </div>
      </Card>

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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" dataKey="value" label>
                      {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        ) : stats && stats.totalUsers === 0 ? (
          <div className="p-12 text-center bg-black/20 rounded-xl border border-dashed border-[#333]">
            <p className="text-gray-400">The 'users' collection is currently empty.</p>
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