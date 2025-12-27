import { useState } from 'react';
import AdditionalInfoInput from '../components/ai-assistant/AdditionalInfoInput';

/**
 * Demo page for AdditionalInfoInput component
 */
export default function AdditionalInfoInputDemo() {
  const [additionalInfo, setAdditionalInfo] = useState('');

  function handleInfoChange(info) {
    setAdditionalInfo(info);
    console.log('Additional info updated:', info);
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Additional Info Input Demo</h1>
      <p style={{ marginBottom: '32px', color: '#666' }}>
        Test the AdditionalInfoInput component with character limit enforcement,
        character counter display, and input sanitization.
      </p>

      <AdditionalInfoInput 
        onInfoChange={handleInfoChange}
      />

      <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Current Value:</h3>
        <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {additionalInfo || '(empty)'}
        </p>
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
          Character count: {additionalInfo.length} / 5000
        </p>
      </div>

      <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h3>Test Cases:</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>Type more than 5000 characters - should be truncated</li>
          <li>Type near 4500 characters - counter should appear</li>
          <li>Reach 4500-5000 characters - counter should turn orange</li>
          <li>Reach 5000 characters - counter should turn red</li>
          <li>Try pasting HTML tags like &lt;script&gt; - should be sanitized</li>
          <li>Try special characters - should be preserved but sanitized</li>
        </ul>
      </div>
    </div>
  );
}
