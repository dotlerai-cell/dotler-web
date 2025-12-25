import { useState } from 'react';
import { Globe } from 'lucide-react';
import Card from '../components/Card';
import GoogleAdsAgenticSetup from '../components/GoogleAdsAgenticSetup';

const GoogleAds = () => {
  const [setupMode, setSetupMode] = useState<'choose' | 'agentic'>('choose');

  if (setupMode === 'agentic') {
    return <GoogleAdsAgenticSetup />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Google Ads</h1>
          <p className="text-gray-400">Connect and optimize your Google Ads campaigns with AI assistance</p>
        </div>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              AI-Powered Google Ads Setup
            </h2>
            <p className="text-gray-400">
              Let our AI assistant guide you through connecting your Google Ads account step by step.
            </p>
          </div>

          <div className="bg-gray-800 p-8 rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">AI Assistant Setup</h3>
              <p className="text-gray-400 mb-6">
                Our intelligent assistant will help you:
              </p>
              <ul className="text-left text-gray-400 mb-8 space-y-2">
                <li>• Connect your Google account securely</li>
                <li>• Configure your Google Ads API access</li>
                <li>• Set up campaign tracking and analytics</li>
                <li>• Guide you through each step with clear instructions</li>
              </ul>
              <button 
                onClick={() => setSetupMode('agentic')}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-8 font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 rounded-lg"
              >
                Start AI-Guided Setup
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GoogleAds;