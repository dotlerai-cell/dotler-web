/**
 * WhatsApp Admin Configuration
 * Reads from environment variables for API URL and API Key
 */

export interface AppConfig {
  apiKey: string;
  baseUrl: string;
  environment: 'development' | 'production';
}

const getConfig = (): AppConfig => {
    
    const environment =  'development';
//   const environment = (import.meta.env.VITE_WA_ENVIRONMENT || 'production') as 'development' | 'production';
  
  const apiKey = import.meta.env.VITE_WA_API_KEY || 'aurora-beauty-dev-key-2025';
  
  let baseUrl = import.meta.env.VITE_WA_API_BASE_URL;
  
  if (!baseUrl) {
    if (environment === 'development') {
      baseUrl = 'http://localhost:8000';
    } else {
      baseUrl = 'https://34-58-246-94.sslip.io';
    }
  }

  return {
    apiKey,
    baseUrl,
    environment,
  };
};

const config = getConfig();

export const AppConfigService = {
  getConfig: () => config,
  getApiKey: () => config.apiKey,
  getBaseUrl: () => config.baseUrl,
  getEnvironment: () => config.environment,
  
  printConfig: () => {
    console.log('═══════════════════════════════════════');
    console.log('🔧 WhatsApp Admin Configuration');
    console.log('═══════════════════════════════════════');
    console.log(`Environment: ${config.environment}`);
    console.log(`Base URL: ${config.baseUrl}`);
    console.log(`API Key: ${config.apiKey.substring(0, 15)}...`);
    console.log('═══════════════════════════════════════');
  },
};
