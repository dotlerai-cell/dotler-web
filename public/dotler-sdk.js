// public/dotler-sdk.js

// 1. Updated Imports to include 'collection' and 'addDoc' for logging
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyAE_AHtNFEsnpWl-A1U_oDsfOU6l-YU7xU",
  authDomain: "dotler-prod.firebaseapp.com",
  projectId: "dotler-prod",
  storageBucket: "dotler-prod.appspot.com", // Matches your .env
  messagingSenderId: "467424984046",
  appId: "1:467424984046:web:e2512da6a5a2bbccaaecff"
};

// 3. Start the connection
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🛡️ Dotler SDK Loaded");

// 4. The Automation Logic
(async function() {
  const scriptTag = document.currentScript || document.querySelector('script[data-org-id]');
  const ORG_ID = scriptTag ? scriptTag.getAttribute('data-org-id') : null;

  if (!ORG_ID) return console.error("Dotler Error: Missing data-org-id");

  try {
    const orgSnap = await getDoc(doc(db, "organizations", ORG_ID));
    if (orgSnap.exists() && orgSnap.data().marketingConsent === false) {
      console.log("Tracking disabled by Admin.");
      return; 
    }
  } catch (e) {
    console.error("Connection error:", e);
  }

  const localChoice = localStorage.getItem(`dotler_consent_${ORG_ID}`);
  if (localChoice) return; 

  let visitorId = localStorage.getItem(`dotler_visitor_${ORG_ID}`);
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(`dotler_visitor_${ORG_ID}`, visitorId);
  }

  const banner = document.createElement('div');
  banner.style.cssText = "position:fixed; bottom:20px; right:20px; width:300px; padding:20px; background:#111; color:white; border-radius:8px; z-index:9999; font-family:sans-serif; box-shadow:0 10px 25px rgba(0,0,0,0.5);";
  banner.innerHTML = `
    <h3 style="margin:0 0 10px 0; font-size:16px;">Privacy Choice</h3>
    <p style="font-size:13px; color:#ccc; margin-bottom:15px;">Allow anonymous usage tracking?</p>
    <div style="display:flex; gap:10px;">
      <button id="btn-yes" style="flex:1; padding:8px; background:#00C49F; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Accept</button>
      <button id="btn-no" style="flex:1; padding:8px; background:#333; border:1px solid #555; color:white; border-radius:4px; cursor:pointer;">Deny</button>
    </div>
  `;
  document.body.appendChild(banner);

  // F. Save to Database on Click (Now updates User AND adds a Log)
  const save = async (choice) => {
    const timestamp = Date.now();
    const data = {
      marketingConsent: choice,
      timestamp: timestamp,
      orgId: ORG_ID,
      userAgent: navigator.userAgent
    };

    try {
      // 1. Update the unique user document (for your dashboard count)
      await setDoc(doc(db, "organizations", ORG_ID, "users", visitorId), data);

      // 2. Add a new document to 'consent_logs' (for the historical audit trail)
      await addDoc(collection(db, "organizations", ORG_ID, "consent_logs"), {
        ...data,
        visitorId: visitorId // include visitor ID in the log entry
      });

      console.log("✅ Saved to DB and Consent Logs:", choice);
    } catch (e) {
      console.error("❌ Save Failed:", e);
    }
    
    localStorage.setItem(`dotler_consent_${ORG_ID}`, choice);
    banner.remove();
  };

  document.getElementById('btn-yes').onclick = () => save(true);
  document.getElementById('btn-no').onclick = () => save(false);

})();