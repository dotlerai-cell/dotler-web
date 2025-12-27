export const oauthConfig = {
  clientId: '467424984046-jb2tknk83s9kmlqlujuhptuecttu6nei.apps.googleusercontent.com',
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || 
    (window.location.hostname === 'localhost' 
      ? 'http://localhost:5173/auth/callback' 
      : 'https://dotler-prod.web.app/auth/callback'),
  scope: 'openid email profile https://www.googleapis.com/auth/adwords',
  responseType: 'code',
};

export const getGoogleAuthUrl = () => {
  console.log('Environment REDIRECT_URI:', import.meta.env.VITE_GOOGLE_REDIRECT_URI);
  console.log('Current hostname:', window.location.hostname);
  console.log('Final redirect URI:', oauthConfig.redirectUri);
  
  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    redirect_uri: oauthConfig.redirectUri,
    scope: 'openid email profile https://www.googleapis.com/auth/adwords',
    response_type: oauthConfig.responseType,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true'
  });
  
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  console.log('Direct OAuth URL:', url);
  return url;
};