import { useState } from 'react';
import WebsiteInput from '../components/ai-assistant/WebsiteInput';

/**
 * Demo page for testing WebsiteInput component
 */
export default function WebsiteInputDemo() {
  const [scrapedData, setScrapedData] = useState(null);
  const [manualData, setManualData] = useState(null);

  function handleScrapedData(data) {
    console.log('Scraped data received:', data);
    setScrapedData(data);
    setManualData(null);
  }

  function handleManualEntry(data) {
    console.log('Manual data received:', data);
    setManualData(data);
    setScrapedData(null);
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Website Input Component Demo</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        Test the WebsiteInput component by entering a website URL or providing manual information.
      </p>

      <WebsiteInput 
        onScrapedData={handleScrapedData}
        onManualEntry={handleManualEntry}
      />

      {/* Display received data */}
      {(scrapedData || manualData) && (
        <div style={{ 
          marginTop: '32px', 
          padding: '20px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px' 
        }}>
          <h2>Received Data:</h2>
          <pre style={{ 
            backgroundColor: '#fff', 
            padding: '16px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(scrapedData || manualData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
