import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  onSnapshot,
  updateDoc,
  orderBy // Added orderBy for sorting logs
} from 'firebase/firestore'; 
import { db } from '../config/firebase'; 
import { useAuth } from '../contexts/AuthContext'; 
import Card from './Card';

// DPDPA Requirement D5: Global Versioning for Compliance
const CURRENT_POLICY_VERSION = "1.1"; 

interface StatsData {
  totalUsers: number;
  consented: number;
  optedOut: number;
}

// Added Interface for Logs
interface LogData {
  id: string;
  visitorId?: string;
  action?: string;
  status?: string;
  timestamp: number;
  marketingConsent?: boolean;
}

const ConsentManagement = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [logs, setLogs] = useState<LogData[]>([]); // New State for Logs
  
  const [aiOptOut, setAiOptOut] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 1. LOAD ORGANIZATION PREFERENCES
  useEffect(() => {
    const fetchOrgPreferences = async () => {
      if (currentUser?.organizationId) {
        const orgRef = doc(db, 'organizations', currentUser.organizationId);
        const orgSnap = await getDoc(orgRef);
        
        if (orgSnap.exists()) {
          const orgData = orgSnap.data();
          setAiOptOut(orgData.aiOptOut || false);
          setMarketingConsent(orgData.marketingConsent || false);

          const lastAgreed = orgData.lastAgreedVersion || "1.0";
          if (lastAgreed < CURRENT_POLICY_VERSION) {
            setShowNotice(true);
          }
        } else {
          setShowNotice(true);
        }
      }
    };
    fetchOrgPreferences();
  }, [currentUser]);

  // 2. REAL-TIME ADMIN ANALYTICS
  useEffect(() => {
    if (!currentUser?.organizationId) return;

    const q = query(collection(db, 'organizations', currentUser.organizationId, 'users'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setStats({ totalUsers: 0, optedOut: 0, consented: 0 });
        return;
      }
      const total = snapshot.size; 
      let optedOutCount = 0;

      if (marketingConsent === false) {
          optedOutCount = total;
      } else {
          snapshot.forEach((doc) => {
            if (doc.data().marketingConsent === false) optedOutCount++;
          });
      }

      setStats({ 
        totalUsers: total, 
        optedOut: optedOutCount, 
        consented: total - optedOutCount 
      });
    }, (error) => {
      console.error("Error listening to global stats:", error);
    });
    return () => unsubscribe(); 
  }, [marketingConsent, currentUser]);

  // 3. NEW: REAL-TIME AUDIT LOGS FETCHER
  useEffect(() => {
    if (!currentUser?.organizationId) return;

    // Connects to your new 'consent_logs' collection
    const q = query(
      collection(db, 'organizations', currentUser.organizationId, 'consent_logs'),
      orderBy('timestamp', 'desc') // Shows newest first
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogData[];
      setLogs(fetchedLogs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 4. DPDPA REQUIREMENT D4: AUDIT LOGGING
  const saveAuditLog = async (action: string, status: boolean) => {
    if (!currentUser?.organizationId) return;
    try {
      const logCollectionRef = collection(db, 'organizations', currentUser.organizationId, 'consent_logs');
      const newLogRef = doc(logCollectionRef); 

      await setDoc(newLogRef, {
        orgId: currentUser.organizationId,
        userEmail: currentUser.email,
        action: action, 
        status: status ? "ENABLED" : "DISABLED",
        timestamp: Date.now(),
        platform: "Dotler.ai CMP",
        version: CURRENT_POLICY_VERSION 
      });
      console.log("✅ Audit Log Saved to Silo:", action);
    } catch (error) {
      console.error("Audit log error:", error);
    }
  };

  // 5. HANDLERS
  const handleAcknowledgeUpdate = async () => {
    if (!currentUser?.organizationId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'organizations', currentUser.organizationId), {
        lastAgreedVersion: CURRENT_POLICY_VERSION,
        lastUpdated: Date.now()
      });
      await saveAuditLog("POLICY_UPDATE_ACKNOWLEDGED", true);
      setShowNotice(false);
    } catch (error) {
      console.error("Error acknowledging update:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAiTraining = async () => {
    if (!currentUser?.organizationId) return;
    setSaving(true);
    const newValue = !aiOptOut;
    try {
      await updateDoc(doc(db, 'organizations', currentUser.organizationId), {
        aiOptOut: newValue,
        lastUpdated: Date.now()
      });
      await saveAuditLog("AI_TRAINING_PREFERENCE_CHANGE", newValue);
      setAiOptOut(newValue);
    } catch (error) {
      console.error("Error saving AI preference:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMarketing = async () => {
    if (!currentUser?.organizationId) return;
    setSaving(true);
    const newValue = !marketingConsent;
    try {
      await updateDoc(doc(db, 'organizations', currentUser.organizationId), {
        marketingConsent: newValue,
        lastUpdated: Date.now()
      });
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
      org_id: currentUser.organizationId,
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
    link.download = `dotler-privacy-data-${currentUser.organizationId?.slice(0, 5)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteMyData = async () => {
    if (!currentUser?.organizationId) return;
    const confirmDelete = window.confirm("Are you sure? This action is irreversible and deletes your organization's settings.");
    if (confirmDelete) {
      setSaving(true);
      try {
        await saveAuditLog("ORG_DATA_ERASURE_REQUESTED", true);
        await deleteDoc(doc(db, 'organizations', currentUser.organizationId));
        setAiOptOut(false);
        setMarketingConsent(false);
        alert("Your organization's privacy data has been successfully erased.");
      } catch (error) {
        console.error("Error deleting data:", error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCopySnippet = () => {
    const code = `const orgSnap = await getDoc(doc(db, 'organizations', orgId));\nif (orgSnap.exists()) {\n  const { marketingConsent } = orgSnap.data();\n  if (marketingConsent) {\n    // Initialize tracking logic here...\n  }\n}`;
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
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

      {showNotice && (
        <div className="p-4 bg-blue-600/20 border border-blue-500/50 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            <p className="text-blue-100 text-sm">
              <span className="font-bold">Privacy Update:</span> We've updated our data processing notice (v{CURRENT_POLICY_VERSION}). Please review.
            </p>
          </div>
          <button onClick={handleAcknowledgeUpdate} disabled={saving} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all">
            {saving ? 'Saving...' : 'Acknowledge'}
          </button>
        </div>
      )}

      {/* MAIN PREFERENCES CARD */}
      <Card className="border-primary/30 bg-primary/5">
        <h3 className="text-xl font-semibold text-white mb-4">Organization Privacy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-[#333]">
            <div>
              <p className="text-white font-medium">Opt-out of AI Training</p>
              <p className="text-sm text-gray-400">Exclude data from non-essential AI model improvements.</p>
            </div>
            <button onClick={handleToggleAiTraining} disabled={saving} className={`px-4 py-2 rounded-lg font-bold transition-all ${aiOptOut ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}>
              {saving ? 'Saving...' : aiOptOut ? 'Opted Out' : 'Active'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-[#333]">
            <div>
              <p className="text-white font-medium">Third-Party Marketing Sharing</p>
              <p className="text-sm text-gray-400">Allow data sharing with Meta and Google Ads networks.</p>
            </div>
            <button onClick={handleToggleMarketing} disabled={saving} className={`px-4 py-2 rounded-lg font-bold transition-all ${marketingConsent ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
              {saving ? 'Saving...' : marketingConsent ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-[#333]">
            <div>
              <p className="text-white font-medium">Data Portability (GDPR/DPDPA)</p>
              <p className="text-sm text-gray-400">Download a full JSON copy of your organization settings.</p>
            </div>
            <button onClick={handleExportData} className="px-4 py-2 rounded-lg font-bold bg-blue-600/20 border border-blue-500/50 text-blue-400">
              Export JSON
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-red-900/30">
            <p className="text-red-500 font-bold text-xs uppercase tracking-widest mb-3">Danger Zone</p>
            <button onClick={handleDeleteMyData} className="px-4 py-2 rounded-lg font-bold border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all">
              Delete Organization Data
            </button>
          </div>
        </div>
      </Card>

      {/* GLOBAL ANALYTICS SECTION */}
      <div className="pt-8 border-t border-[#333]">
        <h2 className="text-xl font-bold text-gray-500 mb-6 uppercase tracking-wider">Visitor Compliance Analytics</h2>
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><h3 className="text-sm text-gray-400 mb-2">Total Visitors Tracked</h3><h1 className="text-4xl font-bold text-white">{stats.totalUsers}</h1></Card>
            <Card><h3 className="text-sm text-gray-400 mb-2">Total Opt-Outs</h3><h1 className="text-4xl font-bold text-white">{stats.optedOut}</h1></Card>
            <Card className="md:col-span-2 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} fill="#8884d8" dataKey="value" label>
                    {chartData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>

      {/* NEW SECTION: LIVE AUDIT LOGS */}
      <div className="pt-8 border-t border-[#333]">
        <h2 className="text-xl font-bold text-gray-500 mb-6 uppercase tracking-wider">Live Audit Trail</h2>
        <Card className="bg-black/60 border border-[#333] overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-[#111] text-xs uppercase text-gray-500 sticky top-0">
                <tr>
                  <th className="p-3">User / Visitor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {logs.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center">No logs found</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-xs text-white">
                        {log.visitorId || "System Admin"}
                      </td>
                      <td className="p-3">
                        {log.action || (log.visitorId ? "VISITOR_CONSENT_CHANGE" : "UNKNOWN_ACTION")}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          (log.marketingConsent === true || log.status === "ENABLED") 
                            ? "bg-green-900/30 text-green-400" 
                            : "bg-red-900/30 text-red-400"
                        }`}>
                          {log.status || (log.marketingConsent ? "ACCEPTED" : "DENIED")}
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* DEVELOPER TOOLS */}
      <div className="pt-8 border-t border-[#333] mt-8">
        <h2 className="text-xl font-bold text-gray-500 mb-6 uppercase tracking-wider">Developer Integration Tool</h2>
        <Card className="bg-black/60 border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Logic Gate Snippet</h3>
            <button 
              onClick={handleCopySnippet}
              className={`text-[10px] font-bold px-3 py-1 rounded transition-all ${
                copySuccess ? 'bg-green-600 text-white' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white'
              }`}
            >
              {copySuccess ? 'COPIED!' : 'COPY CODE'}
            </button>
          </div>
          <div className="bg-black p-4 rounded-lg font-mono text-xs overflow-x-auto border border-[#333]">
            <pre className="text-green-400">
{`// 1. Fetch organization's latest consent
const orgSnap = await getDoc(doc(db, 'organizations', orgId));

if (orgSnap.exists()) {
  const { marketingConsent } = orgSnap.data();

  // 2. The Logic Gate
  if (marketingConsent) {
    // Initializing tracking for Google/Meta Ads...
    console.log("Tracking Enabled by Org Admin");
  } else {
    // Block tracking: Workspace opted out
    console.log("Tracking Blocked by DPDPA Logic Gate");
  }
}`}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
};
 
export default ConsentManagement;