import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (error) {
        setError('Authentication failed: ' + error);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }
      
      if (code) {
        try {
          // Exchange code for tokens
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              code: code,
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
              redirect_uri: window.location.hostname === 'localhost' 
                ? 'http://localhost:5173/auth/callback' 
                : 'https://dotler-prod.web.app/auth/callback',
              grant_type: 'authorization_code',
            }),
          });

          const tokens = await tokenResponse.json();
          
          if (tokens.error) {
            throw new Error(tokens.error_description || tokens.error);
          }

          // Get user info
          const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
            },
          });

          const userInfo = await userResponse.json();
          
          const userData = {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name || userInfo.email.split('@')[0],
            picture: userInfo.picture,
            tokens: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_in: tokens.expires_in,
            }
          };
          
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('✅ OAuth successful - user data:', userData);
          navigate('/dashboard');
        } catch (err) {
          console.error('OAuth error:', err);
          setError('Authentication failed: ' + (err as Error).message);
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        setError('No authorization code received');
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    
    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="text-red-500 max-w-md">
            <div className="text-xl mb-4">❌</div>
            <div>{error}</div>
            <div className="text-sm mt-4 text-gray-400">Redirecting to login...</div>
          </div>
        ) : (
          <div className="text-white">
            <div className="text-xl mb-4">🔄</div>
            <div>Completing authentication...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;