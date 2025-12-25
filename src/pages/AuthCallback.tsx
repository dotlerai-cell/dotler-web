import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasProcessed.current) return;
      
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        hasProcessed.current = true;
        try {
          // 1. Exchange code with your local backend
          const response = await fetch('http://localhost:5000/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();
          
          // 2. CRITICAL CHANGE: Save the WHOLE data object
          // This includes 'user' AND 'firebaseToken'
          if (data.user && data.firebaseToken) {
            localStorage.setItem('user', JSON.stringify(data));
            
            console.log("SaaS Passport Received. Bridging to Firestore...");
            
            // 3. Hard redirect to Dashboard
            // The AuthContext will pick up the token on the next page load
            window.location.href = '/dashboard'; 
          } else {
            throw new Error("Missing user data or Firebase token from backend");
          }
        } catch (error) {
          console.error('SaaS Auth Error:', error);
          navigate('/login');
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-white text-lg font-medium">Provisioning your SaaS Workspace...</p>
        <p className="text-gray-500 text-sm mt-2">Activating DPDPA Compliance Bridge...</p>
      </div>
    </div>
  );
};

export default AuthCallback;