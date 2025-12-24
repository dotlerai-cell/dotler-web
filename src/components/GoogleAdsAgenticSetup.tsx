import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from './Card';

const GoogleAdsAgenticSetup = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your setup assistant. What should I call you?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setSetupData] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionId] = useState(() => `${currentUser?.email || 'user'}_${Date.now()}`);

  const BACKEND_BASE = 'https://google-ads-backend-32929371500.us-central1.run.app';

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch(`${BACKEND_BASE}/api/setup-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: sessionId,
          message: userMessage,
          session_data: {}
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + data.error }]);
        return;
      }

      // Add assistant response
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

      // Check if setup is complete
      if (data.complete && data.data) {
        setSetupData(data.data);
        setIsComplete(true);
        
        // Auto-complete setup after 2 seconds
        setTimeout(() => {
          completeSetup(data.data);
        }, 2000);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + (error as Error).message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async (data: any) => {
    try {
      // Get user email from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userEmail = user.email || currentUser?.email;
      
      const response = await fetch(`${BACKEND_BASE}/api/complete-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: data.username,
          data: data,
          user_email: userEmail  // Send user email for token lookup
        })
      });

      const result = await response.json();
      
      if (result.error === 'oauth_required') {
        // User needs to authenticate with Google
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: result.message + '\n\nClick the button below to sign in with Google:' 
        }]);
        
        // Create OAuth button
        const oauthButton = document.createElement('button');
        oauthButton.textContent = 'Sign in with Google';
        oauthButton.className = 'bg-blue-600 text-white px-4 py-2 rounded mt-2';
        oauthButton.onclick = () => {
          window.location.href = `${BACKEND_BASE}${result.oauth_url}`;
        };
        
        // Add button to the last message
        setTimeout(() => {
          const lastMessage = document.querySelector('.space-y-3 > div:last-child .bg-gray-700');
          if (lastMessage) {
            lastMessage.appendChild(oauthButton);
          }
        }, 100);
        
        return;
      }
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Setup completed successfully
      const performanceData = result.performance_data;
      
      // Store performance data in localStorage for the Google Ads app
      localStorage.setItem('googleAdsPerformanceData', JSON.stringify(performanceData));

      // Store setup completion data
      const setupCompletionData = {
        user_id: data.username,
        email: userEmail,
        username: data.username,
        customer_id: data.campaign_id,
        developer_token: data.developer_token,
        manager_id: data.manager_id,
        timestamp: Date.now()
      };
      
      localStorage.setItem('googleAdsSetupComplete', JSON.stringify(setupCompletionData));

      // Open Google Ads app in new tab
      const params = new URLSearchParams({
        user_id: data.username,
        username: data.username,
        customer_id: data.campaign_id,
        from_agentic: 'true'
      });
      
      const googleAdsUrl = `${window.location.origin}/src/GoogleAdsConsentManagement/frontend/index.html?${params.toString()}`;
      window.open(googleAdsUrl, '_blank');
      
    } catch (error) {
      console.error('Complete setup error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + (error as Error).message }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          Google Ads Setup Assistant
        </h2>
        <p className="text-gray-400">
          Let our AI assistant guide you through connecting your Google Ads account.
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto space-y-3 p-4 bg-black/50 rounded-lg">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: message.content
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }}
                  />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-white px-4 py-2 rounded-lg">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          {!isComplete && (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                className="flex-1 bg-black border border-dark-border p-3 text-white focus:outline-none focus:border-primary rounded-lg"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 rounded-lg"
              >
                Send
              </button>
            </div>
          )}

          {isComplete && (
            <div className="text-center py-4">
              <div className="text-green-500 mb-2">✓ Setup Complete!</div>
              <p className="text-gray-400">Opening Google Ads dashboard in a new tab...</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default GoogleAdsAgenticSetup;