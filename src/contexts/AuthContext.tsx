import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithCustomToken } from 'firebase/auth'; // Added for the Bridge
import { db, getGoogleAuthUrl } from '../config/firebase'; 

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  organizationId?: string;
  firebaseToken?: string; // New: To store the "Passport" from backend
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. The Bridge: Sign in to Firebase natively
  const syncFirebaseSession = async (token: string) => {
    try {
      const auth = getAuth();
      await signInWithCustomToken(auth, token);
      console.log("🔥 Firebase Native Session: ACTIVE");
    } catch (error) {
      console.error("Firebase Bridge Failed:", error);
    }
  };

  const ensureOrganizationExists = async (user: User) => {
    try {
      const orgRef = doc(db, 'organizations', user.id);
      const orgSnap = await getDoc(orgRef);

      if (!orgSnap.exists()) {
        await setDoc(orgRef, {
          ownerId: user.id,
          ownerEmail: user.email,
          orgName: `${user.name}'s Organization`,
          createdAt: Date.now(),
          policyVersion: "1.1"
        });
        console.log("SaaS Workspace Provisioned:", user.id);
      }
      return user.id;
    } catch (e) {
      console.error("SaaS Identity Sync Error:", e);
      return user.id;
    }
  };

  const signInWithGoogle = () => {
    window.location.href = getGoogleAuthUrl();
  };

  const logout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  useEffect(() => {
    const initSaaSAuth = async () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // 2. ACTIVATE BRIDGE ON REFRESH
        // If the backend sent a token, use it before talking to Firestore
        if (parsed.firebaseToken) {
          await syncFirebaseSession(parsed.firebaseToken);
        }

        const orgId = await ensureOrganizationExists(parsed.user || parsed);
        setCurrentUser({ ...(parsed.user || parsed), organizationId: orgId });
      }
      setLoading(false);
    };

    initSaaSAuth();

    const handleStorageChange = async () => {
      const updated = localStorage.getItem('user');
      if (updated) {
        const parsed = JSON.parse(updated);
        if (parsed.firebaseToken) await syncFirebaseSession(parsed.firebaseToken);
        const orgId = await ensureOrganizationExists(parsed.user || parsed);
        setCurrentUser({ ...(parsed.user || parsed), organizationId: orgId });
      } else {
        setCurrentUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};